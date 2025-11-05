/**
 * ClaudeWebFetchService - Парсинг товаров через Claude Web Fetch API
 *
 * Использует встроенный Web Fetch инструмент Claude для получения контента по URL
 * и интеллектуального анализа товаров с маркетплейсов.
 *
 * Преимущества:
 * - Не требует дополнительных библиотек для парсинга
 * - AI понимает контекст и извлекает нужную информацию
 * - Работает с простыми сайтами без Cloudflare
 *
 * Ограничения:
 * - НЕ обходит Cloudflare/anti-bot защиту
 * - Для Ozon/Wildberries нужен fallback на ScraperAPI
 */

import Anthropic from '@anthropic-ai/sdk'
import type { ParsedProductMetadata } from './UrlParserService'

export interface ClaudeProductAnalysis {
  brand: string | null
  category: string | null
  productType: string | null
  keywords: string[]
  description: string
  price?: string
  currency?: string
}

export class ClaudeWebFetchService {
  private client: Anthropic | null = null
  private apiKey: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY не найден в переменных окружения')
      console.warn('⚠️ Claude Web Fetch будет недоступен')
    } else {
      this.client = new Anthropic({
        apiKey: this.apiKey
      })
      console.log('✅ Claude Web Fetch Service инициализирован')
    }
  }

  /**
   * Проверка доступности Claude API
   */
  isAvailable(): boolean {
    return !!this.client && !!this.apiKey
  }

  /**
   * Парсинг товара по URL через Claude Web Fetch
   */
  async parseProductUrl(url: string): Promise<ParsedProductMetadata> {
    if (!this.client) {
      throw new Error('Claude API недоступен. Проверьте ANTHROPIC_API_KEY')
    }

    console.log('🤖 [Claude Web Fetch] Начинаем парсинг:', url)

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        tools: [{
          type: 'web_fetch_20250910' as any,
          name: 'web_fetch',
          max_uses: 3
        }],
        messages: [{
          role: 'user',
          content: this.buildPrompt(url)
        }]
      }, {
        headers: {
          'anthropic-beta': 'web-fetch-2025-09-10'
        }
      } as any)

      console.log('✅ [Claude Web Fetch] Ответ получен')

      // Извлекаем текстовый контент из ответа
      const textContent = response.content.find((block: any) => block.type === 'text')

      if (!textContent || !textContent.text) {
        throw new Error('Claude не вернул текстовый ответ')
      }

      console.log('📄 [Claude Web Fetch] Ответ Claude:', textContent.text.substring(0, 200))

      // Парсим JSON из ответа Claude
      const analysis = this.parseClaudeResponse(textContent.text)

      console.log('🎯 [Claude Web Fetch] Результат анализа:', {
        brand: analysis.brand,
        category: analysis.category,
        keywordsCount: analysis.keywords.length
      })

      // Конвертируем в формат ParsedProductMetadata
      return {
        title: this.constructTitle(analysis),
        description: analysis.description,
        price: analysis.price,
        currency: analysis.currency,
        brand: analysis.brand,
        category: analysis.category,
        marketplace: this.detectMarketplace(url),
        originalUrl: url
      }

    } catch (error) {
      console.error('❌ [Claude Web Fetch] Ошибка:', error)

      // Проверяем специфичные ошибки
      if (error instanceof Error) {
        // Если доступ запрещен (403, 429, etc)
        if (error.message.includes('403') ||
            error.message.includes('forbidden') ||
            error.message.includes('access denied')) {
          throw new Error('Сайт заблокировал доступ. Требуется ScraperAPI для обхода защиты.')
        }

        // Если Cloudflare challenge
        if (error.message.includes('cloudflare') ||
            error.message.includes('challenge')) {
          throw new Error('Обнаружена защита Cloudflare. Требуется ScraperAPI.')
        }

        // Если таймаут
        if (error.message.includes('timeout')) {
          throw new Error('Таймаут загрузки страницы. Попробуйте позже.')
        }
      }

      throw error
    }
  }

  /**
   * Анализ HTML контента (для использования с ScraperAPI)
   */
  async analyzeHtmlContent(html: string, url: string): Promise<ParsedProductMetadata> {
    if (!this.client) {
      throw new Error('Claude API недоступен')
    }

    console.log('🤖 [Claude] Анализируем HTML контент (размер:', html.length, 'байт)')

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: this.buildHtmlAnalysisPrompt(html, url)
        }]
      })

      const textContent = response.content.find((block: any) => block.type === 'text')

      if (!textContent || !textContent.text) {
        throw new Error('Claude не вернул текстовый ответ')
      }

      const analysis = this.parseClaudeResponse(textContent.text)

      return {
        title: this.constructTitle(analysis),
        description: analysis.description,
        price: analysis.price,
        currency: analysis.currency,
        brand: analysis.brand,
        category: analysis.category,
        marketplace: this.detectMarketplace(url),
        originalUrl: url
      }

    } catch (error) {
      console.error('❌ [Claude] Ошибка анализа HTML:', error)
      throw error
    }
  }

  /**
   * Формирует промпт для Web Fetch
   */
  private buildPrompt(url: string): string {
    return `Проанализируй товар на этой странице: ${url}

ЗАДАЧА:
1. Используй web_fetch чтобы загрузить страницу
2. Извлеки информацию о товаре:
   - Название товара (полное)
   - Бренд (если есть)
   - Категория товара
   - Описание
   - Цена (если есть)
3. Создай ключевые слова для поиска аналогов

ТРЕБОВАНИЯ:
- Ключевые слова должны быть НА РУССКОМ И АНГЛИЙСКОМ
- Добавь синонимы и связанные термины
- Если бренд известный (Apple, Samsung, Bosch и т.д.) - обязательно укажи
- Категория должна быть общая (Электроника, Автозапчасти, Инструменты и т.д.)

ФОРМАТ ОТВЕТА (только JSON, без markdown):
{
  "brand": "название бренда или null",
  "category": "категория товара",
  "productType": "конкретный тип товара",
  "keywords": ["ключевое1", "ключевое2", "ключевое3", "keyword4", "keyword5"],
  "description": "краткое описание товара для поиска",
  "price": "цена товара (если найдена)",
  "currency": "валюта (RUB, USD, EUR)"
}

ПРИМЕРЫ:
Товар: "Смартфон Apple iPhone 15 128GB Розовый"
→ {
  "brand": "Apple",
  "category": "Электроника",
  "productType": "Смартфон",
  "keywords": ["Apple", "iPhone 15", "смартфон", "smartphone", "128GB", "розовый", "pink"],
  "description": "Смартфон Apple iPhone 15 128GB розовый",
  "price": "79999",
  "currency": "RUB"
}

ОТВЕТ (только JSON):`
  }

  /**
   * Формирует промпт для анализа HTML
   */
  private buildHtmlAnalysisPrompt(html: string, url: string): string {
    // Обрезаем HTML если слишком большой (Claude имеет лимит токенов)
    const truncatedHtml = html.length > 50000
      ? html.substring(0, 50000) + '\n... (HTML обрезан)'
      : html

    return `Проанализируй HTML код товара с маркетплейса и извлеки информацию.

URL: ${url}

HTML КОНТЕНТ:
${truncatedHtml}

ЗАДАЧА:
Извлеки из HTML:
1. Название товара (из <h1>, <title>, meta tags)
2. Бренд (если есть)
3. Категорию товара
4. Описание
5. Цену (если есть)
6. Создай ключевые слова для поиска

ТРЕБОВАНИЯ:
- Ключевые слова НА РУССКОМ И АНГЛИЙСКОМ
- Добавь синонимы
- Категория общая (Электроника, Автозапчасти и т.д.)

ФОРМАТ ОТВЕТА (только JSON, без markdown):
{
  "brand": "бренд или null",
  "category": "категория",
  "productType": "тип товара",
  "keywords": ["слово1", "слово2", "word3", "word4"],
  "description": "краткое описание",
  "price": "цена (если найдена)",
  "currency": "RUB/USD/EUR"
}

ОТВЕТ (только JSON):`
  }

  /**
   * Парсит JSON ответ от Claude
   */
  private parseClaudeResponse(response: string): ClaudeProductAnalysis {
    try {
      // Убираем markdown форматирование
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      // Пытаемся найти JSON в ответе
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanResponse = jsonMatch[0]
      }

      const parsed = JSON.parse(cleanResponse)

      return {
        brand: parsed.brand || null,
        category: parsed.category || null,
        productType: parsed.productType || null,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        description: parsed.description || '',
        price: parsed.price || undefined,
        currency: parsed.currency || undefined
      }
    } catch (error) {
      console.error('❌ Ошибка парсинга ответа Claude:', error)
      console.log('📄 Проблемный ответ:', response)

      // Возвращаем базовый результат
      return {
        brand: null,
        category: null,
        productType: null,
        keywords: [],
        description: response.substring(0, 200),
        price: undefined,
        currency: undefined
      }
    }
  }

  /**
   * Конструирует название товара из анализа
   */
  private constructTitle(analysis: ClaudeProductAnalysis): string {
    if (analysis.description) {
      return analysis.description
    }

    const parts = [
      analysis.brand,
      analysis.productType
    ].filter(Boolean)

    return parts.join(' ') || 'Товар без названия'
  }

  /**
   * Определяет маркетплейс по URL
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
}

// Singleton instance
let claudeWebFetchService: ClaudeWebFetchService | null = null

export function getClaudeWebFetchService(): ClaudeWebFetchService {
  if (!claudeWebFetchService) {
    claudeWebFetchService = new ClaudeWebFetchService()
  }
  return claudeWebFetchService
}
