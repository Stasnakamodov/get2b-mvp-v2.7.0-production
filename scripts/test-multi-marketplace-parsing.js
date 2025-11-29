#!/usr/bin/env node

/**
 * Тестирование парсинга товаров с 10 разных маркетплейсов
 * Русские и китайские платформы
 */

const fs = require('fs')
const path = require('path')

// Читаем .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      process.env[match[1]] = match[2]
    }
  })
}

// Тестовые товары электроники с разных маркетплейсов
const testProducts = [
  // Русские маркетплейсы
  {
    marketplace: 'Яндекс.Маркет',
    url: 'https://market.yandex.ru/product--smartfon-xiaomi-13t-12-256gb/1913095424',
    expectedName: 'Xiaomi 13T',
    category: 'Смартфоны'
  },
  {
    marketplace: 'Wildberries',
    url: 'https://www.wildberries.ru/catalog/178294523/detail.aspx',
    expectedName: 'Наушники беспроводные',
    category: 'Наушники'
  },
  {
    marketplace: 'Ozon',
    url: 'https://www.ozon.ru/product/noutbuk-honor-magicbook-x14-14-fhd-ips-intel-core-i3-10110u-8-gb-256-gb-ssd-windows-11-home-1398848963/',
    expectedName: 'Honor MagicBook X14',
    category: 'Ноутбуки'
  },
  {
    marketplace: 'СберМегаМаркет',
    url: 'https://megamarket.ru/catalog/details/smart-chasy-apple-watch-se-2023-40-mm-600008728569/',
    expectedName: 'Apple Watch SE',
    category: 'Умные часы'
  },
  {
    marketplace: 'МВидео',
    url: 'https://www.mvideo.ru/products/televizor-xiaomi-mi-tv-a2-50-50027694',
    expectedName: 'Xiaomi Mi TV A2 50',
    category: 'Телевизоры'
  },

  // Китайские маркетплейсы
  {
    marketplace: 'AliExpress RU',
    url: 'https://aliexpress.ru/item/1005006239915831.html',
    expectedName: 'Realme GT Neo 5',
    category: 'Смартфоны'
  },
  {
    marketplace: 'JD.ru',
    url: 'https://www.jd.ru/product/planshet-apple-ipad-air-5-wi-fi-64gb_100041867062.html',
    expectedName: 'Apple iPad Air 5',
    category: 'Планшеты'
  },

  // Дополнительные маркетплейсы
  {
    marketplace: 'DNS',
    url: 'https://www.dns-shop.ru/product/5c5a5c5a5ed1ed20/156-noutbuk-asus-vivobook-15-x1502za-bq1960-serebristyj/',
    expectedName: 'ASUS VivoBook 15',
    category: 'Ноутбуки'
  },
  {
    marketplace: 'Эльдорадо',
    url: 'https://www.eldorado.ru/cat/detail/smartfon-samsung-galaxy-a54-5g-8-256gb-lajm/',
    expectedName: 'Samsung Galaxy A54',
    category: 'Смартфоны'
  },
  {
    marketplace: 'Ситилинк',
    url: 'https://www.citilink.ru/product/naushniki-s-mikrofonom-apple-airpods-pro-2nd-generation-belyi-1886343/',
    expectedName: 'Apple AirPods Pro 2',
    category: 'Наушники'
  }
]

// API endpoint
const API_BASE = 'http://localhost:3000'
const PARSE_ENDPOINT = '/api/catalog/products/parse-and-import'

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

// Результаты тестирования
const results = []

async function testParseProduct(product, index) {
  console.log(`\n${colors.bright}${'═'.repeat(80)}${colors.reset}`)
  console.log(`${colors.cyan}📦 [${index + 1}/10] Тестирование: ${product.marketplace}${colors.reset}`)
  console.log(`${colors.blue}🔗 URL: ${product.url.substring(0, 60)}...${colors.reset}`)
  console.log('─'.repeat(80))

  const startTime = Date.now()

  try {
    console.log(`${colors.yellow}⏳ Отправляю запрос на парсинг...${colors.reset}`)

    const response = await fetch(`${API_BASE}${PARSE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: product.url,
        category: 'ТЕСТ_МАРКЕТПЛЕЙСЫ',
        subcategory: product.marketplace
      })
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    const data = await response.json()

    if (response.ok && data.success) {
      console.log(`${colors.green}✅ УСПЕШНО спарсено за ${duration} сек${colors.reset}`)
      console.log(`${colors.bright}📋 Результаты:${colors.reset}`)
      console.log(`   • Название: ${data.product?.name || data.metadata?.title}`)
      console.log(`   • Цена: ${data.product?.price || 'Не определена'} ${data.product?.currency || ''}`)
      console.log(`   • Изображение: ${data.product?.images?.length ? 'Загружено ✓' : 'Отсутствует ✗'}`)
      console.log(`   • ID в БД: ${data.product?.id}`)
      console.log(`   • Маркетплейс: ${data.metadata?.marketplace || 'Не определен'}`)

      results.push({
        marketplace: product.marketplace,
        status: 'SUCCESS',
        duration: duration,
        name: data.product?.name || data.metadata?.title,
        price: data.product?.price,
        hasImage: !!data.product?.images?.length,
        id: data.product?.id,
        error: null
      })

    } else {
      console.log(`${colors.red}❌ ОШИБКА парсинга${colors.reset}`)
      console.log(`   Статус: ${response.status}`)
      console.log(`   Сообщение: ${data.error || 'Неизвестная ошибка'}`)
      console.log(`   Детали: ${data.details || 'Нет деталей'}`)

      results.push({
        marketplace: product.marketplace,
        status: 'ERROR',
        duration: duration,
        name: null,
        price: null,
        hasImage: false,
        id: null,
        error: data.error || `HTTP ${response.status}`
      })
    }

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`${colors.red}❌ КРИТИЧЕСКАЯ ОШИБКА${colors.reset}`)
    console.log(`   ${error.message}`)

    results.push({
      marketplace: product.marketplace,
      status: 'CRITICAL_ERROR',
      duration: duration,
      name: null,
      price: null,
      hasImage: false,
      id: null,
      error: error.message
    })
  }
}

async function generateReport() {
  console.log(`\n\n${colors.bright}${'═'.repeat(80)}${colors.reset}`)
  console.log(`${colors.magenta}📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ${colors.reset}`)
  console.log('═'.repeat(80))

  // Статистика
  const successful = results.filter(r => r.status === 'SUCCESS').length
  const failed = results.filter(r => r.status !== 'SUCCESS').length
  const withImages = results.filter(r => r.hasImage).length
  const withPrices = results.filter(r => r.price !== null).length
  const avgDuration = (results.reduce((sum, r) => sum + parseFloat(r.duration), 0) / results.length).toFixed(2)

  console.log(`\n${colors.bright}📈 ОБЩАЯ СТАТИСТИКА:${colors.reset}`)
  console.log(`   • Успешно спарсено: ${colors.green}${successful}/10${colors.reset}`)
  console.log(`   • Ошибки парсинга: ${colors.red}${failed}/10${colors.reset}`)
  console.log(`   • С изображениями: ${withImages}/10`)
  console.log(`   • С ценами: ${withPrices}/10`)
  console.log(`   • Среднее время: ${avgDuration} сек`)

  // Таблица результатов
  console.log(`\n${colors.bright}📋 ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ:${colors.reset}`)
  console.log('─'.repeat(80))
  console.log('Маркетплейс          | Статус    | Время  | Товар                     | Цена  | Фото')
  console.log('─'.repeat(80))

  results.forEach(r => {
    const status = r.status === 'SUCCESS'
      ? `${colors.green}✅ OK${colors.reset}    `
      : `${colors.red}❌ FAIL${colors.reset}  `
    const name = r.name ? r.name.substring(0, 25).padEnd(25) : '---'.padEnd(25)
    const price = r.price ? `${r.price}`.substring(0, 6).padEnd(6) : '---   '
    const image = r.hasImage ? '✅' : '❌'
    const marketplace = r.marketplace.padEnd(20)

    console.log(`${marketplace} | ${status} | ${r.duration}s | ${name} | ${price} | ${image}`)
  })

  // Проблемные маркетплейсы
  const failedMarketplaces = results.filter(r => r.status !== 'SUCCESS')
  if (failedMarketplaces.length > 0) {
    console.log(`\n${colors.red}⚠️ ПРОБЛЕМНЫЕ МАРКЕТПЛЕЙСЫ:${colors.reset}`)
    failedMarketplaces.forEach(r => {
      console.log(`   • ${r.marketplace}: ${r.error}`)
    })
  }

  // Сохранение отчета
  const report = {
    date: new Date().toISOString(),
    statistics: {
      total: results.length,
      successful,
      failed,
      withImages,
      withPrices,
      avgDuration
    },
    results: results
  }

  const reportPath = path.join(__dirname, '..', 'MARKETPLACE_PARSING_TEST_REPORT.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n${colors.green}✅ Отчет сохранен в: MARKETPLACE_PARSING_TEST_REPORT.json${colors.reset}`)
}

// Главная функция
async function main() {
  console.log(`${colors.bright}${colors.magenta}🚀 ЗАПУСК ТЕСТИРОВАНИЯ ПАРСИНГА 10 МАРКЕТПЛЕЙСОВ${colors.reset}`)
  console.log(`${colors.cyan}📅 Дата: ${new Date().toLocaleString('ru-RU')}${colors.reset}`)

  // Проверяем доступность сервера
  console.log(`\n${colors.yellow}🔍 Проверяю доступность сервера на ${API_BASE}...${colors.reset}`)

  try {
    const healthCheck = await fetch(API_BASE)
    if (!healthCheck.ok && healthCheck.status !== 404) {
      throw new Error(`Сервер недоступен (статус ${healthCheck.status})`)
    }
    console.log(`${colors.green}✅ Сервер доступен${colors.reset}`)
  } catch (error) {
    console.log(`${colors.red}❌ Сервер недоступен! Запустите: npm run dev${colors.reset}`)
    process.exit(1)
  }

  // Тестируем каждый маркетплейс
  for (let i = 0; i < testProducts.length; i++) {
    await testParseProduct(testProducts[i], i)

    // Небольшая задержка между запросами
    if (i < testProducts.length - 1) {
      console.log(`\n${colors.yellow}⏳ Пауза 2 секунды перед следующим тестом...${colors.reset}`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Генерируем отчет
  await generateReport()

  console.log(`\n${colors.bright}${colors.green}🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!${colors.reset}`)
}

// Запуск
main().catch(error => {
  console.error(`${colors.red}Критическая ошибка:${colors.reset}`, error)
  process.exit(1)
})