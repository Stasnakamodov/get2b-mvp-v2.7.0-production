/**
 * PlaywrightParserService - Парсинг защищенных маркетплейсов через Playwright
 *
 * Использует Playwright-extra + Stealth плагин для обхода anti-bot защиты
 * Работает с accessibility tree для надежного извлечения информации
 */

import type { ParsedProductMetadata } from './UrlParserService'

export class PlaywrightParserService {
  /**
   * Парсинг через Playwright браузер со Stealth плагином
   */
  async parseWithPlaywright(url: string): Promise<ParsedProductMetadata> {
    console.log('🎭 [Playwright Parser] Запуск для:', url)

    let browser = null

    try {
      // Динамический импорт Playwright
      const { chromium } = await import('playwright')
      console.log('🎭 [Playwright Parser] Playwright импортирован')

      // Рандомизированные настройки для обхода детектирования
      const viewportOptions = this.getRandomViewport()
      const userAgent = this.getRandomUserAgent()

      // Запускаем браузер с расширенными anti-detection настройками
      browser = await chromium.launch({
        headless: true, // Можно попробовать headless: false для сложных случаев
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          `--window-size=${viewportOptions.width},${viewportOptions.height}`,
          '--disable-infobars',
          '--disable-notifications',
          '--disable-save-password-bubble',
          '--mute-audio',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        ignoreDefaultArgs: ['--enable-automation']
      })

      const context = await browser.newContext({
        userAgent,
        viewport: viewportOptions,
        locale: 'ru-RU',
        timezoneId: 'Europe/Moscow',
        geolocation: { latitude: 55.7558, longitude: 37.6173 }, // Москва
        permissions: ['geolocation'],
        colorScheme: 'light',
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        extraHTTPHeaders: {
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Chromium";v="120", "Google Chrome";v="120", "Not_A Brand";v="24"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'DNT': '1'
        }
      })

      const page = await context.newPage()

      // Дополнительные anti-detection скрипты
      await page.addInitScript(() => {
        // Переопределяем navigator.webdriver
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        })

        // Реалистичные plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        })

        // Chrome runtime
        // @ts-ignore
        window.chrome = {
          runtime: {},
          loadTimes: function() {},
          csi: function() {},
        }

        // Permissions API
        const originalQuery = window.navigator.permissions.query
        // @ts-ignore
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        )

        // Переопределяем languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['ru-RU', 'ru', 'en-US', 'en'],
        })

        // Battery API (некоторые боты не имеют батареи)
        // @ts-ignore
        navigator.getBattery = () => Promise.resolve({
          charging: true,
          chargingTime: 0,
          dischargingTime: Infinity,
          level: 1.0
        })
      })

      console.log('🔄 [Playwright Parser] Загружаем страницу...')

      // Рандомная задержка перед загрузкой (имитация человека)
      await this.randomDelay(1000, 3000)

      // Переходим на страницу
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000 // Увеличен timeout для anti-bot проверок
      })

      // Рандомная задержка после загрузки
      await this.randomDelay(3000, 5000)
      console.log('⏳ [Playwright Parser] Ждем загрузки контента...')

      // Проверяем не попали ли мы на antibot страницу
      const pageTitle = await page.title()
      const pageContent = await page.content()

      if (pageTitle.toLowerCase().includes('доступ огр') ||
          pageTitle.toLowerCase().includes('antibot') ||
          pageTitle.toLowerCase().includes('challenge') ||
          pageTitle.toLowerCase().includes('just a moment') ||
          pageContent.includes('cloudflare') ||
          pageContent.includes('ray id')) {
        console.log('🤖 [Playwright Parser] Обнаружена antibot/Cloudflare страница, имитируем поведение человека...')

        // Эмулируем движения мыши
        await this.simulateHumanBehavior(page)

        // Дополнительное ожидание для прохождения проверок
        await this.randomDelay(8000, 12000)
      }

      console.log('✅ [Playwright Parser] Страница загружена')

      // Получаем accessibility snapshot (как в Playwright MCP)
      const accessibilitySnapshot = await page.accessibility.snapshot()
      console.log('🌳 [Playwright Parser] Accessibility tree получен')

      // Извлекаем метаданные
      const metadata = await this.extractMetadata(page, accessibilitySnapshot)

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
        brand: metadata.brand,
        category: metadata.category,
        marketplace: this.detectMarketplace(url),
        originalUrl: url
      }

    } catch (error) {
      if (browser) {
        await browser.close()
      }

      console.error('❌ [Playwright Parser] Ошибка:', error)
      throw new Error(`Playwright парсинг не удался: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Извлечение метаданных через accessibility tree + DOM
   */
  private async extractMetadata(page: any, accessibilityTree: any): Promise<Partial<ParsedProductMetadata>> {

    // Метод 1: Open Graph метатеги (самый надежный)
    const ogData = await page.evaluate(() => {
      const getMeta = (selector: string) =>
        document.querySelector(selector)?.getAttribute('content') || undefined

      return {
        title: getMeta('meta[property="og:title"]') ||
               getMeta('meta[name="twitter:title"]'),
        description: getMeta('meta[property="og:description"]') ||
                    getMeta('meta[name="twitter:description"]') ||
                    getMeta('meta[name="description"]'),
        imageUrl: getMeta('meta[property="og:image"]') ||
                 getMeta('meta[name="twitter:image"]'),
        price: getMeta('meta[property="og:price:amount"]') ||
              getMeta('meta[property="product:price:amount"]')
      }
    })

    // Метод 2: Accessibility tree (как в Playwright MCP)
    const accessibilityData = this.parseAccessibilityTree(accessibilityTree)

    // Метод 3: DOM селекторы (расширенные для галереи товаров)
    const domData = await page.evaluate(() => {
      const getText = (selector: string) =>
        document.querySelector(selector)?.textContent?.trim() || undefined

      const getAttr = (selector: string, attr: string) =>
        document.querySelector(selector)?.getAttribute(attr) || undefined

      // 🔥 FIX: Ищем изображения в галерее товара (НЕ баннеры!)
      const getProductImage = () => {
        // Wildberries галерея
        const wbGallery = document.querySelector('.slide__content img')?.getAttribute('src')
        const wbGallery2 = document.querySelector('.product-gallery img')?.getAttribute('src')

        // Ozon галерея
        const ozonGallery = document.querySelector('[data-widget="webGallery"] img')?.getAttribute('src')
        const ozonMain = document.querySelector('.product-image img')?.getAttribute('src')

        // Яндекс.Маркет галерея
        const yandexGallery = document.querySelector('[data-auto="productMediaGallery"] img')?.getAttribute('src')
        const yandexMain = document.querySelector('[data-zone-name="gallery"] img')?.getAttribute('src')

        // AliExpress галерея
        const aliGallery = document.querySelector('.images-view-item img')?.getAttribute('src')

        return wbGallery || wbGallery2 || ozonGallery || ozonMain || yandexGallery || yandexMain || aliGallery
      }

      return {
        title: getText('h1') || document.title,
        description: getText('.description') ||
                    getText('[data-widget="webDescription"]') ||
                    getText('.product-description') ||
                    getText('.collapsable__content'),
        price: getText('.price-block__final-price') ||
              getText('[data-widget="webPrice"]') ||
              getText('.product-price-value'),
        imageUrl: getProductImage()
      }
    })

    console.log('📦 [Playwright Parser] Извлечено:', {
      ogTitle: !!ogData.title,
      accessibilityTitle: !!accessibilityData.title,
      domTitle: !!domData.title,
      domImage: !!domData.imageUrl,
      ogImage: !!ogData.imageUrl
    })

    // 🔥 FIX: Валидация изображения с проверкой размеров
    let validatedImageUrl = null

    // Приоритет 1: DOM изображение (из галереи товара)
    if (domData.imageUrl) {
      const isValid = await this.validateImage(page, domData.imageUrl)
      if (isValid) {
        console.log('✅ [Playwright Parser] DOM изображение валидно:', domData.imageUrl)
        validatedImageUrl = domData.imageUrl
      } else {
        console.warn('⚠️ [Playwright Parser] DOM изображение отклонено (баннер или слишком маленькое)')
      }
    }

    // Приоритет 2: og:image (только если DOM не подошло)
    if (!validatedImageUrl && ogData.imageUrl) {
      const isValid = await this.validateImage(page, ogData.imageUrl)
      if (isValid) {
        console.log('✅ [Playwright Parser] OG изображение валидно:', ogData.imageUrl)
        validatedImageUrl = ogData.imageUrl
      } else {
        console.warn('⚠️ [Playwright Parser] OG изображение отклонено (баннер)')
      }
    }

    // Объединяем (приоритет: DOM (галерея) > OG > Accessibility)
    return {
      title: ogData.title || accessibilityData.title || domData.title || '',
      description: ogData.description || accessibilityData.description || domData.description || '',
      imageUrl: validatedImageUrl || undefined,
      price: ogData.price || domData.price
    }
  }

  /**
   * Парсинг accessibility tree (как browser_snapshot в Playwright MCP)
   */
  private parseAccessibilityTree(tree: any): Partial<ParsedProductMetadata> {
    if (!tree) return {}

    const result: Partial<ParsedProductMetadata> = {}

    // Рекурсивный обход дерева
    const traverse = (node: any) => {
      if (!node) return

      // Ищем заголовок (heading role)
      if (node.role === 'heading' && node.name && !result.title) {
        result.title = node.name
      }

      // Ищем описание (paragraph или text)
      if ((node.role === 'paragraph' || node.role === 'text') &&
          node.name &&
          node.name.length > 50 &&
          !result.description) {
        result.description = node.name
      }

      // Обходим детей
      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    traverse(tree)

    return result
  }

  /**
   * Определение маркетплейса
   */
  private detectMarketplace(url: string): string {
    const lowercaseUrl = url.toLowerCase()

    if (lowercaseUrl.includes('wildberries.ru')) return 'wildberries'
    if (lowercaseUrl.includes('ozon.ru')) return 'ozon'
    if (lowercaseUrl.includes('aliexpress')) return 'aliexpress'
    if (lowercaseUrl.includes('market.yandex.ru')) return 'yandex'
    if (lowercaseUrl.includes('sbermegamarket.ru')) return 'sber'

    return 'unknown'
  }

  /**
   * 🔥 Валидация изображения товара
   * Проверяет что это НЕ баннер/логотип, а реальная фотография товара
   */
  private async validateImage(page: any, imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl || imageUrl.length === 0) {
        return false
      }

      // Проверяем размеры изображения
      const dimensions = await page.evaluate(async (url: string) => {
        return new Promise((resolve) => {
          const img = new Image()

          img.onload = () => {
            resolve({
              width: img.naturalWidth,
              height: img.naturalHeight,
              success: true
            })
          }

          img.onerror = () => {
            resolve({ width: 0, height: 0, success: false })
          }

          img.src = url
        })
      }, imageUrl)

      if (!dimensions.success) {
        console.warn('⚠️ [Playwright Parser] Не удалось загрузить изображение:', imageUrl)
        return false
      }

      const { width, height } = dimensions

      console.log(`📏 [Playwright Parser] Размеры изображения: ${width}x${height}`)

      // Правила валидации:
      // 1. Минимум 400x400 пикселей (отсекает иконки и мелкие логотипы)
      // 2. Соотношение сторон не больше 3:1 (отсекает баннеры)
      // 3. Соотношение сторон не меньше 1:3 (отсекает вертикальные баннеры)

      const MIN_SIZE = 400
      const MAX_ASPECT_RATIO = 3

      if (width < MIN_SIZE || height < MIN_SIZE) {
        console.warn(`⚠️ [Playwright Parser] Изображение слишком маленькое: ${width}x${height} (минимум ${MIN_SIZE}x${MIN_SIZE})`)
        return false
      }

      const aspectRatio = width / height

      if (aspectRatio > MAX_ASPECT_RATIO || aspectRatio < (1 / MAX_ASPECT_RATIO)) {
        console.warn(`⚠️ [Playwright Parser] Неправильные пропорции (баннер?): ${aspectRatio.toFixed(2)} (макс ${MAX_ASPECT_RATIO}:1)`)
        return false
      }

      console.log(`✅ [Playwright Parser] Изображение прошло валидацию: ${width}x${height}, пропорции ${aspectRatio.toFixed(2)}:1`)
      return true

    } catch (error) {
      console.error('❌ [Playwright Parser] Ошибка валидации изображения:', error)
      return false
    }
  }

  /**
   * Рандомная задержка для имитации человеческого поведения
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Получение случайного viewport для обхода детектирования
   */
  private getRandomViewport() {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 }
    ]
    return viewports[Math.floor(Math.random() * viewports.length)]
  }

  /**
   * Получение случайного User-Agent
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ]
    return userAgents[Math.floor(Math.random() * userAgents.length)]
  }

  /**
   * Симуляция человеческого поведения: скроллинг и движения мыши
   */
  private async simulateHumanBehavior(page: any): Promise<void> {
    try {
      // Случайные движения мыши
      const viewport = page.viewportSize()
      const movements = 5 + Math.floor(Math.random() * 5) // 5-10 движений

      for (let i = 0; i < movements; i++) {
        const x = Math.floor(Math.random() * viewport.width)
        const y = Math.floor(Math.random() * viewport.height)
        await page.mouse.move(x, y)
        await this.randomDelay(100, 300)
      }

      // Скроллинг как человек (несколько шагов)
      const scrollSteps = [
        { percent: 0.2, behavior: 'smooth' },
        { percent: 0.4, behavior: 'smooth' },
        { percent: 0.6, behavior: 'smooth' },
        { percent: 0.3, behavior: 'smooth' }, // Скроллим назад
        { percent: 0.5, behavior: 'smooth' }
      ]

      for (const step of scrollSteps) {
        await page.evaluate((scrollPercent: number) => {
          window.scrollTo({
            top: document.body.scrollHeight * scrollPercent,
            behavior: 'smooth'
          })
        }, step.percent)

        await this.randomDelay(800, 1500)
      }

      // Случайный клик (не по элементу, просто для эмуляции)
      const x = Math.floor(Math.random() * viewport.width)
      const y = Math.floor(Math.random() * viewport.height)
      await page.mouse.click(x, y, { delay: 100 })

    } catch (error) {
      console.warn('⚠️ [Playwright Parser] Ошибка симуляции поведения:', error)
      // Не фейлим весь процесс если симуляция не удалась
    }
  }

  /**
   * Проверка доступности Playwright
   */
  async isAvailable(): Promise<boolean> {
    try {
      await import('playwright')
      return true
    } catch {
      return false
    }
  }
}

// Singleton
let playwrightParserService: PlaywrightParserService | null = null

export function getPlaywrightParserService(): PlaywrightParserService {
  if (!playwrightParserService) {
    playwrightParserService = new PlaywrightParserService()
  }
  return playwrightParserService
}
