import { NextRequest, NextResponse } from 'next/server'
import { getUrlParserService } from '@/lib/services/UrlParserService'
import { getYandexGPTService } from '@/lib/services/YandexGPTService'
import { supabase } from '@/lib/supabaseClient'

/**
 * POST /api/catalog/search-by-url
 * Поиск товаров по ссылке с маркетплейса
 *
 * Поддерживаемые маркетплейсы:
 * - Wildberries
 * - Ozon
 * - AliExpress
 * - Яндекс.Маркет
 * - СберМегаМаркет
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL не предоставлен' },
        { status: 400 }
      )
    }

    console.log('🔗 [URL SEARCH] Начинаем поиск товаров по URL:', url)

    // Шаг 1: Парсим метаданные с маркетплейса
    const urlParser = getUrlParserService()

    // Валидация URL
    if (!urlParser.isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Некорректный URL' },
        { status: 400 }
      )
    }

    console.log('📦 [URL SEARCH] Парсим метаданные товара...')
    const metadata = await urlParser.parseProductUrl(url)

    console.log('✅ [URL SEARCH] Метаданные получены:', {
      title: metadata.title,
      marketplace: metadata.marketplace,
      hasDescription: !!metadata.description,
      hasImage: !!metadata.imageUrl
    })

    // Шаг 2: Анализируем товар с помощью YandexGPT
    const gptService = getYandexGPTService()
    const analysis = await gptService.analyzeProductFromMetadata(
      metadata.title,
      metadata.description || '',
      metadata.marketplace
    )

    console.log('🤖 [URL SEARCH] Анализ YandexGPT:', analysis)

    // Шаг 3: Формируем поисковые термины
    const searchTerms = [
      metadata.title,
      analysis.brand,
      analysis.category,
      ...analysis.keywords
    ]
      .filter(Boolean) // Убираем null/undefined
      .filter((v, i, a) => a.indexOf(v) === i) // Убираем дубликаты
      .filter((term): term is string => typeof term === 'string') // TypeScript type guard

    console.log('🔍 [URL SEARCH] Поисковые термины:', searchTerms)

    // Шаг 4: Ищем в базе данных
    let query = supabase
      .from('catalog_verified_products')
      .select('*')
      .eq('is_active', true)

    // Строим OR условие для каждого термина
    const orConditions = searchTerms
      .map(term => {
        const escaped = term.replace(/[%_]/g, '\\$&') // Экранируем спецсимволы SQL
        return `name.ilike.%${escaped}%,description.ilike.%${escaped}%`
      })
      .join(',')

    if (orConditions) {
      query = query.or(orConditions)
    }

    // Ограничиваем результаты
    query = query.limit(20)

    const { data: products, error } = await query

    if (error) {
      console.error('❌ [URL SEARCH] Ошибка поиска в БД:', error)
      throw error
    }

    console.log(`✅ [URL SEARCH] Найдено товаров: ${products?.length || 0}`)

    // Возвращаем результат
    return NextResponse.json({
      success: true,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        marketplace: metadata.marketplace,
        imageUrl: metadata.imageUrl
      },
      analysis: {
        brand: analysis.brand,
        category: analysis.category,
        keywords: analysis.keywords
      },
      products: products || [],
      productsCount: products?.length || 0,
      searchTerms: searchTerms.slice(0, 10) // Показываем первые 10 для отладки
    })

  } catch (error) {
    console.error('❌ [URL SEARCH] Критическая ошибка:', error)

    // Определяем тип ошибки для более информативного ответа
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Не удалось получить данные с сайта. Проверьте URL и попробуйте снова.' },
          { status: 503 }
        )
      }

      if (error.message.includes('Open Graph')) {
        return NextResponse.json(
          { error: 'Не удалось распарсить страницу товара' },
          { status: 422 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Произошла ошибка при поиске товара', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
