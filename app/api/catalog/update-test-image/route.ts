import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET /api/catalog/update-test-image
 *
 * Обновляет картинку тестового товара на рабочую
 */
export async function GET() {
  try {
    const productId = '71286c51-441d-4402-ba7d-94a230eb1138'

    // Используем SVG data URI - это будет работать всегда
    const workingImageUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%234F46E5" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="24" fill="white"%3EiPhone 15 128GB%3C/text%3E%3C/svg%3E'

    console.log('🖼️ [UPDATE] Обновляем картинку товара...')
    console.log('   Новый URL:', workingImageUrl)

    const { data: product, error } = await supabase
      .from('catalog_verified_products')
      .update({
        images: [workingImageUrl]
      })
      .eq('id', productId)
      .select()

    if (error) {
      console.error('❌ [UPDATE] Ошибка обновления:', error)
      return NextResponse.json(
        { error: 'Не удалось обновить картинку', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [UPDATE] Картинка обновлена!')

    return NextResponse.json({
      success: true,
      message: 'Картинка товара обновлена на рабочую!',
      product: {
        id: product[0].id,
        name: product[0].name,
        images: product[0].images
      },
      note: 'Обновите страницу каталога (Cmd+R / F5) чтобы увидеть новую картинку'
    })

  } catch (error) {
    console.error('❌ [UPDATE] Критическая ошибка:', error)
    return NextResponse.json(
      {
        error: 'Критическая ошибка',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
