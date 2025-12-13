import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getOtapiService } from '@/lib/services/OtapiService'
import { logger } from '@/src/shared/lib/logger'

/**
 * API Endpoint для импорта товаров из OTAPI
 *
 * POST /api/catalog/import-from-otapi
 *
 * Body:
 * {
 *   query: string        - поисковый запрос
 *   provider?: string    - маркетплейс (Taobao, 1688, AliExpress)
 *   category?: string    - категория для сохранения
 *   limit?: number       - количество товаров
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Проверяем наличие ключа OTAPI
    if (!process.env.OTAPI_INSTANCE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OTAPI не настроен. Добавьте OTAPI_INSTANCE_KEY в переменные окружения.'
      }, { status: 503 })
    }

    // Получаем параметры из запроса
    const body = await request.json()
    const {
      query = 'electronics',
      provider = 'Taobao',
      category = 'Электроника',
      limit = 20
    } = body

    logger.info('[API] Импорт из OTAPI:', { query, provider, category, limit })

    // Инициализируем сервис OTAPI
    const otapi = getOtapiService()

    // 1. Проверяем доступность OTAPI
    const status = await otapi.checkStatus()
    if (!status.available) {
      return NextResponse.json({
        success: false,
        error: `OTAPI недоступен: ${status.error}`
      }, { status: 503 })
    }

    // 2. Ищем товары через OTAPI
    const products = await otapi.searchProducts({
      query,
      provider,
      limit
    })

    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Товары не найдены. Попробуйте изменить запрос.',
        imported: 0
      })
    }

    console.log(`[API] Найдено товаров в OTAPI: ${products.length}`)

    // 3. Получаем или создаем поставщика
    let { data: supplier, error: supplierError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name')
      .eq('name', `OTAPI ${provider} Import`)
      .single()

    if (supplierError || !supplier) {
      // Создаем нового поставщика
      const { data: newSupplier, error: createError } = await supabase
        .from('catalog_verified_suppliers')
        .insert([{
          name: `OTAPI ${provider} Import`,
          company_name: `${provider} через OTAPI`,
          category: category,
          country: 'Китай',
          city: provider === '1688' ? 'Иу' : 'Гуанчжоу',
          description: `Автоматический импорт товаров с ${provider} через OTAPI API. Прямые поставки из Китая.`,
          is_active: true,
          is_verified: true,
          moderation_status: 'approved',
          contact_email: 'import@otapi.net',
          min_order: 'От 1 шт.',
          response_time: '1-2 дня',
          public_rating: 4.5,
          certifications: ['OTAPI Partner', 'Verified Importer'],
          specialties: ['Оптовые поставки', 'Прямые поставки из Китая', 'Автоматический импорт']
        }])
        .select()
        .single()

      if (createError) {
        throw new Error(`Ошибка создания поставщика: ${createError.message}`)
      }

      supplier = newSupplier
      logger.info(`[API] Создан новый поставщик: ${supplier?.name || 'Unknown'}`)
    }

    // Проверяем что supplier существует
    if (!supplier) {
      throw new Error('Не удалось получить или создать поставщика')
    }

    // 4. Форматируем и импортируем товары
    const productsToImport = []
    const skippedProducts = []
    const errors = []

    for (const product of products) {
      try {
        // Проверяем дубликаты по SKU
        if (product.id) {
          const { data: existing } = await supabase
            .from('catalog_verified_products')
            .select('id')
            .eq('sku', product.id)
            .single()

          if (existing) {
            skippedProducts.push(product.name)
            continue
          }
        }

        // Создаем specifications с правильной типизацией
        const specifications: Record<string, any> = {
          ...product.specifications,
          'Бренд': product.brand,
          'Маркетплейс': provider,
          'Рейтинг': product.rating ? `${product.rating}/5` : null,
          'Продано': product.soldCount ? `${product.soldCount} шт.` : null,
          'Отзывов': product.reviewsCount,
          'Поставщик': product.seller.name,
          'Страна поставщика': product.seller.country,
          'Город поставщика': product.seller.city
        }

        // Очищаем null значения из specifications
        Object.keys(specifications).forEach(key => {
          if (specifications[key] === null ||
              specifications[key] === undefined) {
            delete specifications[key]
          }
        })

        // Форматируем товар для БД
        const formattedProduct = {
          // Основная информация
          name: product.name,
          description: product.description || `${product.name}\n\nИмпортировано с ${provider} через OTAPI`,
          category: category,
          sku: product.id,

          // Цены
          price: product.price,
          currency: 'RUB',
          min_order: product.minOrderQuantity ? `${product.minOrderQuantity} шт.` : '1 шт.',
          in_stock: product.inStock,

          // Характеристики
          specifications: specifications,
          images: product.images.slice(0, 10), // Максимум 10 изображений

          // Связь с поставщиком
          supplier_id: supplier.id,

          // Статус
          is_active: true,
          is_featured: product.rating && product.rating >= 4.5 // Выделяем товары с высоким рейтингом
        }

        productsToImport.push(formattedProduct)

      } catch (error: any) {
        errors.push({
          product: product.name,
          error: error.message
        })
      }
    }

    // 5. Массовая вставка в БД
    let imported = 0
    if (productsToImport.length > 0) {
      const { data: insertedProducts, error: insertError } = await supabase
        .from('catalog_verified_products')
        .insert(productsToImport)
        .select('id, name')

      if (insertError) {
        throw new Error(`Ошибка импорта в БД: ${insertError.message}`)
      }

      imported = insertedProducts?.length || 0
      logger.info(`[API] Импортировано товаров: ${imported}`)
    }

    // 6. Формируем ответ
    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: `Успешно импортировано ${imported} товаров из ${provider}`,
      stats: {
        found: products.length,
        imported: imported,
        skipped: skippedProducts.length,
        errors: errors.length,
        executionTimeMs: executionTime
      },
      details: {
        supplier: {
          id: supplier.id,
          name: supplier.name
        },
        skippedProducts: skippedProducts.slice(0, 5), // Показываем первые 5
        errors: errors.slice(0, 5) // Показываем первые 5 ошибок
      }
    })

  } catch (error: any) {
    logger.error('[API] Ошибка импорта из OTAPI:', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера',
      details: error.stack
    }, { status: 500 })
  }
}

/**
 * GET /api/catalog/import-from-otapi
 *
 * Проверка статуса OTAPI
 */
export async function GET() {
  try {
    if (!process.env.OTAPI_INSTANCE_KEY) {
      return NextResponse.json({
        available: false,
        error: 'OTAPI_INSTANCE_KEY не настроен'
      })
    }

    const otapi = getOtapiService()
    const status = await otapi.checkStatus()

    return NextResponse.json({
      available: status.available,
      instanceInfo: status.instanceInfo,
      error: status.error,
      providers: ['Taobao', '1688', 'AliExpress'],
      categories: [
        'Электроника',
        'Текстиль и одежда',
        'Красота и здоровье',
        'Автотовары',
        'Спорт и отдых'
      ]
    })

  } catch (error: any) {
    return NextResponse.json({
      available: false,
      error: error.message
    }, { status: 500 })
  }
}