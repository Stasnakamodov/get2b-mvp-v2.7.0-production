import { NextRequest, NextResponse } from 'next/server'
import { getUrlParserService } from '@/lib/services/UrlParserService'
import { getHtmlParserService } from '@/lib/services/HtmlParserService'
import { getYandexGPTService } from '@/lib/services/YandexGPTService'
import { getClaudeWebFetchService } from '@/lib/services/ClaudeWebFetchService'
import { supabase } from '@/lib/supabaseClient'

/**
 * POST /api/catalog/search-by-url
 * Поиск товаров по ссылке с маркетплейса ИЛИ по HTML коду
 *
 * Поддерживает 3 режима:
 * 1. url: string + Claude Web Fetch - AI парсинг по URL (быстро, для простых сайтов)
 * 2. url: string + Playwright - браузерный парсинг (fallback для защищенных)
 * 3. html: string - парсинг HTML кода (обходит защиту маркетплейсов!)
 *
 * Поддерживаемые маркетплейсы:
 * - Wildberries, Ozon, AliExpress, Яндекс.Маркет, СберМегаМаркет
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, html } = body

    // Должен быть предоставлен либо URL либо HTML
    if (!url && !html) {
      return NextResponse.json(
        { error: 'Необходимо предоставить URL или HTML код' },
        { status: 400 }
      )
    }

    let metadata: any

    // Режим 1: Парсинг по URL
    if (url && !html) {
      console.log('🔗 [URL SEARCH] Режим: Парсинг по URL:', url)

      // Проверяем валидность URL
      const urlParser = getUrlParserService()
      if (!urlParser.isValidUrl(url)) {
        return NextResponse.json(
          { error: 'Некорректный URL' },
          { status: 400 }
        )
      }

      // Стратегия: Пробуем Claude Web Fetch, затем fallback на Playwright
      const claudeService = getClaudeWebFetchService()

      if (claudeService.isAvailable()) {
        try {
          console.log('🤖 [URL SEARCH] Пробуем Claude Web Fetch (AI парсинг)...')
          metadata = await claudeService.parseProductUrl(url)
          console.log('✅ [URL SEARCH] Claude Web Fetch успешен!')
        } catch (claudeError) {
          console.log('⚠️ [URL SEARCH] Claude Web Fetch не удался:',
            claudeError instanceof Error ? claudeError.message : String(claudeError))
          console.log('🔄 [URL SEARCH] Переключаемся на Playwright парсинг...')

          // Fallback на Playwright
          metadata = await urlParser.parseProductUrl(url)
        }
      } else {
        console.log('⚠️ [URL SEARCH] Claude недоступен, используем Playwright')
        metadata = await urlParser.parseProductUrl(url)
      }
    }
    // Режим 2: Парсинг HTML кода (ОБХОДИТ ЗАЩИТУ!)
    else if (html) {
      console.log('📄 [URL SEARCH] Режим: Парсинг HTML кода (размер:', html.length, 'байт)')

      const htmlParser = getHtmlParserService()

      if (!htmlParser.isValidHtml(html)) {
        return NextResponse.json(
          { error: 'Некорректный HTML код. Убедитесь что вы скопировали исходный код страницы целиком.' },
          { status: 400 }
        )
      }

      console.log('📦 [URL SEARCH] Парсим метаданные из HTML...')
      metadata = htmlParser.parseHtmlCode(html)
    }

    console.log('✅ [URL SEARCH] Метаданные получены:', {
      title: metadata.title,
      marketplace: metadata.marketplace,
      hasDescription: !!metadata.description,
      hasImage: !!metadata.imageUrl
    })

    // Шаг 2: Формируем анализ (ключевые слова для поиска)
    // Если Claude уже проанализировал - используем его данные
    // Иначе используем YandexGPT или базовый анализ
    let analysis: any

    if (metadata.brand || metadata.category) {
      // Claude уже проанализировал товар
      console.log('✅ [URL SEARCH] Используем анализ от Claude')

      // Извлекаем ключевые слова из названия и описания
      const titleWords = metadata.title?.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3) || []
      const descWords = metadata.description?.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5) || []

      analysis = {
        brand: metadata.brand,
        category: metadata.category,
        keywords: [...titleWords, ...descWords, metadata.brand].filter(Boolean)
      }
    } else {
      // Используем YandexGPT для анализа
      console.log('🤖 [URL SEARCH] Анализируем через YandexGPT...')
      const gptService = getYandexGPTService()
      analysis = await gptService.analyzeProductFromMetadata(
        metadata.title,
        metadata.description || '',
        metadata.marketplace
      )
    }

    console.log('🎯 [URL SEARCH] Финальный анализ:', analysis)

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
