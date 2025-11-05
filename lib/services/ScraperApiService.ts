/**
 * ScraperApiService - Обход Cloudflare/anti-bot защиты через ScraperAPI
 *
 * ScraperAPI - это облачный сервис который:
 * - Запускает реальный браузер
 * - Использует residential прокси (IP настоящих людей)
 * - Обходит Cloudflare challenges и CAPTCHA
 * - Возвращает готовый HTML контент
 *
 * Цены (2025):
 * - Free: 1,000 кредитов/мес (66 запросов Ozon/WB)
 * - Trial: 5,000 кредитов (333 запроса за 7 дней)
 * - Hobby: $49/мес (100K кредитов = 6,666 запросов)
 *
 * Стоимость 1 запроса для Ozon/WB:
 * - JS Rendering: 5 кредитов
 * - Geotargeting (RU): +10 кредитов
 * - ИТОГО: 15 кредитов = ~$0.007 (0.63₽)
 */

export interface ScraperApiOptions {
  render?: boolean          // Выполнять JavaScript (true для SPA сайтов)
  country_code?: string     // Код страны прокси (ru, us, uk и т.д.)
  premium?: boolean         // Использовать premium residential прокси
  session_number?: number   // ID сессии для сохранения cookies
}

export class ScraperApiService {
  private apiKey: string
  private baseUrl = 'https://api.scraperapi.com'
  private creditsUsed = 0
  private requestsCount = 0

  constructor() {
    this.apiKey = process.env.SCRAPER_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️ SCRAPER_API_KEY не найден в переменных окружения')
      console.warn('⚠️ ScraperAPI будет недоступен')
    } else {
      console.log('✅ ScraperAPI Service инициализирован')
      console.log('🔑 API Key:', this.apiKey.substring(0, 8) + '...')
    }
  }

  /**
   * Проверка доступности ScraperAPI
   */
  isAvailable(): boolean {
    return !!this.apiKey
  }

  /**
   * Получить HTML контент страницы через ScraperAPI
   */
  async fetchPage(url: string, options: ScraperApiOptions = {}): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ScraperAPI недоступен. Проверьте SCRAPER_API_KEY')
    }

    console.log('🌐 [ScraperAPI] Получаем страницу:', url)

    // Настройки по умолчанию для маркетплейсов
    const defaultOptions: ScraperApiOptions = {
      render: true,           // Выполняем JavaScript
      country_code: 'ru',     // Российский IP (важно для .ru сайтов)
      premium: false          // Datacenter прокси (дешевле)
    }

    const finalOptions = { ...defaultOptions, ...options }

    // Формируем query параметры
    const params = new URLSearchParams({
      api_key: this.apiKey,
      url: url,
      render: finalOptions.render ? 'true' : 'false'
    })

    if (finalOptions.country_code) {
      params.append('country_code', finalOptions.country_code)
    }

    if (finalOptions.premium) {
      params.append('premium', 'true')
    }

    if (finalOptions.session_number) {
      params.append('session_number', finalOptions.session_number.toString())
    }

    const apiUrl = `${this.baseUrl}?${params.toString()}`

    console.log('📡 [ScraperAPI] Параметры:', {
      render: finalOptions.render,
      country: finalOptions.country_code,
      premium: finalOptions.premium
    })

    try {
      const startTime = Date.now()

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })

      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)

      console.log(`⏱️ [ScraperAPI] Ответ получен за ${duration}с`)
      console.log(`📊 [ScraperAPI] HTTP статус: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [ScraperAPI] Ошибка:', response.status, errorText)

        // Специфичные ошибки
        if (response.status === 401) {
          throw new Error('ScraperAPI: Неверный API ключ')
        } else if (response.status === 429) {
          throw new Error('ScraperAPI: Превышен лимит запросов')
        } else if (response.status === 402) {
          throw new Error('ScraperAPI: Недостаточно кредитов на аккаунте')
        } else {
          throw new Error(`ScraperAPI: HTTP ${response.status} - ${errorText}`)
        }
      }

      const html = await response.text()
      console.log('✅ [ScraperAPI] HTML получен, размер:', html.length, 'байт')

      // Статистика
      this.requestsCount++
      const estimatedCredits = this.estimateCredits(finalOptions)
      this.creditsUsed += estimatedCredits

      console.log('💰 [ScraperAPI] Использовано кредитов:', estimatedCredits)
      console.log('📈 [ScraperAPI] Всего за сессию:', {
        запросов: this.requestsCount,
        кредитов: this.creditsUsed
      })

      // Проверяем что получили нормальный HTML
      if (html.length < 100) {
        console.warn('⚠️ [ScraperAPI] Подозрительно маленький HTML')
      }

      if (html.toLowerCase().includes('cloudflare') &&
          html.toLowerCase().includes('challenge')) {
        console.warn('⚠️ [ScraperAPI] Возможно Cloudflare challenge не пройден')
      }

      return html

    } catch (error) {
      console.error('❌ [ScraperAPI] Критическая ошибка:', error)
      throw error
    }
  }

  /**
   * Оценка стоимости запроса в кредитах
   */
  private estimateCredits(options: ScraperApiOptions): number {
    let credits = 1 // Базовый запрос

    if (options.render) {
      credits += 4 // JS rendering = +4 кредита
    }

    if (options.country_code && options.country_code !== 'us') {
      credits += 10 // Geotargeting = +10 кредитов
    }

    if (options.premium) {
      credits += 10 // Premium residential = +10 кредитов
    }

    return credits
  }

  /**
   * Проверка баланса кредитов (через отдельный API запрос)
   */
  async checkAccountStatus(): Promise<{
    creditsRemaining: number
    planType: string
  }> {
    if (!this.apiKey) {
      throw new Error('ScraperAPI недоступен')
    }

    try {
      // ScraperAPI возвращает информацию о кредитах в заголовках
      const response = await fetch(`${this.baseUrl}/account?api_key=${this.apiKey}`)

      if (!response.ok) {
        throw new Error(`Не удалось получить информацию об аккаунте: ${response.status}`)
      }

      const data = await response.json()

      return {
        creditsRemaining: data.credits_remaining || 0,
        planType: data.plan_type || 'unknown'
      }

    } catch (error) {
      console.error('❌ Ошибка проверки аккаунта ScraperAPI:', error)
      throw error
    }
  }

  /**
   * Получить статистику использования за текущую сессию
   */
  getSessionStats() {
    return {
      requests: this.requestsCount,
      creditsUsed: this.creditsUsed,
      estimatedCost: (this.creditsUsed / 1000) * 0.49, // $0.49 за 1000 кредитов (Hobby план)
      estimatedCostRub: (this.creditsUsed / 1000) * 0.49 * 90 // ~90₽ за $1
    }
  }

  /**
   * Сбросить статистику
   */
  resetStats() {
    this.requestsCount = 0
    this.creditsUsed = 0
  }
}

// Singleton instance
let scraperApiService: ScraperApiService | null = null

export function getScraperApiService(): ScraperApiService {
  if (!scraperApiService) {
    scraperApiService = new ScraperApiService()
  }
  return scraperApiService
}
