import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * POST /api/catalog/products/import-from-url
 *
 * Импортирует спарсенный товар в catalog_verified_products
 * ОБНОВЛЕНО: Скачивает картинки и загружает их в Supabase Storage
 *
 * Body:
 * {
 *   "metadata": {
 *     "title": string,
 *     "description": string,
 *     "imageUrl": string,
 *     "price": string,
 *     "currency": string,
 *     "marketplace": string,
 *     "originalUrl": string
 *   },
 *   "analysis": {
 *     "brand": string,
 *     "category": string,
 *     "keywords": string[]
 *   },
 *   "supplier_id": uuid (опционально, создаст default если нет)
 * }
 */

/**
 * Транслитерация кириллицы в латиницу
 */
function transliterate(text: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  }

  return text
    .toLowerCase()
    .split('')
    .map(char => map[char] || char)
    .join('')
}

/**
 * Скачивает картинку с URL и загружает в Supabase Storage
 */
async function downloadAndUploadImage(imageUrl: string, productName: string): Promise<string | null> {
  try {
    console.log('📥 [IMAGE] Скачиваем картинку:', imageUrl)

    // Скачиваем картинку
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error('❌ [IMAGE] Ошибка скачивания:', response.status, response.statusText)
      return null
    }

    const blob = await response.blob()
    console.log('✅ [IMAGE] Картинка скачана, размер:', blob.size, 'bytes')

    // Определяем расширение файла
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const extension = contentType.split('/')[1] || 'jpg'

    // Генерируем уникальное имя файла (только латиница!)
    const timestamp = Date.now()
    const transliterated = transliterate(productName)
    const sanitizedName = transliterated
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 50)
    const fileName = `imported/${timestamp}_${sanitizedName}.${extension}`

    console.log('📤 [IMAGE] Загружаем в Storage:', fileName)

    // Загружаем в Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, blob, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ [IMAGE] Ошибка загрузки в Storage:', uploadError)
      return null
    }

    console.log('✅ [IMAGE] Загружено в Storage:', uploadData.path)

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    if (!urlData?.publicUrl) {
      console.error('❌ [IMAGE] Не удалось получить публичный URL')
      return null
    }

    console.log('✅ [IMAGE] Публичный URL:', urlData.publicUrl)
    return urlData.publicUrl

  } catch (error) {
    console.error('❌ [IMAGE] Критическая ошибка:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metadata, analysis, supplier_id } = body

    console.log('📦 [IMPORT] Импорт товара:', {
      title: metadata?.title?.substring(0, 50),
      hasImage: !!metadata?.imageUrl,
      supplier_id
    })

    // Валидация
    if (!metadata?.title) {
      return NextResponse.json(
        { error: 'Отсутствует название товара (metadata.title)' },
        { status: 400 }
      )
    }

    // Парсинг цены
    let parsedPrice: number | null = null
    if (metadata.price) {
      const priceStr = metadata.price.toString().replace(/[^\d.,]/g, '').replace(',', '.')
      const price = parseFloat(priceStr)
      if (!isNaN(price)) {
        parsedPrice = price
      }
    }

    // Если supplier_id не передан, создаем/используем default
    let finalSupplierId = supplier_id

    if (!finalSupplierId) {
      console.log('⚠️ [IMPORT] supplier_id не указан, ищем/создаем default...')

      // Ищем default поставщика
      const { data: defaultSupplier } = await supabase
        .from('catalog_verified_suppliers')
        .select('id')
        .eq('name', 'Импортированные товары')
        .single()

      if (defaultSupplier) {
        finalSupplierId = defaultSupplier.id
        console.log('✅ [IMPORT] Используем существующего default поставщика:', finalSupplierId)
      } else {
        // Создаем default поставщика
        console.log('🔨 [IMPORT] Создаем default поставщика...')
        const { data: newSupplier, error: createError } = await supabase
          .from('catalog_verified_suppliers')
          .insert({
            name: 'Импортированные товары',
            company_name: 'Импортированные товары',
            category: 'Разное',
            description: 'Автоматически импортированные товары из маркетплейсов',
            country: 'RU',
            is_verified: true,
            is_active: true
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ [IMPORT] Ошибка создания поставщика:', createError)
          return NextResponse.json(
            { error: 'Не удалось создать поставщика' },
            { status: 500 }
          )
        }

        finalSupplierId = newSupplier.id
        console.log('✅ [IMPORT] Создан default поставщик:', finalSupplierId)
      }
    }

    // Скачиваем и загружаем картинку в Storage
    const images: string[] = []
    if (metadata.imageUrl) {
      console.log('🖼️ [IMPORT] Обрабатываем картинку товара...')
      const uploadedImageUrl = await downloadAndUploadImage(metadata.imageUrl, metadata.title)

      if (uploadedImageUrl) {
        images.push(uploadedImageUrl)
        console.log('✅ [IMPORT] Картинка загружена в Storage:', uploadedImageUrl)
      } else {
        console.warn('⚠️ [IMPORT] Не удалось загрузить картинку, сохраняем оригинальный URL')
        images.push(metadata.imageUrl) // Fallback на оригинальный URL
      }
    }

    // Формируем specifications
    const specifications: any = {}
    if (analysis?.brand) specifications.brand = analysis.brand
    if (analysis?.keywords) specifications.keywords = analysis.keywords
    if (metadata?.marketplace) specifications.marketplace = metadata.marketplace
    if (metadata?.originalUrl) specifications.originalUrl = metadata.originalUrl

    // Определяем категорию
    let category = 'Разное'
    if (analysis?.category) {
      // Убираем подкатегорию если есть (например "Электроника - Смартфоны" → "Электроника")
      category = analysis.category.split(' - ')[0]
    }

    console.log('💾 [IMPORT] Сохраняем товар в БД...')
    console.log('   Название:', metadata.title)
    console.log('   Категория:', category)
    console.log('   Цена:', parsedPrice)
    console.log('   Картинок:', images.length)
    console.log('   Поставщик:', finalSupplierId)

    // Сохраняем в БД
    const { data: product, error: insertError } = await supabase
      .from('catalog_verified_products')
      .insert({
        supplier_id: finalSupplierId,
        name: metadata.title,
        description: metadata.description || metadata.title,
        category: category,
        price: parsedPrice,
        currency: metadata.currency || 'RUB',
        images: images, // JSONB массив URL
        specifications: specifications,
        is_active: true,
        in_stock: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ [IMPORT] Ошибка сохранения:', insertError)
      return NextResponse.json(
        {
          error: 'Ошибка сохранения товара в БД',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ [IMPORT] Товар успешно добавлен! ID:', product.id)

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        images: product.images,
        created_at: product.created_at
      },
      message: 'Товар успешно добавлен в каталог'
    })

  } catch (error) {
    console.error('❌ [IMPORT] Критическая ошибка:', error)
    return NextResponse.json(
      {
        error: 'Критическая ошибка при импорте товара',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
