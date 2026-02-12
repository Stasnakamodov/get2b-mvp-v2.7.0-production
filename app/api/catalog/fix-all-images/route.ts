import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * POST /api/catalog/fix-all-images
 *
 * Заменяет все фейковые alicdn URL изображений на рабочие picsum.photos placeholder-ы.
 * Seed-скрипт генерировал несуществующие alicdn URL с рандомными MD5-хэшами.
 *
 * Использование: POST запрос без body
 * Результат: обновляет images массив у всех товаров с фейковыми URL
 */

const FAKE_PATTERNS = [
  'img.alicdn.com/imgextra/i1/smart_device_',
  'img.alicdn.com/imgextra/i2/iot_product_',
  'img.alicdn.com/imgextra/i3/home_auto_',
  'img.alicdn.com/imgextra/i4/sensor_',
  'ae04.alicdn.com/kf/smart_',
]

function isFakeUrl(url: string): boolean {
  return FAKE_PATTERNS.some(pattern => url.includes(pattern))
}

function generatePlaceholderImages(productId: string, count: number): string[] {
  const images: string[] = []
  for (let i = 0; i < count; i++) {
    images.push(`https://picsum.photos/seed/${productId}_${i}/600/600`)
  }
  return images
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Получаем товары с изображениями из verified таблицы
    let totalFixed = 0
    let totalChecked = 0
    let offset = 0
    const batchSize = 200

    while (true) {
      const { data: products, error } = await supabase
        .from('catalog_verified_products')
        .select('id, images')
        .not('images', 'is', null)
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error('[fix-all-images] Query error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!products || products.length === 0) break

      totalChecked += products.length

      // Фильтруем товары с фейковыми URL
      const toFix = products.filter(p => {
        if (!Array.isArray(p.images) || p.images.length === 0) return false
        return p.images.some((url: string) => typeof url === 'string' && isFakeUrl(url))
      })

      // Обновляем пакетно
      for (const product of toFix) {
        const imageCount = Array.isArray(product.images) ? product.images.length : 3
        const newImages = generatePlaceholderImages(product.id, imageCount)

        const { error: updateError } = await supabase
          .from('catalog_verified_products')
          .update({ images: newImages })
          .eq('id', product.id)

        if (updateError) {
          console.error(`[fix-all-images] Update error for ${product.id}:`, updateError)
        } else {
          totalFixed++
        }
      }

      offset += batchSize
      if (products.length < batchSize) break
    }

    // Аналогично для user products
    offset = 0
    let userFixed = 0

    while (true) {
      const { data: products, error } = await supabase
        .from('catalog_user_products')
        .select('id, images')
        .not('images', 'is', null)
        .range(offset, offset + batchSize - 1)

      if (error) break
      if (!products || products.length === 0) break

      const toFix = products.filter(p => {
        if (!Array.isArray(p.images) || p.images.length === 0) return false
        return p.images.some((url: string) => typeof url === 'string' && isFakeUrl(url))
      })

      for (const product of toFix) {
        const imageCount = Array.isArray(product.images) ? product.images.length : 3
        const newImages = generatePlaceholderImages(product.id, imageCount)

        const { error: updateError } = await supabase
          .from('catalog_user_products')
          .update({ images: newImages })
          .eq('id', product.id)

        if (!updateError) userFixed++
      }

      offset += batchSize
      if (products.length < batchSize) break
    }

    return NextResponse.json({
      success: true,
      message: 'Фейковые alicdn URL заменены на рабочие picsum.photos placeholder-ы',
      stats: {
        totalChecked,
        verifiedFixed: totalFixed,
        userFixed,
        totalFixed: totalFixed + userFixed,
        executionTime: Date.now() - startTime
      }
    })

  } catch (error: any) {
    console.error('[fix-all-images] Critical error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
