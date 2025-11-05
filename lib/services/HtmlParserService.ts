/**
 * HtmlParserService - Парсинг HTML кода предоставленного пользователем
 *
 * Обходит anti-bot защиту потому что:
 * 1. Пользователь сам открывает страницу в браузере
 * 2. Копирует HTML код (View Source)
 * 3. Мы парсим уже полученный HTML
 */

import * as cheerio from 'cheerio'

export interface ParsedHtmlMetadata {
  title: string
  description: string
  price?: string
  currency?: string
  imageUrl?: string
  brand?: string
  marketplace?: string
}

export class HtmlParserService {
  /**
   * Парсинг HTML кода предоставленного пользователем
   */
  parseHtmlCode(html: string): ParsedHtmlMetadata {
    console.log('🔍 [HTML Parser] Начинаем парсинг HTML кода')
    console.log('📄 [HTML Parser] Размер HTML:', html.length, 'символов')

    const $ = cheerio.load(html)

    // Извлекаем Open Graph теги (самое надежное)
    const ogTitle = $('meta[property="og:title"]').attr('content')
    const ogDesc = $('meta[property="og:description"]').attr('content')
    const ogImage = $('meta[property="og:image"]').attr('content')
    const ogPrice = $('meta[property="og:price:amount"]').attr('content') ||
                   $('meta[property="product:price:amount"]').attr('content')
    const ogCurrency = $('meta[property="og:price:currency"]').attr('content') ||
                      $('meta[property="product:price:currency"]').attr('content')

    console.log('🏷️ [HTML Parser] Open Graph теги:')
    console.log('   og:title:', ogTitle?.substring(0, 50))
    console.log('   og:description:', ogDesc?.substring(0, 50))
    console.log('   og:price:', ogPrice, ogCurrency)

    // Fallback на Twitter Card
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')
    const twitterDesc = $('meta[name="twitter:description"]').attr('content')
    const twitterImage = $('meta[name="twitter:image"]').attr('content')

    // Fallback на обычные meta теги
    const metaDesc = $('meta[name="description"]').attr('content')
    const pageTitle = $('title').text()

    // Пробуем найти цену в различных вариантах
    const priceSelectors = [
      '[data-widget="webPrice"]',
      '.price-block__final-price',
      '[class*="price"]',
      '[data-price]'
    ]

    let foundPrice = ogPrice
    if (!foundPrice) {
      for (const selector of priceSelectors) {
        const priceText = $(selector).first().text().trim()
        if (priceText && /\d/.test(priceText)) {
          foundPrice = priceText
          console.log(`💰 [HTML Parser] Найдена цена через selector "${selector}":`, priceText.substring(0, 30))
          break
        }
      }
    }

    // Определяем маркетплейс по URL в HTML
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || ''
    const marketplace = this.detectMarketplaceFromHtml(canonicalUrl, html)

    const result: ParsedHtmlMetadata = {
      title: ogTitle || twitterTitle || pageTitle || 'Товар без названия',
      description: ogDesc || twitterDesc || metaDesc || '',
      price: foundPrice,
      currency: ogCurrency || 'RUB',
      imageUrl: ogImage || twitterImage,
      marketplace
    }

    console.log('✅ [HTML Parser] Парсинг завершен:')
    console.log('   Title:', result.title.substring(0, 60))
    console.log('   Description:', result.description.substring(0, 60))
    console.log('   Price:', result.price, result.currency)
    console.log('   Marketplace:', result.marketplace)

    if (!result.title || result.title === 'Товар без названия') {
      throw new Error('Не удалось извлечь название товара из HTML. Убедитесь что вы скопировали HTML код со страницы товара.')
    }

    return result
  }

  /**
   * Определение маркетплейса из HTML
   */
  private detectMarketplaceFromHtml(url: string, html: string): string {
    const lowercaseUrl = url.toLowerCase()
    const lowercaseHtml = html.toLowerCase()

    if (lowercaseUrl.includes('wildberries.ru') || lowercaseHtml.includes('wildberries')) {
      return 'wildberries'
    }
    if (lowercaseUrl.includes('ozon.ru') || lowercaseHtml.includes('ozon')) {
      return 'ozon'
    }
    if (lowercaseUrl.includes('aliexpress') || lowercaseHtml.includes('aliexpress')) {
      return 'aliexpress'
    }
    if (lowercaseUrl.includes('market.yandex.ru') || lowercaseHtml.includes('yandex')) {
      return 'yandex'
    }
    if (lowercaseUrl.includes('sbermegamarket.ru') || lowercaseHtml.includes('sbermegamarket')) {
      return 'sber'
    }
    if (lowercaseUrl.includes('amazon.') || lowercaseHtml.includes('amazon')) {
      return 'amazon'
    }

    return 'unknown'
  }

  /**
   * Валидация HTML кода
   */
  isValidHtml(html: string): boolean {
    if (!html || html.trim().length < 100) {
      return false
    }

    // Проверяем что это похоже на HTML
    const hasHtmlTags = /<html/i.test(html) || /<head/i.test(html) || /<meta/i.test(html)

    return hasHtmlTags
  }
}

// Singleton instance
let htmlParserService: HtmlParserService | null = null

export function getHtmlParserService(): HtmlParserService {
  if (!htmlParserService) {
    htmlParserService = new HtmlParserService()
  }
  return htmlParserService
}
