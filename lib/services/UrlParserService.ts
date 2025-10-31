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
   * Основной метод парсинга - пробует Open Graph, потом HTML fallback
   */
  async parseProductUrl(url: string): Promise<ParsedProductMetadata> {
    console.log('🔍 [URL Parser] Начинаем парсинг:', url)

    // Определяем маркетплейс
    const marketplace = this.detectMarketplace(url)
    console.log('🏪 [URL Parser] Определен маркетплейс:', marketplace)

    try {
      // Сначала пробуем Open Graph
      const ogData = await this.parseOpenGraph(url)

      if (ogData.title && ogData.description) {
        console.log('✅ [URL Parser] Open Graph данные получены')
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

      console.log('⚠️ [URL Parser] Open Graph неполный, пробуем HTML парсинг...')
    } catch (error) {
      console.log('⚠️ [URL Parser] Open Graph не удался:', error)
    }

    // Fallback на HTML парсинг
    try {
      const htmlData = await this.parseHtml(url, marketplace)
      console.log('✅ [URL Parser] HTML данные получены')
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
      throw new Error(`Не удалось распарсить URL: ${url}`)
    }
  }

  /**
   * Парсинг Open Graph метаданных
   */
  private async parseOpenGraph(url: string): Promise<Partial<ParsedProductMetadata>> {
    const options = {
      url,
      timeout: 10000,
      fetchOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    }

    const { result, error } = await ogs(options)

    if (error) {
      throw new Error(`Open Graph error: ${error}`)
    }

    return {
      title: result.ogTitle || result.twitterTitle || '',
      description: result.ogDescription || result.twitterDescription || '',
      imageUrl: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || ''
    }
  }

  /**
   * Fallback парсинг HTML если Open Graph не работает
   */
  private async parseHtml(url: string, marketplace: string): Promise<Partial<ParsedProductMetadata>> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Разные стратегии для разных маркетплейсов
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
