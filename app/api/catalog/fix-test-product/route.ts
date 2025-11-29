import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET /api/catalog/fix-test-product
 *
 * Создает подкатегорию для ТЕСТОВАЯ и привязывает к ней тестовый товар
 */
export async function GET() {
  try {
    const categoryId = 'a3bb6211-4c81-44c6-a328-42092b27234b'
    const productId = '71286c51-441d-4402-ba7d-94a230eb1138'

    console.log('🔧 [FIX] Создаем подкатегорию для ТЕСТОВАЯ...')

    // Шаг 1: Создаем подкатегорию
    const { data: subcategory, error: subError } = await supabase
      .from('catalog_subcategories')
      .insert({
        category_id: categoryId,
        name: 'Тестовые товары',
        key: 'test_products'
      })
      .select()
      .single()

    if (subError) {
      console.error('❌ [FIX] Ошибка создания подкатегории:', subError)
      return NextResponse.json(
        { error: 'Не удалось создать подкатегорию', details: subError.message },
        { status: 500 }
      )
    }

    console.log('✅ [FIX] Подкатегория создана:', subcategory.id)

    // Шаг 2: Обновляем товар - добавляем subcategory_id
    console.log('🔗 [FIX] Привязываем товар к подкатегории...')

    const { data: product, error: updateError } = await supabase
      .from('catalog_verified_products')
      .update({ subcategory_id: subcategory.id })
      .eq('id', productId)
      .select()

    if (updateError) {
      console.error('❌ [FIX] Ошибка обновления товара:', updateError)
      return NextResponse.json(
        { error: 'Не удалось обновить товар', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ [FIX] Товар обновлен! subcategory_id:', product[0].subcategory_id)

    return NextResponse.json({
      success: true,
      message: 'Товар теперь должен быть виден в UI!',
      subcategory: {
        id: subcategory.id,
        name: subcategory.name,
        key: subcategory.key
      },
      product: {
        id: product[0].id,
        name: product[0].name,
        category: product[0].category,
        subcategory_id: product[0].subcategory_id
      },
      instructions: {
        url: 'http://localhost:3000/dashboard/catalog',
        path: 'ТЕСТОВАЯ → Тестовые товары'
      }
    })

  } catch (error) {
    console.error('❌ [FIX] Критическая ошибка:', error)
    return NextResponse.json(
      {
        error: 'Критическая ошибка',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
