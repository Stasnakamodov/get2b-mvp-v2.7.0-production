import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getUrlParserService } from '@/lib/services/UrlParserService'

/**
 * POST /api/catalog/products/parse-and-import
 *
 * Парсит товар с маркетплейса через Playwright (с правильными изображениями!)
 * и сразу импортирует в catalog_verified_products
 *
 * Body:
 * {
 *   "url": string,
 *   "category": string (опционально),
 *   "supplier_id": uuid (опционально)
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
    const { url, category, supplier_id } = body

    console.log('🔄 [PARSE-AND-IMPORT] Начало импорта из URL:', url)

    // Валидация
    if (!url) {
      return NextResponse.json(
        { error: 'URL обязателен' },
        { status: 400 }
      )
    }

    const urlParser = getUrlParserService()
    if (!urlParser.isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Некорректный URL' },
        { status: 400 }
      )
    }

    // ШАГ 1: ПАРСИНГ через UrlParserService (с Playwright для yandex!)
    console.log('🎭 [PARSE-AND-IMPORT] Парсинг через UrlParserService...')
    const metadata = await urlParser.parseProductUrl(url)

    console.log('✅ [PARSE-AND-IMPORT] Парсинг завершен:', {
      title: metadata.title?.substring(0, 50),
      hasImage: !!metadata.imageUrl,
      imageUrl: metadata.imageUrl
    })

    // ШАГ 2: Определяем или создаем поставщика
    let finalSupplierId = supplier_id

    if (!finalSupplierId) {
      console.log('⚠️ [PARSE-AND-IMPORT] supplier_id не указан, ищем/создаем default...')

      const { data: defaultSupplier } = await supabase
        .from('catalog_verified_suppliers')
        .select('id')
        .eq('name', 'Импортированные товары')
        .single()

      if (defaultSupplier) {
        finalSupplierId = defaultSupplier.id
        console.log('✅ [PARSE-AND-IMPORT] Используем существующего default поставщика')
      } else {
        console.log('🔨 [PARSE-AND-IMPORT] Создаем default поставщика...')
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
          console.error('❌ [PARSE-AND-IMPORT] Ошибка создания поставщика:', createError)
          return NextResponse.json(
            { error: 'Не удалось создать поставщика' },
            { status: 500 }
          )
        }

        finalSupplierId = newSupplier.id
        console.log('✅ [PARSE-AND-IMPORT] Создан default поставщик')
      }
    }

    // ШАГ 3: Скачиваем и загружаем изображение в Storage
    const images: string[] = []

    if (metadata.imageUrl) {
      console.log('🖼️ [PARSE-AND-IMPORT] Обрабатываем изображение...')
      const uploadedImageUrl = await downloadAndUploadImage(metadata.imageUrl, metadata.title)

      if (uploadedImageUrl) {
        images.push(uploadedImageUrl)
        console.log('✅ [PARSE-AND-IMPORT] Изображение загружено в Storage!')
      } else {
        console.warn('⚠️ [PARSE-AND-IMPORT] Не удалось загрузить изображение, сохраняем оригинальный URL')
        images.push(metadata.imageUrl)
      }
    } else {
      console.warn('⚠️ [PARSE-AND-IMPORT] Изображение не найдено при парсинге!')
    }

    // ШАГ 4: Парсинг цены
    let parsedPrice: number | null = null
    if (metadata.price) {
      const priceStr = metadata.price.toString().replace(/[^\d.,]/g, '').replace(',', '.')
      const price = parseFloat(priceStr)
      if (!isNaN(price)) {
        parsedPrice = price
      }
    }

    // ШАГ 5: Формируем specifications
    const specifications: any = {}
    if (metadata.brand) specifications.brand = metadata.brand
    if (metadata.marketplace) specifications.marketplace = metadata.marketplace
    specifications.originalUrl = url

    // Определяем категорию
    const finalCategory = category || metadata.category || 'Разное'

    console.log('💾 [PARSE-AND-IMPORT] Сохраняем товар в БД...')
    console.log('   Название:', metadata.title)
    console.log('   Категория:', finalCategory)
    console.log('   Цена:', parsedPrice)
    console.log('   Изображений:', images.length)

    // ШАГ 6: Сохраняем в БД
    const { data: product, error: insertError } = await supabase
      .from('catalog_verified_products')
      .insert({
        supplier_id: finalSupplierId,
        name: metadata.title,
        description: metadata.description || metadata.title,
        category: finalCategory,
        price: parsedPrice,
        currency: metadata.currency || 'RUB',
        images: images,
        specifications: specifications,
        is_active: true,
        in_stock: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ [PARSE-AND-IMPORT] Ошибка сохранения:', insertError)
      return NextResponse.json(
        {
          error: 'Ошибка сохранения товара в БД',
          details: insertError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ [PARSE-AND-IMPORT] Товар успешно импортирован! ID:', product.id)

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
      metadata: {
        title: metadata.title,
        imageUrl: metadata.imageUrl,
        marketplace: metadata.marketplace
      },
      message: 'Товар успешно спарсен и добавлен в каталог'
    })

  } catch (error) {
    console.error('❌ [PARSE-AND-IMPORT] Критическая ошибка:', error)
    return NextResponse.json(
      {
        error: 'Критическая ошибка при импорте товара',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
