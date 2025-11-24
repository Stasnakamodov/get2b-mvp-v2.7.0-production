/**
 * BrowserParserService - Парсинг защищенных маркетплейсов через браузер
 *
 * Использует Puppeteer для обхода anti-bot защиты
 * Fallback на обычный HTTP если браузер не нужен
 */

import type { ParsedProductMetadata } from './UrlParserService'

// Helper function for timeout
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class BrowserParserService {
  /**
   * Парсинг через реальный браузер (обходит защиту маркетплейсов)
   */
  async parseWithBrowser(url: string): Promise<ParsedProductMetadata> {
    console.log('🌐 [Browser Parser] Запускаем браузер для:', url)

    let browser = null

    try {
      // Динамический импорт Puppeteer (только когда нужен)
      const puppeteer = await import('puppeteer')

      // Запускаем браузер с настройками для обхода защиты
      browser = await puppeteer.default.launch({
        headless: 'new' as any,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
          '--disable-blink-features=AutomationControlled', // Скрываем что это автоматизация
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--flag-switches-begin --disable-site-isolation-trials --flag-switches-end'
        ],
        ignoreDefaultArgs: ['--enable-automation'] // Убираем флаг автоматизации
      })

      const page = await browser.newPage()

      // Маскируемся под настоящий браузер
      await page.evaluateOnNewDocument(() => {
        // Удаляем webdriver property
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        })

        // Подменяем plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        })

        // Подменяем languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['ru-RU', 'ru', 'en-US', 'en'],
        })

        // Chrome runtime
        // @ts-ignore
        window.chrome = {
          runtime: {},
        }

        // Permissions
        const originalQuery = window.navigator.permissions.query
        // @ts-ignore
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        )
      })

      // Устанавливаем реалистичный User-Agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Устанавливаем viewport
      await page.setViewport({ width: 1920, height: 1080 })

      // Устанавливаем реальные headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      })

      console.log('🔄 [Browser Parser] Загружаем страницу...')

      // Переходим на страницу с таймаутом
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })

      // Ждем немного чтобы JavaScript успел выполниться
      console.log('⏳ [Browser Parser] Ждем загрузки контента...')
      await sleep(3000)

      // Проверяем не попали ли мы на antibot страницу
      const pageTitle = await page.title()
      if (pageTitle.toLowerCase().includes('antibot') || pageTitle.toLowerCase().includes('challenge')) {
        console.log('🤖 [Browser Parser] Обнаружена antibot страница, ждем...')
        // Ждем дольше для прохождения проверки
        await sleep(5000)

        // Пробуем прокрутить страницу (эмуляция пользователя)
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2)
        })
        await sleep(2000)
      }

      console.log('✅ [Browser Parser] Страница загружена')

      // Извлекаем метаданные со страницы
      const metadata = await page.evaluate(() => {
        // Функция для безопасного получения атрибута
        const getMetaContent = (selector: string): string | undefined => {
          const element = document.querySelector(selector)
          return element?.getAttribute('content') || undefined
        }

        // Функция для безопасного получения текста
        const getText = (selector: string): string | undefined => {
          const element = document.querySelector(selector)
          return element?.textContent?.trim() || undefined
        }

        return {
          // Open Graph теги
          title: getMetaContent('meta[property="og:title"]') ||
                 getMetaContent('meta[name="twitter:title"]') ||
                 getText('h1') ||
                 document.title,

          description: getMetaContent('meta[property="og:description"]') ||
                      getMetaContent('meta[name="twitter:description"]') ||
                      getMetaContent('meta[name="description"]') ||
                      '',

          imageUrl: getMetaContent('meta[property="og:image"]') ||
                   getMetaContent('meta[name="twitter:image"]'),

          price: getMetaContent('meta[property="og:price:amount"]') ||
                getMetaContent('meta[property="product:price:amount"]') ||
                getText('[data-widget="webPrice"]') ||
                getText('.price-block__final-price'),

          currency: getMetaContent('meta[property="og:price:currency"]') ||
                   getMetaContent('meta[property="product:price:currency"]') ||
                   'RUB'
        }
      })

      console.log('📦 [Browser Parser] Метаданные извлечены:', {
        title: metadata.title?.substring(0, 50),
        hasDescription: !!metadata.description,
        hasImage: !!metadata.imageUrl,
        hasPrice: !!metadata.price
      })

      await browser.close()

      if (!metadata.title) {
        throw new Error('Не удалось извлечь название товара')
      }

      return {
        title: metadata.title,
        description: metadata.description || '',
        price: metadata.price,
        currency: metadata.currency,
        imageUrl: metadata.imageUrl,
        marketplace: this.detectMarketplace(url),
        originalUrl: url
      }

    } catch (error) {
      if (browser) {
        await browser.close()
      }

      console.error('❌ [Browser Parser] Ошибка:', error)
      throw new Error(`Не удалось распарсить страницу: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
   * Проверка доступности Puppeteer
   */
  async isPuppeteerAvailable(): Promise<boolean> {
    try {
      await import('puppeteer')
      return true
    } catch {
      return false
    }
  }
}

// Singleton instance
let browserParserService: BrowserParserService | null = null

export function getBrowserParserService(): BrowserParserService {
  if (!browserParserService) {
    browserParserService = new BrowserParserService()
  }
  return browserParserService
}
