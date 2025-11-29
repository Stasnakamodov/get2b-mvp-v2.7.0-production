import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET /api/catalog/fix-new-product
 *
 * Привязывает новый товар (iPhone 15 Pro Max) к подкатегории
 */
export async function GET() {
  try {
    const newProductId = '4f7dd6a8-1302-42b0-b362-73abeff07511'
    const subcategoryId = '731e04c6-875d-492f-a460-e8e248c75e5b'

    console.log('🔧 [FIX] Обновляем новый товар...')
    console.log('   Product ID:', newProductId)
    console.log('   Subcategory ID:', subcategoryId)

    // Обновляем товар - добавляем subcategory_id
    const { data: product, error } = await supabase
      .from('catalog_verified_products')
      .update({ subcategory_id: subcategoryId })
      .eq('id', newProductId)
      .select()

    if (error) {
      console.error('❌ [FIX] Ошибка:', error)
      return NextResponse.json(
        { error: 'Не удалось обновить товар', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [FIX] Товар обновлен!')

    return NextResponse.json({
      success: true,
      message: 'Новый товар с картинкой из Storage теперь виден в UI!',
      product: {
        id: product[0].id,
        name: product[0].name,
        subcategory_id: product[0].subcategory_id,
        images: product[0].images
      },
      instructions: 'Обновите страницу (Cmd+Shift+R) чтобы увидеть новый товар'
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
