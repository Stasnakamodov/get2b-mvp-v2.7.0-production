import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    console.log('🔍 Проверяем таблицу project_templates...')
    
    // Проверяем существование таблицы через pg_catalog.pg_tables
    const { data: tableExists, error: tableError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('tablename', 'project_templates')
      .eq('schemaname', 'public')

    if (tableError) {
      console.error('❌ Ошибка проверки таблицы (pg_catalog):', tableError)
      return NextResponse.json({
        error: 'Ошибка проверки таблицы',
        details: tableError.message
      }, { status: 500 })
    }

    const tableExistsResult = tableExists && tableExists.length > 0

    console.log('📋 Таблица project_templates существует:', tableExistsResult)

    if (!tableExistsResult) {
      return NextResponse.json({
        error: 'Таблица project_templates не существует',
        suggestion: 'Нужно создать таблицу project_templates'
      }, { status: 404 })
    }

    // Проверяем количество записей
    const { count, error: countError } = await supabase
      .from('project_templates')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Ошибка подсчета записей:', countError)
      return NextResponse.json({
        error: 'Ошибка подсчета записей',
        details: countError.message
      }, { status: 500 })
    }

    console.log('✅ Проверка завершена успешно')

    return NextResponse.json({
      success: true,
      table_exists: tableExistsResult,
      record_count: count,
      message: 'Таблица project_templates существует и доступна'
    })
    
  } catch (error) {
    console.error('❌ Неожиданная ошибка:', error)
    return NextResponse.json({
      error: 'Неожиданная ошибка',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 