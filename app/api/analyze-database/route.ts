import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Начинаем анализ структуры базы данных...");

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
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            table_name,
            table_type,
            'EXISTS' as status
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (tablesError) {
      console.error("❌ [API] Ошибка получения списка таблиц:", tablesError);
    } else {
      analysis.tables = tables;
      console.log("✅ [API] Получен список таблиц:", tables?.length);
    }

    // 2. Количество записей в основных таблицах
    const mainTables = [
      'client_profiles', 'supplier_profiles', 'projects', 
      'project_specifications', 'specifications',
      'catalog_verified_suppliers', 'catalog_user_suppliers',
      'catalog_verified_products', 'catalog_user_products',
      'chat_rooms', 'chat_messages', 'accreditation_applications'
    ];

    for (const tableName of mainTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          analysis.data[tableName] = count;
        }
      } catch (err) {
        analysis.data[tableName] = 'TABLE_NOT_EXISTS';
      }
    }

    // 3. Структура основных таблиц
    const structureTables = ['projects', 'specifications', 'catalog_verified_suppliers'];
    
    for (const tableName of structureTables) {
      try {
        const { data: structure, error } = await supabase
          .rpc('exec_sql', {
            sql_query: `
              SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
              FROM information_schema.columns 
              WHERE table_name = '${tableName}' 
                AND table_schema = 'public'
              ORDER BY ordinal_position;
            `
          });

        if (!error) {
          analysis.structures[tableName] = structure;
        }
      } catch (err) {
        analysis.structures[tableName] = 'TABLE_NOT_EXISTS';
      }
    }

    // 4. Анализ данных проектов
    try {
      const { data: projectStatuses, error: statusError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT 
              status,
              COUNT(*) as count
            FROM projects 
            GROUP BY status
            ORDER BY count DESC;
          `
        });

      if (!statusError) {
        analysis.data.projectStatuses = projectStatuses;
      }
    } catch (err) {
      analysis.data.projectStatuses = { error: 'ERROR' };
    }

    // 5. Анализ шагов проектов
    try {
      const { data: projectSteps, error: stepsError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT 
              current_step,
              max_step_reached,
              COUNT(*) as count
            FROM projects 
            GROUP BY current_step, max_step_reached
            ORDER BY current_step, max_step_reached;
          `
        });

      if (!stepsError) {
        analysis.data.projectSteps = projectSteps;
      }
    } catch (err) {
      analysis.data.projectSteps = { error: 'ERROR' };
    }

    // 6. Анализ каталога
    try {
      const { data: catalogAnalysis, error: catalogError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
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
          `
        });

      if (!catalogError) {
        analysis.data.catalogAnalysis = catalogAnalysis;
      }
    } catch (err) {
      analysis.data.catalogAnalysis = { error: 'ERROR' };
    }

    // 7. Индексы
    try {
      const { data: indexes, error: indexesError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT 
              schemaname,
              tablename,
              indexname,
              indexdef
            FROM pg_indexes 
            WHERE schemaname = 'public' 
              AND tablename IN ('projects', 'specifications', 'catalog_verified_suppliers', 'catalog_user_suppliers')
            ORDER BY tablename, indexname;
          `
        });

      if (!indexesError) {
        analysis.indexes = indexes;
      }
    } catch (err) {
      analysis.indexes = { error: 'ERROR' };
    }

    // 8. RLS политики
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
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
          `
        });

      if (!policiesError) {
        analysis.policies = policies;
      }
    } catch (err) {
      analysis.policies = { error: 'ERROR' };
    }

    // 9. Внешние ключи
    try {
      const { data: foreignKeys, error: fkError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
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
          `
        });

      if (!fkError) {
        analysis.foreignKeys = foreignKeys;
      }
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
      totalAccreditationApplications: analysis.data.accreditation_applications || 0,
      analysisDate: new Date().toISOString()
    };

    console.log("✅ [API] Анализ базы данных завершен");
    console.log("📊 [API] Сводка:", analysis.summary);

    return NextResponse.json({
      success: true,
      analysis,
      message: "Анализ структуры базы данных завершен"
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при анализе БД:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 