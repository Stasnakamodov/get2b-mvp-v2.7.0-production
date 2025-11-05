/**
 * Тестовый скрипт для проверки Playwright-extra + Stealth парсинга
 *
 * Запуск: node scripts/test-playwright-parser.js
 */

const { chromium } = require('playwright-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

// Подключаем stealth плагин
chromium.use(StealthPlugin())

async function testPlaywrightParser() {
  console.log('🎭 ТЕСТ: Playwright-extra + Stealth парсинг Ozon\n')

  // Тестовая ссылка на товар с Ozon
  const testUrl = 'https://www.ozon.ru/product/smartfon-apple-iphone-15-128-gb-rozovyy-1189416565/'

  let browser = null

  try {
    console.log('1️⃣ Запускаем Playwright-extra с Stealth плагином...')
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--window-size=1920,1080',
        '--disable-infobars',
        '--disable-notifications'
      ],
      ignoreDefaultArgs: ['--enable-automation']
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'ru-RU',
      timezoneId: 'Europe/Moscow',
      geolocation: { latitude: 55.7558, longitude: 37.6173 },
      permissions: ['geolocation'],
      extraHTTPHeaders: {
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Sec-Ch-Ua': '"Chromium";v="120", "Google Chrome";v="120", "Not_A Brand";v="24"',
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
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages', { get: () => ['ru-RU', 'ru', 'en-US'] })
      window.chrome = { runtime: {}, loadTimes: function() {}, csi: function() {} }
      navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1.0
      })
    })

    console.log('2️⃣ Загружаем страницу:', testUrl)

    // Рандомная задержка перед загрузкой
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    await page.goto(testUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    })

    console.log('3️⃣ Ждем загрузки контента...')
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))

    // Проверяем antibot
    const title = await page.title()
    const content = await page.content()

    if (title.toLowerCase().includes('доступ') ||
        title.toLowerCase().includes('antibot') ||
        title.toLowerCase().includes('challenge') ||
        content.includes('cloudflare')) {
      console.log('⚠️ Anti-bot/Cloudflare обнаружен, имитируем поведение человека...')

      // Движения мыши
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * 1920)
        const y = Math.floor(Math.random() * 1080)
        await page.mouse.move(x, y)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
      }

      // Скроллинг
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }))
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }))
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))

      // Дополнительное ожидание
      await new Promise(resolve => setTimeout(resolve, 8000))
    }

    console.log('4️⃣ Получаем accessibility snapshot...')
    const accessibilitySnapshot = await page.accessibility.snapshot()

    console.log('5️⃣ Извлекаем метаданные...\n')

    // Open Graph
    const ogData = await page.evaluate(() => {
      const getMeta = (selector) =>
        document.querySelector(selector)?.getAttribute('content') || null

      return {
        title: getMeta('meta[property="og:title"]'),
        description: getMeta('meta[property="og:description"]'),
        image: getMeta('meta[property="og:image"]'),
        price: getMeta('meta[property="og:price:amount"]')
      }
    })

    // DOM
    const domData = await page.evaluate(() => {
      const getText = (selector) =>
        document.querySelector(selector)?.textContent?.trim() || null

      return {
        h1: getText('h1'),
        title: document.title
      }
    })

    // Accessibility tree
    let accessibilityTitle = null
    const traverse = (node) => {
      if (!node) return
      if (node.role === 'heading' && node.name && !accessibilityTitle) {
        accessibilityTitle = node.name
      }
      if (node.children) {
        node.children.forEach(traverse)
      }
    }
    traverse(accessibilitySnapshot)

    console.log('✅ РЕЗУЛЬТАТЫ:\n')
    console.log('📊 Open Graph:')
    console.log('  Title:', ogData.title?.substring(0, 80))
    console.log('  Description:', ogData.description?.substring(0, 80))
    console.log('  Price:', ogData.price)
    console.log('')

    console.log('📄 DOM:')
    console.log('  H1:', domData.h1?.substring(0, 80))
    console.log('  Title:', domData.title?.substring(0, 80))
    console.log('')

    console.log('🌳 Accessibility Tree:')
    console.log('  Heading:', accessibilityTitle?.substring(0, 80))
    console.log('')

    // Финальное название
    const finalTitle = ogData.title || accessibilityTitle || domData.h1 || domData.title
    console.log('🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:')
    console.log('  Название товара:', finalTitle)
    console.log('  Описание:', ogData.description?.substring(0, 100))
    console.log('')

    if (finalTitle) {
      console.log('✅ УСПЕХ! Товар распарсен!')
    } else {
      console.log('❌ ОШИБКА! Не удалось извлечь название')
    }

    await browser.close()

  } catch (error) {
    if (browser) await browser.close()
    console.error('❌ ОШИБКА:', error.message)
    process.exit(1)
  }
}

// Запуск
testPlaywrightParser()
  .then(() => {
    console.log('\n✅ Тест завершен успешно!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Тест провален:', error)
    process.exit(1)
  })
