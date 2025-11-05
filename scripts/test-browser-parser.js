/**
 * Тестируем новый BrowserParserService с Puppeteer
 */

const puppeteer = require('puppeteer')

async function testBrowserParsing() {
  const url = 'https://www.ozon.ru/product/tormoznaya-zhidkost-lukoil-dot-3-1-l-142950385/'

  console.log('🚀 [Test] Тестируем браузерный парсинг для:', url)
  console.log('')

  let browser = null

  try {
    console.log('🔧 [Test] Запускаем Puppeteer браузер...')

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    })

    console.log('✅ [Test] Браузер запущен')

    const page = await browser.newPage()

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    await page.setViewport({ width: 1920, height: 1080 })

    console.log('🔄 [Test] Загружаем страницу Ozon...')

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    console.log('✅ [Test] Страница загружена!')
    console.log('')

    // Извлекаем метаданные
    const metadata = await page.evaluate(() => {
      const getMetaContent = (selector) => {
        const element = document.querySelector(selector)
        return element?.getAttribute('content') || undefined
      }

      const getText = (selector) => {
        const element = document.querySelector(selector)
        return element?.textContent?.trim() || undefined
      }

      return {
        title: getMetaContent('meta[property="og:title"]') ||
               getText('h1') ||
               document.title,
        description: getMetaContent('meta[property="og:description"]') ||
                    getMetaContent('meta[name="description"]'),
        imageUrl: getMetaContent('meta[property="og:image"]'),
        price: getMetaContent('meta[property="og:price:amount"]') ||
              getText('[data-widget="webPrice"]'),
        currency: getMetaContent('meta[property="og:price:currency"]') || 'RUB',
        pageTitle: document.title
      }
    })

    console.log('📦 [Test] Извлеченные данные:')
    console.log('  Title:', metadata.title)
    console.log('  Description:', metadata.description?.substring(0, 100) + '...')
    console.log('  Price:', metadata.price, metadata.currency)
    console.log('  Image:', metadata.imageUrl ? '✅ Есть' : '❌ Нет')
    console.log('  Page Title:', metadata.pageTitle)
    console.log('')

    // Делаем скриншот для проверки
    const screenshotPath = './ozon-screenshot.png'
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log('📸 [Test] Скриншот сохранен:', screenshotPath)

    await browser.close()

    console.log('')
    console.log('✅ [Test] Тест успешен!')
    console.log('')
    console.log('🎉 Puppeteer успешно обходит защиту Ozon!')

  } catch (error) {
    if (browser) {
      await browser.close()
    }

    console.log('')
    console.log('❌ [Test] Ошибка:', error.message)
    console.log('')
    console.log('Полная информация об ошибке:')
    console.log(error)
  }
}

testBrowserParsing()
