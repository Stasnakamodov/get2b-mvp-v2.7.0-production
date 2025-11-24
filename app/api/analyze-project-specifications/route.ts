import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {

    // 1. Пробуем получить данные напрямую
    const { data: sampleData, error: sampleError } = await supabase
      .from('project_specifications')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false })

    if (sampleError) {
      return NextResponse.json({
        error: 'Ошибка доступа к таблице project_specifications',
        details: sampleError.message,
        code: sampleError.code
      }, { status: 500 })
    }

    // 2. Получаем количество записей
    const { count: recordCount, error: countError } = await supabase
      .from('project_specifications')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({
        error: 'Ошибка подсчета записей',
        details: countError.message
      }, { status: 500 })
    }

    // 3. Анализируем supplier_name
    const { data: supplierAnalysis, error: supplierError } = await supabase
      .from('project_specifications')
      .select('supplier_name')
      .not('supplier_name', 'is', null)

    let uniqueSuppliers = 0
    let supplierNames: string[] = []
    
    if (!supplierError && supplierAnalysis) {
      const suppliers = supplierAnalysis.map(item => item.supplier_name).filter(Boolean)
      uniqueSuppliers = new Set(suppliers).size
      supplierNames = Array.from(new Set(suppliers)).slice(0, 10) // Первые 10 уникальных
    }

    // 4. Проверяем связь с project_requisites
    const { data: requisitesData, error: requisitesError } = await supabase
      .from('project_requisites')
      .select('project_id, type, data')
      .limit(3)

    // 5. Анализируем структуру данных
    let columnStructure: any = {}
    if (sampleData && sampleData.length > 0) {
      const firstRecord = sampleData[0]
      columnStructure = Object.keys(firstRecord).map(key => ({
        column_name: key,
        sample_value: firstRecord[key],
        data_type: typeof firstRecord[key]
      }))
    }

    return NextResponse.json({
      success: true,
      analysis: {
        table_exists: true,
        structure: {
          columns: columnStructure,
          total_columns: columnStructure.length
        },
        data: {
          total_records: recordCount || 0,
          sample_records: sampleData?.length || 0,
          supplier_analysis: {
            total_with_supplier_name: supplierAnalysis?.length || 0,
            unique_suppliers: uniqueSuppliers,
            sample_supplier_names: supplierNames
          }
        },
        sample_data: sampleData,
        requisites_sample: requisitesData,
        analysis_date: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Ошибка анализа project_specifications:', error)
    return NextResponse.json({
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
} 