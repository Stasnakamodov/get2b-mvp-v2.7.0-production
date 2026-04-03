import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { pool } from "@/lib/db/pool";
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    interface DatabaseAnalysis {
      tables: Record<string, any>;
      structures: Record<string, any>;
      data: Record<string, any>;
      indexes: Record<string, any>;
      policies: Record<string, any>;
      foreignKeys: Record<string, any>;
      summary: Record<string, any>;
      [key: string]: any;
    }

    const analysis: DatabaseAnalysis = {
      tables: {},
      structures: {},
      data: {},
      indexes: {},
      policies: {},
      foreignKeys: {},
      summary: {}
    };

    // 1. Список всех таблиц
    try {
      const tablesResult = await pool.query(`
        SELECT
          table_name,
          table_type,
          'EXISTS' as status
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      analysis.tables = tablesResult.rows;
    } catch (tablesError) {
      logger.error("❌ [API] Ошибка получения списка таблиц:", tablesError);
    }

    // 2. Количество записей в основных таблицах
    const mainTables = [
      'client_profiles', 'supplier_profiles', 'projects', 
      'project_specifications', 'specifications',
      'catalog_verified_suppliers', 'catalog_user_suppliers',
      'catalog_verified_products', 'catalog_user_products',
      'chat_rooms', 'chat_messages'
    ];

    for (const tableName of mainTables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        analysis.data[tableName] = parseInt(countResult.rows[0].count, 10);
      } catch (err) {
        analysis.data[tableName] = 'TABLE_NOT_EXISTS';
      }
    }

    // 3. Структура основных таблиц
    const structureTables = ['projects', 'specifications', 'catalog_verified_suppliers'];
    
    for (const tableName of structureTables) {
      try {
        const structureResult = await pool.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `, [tableName]);
        analysis.structures[tableName] = structureResult.rows;
      } catch (err) {
        analysis.structures[tableName] = 'TABLE_NOT_EXISTS';
      }
    }

    // 4. Анализ данных проектов
    try {
      const statusResult = await pool.query(`
        SELECT
          status,
          COUNT(*) as count
        FROM projects
        GROUP BY status
        ORDER BY count DESC;
      `);
      analysis.data.projectStatuses = statusResult.rows;
    } catch (err) {
      analysis.data.projectStatuses = { error: 'ERROR' };
    }

    // 5. Анализ шагов проектов
    try {
      const stepsResult = await pool.query(`
        SELECT
          current_step,
          max_step_reached,
          COUNT(*) as count
        FROM projects
        GROUP BY current_step, max_step_reached
        ORDER BY current_step, max_step_reached;
      `);
      analysis.data.projectSteps = stepsResult.rows;
    } catch (err) {
      analysis.data.projectSteps = { error: 'ERROR' };
    }

    // 6. Анализ каталога
    try {
      const catalogResult = await pool.query(`
        SELECT
          'categories' as type,
          category as value,
          COUNT(*) as count
        FROM catalog_verified_suppliers
        GROUP BY category
        UNION ALL
        SELECT
          'countries' as type,
          country as value,
          COUNT(*) as count
        FROM catalog_verified_suppliers
        GROUP BY country
        UNION ALL
        SELECT
          'moderation_status' as type,
          moderation_status as value,
          COUNT(*) as count
        FROM catalog_verified_suppliers
        GROUP BY moderation_status
        ORDER BY type, count DESC;
      `);
      analysis.data.catalogAnalysis = catalogResult.rows;
    } catch (err) {
      analysis.data.catalogAnalysis = { error: 'ERROR' };
    }

    // 7. Индексы
    try {
      const indexesResult = await pool.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('projects', 'specifications', 'catalog_verified_suppliers', 'catalog_user_suppliers')
        ORDER BY tablename, indexname;
      `);
      analysis.indexes = indexesResult.rows;
    } catch (err) {
      analysis.indexes = { error: 'ERROR' };
    }

    // 8. RLS политики
    try {
      const policiesResult = await pool.query(`
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('projects', 'specifications', 'catalog_verified_suppliers', 'catalog_user_suppliers')
        ORDER BY tablename, policyname;
      `);
      analysis.policies = policiesResult.rows;
    } catch (err) {
      analysis.policies = { error: 'ERROR' };
    }

    // 9. Внешние ключи
    try {
      const fkResult = await pool.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
      `);
      analysis.foreignKeys = fkResult.rows;
    } catch (err) {
      analysis.foreignKeys = { error: 'ERROR' };
    }

    // 10. Итоговая сводка
    analysis.summary = {
      totalTables: analysis.tables?.length || 0,
      totalProjects: analysis.data.projects || 0,
      totalSuppliers: (analysis.data.catalog_verified_suppliers || 0) + (analysis.data.catalog_user_suppliers || 0),
      totalChatRooms: analysis.data.chat_rooms || 0,
      totalChatMessages: analysis.data.chat_messages || 0,
      analysisDate: new Date().toISOString()
    };


    return NextResponse.json({
      success: true,
      analysis,
      message: "Анализ структуры базы данных завершен"
    });

  } catch (error) {
    logger.error("❌ [API] Критическая ошибка при анализе БД:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 