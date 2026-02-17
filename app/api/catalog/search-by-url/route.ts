import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from 'next/server'
import { getUrlParserService } from '@/lib/services/UrlParserService'
import { getHtmlParserService } from '@/lib/services/HtmlParserService'
import { getClaudeWebFetchService } from '@/lib/services/ClaudeWebFetchService'
import { getPlaywrightParserService } from '@/lib/services/PlaywrightParserService'
import { getYandexGPTService } from '@/lib/services/YandexGPTService'
import { supabase } from '@/lib/supabaseClient'
import { getOptionalAuthUser } from '@/lib/api/getOptionalAuthUser'
import { buildOrFilter } from '@/lib/api/escapePostgrestTerm'
import { isPrivateUrl } from '@/lib/api/ssrfGuard'

// BUG-10: Typed interfaces instead of `any`
interface UrlSearchMetadata {
  title?: string
  description?: string
  marketplace?: string
  imageUrl?: string
  brand?: string
  category?: string
}

interface UrlSearchAnalysis {
  brand?: string
  category?: string
  keywords: string[]
}

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
 *
 * BUG-8: Requires ANTHROPIC_API_KEY env var for Claude Web Fetch mode.
 * Without it, falls back to Playwright/UrlParser automatically.
 */
export async function POST(request: NextRequest) {
  try {
    // BUG-11: Optional auth — log user if present, don't block anonymous
    const user = await getOptionalAuthUser(request)
    if (user) {
      logger.info(`[URL SEARCH] Authenticated user: ${user.id}`)
    }

    const body = await request.json()
    const { url, html } = body

    // Должен быть предоставлен либо URL либо HTML
    if (!url && !html) {
      return NextResponse.json(
        { error: 'Необходимо предоставить URL или HTML код' },
        { status: 400 }
      )
    }

    let metadata: UrlSearchMetadata | undefined

    // Режим 1: Парсинг по URL
    if (url && !html) {

      // Проверяем валидность URL
      const urlParser = getUrlParserService()
      if (!urlParser.isValidUrl(url)) {
        return NextResponse.json(
          { error: 'Некорректный URL' },
          { status: 400 }
        )
      }

      // BUG-7: SSRF protection — block private/internal addresses
      if (isPrivateUrl(url)) {
        return NextResponse.json(
          { error: 'URL указывает на внутренний адрес' },
          { status: 400 }
        )
      }

      // Стратегия: Пробуем Claude Web Fetch, затем fallback на Playwright
      const claudeService = getClaudeWebFetchService()

      if (claudeService.isAvailable()) {
        try {
          metadata = await claudeService.parseProductUrl(url)
        } catch (claudeError) {

          // Fallback на Playwright
          metadata = await urlParser.parseProductUrl(url)
        }
      } else {
        metadata = await urlParser.parseProductUrl(url)
      }
    }
    // Режим 2: Парсинг HTML кода (ОБХОДИТ ЗАЩИТУ!)
    else if (html) {

      const htmlParser = getHtmlParserService()

      if (!htmlParser.isValidHtml(html)) {
        return NextResponse.json(
          { error: 'Некорректный HTML код. Убедитесь что вы скопировали исходный код страницы целиком.' },
          { status: 400 }
        )
      }

      metadata = htmlParser.parseHtmlCode(html)
    }

    if (!metadata) {
      return NextResponse.json(
        { error: 'Не удалось получить данные о товаре' },
        { status: 422 }
      )
    }

    // Шаг 2: Формируем анализ (ключевые слова для поиска)
    // Если Claude уже проанализировал - используем его данные
    // Иначе используем YandexGPT или базовый анализ
    let analysis: UrlSearchAnalysis

    if (metadata.brand || metadata.category) {
      // Claude уже проанализировал товар

      // Извлекаем ключевые слова из названия и описания
      const titleWords = metadata.title?.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3) || []
      const descWords = metadata.description?.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5) || []

      analysis = {
        brand: metadata.brand,
        category: metadata.category,
        keywords: [...titleWords, ...descWords, metadata.brand].filter((v): v is string => !!v)
      }
    } else {
      // Используем YandexGPT для анализа
      const gptService = getYandexGPTService()
      const gptResult = await gptService.analyzeProductFromMetadata(
        metadata.title || '',
        metadata.description || '',
        metadata.marketplace
      )
      analysis = {
        brand: gptResult.brand ?? undefined,
        category: gptResult.category ?? undefined,
        keywords: gptResult.keywords,
      }
    }


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


    // Шаг 4: Ищем в базе данных
    let query = supabase
      .from('catalog_verified_products')
      .select('*')
      .eq('is_active', true)

    // BUG-9: Use safe buildOrFilter instead of partial manual escape
    const orFilter = buildOrFilter(searchTerms)
    if (orFilter) {
      query = query.or(orFilter)
    }

    // Ограничиваем результаты
    query = query.limit(20)

    const { data: products, error } = await query

    if (error) {
      logger.error('[URL SEARCH] Ошибка поиска в БД:', error)
      throw error
    }


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
    logger.error('[URL SEARCH] Критическая ошибка:', error)

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

    // BUG-5 equivalent: Don't leak error details to client
    return NextResponse.json(
      { error: 'Произошла ошибка при поиске товара' },
      { status: 500 }
    )
  }
}
