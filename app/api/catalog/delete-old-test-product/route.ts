import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET /api/catalog/delete-old-test-product
 *
 * Удаляет старый тестовый товар с SVG заглушкой
 */
export async function GET() {
  try {
    const oldProductId = '71286c51-441d-4402-ba7d-94a230eb1138'

    console.log('🗑️ [DELETE] Удаляем старый товар с SVG заглушкой...')
    console.log('   Product ID:', oldProductId)

    // Удаляем товар (мягкое удаление - деактивация)
    const { data: product, error } = await supabase
      .from('catalog_verified_products')
      .update({ is_active: false })
      .eq('id', oldProductId)
      .select()

    if (error) {
      console.error('❌ [DELETE] Ошибка:', error)
      return NextResponse.json(
        { error: 'Не удалось удалить товар', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [DELETE] Старый товар деактивирован!')

    return NextResponse.json({
      success: true,
      message: 'Старый товар (iPhone 15 128GB [TEST]) удален из каталога',
      product: {
        id: product[0].id,
        name: product[0].name,
        is_active: product[0].is_active
      },
      note: 'Теперь в каталоге только новый товар с картинкой из Storage'
    })

  } catch (error) {
    console.error('❌ [DELETE] Критическая ошибка:', error)
    return NextResponse.json(
      {
        error: 'Критическая ошибка',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
