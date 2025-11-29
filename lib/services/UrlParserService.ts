/**
 * UrlParserService - Парсинг метаданных товаров с маркетплейсов
 *
 * Поддерживаемые маркетплейсы:
 * - Wildberries
 * - Ozon
 * - AliExpress
 * - Яндекс.Маркет
 * - СберМегаМаркет
 * - Amazon
 */

import ogs from 'open-graph-scraper'
import * as cheerio from 'cheerio'
import { getBrowserParserService } from './BrowserParserService'
import { getPlaywrightParserService } from './PlaywrightParserService'
import { getScraperApiService } from './ScraperApiService'
import { getClaudeWebFetchService } from './ClaudeWebFetchService'

export interface ParsedProductMetadata {
  title: string
  description: string
  price?: string
  currency?: string
  imageUrl?: string
  brand?: string
  category?: string
  marketplace?: string
  originalUrl: string
}

export class UrlParserService {
  /**
   * Основной метод парсинга - пробует разные методы с fallback
   */
  async parseProductUrl(url: string): Promise<ParsedProductMetadata> {

    // Определяем маркетплейс
    const marketplace = this.detectMarketplace(url)

    // Для защищенных маркетплейсов используем Playwright
    const protectedMarketplaces = ['ozon', 'wildberries', 'aliexpress', 'yandex']

    if (protectedMarketplaces.includes(marketplace)) {

      try {
        // Сначала пробуем Playwright (самый надежный)
        const playwrightParser = getPlaywrightParserService()

        if (await playwrightParser.isAvailable()) {
          const data = await playwrightParser.parseWithPlaywright(url)
          return data
        }

        // Fallback на Puppeteer если Playwright недоступен
        const browserParser = getBrowserParserService()
        const data = await browserParser.parseWithBrowser(url)
        return data

      } catch (error) {
        console.error('❌ [URL Parser] Браузерный парсинг не удался:', error)

        // Последняя попытка - ScraperAPI
        const scraperApi = getScraperApiService()
        if (scraperApi.isAvailable()) {
          console.log('🌐 [URL Parser] Пробуем ScraperAPI как последний шанс...')
          try {
            // Для защищенных маркетплейсов используем premium прокси
            const usePremium = marketplace === 'ozon' || marketplace === 'wildberries'
            const html = await scraperApi.fetchPage(url, { premium: usePremium })
            const claudeService = getClaudeWebFetchService()

            if (claudeService.isAvailable()) {
              // Используем Claude для анализа HTML от ScraperAPI
              const data = await claudeService.analyzeHtmlContent(html, url)
              return data
            } else {
              // Парсим HTML через cheerio
              const $ = cheerio.load(html)
              const ogData = this.parseOGFromHTML($)

              if (ogData.title) {
                return {
                  title: ogData.title,
                  description: ogData.description || '',
                  price: ogData.price,
                  currency: ogData.currency,
                  imageUrl: ogData.imageUrl,
                  brand: ogData.brand,
                  category: ogData.category,
                  marketplace,
                  originalUrl: url
                }
              }
            }
          } catch (scraperError) {
            console.error('❌ [URL Parser] ScraperAPI тоже не помог:', scraperError)
          }
        }

        // Fallback на сообщение об ошибке
        throw new Error(
          `Не удалось автоматически распарсить ${marketplace.toUpperCase()}. ` +
          `Попробуйте скопировать название товара и использовать обычный поиск.`
        )
      }
    }

    // Для остальных сайтов пробуем обычный HTTP
    try {
      // Сначала пробуем Open Graph
      const ogData = await this.parseOpenGraph(url)

      if (ogData.title && ogData.description) {
        return {
          title: ogData.title,
          description: ogData.description,
          price: ogData.price,
          currency: ogData.currency,
          imageUrl: ogData.imageUrl,
          brand: ogData.brand,
          category: ogData.category,
          marketplace,
          originalUrl: url
        }
      }

    } catch (error) {
    }

    // Fallback на HTML парсинг
    try {
      const htmlData = await this.parseHtml(url, marketplace)
      return {
        title: htmlData.title || 'Товар без названия',
        description: htmlData.description || '',
        price: htmlData.price,
        currency: htmlData.currency,
        imageUrl: htmlData.imageUrl,
        brand: htmlData.brand,
        category: htmlData.category,
        marketplace,
        originalUrl: url
      }
    } catch (error) {
      console.error('❌ [URL Parser] Ошибка парсинга HTML:', error)

      // Последняя попытка - браузерный парсинг
      try {
        const browserParser = getBrowserParserService()
        return await browserParser.parseWithBrowser(url)
      } catch (browserError) {
        console.error('❌ [URL Parser] Браузерный парсинг не удался')

        // Финальная попытка - ScraperAPI
        const scraperApi = getScraperApiService()
        if (scraperApi.isAvailable()) {
          console.log('🌐 [URL Parser] Последняя попытка через ScraperAPI...')
          try {
            // Для защищенных маркетплейсов используем premium прокси
            const usePremium = marketplace === 'ozon' || marketplace === 'wildberries'
            const html = await scraperApi.fetchPage(url, { premium: usePremium })
            const $ = cheerio.load(html)
            const ogData = this.parseOGFromHTML($)

            if (ogData.title) {
              return {
                title: ogData.title,
                description: ogData.description || '',
                price: ogData.price,
                currency: ogData.currency,
                imageUrl: ogData.imageUrl,
                brand: ogData.brand,
                category: ogData.category,
                marketplace,
                originalUrl: url
              }
            }

            const htmlData = await this.parseHtml(url, marketplace)

            return {
              title: htmlData.title || 'Товар без названия',
              description: htmlData.description || '',
              price: htmlData.price,
              currency: htmlData.currency,
              imageUrl: htmlData.imageUrl,
              brand: htmlData.brand,
              category: htmlData.category,
              marketplace,
              originalUrl: url
            }
          } catch (scraperError) {
            console.error('❌ [URL Parser] ScraperAPI не помог:', scraperError)
          }
        }

        console.error('❌ [URL Parser] Все методы парсинга не удались')
        throw new Error(`Не удалось распарсить URL: ${url}`)
      }
    }
  }

  /**
   * Парсинг Open Graph метаданных
   */
  private async parseOpenGraph(url: string): Promise<Partial<ParsedProductMetadata>> {
    // Пропускаем Open Graph, сразу идем к HTML парсингу
    // так как маркетплейсы часто блокируют OG парсеры
    throw new Error('Skipping OG, using HTML fallback')
  }

  /**
   * Fallback парсинг HTML если Open Graph не работает
   */
  private async parseHtml(url: string, marketplace: string): Promise<Partial<ParsedProductMetadata>> {

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow'
    })


    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    const $ = cheerio.load(html)

    // Сначала пробуем универсальный парсинг Open Graph из HTML
    const ogData = this.parseOGFromHTML($ as any)

    if (ogData.title && ogData.description) {
      return ogData
    }

    // Если OG не сработал, используем специфичные парсеры

    switch (marketplace) {
      case 'wildberries':
        return this.parseWildberries($ as any)
      case 'ozon':
        return this.parseOzon($ as any)
      case 'aliexpress':
        return this.parseAliExpress($ as any)
      case 'yandex':
        return this.parseYandexMarket($ as any)
      default:
        return this.parseGeneric($ as any)
    }
  }

  /**
   * Парсинг Open Graph тегов из HTML
   */
  private parseOGFromHTML($: any): Partial<ParsedProductMetadata> {
    return {
      title: $('meta[property="og:title"]').attr('content') ||
             $('meta[name="twitter:title"]').attr('content') || '',
      description: $('meta[property="og:description"]').attr('content') ||
                   $('meta[name="twitter:description"]').attr('content') ||
                   $('meta[name="description"]').attr('content') || '',
      imageUrl: $('meta[property="og:image"]').attr('content') ||
                $('meta[name="twitter:image"]').attr('content') || '',
      price: $('meta[property="og:price:amount"]').attr('content') ||
             $('meta[property="product:price:amount"]').attr('content')
    }
  }

  /**
   * Парсинг Wildberries HTML
   */
  private parseWildberries($: any): Partial<ParsedProductMetadata> {
    return {
      title: $('h1').first().text().trim() ||
             $('[data-link="text{:product^goodsName}"]').text().trim(),
      description: $('.description').first().text().trim() ||
                  $('.collapsable__content').first().text().trim(),
      price: $('.price-block__final-price').first().text().trim(),
      imageUrl: $('.img-plug').first().attr('src') ||
                $('.slide__content img').first().attr('src')
    }
  }

  /**
   * Парсинг Ozon HTML
   */
  private parseOzon($: any): Partial<ParsedProductMetadata> {
    return {
      title: $('h1').first().text().trim() ||
             $('[data-widget="webProductHeading"]').text().trim(),
      description: $('[data-widget="webDescription"]').text().trim() ||
                  $('.RA-a1').text().trim(),
      price: $('[data-widget="webPrice"]').text().trim() ||
             $('.c3017-a1').text().trim(),
      imageUrl: $('.PhotoView_photo img').first().attr('src') ||
                $('[data-state-item-id] img').first().attr('src')
    }
  }

  /**
   * Парсинг AliExpress HTML
   */
  private parseAliExpress($: any): Partial<ParsedProductMetadata> {
    return {
      title: $('h1').first().text().trim() ||
             $('.product-title-text').text().trim(),
      description: $('.product-description').text().trim() ||
                  $('.product-overview').text().trim(),
      price: $('.product-price-value').text().trim() ||
             $('.uniform-banner-box-price').text().trim(),
      imageUrl: $('.magnifier-image').first().attr('src') ||
                $('.images-view-item img').first().attr('src')
    }
  }

  /**
   * Парсинг Яндекс.Маркет HTML
   */
  private parseYandexMarket($: any): Partial<ParsedProductMetadata> {
    return {
      title: $('h1').first().text().trim(),
      description: $('[data-auto="description"]').text().trim() ||
                  $('.n-product-overview__description').text().trim(),
      price: $('[data-auto="price"]').first().text().trim() ||
             $('.n-product-price__price').text().trim(),
      imageUrl: $('[data-auto="offer-photo"] img').first().attr('src')
    }
  }

  /**
   * Универсальный парсинг для остальных сайтов
   */
  private parseGeneric($: any): Partial<ParsedProductMetadata> {
    // Пробуем стандартные HTML теги
    const title = $('h1').first().text().trim() ||
                  $('title').text().trim()

    const description = $('meta[name="description"]').attr('content') ||
                       $('.description').first().text().trim() ||
                       $('p').first().text().trim()

    const price = $('[class*="price"]').first().text().trim() ||
                  $('[data-price]').first().text().trim()

    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                    $('img').first().attr('src')

    return { title, description, price, imageUrl }
  }

  /**
   * Определение маркетплейса по URL
   */
  private detectMarketplace(url: string): string {
    const lowercaseUrl = url.toLowerCase()

    if (lowercaseUrl.includes('wildberries.ru')) return 'wildberries'
    if (lowercaseUrl.includes('ozon.ru')) return 'ozon'
    if (lowercaseUrl.includes('aliexpress')) return 'aliexpress'
    if (lowercaseUrl.includes('market.yandex.ru')) return 'yandex'
    if (lowercaseUrl.includes('sbermegamarket.ru')) return 'sber'
    if (lowercaseUrl.includes('amazon.')) return 'amazon'

    return 'unknown'
  }

  /**
   * Валидация URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Проверка, является ли URL маркетплейсом
   */
  isSupportedMarketplace(url: string): boolean {
    const marketplace = this.detectMarketplace(url)
    return marketplace !== 'unknown'
  }
}

// Singleton instance
let urlParserService: UrlParserService | null = null

export function getUrlParserService(): UrlParserService {
  if (!urlParserService) {
    urlParserService = new UrlParserService()
  }
  return urlParserService
}
