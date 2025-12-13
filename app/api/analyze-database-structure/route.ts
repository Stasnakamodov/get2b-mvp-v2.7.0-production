import { NextResponse } from 'next/server'
import { logger } from "@/src/shared/lib/logger";
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    
    interface DatabaseStructureResults {
      tables?: Array<{ table_name: string; table_type: string }>;
      columns?: Record<string, Array<{ column_name: string; data_type: string; is_nullable: string }>>;
      constraints?: Record<string, Array<{ constraint_name: string; constraint_type: string }>>;
      indexes?: Record<string, Array<{ index_name: string; column_name: string }>>;
      [key: string]: any;
    }
    
    const results: DatabaseStructureResults = {}
    
    // 1. Все таблицы в схеме public
    const { data: allTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      logger.error('❌ Ошибка получения таблиц:', tablesError)
      return NextResponse.json({
        error: 'Ошибка получения таблиц',
        details: tablesError.message
      }, { status: 500 })
    }
    
    results.allTables = allTables
    
    // 2. Таблицы, связанные с проектами
    const projectTables = allTables?.filter(table => 
      table.table_name.toLowerCase().includes('project')
    ) || []
    results.projectTables = projectTables
    
    // 3. Таблицы, связанные с шаблонами
    const templateTables = allTables?.filter(table => 
      table.table_name.toLowerCase().includes('template')
    ) || []
    results.templateTables = templateTables
    
    // 4. Таблицы, связанные с эхо карточками
    const echoTables = allTables?.filter(table => 
      table.table_name.toLowerCase().includes('echo')
    ) || []
    results.echoTables = echoTables
    
    // 5. Таблицы, связанные с поставщиками
    const supplierTables = allTables?.filter(table => 
      table.table_name.toLowerCase().includes('supplier')
    ) || []
    results.supplierTables = supplierTables
    
    // 6. Таблицы, связанные с реквизитами
    const requisiteTables = allTables?.filter(table => 
      table.table_name.toLowerCase().includes('requisite')
    ) || []
    results.requisiteTables = requisiteTables
    
    // 7. Структура основных таблиц
    const mainTables = ['projects', 'project_templates', 'project_requisites', 'project_specifications', 'supplier_cards', 'bank_accounts']
    
    for (const tableName of mainTables) {
      try {
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default, ordinal_position')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
          .order('ordinal_position')
        
        if (!columnsError && columns && columns.length > 0) {
          results[`${tableName}Structure`] = columns
          
          // Также получаем количество записей
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
          
          if (!countError) {
            results[`${tableName}Count`] = count || 0
          }
        }
      } catch (error) {
      }
    }
    
    // 8. Внешние ключи
    const { data: foreignKeys, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        table_name,
        constraint_name,
        constraint_type
      `)
      .eq('table_schema', 'public')
      .eq('constraint_type', 'FOREIGN KEY')
      .order('table_name')
    
    if (!fkError) {
      results.foreignKeys = foreignKeys
    }
    
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        totalTables: allTables?.length || 0,
        projectTables: projectTables.length,
        templateTables: templateTables.length,
        echoTables: echoTables.length,
        supplierTables: supplierTables.length,
        requisiteTables: requisiteTables.length
      }
    })
    
  } catch (error: unknown) {
    logger.error('❌ Неожиданная ошибка:', error)
    return NextResponse.json({
      error: 'Неожиданная ошибка',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 