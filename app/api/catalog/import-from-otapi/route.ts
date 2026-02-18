import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { getOtapiService } from '@/lib/services/OtapiService'
import { getDeduplicationService, normalizeImageUrl } from '@/lib/services/ImportDeduplicationService'
import { getProductQualityEnricher } from '@/lib/services/ProductQualityEnricher'
import { logger } from '@/src/shared/lib/logger'

/**
 * API Endpoint для импорта товаров из OTAPI
 *
 * POST /api/catalog/import-from-otapi
 *
 * Body:
 * {
 *   query: string        - поисковый запрос
 *   supplier_id: string  - ID существующего поставщика в catalog_verified_suppliers
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
      supplier_id,
      provider = 'Taobao',
      category = 'Электроника',
      limit = 20
    } = body

    // Валидация обязательного supplier_id
    if (!supplier_id) {
      return NextResponse.json({
        success: false,
        error: 'supplier_id обязателен. Выберите поставщика для привязки импортированных товаров.'
      }, { status: 400 })
    }

    logger.info('[API] Импорт из OTAPI:', { query, supplier_id, provider, category, limit })

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

    logger.info(`[API] Найдено товаров в OTAPI: ${products.length}`)

    // 3. Проверяем что поставщик существует
    const { data: supplier, error: supplierError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name')
      .eq('id', supplier_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({
        success: false,
        error: `Поставщик с ID "${supplier_id}" не найден в catalog_verified_suppliers.`
      }, { status: 400 })
    }

    logger.info(`[API] Импорт товаров для поставщика: ${supplier.name} (${supplier.id})`)

    // 4. Инициализируем сервисы дедупликации и обогащения
    const dedupService = getDeduplicationService()
    await dedupService.initialize(category)

    const enricher = getProductQualityEnricher()
    const batchNames = new Set<string>()

    // 5. Форматируем и фильтруем товары
    const productsToImport = []
    const skippedProducts: Array<{ name: string; reason: string }> = []
    const errors: Array<{ product: string; error: string }> = []

    for (const product of products) {
      try {
        // 5-layer duplicate check
        const images = product.images.slice(0, 10).map(normalizeImageUrl)
        const dupResult = dedupService.checkDuplicate({
          sku: product.id,
          name: product.name,
          images,
          price: product.price,
          category,
        })

        if (dupResult.isDuplicate) {
          skippedProducts.push({
            name: product.name,
            reason: dupResult.reason || 'duplicate',
          })
          continue
        }

        // Enrich name and description
        const enrichedName = enricher.enrichName(product, batchNames)
        const enrichedDescription = enricher.enrichDescription(product, category)

        // Создаем specifications
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

        // Очищаем null значения
        Object.keys(specifications).forEach(key => {
          if (specifications[key] === null || specifications[key] === undefined) {
            delete specifications[key]
          }
        })

        // Форматируем товар для БД
        const formattedProduct = {
          name: enrichedName,
          description: enrichedDescription,
          category: category,
          sku: product.id,
          price: product.price,
          currency: 'RUB',
          min_order: product.minOrderQuantity ? `${product.minOrderQuantity} шт.` : '1 шт.',
          in_stock: product.inStock,
          specifications: specifications,
          images: images,
          supplier_id: supplier.id,
          is_active: true,
          is_featured: product.rating != null && product.rating >= 4.5
        }

        productsToImport.push({ formatted: formattedProduct, original: product })

      } catch (error: any) {
        errors.push({
          product: product.name,
          error: error.message
        })
      }
    }

    // 6. Массовая вставка в БД с fallback на one-by-one
    let imported = 0
    const insertedIds: Array<{ id: string; images: string[] }> = []

    if (productsToImport.length > 0) {
      const rows = productsToImport.map(p => p.formatted)

      // Try batch insert first
      const { data: insertedProducts, error: insertError } = await supabase
        .from('catalog_verified_products')
        .insert(rows)
        .select('id, name, images')

      if (insertError) {
        // Fallback: insert one-by-one, skip constraint violations
        logger.warn(`[API] Batch insert failed: ${insertError.message}. Falling back to one-by-one.`)

        for (const row of rows) {
          const { data: single, error: singleError } = await supabase
            .from('catalog_verified_products')
            .insert([row])
            .select('id, name, images')
            .single()

          if (singleError) {
            skippedProducts.push({
              name: row.name,
              reason: `db_constraint: ${singleError.message}`,
            })
          } else if (single) {
            imported++
            insertedIds.push({ id: single.id, images: single.images || [] })
            // Register in dedup cache for within-batch dedup
            dedupService.registerProduct({
              id: single.id,
              name: single.name,
              sku: row.sku,
              price: row.price,
              images: single.images || [],
            })
          }
        }
      } else if (insertedProducts) {
        imported = insertedProducts.length
        for (const p of insertedProducts) {
          insertedIds.push({ id: p.id, images: p.images || [] })
          dedupService.registerProduct({
            id: p.id,
            name: p.name,
            sku: rows.find(r => r.name === p.name)?.sku || '',
            price: rows.find(r => r.name === p.name)?.price || 0,
            images: p.images || [],
          })
        }
      }

      logger.info(`[API] Импортировано товаров: ${imported}`)
    }

    // 7. Регистрация картинок в image registry (fire-and-forget, non-blocking)
    if (insertedIds.length > 0) {
      Promise.all(
        insertedIds.map(({ id, images }) => dedupService.registerImages(id, images))
      ).catch(err => logger.warn('[API] Image registry error:', err))
    }

    // 8. Формируем ответ с расширенной статистикой
    const executionTime = Date.now() - startTime

    // Breakdown skipped by reason
    const skipReasons: Record<string, number> = {}
    for (const s of skippedProducts) {
      skipReasons[s.reason] = (skipReasons[s.reason] || 0) + 1
    }

    return NextResponse.json({
      success: true,
      message: `Успешно импортировано ${imported} товаров из ${provider}`,
      stats: {
        found: products.length,
        imported: imported,
        skipped: skippedProducts.length,
        errors: errors.length,
        executionTimeMs: executionTime,
        skipReasons,
        dedupCacheStats: dedupService.stats,
      },
      details: {
        supplier: {
          id: supplier.id,
          name: supplier.name
        },
        skippedProducts: skippedProducts.slice(0, 10),
        errors: errors.slice(0, 5)
      }
    })

  } catch (error: any) {
    logger.error('[API] Ошибка импорта из OTAPI:', error)

    return NextResponse.json({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера'
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
