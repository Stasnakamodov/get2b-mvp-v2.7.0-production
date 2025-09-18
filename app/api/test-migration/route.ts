import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🧪 ПРОСТОЙ ТЕСТ АВТОМАТИЧЕСКОЙ МИГРАЦИИ
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('🧪 [TEST] Тестируем быструю миграцию...')
    
    // 1. Простая проверка подключения
    const { data: categories, error: categoriesError } = await supabase
      .from('catalog_categories')
      .select('id, name')
      .eq('is_active', true)
      .limit(5)

    if (categoriesError) {
      throw new Error(`Ошибка подключения к БД: ${categoriesError.message}`)
    }

    console.log(`✅ [TEST] Подключение OK. Найдено ${categories?.length} категорий`)

    // 2. Быстрое обновление Bosch товаров
    const { data: boschSupplier } = await supabase
      .from('catalog_verified_suppliers')
      .select('id')
      .ilike('name', '%bosch%')
      .single()
      
    if (boschSupplier) {
      const { data: updatedProducts, error: updateError } = await supabase
        .from('catalog_verified_products')
        .update({ category_id: '68ea0904-ba73-4e7e-8ae0-9f9c468a2b18' })
        .eq('supplier_id', boschSupplier.id)
        .is('category_id', null)
        .select('id')
        
      if (updateError) {
        throw new Error(`Ошибка обновления: ${updateError.message}`)
      }
      
      console.log(`🚗 [TEST] Обновлено Bosch товаров: ${updatedProducts?.length || 0}`)
    }

    // 3. Проверяем результат
    const { data: stats } = await supabase
      .from('catalog_verified_products')
      .select('category_id')
      
    const withCategories = stats?.filter(p => p.category_id !== null).length || 0
    const total = stats?.length || 0
    const percent = total > 0 ? Math.round((withCategories / total) * 100) : 0
    
    const executionTime = Date.now() - startTime
    
    console.log(`✅ [TEST] Готово за ${executionTime}мс. Категоризация: ${percent}%`)
    
    return NextResponse.json({
      success: true,
      message: 'Тест быстрой миграции успешен!',
      stats: {
        total_products: total,
        with_categories: withCategories,
        categorization_percent: percent,
        execution_time_ms: executionTime
      }
    })

  } catch (error) {
    console.error('❌ [TEST] Ошибка:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Ошибка тестовой миграции',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      execution_time_ms: Date.now() - startTime
    }, { status: 500 })
  }
}

// GET: Проверка статуса
export async function GET() {
  try {
    const { data: stats } = await supabase
      .from('catalog_verified_products')
      .select('category_id')
      
    const withCategories = stats?.filter(p => p.category_id !== null).length || 0
    const total = stats?.length || 0
    
    return NextResponse.json({
      success: true,
      current_stats: {
        total_products: total,
        with_categories: withCategories,
        without_categories: total - withCategories,
        migration_percent: total > 0 ? ((withCategories / total) * 100).toFixed(1) + '%' : '0%'
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка получения статистики'
    }, { status: 500 })
  }
}