#!/usr/bin/env node

/**
 * Batch импорт 30 товаров в категорию ТЕСТОВАЯ
 * С картинками и загрузкой в Supabase Storage
 */

const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

// Читаем .env.local вручную
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

// 30 товаров из разных маркетплейсов для тестирования
const products = [
  // Яндекс.Маркет - смартфоны
  { url: 'https://market.yandex.ru/product--smartfon-samsung-galaxy-s23-8-128gb/1965359484', name: 'Samsung Galaxy S23' },
  { url: 'https://market.yandex.ru/product--smartfon-xiaomi-redmi-note-12-pro-8-256gb/1781893745', name: 'Xiaomi Redmi Note 12 Pro' },
  { url: 'https://market.yandex.ru/product--smartfon-apple-iphone-14-128gb/1790576609', name: 'Apple iPhone 14' },
  { url: 'https://market.yandex.ru/product--smartfon-realme-c55-6-128gb/1836896357', name: 'Realme C55' },
  { url: 'https://market.yandex.ru/product--smartfon-honor-x8a-6-128gb/1873395704', name: 'Honor X8a' },

  // Яндекс.Маркет - ноутбуки
  { url: 'https://market.yandex.ru/product--noutbuk-lenovo-ideapad-3-15iau7/1828575647', name: 'Lenovo IdeaPad 3' },
  { url: 'https://market.yandex.ru/product--noutbuk-hp-15s-fq5007ur/1847521673', name: 'HP 15s' },
  { url: 'https://market.yandex.ru/product--noutbuk-asus-vivobook-15-x1502za/1811938463', name: 'ASUS VivoBook 15' },
  { url: 'https://market.yandex.ru/product--noutbuk-acer-aspire-3-a315-59/1829464891', name: 'Acer Aspire 3' },
  { url: 'https://market.yandex.ru/product--noutbuk-msi-modern-15-b12mo/1835721948', name: 'MSI Modern 15' },

  // Яндекс.Маркет - наушники
  { url: 'https://market.yandex.ru/product--naushniki-apple-airpods-2/376826059', name: 'Apple AirPods 2' },
  { url: 'https://market.yandex.ru/product--naushniki-samsung-galaxy-buds2-pro/1774958334', name: 'Samsung Galaxy Buds2 Pro' },
  { url: 'https://market.yandex.ru/product--naushniki-jbl-tune-520bt/1870743289', name: 'JBL Tune 520BT' },
  { url: 'https://market.yandex.ru/product--naushniki-xiaomi-redmi-buds-4-pro/1842738643', name: 'Xiaomi Redmi Buds 4 Pro' },
  { url: 'https://market.yandex.ru/product--naushniki-sony-wh-1000xm5/1769859471', name: 'Sony WH-1000XM5' },

  // Яндекс.Маркет - планшеты
  { url: 'https://market.yandex.ru/product--planshet-apple-ipad-10-2-2021/700828792', name: 'Apple iPad 10.2' },
  { url: 'https://market.yandex.ru/product--planshet-samsung-galaxy-tab-s9-fe/1918374829', name: 'Samsung Galaxy Tab S9 FE' },
  { url: 'https://market.yandex.ru/product--planshet-xiaomi-redmi-pad-se/1906523874', name: 'Xiaomi Redmi Pad SE' },
  { url: 'https://market.yandex.ru/product--planshet-lenovo-tab-m10-fhd-plus-3rd-gen/1804725638', name: 'Lenovo Tab M10' },
  { url: 'https://market.yandex.ru/product--planshet-huawei-matepad-11/1752648294', name: 'Huawei MatePad 11' },

  // Яндекс.Маркет - умные часы
  { url: 'https://market.yandex.ru/product--umnye-chasy-apple-watch-series-9/1919748326', name: 'Apple Watch Series 9' },
  { url: 'https://market.yandex.ru/product--umnye-chasy-samsung-galaxy-watch6/1891472638', name: 'Samsung Galaxy Watch6' },
  { url: 'https://market.yandex.ru/product--umnye-chasy-xiaomi-watch-s1-pro/1765228674', name: 'Xiaomi Watch S1 Pro' },
  { url: 'https://market.yandex.ru/product--umnye-chasy-huawei-watch-fit-3/1938274856', name: 'Huawei Watch Fit 3' },
  { url: 'https://market.yandex.ru/product--umnye-chasy-amazfit-gtr-4/1817264739', name: 'Amazfit GTR 4' },

  // Яндекс.Маркет - телевизоры
  { url: 'https://market.yandex.ru/product--televizor-samsung-ue43cu7100u/1905837462', name: 'Samsung UE43CU7100U' },
  { url: 'https://market.yandex.ru/product--televizor-lg-43ur78006lk/1914738264', name: 'LG 43UR78006LK' },
  { url: 'https://market.yandex.ru/product--televizor-xiaomi-mi-tv-p1-50/644993748', name: 'Xiaomi Mi TV P1 50' },
  { url: 'https://market.yandex.ru/product--televizor-sony-kd-43x81k/1783562847', name: 'Sony KD-43X81K' },
  { url: 'https://market.yandex.ru/product--televizor-hisense-43a6bgu/1899473628', name: 'Hisense 43A6BGU' }
]

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY
const API_ENDPOINT = 'http://localhost:3002/api/catalog/products/import-from-url'

if (!SCRAPER_API_KEY) {
  console.error('❌ SCRAPER_API_KEY не найден в .env.local')
  process.exit(1)
}

async function parseProduct(productUrl, productName, index, total) {
  console.log(`\n${'═'.repeat(80)}`)
  console.log(`📦 ТОВАР ${index}/${total}: ${productName}`)
  console.log(`🔗 ${productUrl}`)
  console.log('═'.repeat(80))

  try {
    // Шаг 1: Парсинг через ScraperAPI
    console.log('⏳ [1/3] Парсинг HTML через ScraperAPI...')

    const params = new URLSearchParams({
      api_key: SCRAPER_API_KEY,
      url: productUrl,
      render: 'true',
      country_code: 'ru'
    })

    const startTime = Date.now()
    const response = await fetch(`https://api.scraperapi.com?${params}`)
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    if (!response.ok) {
      throw new Error(`ScraperAPI error: ${response.status}`)
    }

    const html = await response.text()
    console.log(`✅ HTML получен (${html.length} байт) за ${duration}с`)

    // Шаг 2: Парсинг метаданных
    console.log('⏳ [2/3] Извлечение метаданных...')

    const $ = cheerio.load(html)

    const title = $('h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  productName

    const description = $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="description"]').attr('content') ||
                       ''

    const imageUrl = $('meta[property="og:image"]').attr('content') ||
                    $('img').first().attr('src') ||
                    ''

    const priceText = $('.price').first().text().trim() ||
                     $('[data-auto="price"]').text().trim() ||
                     ''

    console.log(`✅ Название: ${title.substring(0, 50)}...`)
    console.log(`✅ Картинка: ${imageUrl ? '✅ Найдена' : '❌ Не найдена'}`)
    console.log(`✅ Цена: ${priceText || 'Не найдена'}`)

    // Шаг 3: Импорт в БД
    console.log('⏳ [3/3] Импорт в базу данных...')

    const importResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: {
          title: title,
          description: description,
          imageUrl: imageUrl,
          price: priceText,
          currency: 'RUB',
          marketplace: 'yandex_market',
          originalUrl: productUrl
        },
        analysis: {
          brand: title.split(' ')[0],
          category: 'ТЕСТОВАЯ',
          keywords: title.split(' ').slice(0, 5)
        }
      })
    })

    const result = await importResponse.json()

    if (!importResponse.ok) {
      throw new Error(result.error || 'Import failed')
    }

    console.log(`✅ [SUCCESS] Товар добавлен! ID: ${result.product.id}`)
    return { success: true, product: result.product }

  } catch (error) {
    console.error(`❌ [FAILED] Ошибка: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function batchImport() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗')
  console.log('║              🚀 BATCH ИМПОРТ 30 ТОВАРОВ В КАТЕГОРИЮ "ТЕСТОВАЯ"              ║')
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`📊 Товаров к импорту: ${products.length}`)
  console.log(`⏱️  Ожидаемое время: ~7-10 минут`)
  console.log(`💾 Storage: ~30-60 MB`)
  console.log('')

  const results = {
    success: 0,
    failed: 0,
    products: []
  }

  const startTime = Date.now()

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const result = await parseProduct(product.url, product.name, i + 1, products.length)

    if (result.success) {
      results.success++
      results.products.push(result.product)
    } else {
      results.failed++
    }

    // Прогресс
    const progress = ((i + 1) / products.length * 100).toFixed(1)
    console.log(`\n📊 ПРОГРЕСС: ${progress}% (${i + 1}/${products.length})`)
    console.log(`✅ Успешно: ${results.success} | ❌ Ошибок: ${results.failed}`)

    // Задержка между запросами (чтобы не перегрузить API)
    if (i < products.length - 1) {
      console.log('⏳ Пауза 2 сек...\n')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2)

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗')
  console.log('║                           ✅ ИМПОРТ ЗАВЕРШЕН                                 ║')
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`⏱️  Общее время: ${totalTime} минут`)
  console.log(`✅ Успешно импортировано: ${results.success}`)
  console.log(`❌ Ошибок: ${results.failed}`)
  console.log('')
  console.log('📍 Проверьте результат:')
  console.log('   http://localhost:3002/dashboard/catalog')
  console.log('   Категория: ТЕСТОВАЯ')
  console.log('')
}

batchImport().catch(console.error)
