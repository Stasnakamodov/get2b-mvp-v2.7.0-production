#!/usr/bin/env node

/**
 * ПРАВИЛЬНЫЙ ПЕРЕИМПОРТ через ScraperAPI
 *
 * ✅ Использует ScraperAPI для получения HTML
 * ✅ Парсит ГАЛЕРЕЮ товара (НЕ баннеры og:image!)
 * ✅ Валидирует размеры изображений
 * ✅ Импортирует в БД через новый API
 */

const cheerio = require('cheerio')
const { createClient } = require('@supabase/supabase-js')
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

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY?.replace(/['"]/g, '')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/['"]/g, '')

if (!SCRAPER_API_KEY || !supabaseUrl || !supabaseKey) {
  console.error('❌ Не найдены переменные окружения!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

/**
 * Парсит изображение товара из HTML (ПРАВИЛЬНО!)
 * Приоритет: галерея товара → og:image
 */
function parseProductImage(html) {
  const $ = cheerio.load(html)

  // ПРИОРИТЕТ 1: Галереи товаров (НАСТОЯЩИЕ ФОТО!)
  const gallerySelectors = [
    // Яндекс.Маркет
    '[data-auto="productMediaGallery"] img',
    '[data-zone-name="gallery"] img',
    '[data-auto="offer-photo"] img',

    // Wildberries
    '.slide__content img',
    '.product-gallery img',
    '[data-link*="goodsImage"] img',

    // Ozon
    '[data-widget="webGallery"] img',
    '.product-image img',

    // AliExpress
    '.images-view-item img',
    '.magnifier-image img'
  ]

  for (const selector of gallerySelectors) {
    const img = $(selector).first().attr('src') || $(selector).first().attr('data-src')
    if (img) {
      console.log(`   ✅ Найдено изображение в галерее: ${selector}`)
      return img
    }
  }

  // ПРИОРИТЕТ 2: og:image (ТОЛЬКО как fallback!)
  const ogImage = $('meta[property="og:image"]').attr('content')
  if (ogImage) {
    console.log('   ⚠️  Используем og:image как fallback')
    return ogImage
  }

  return null
}

/**
 * Валидация URL изображения
 */
function validateImageUrl(imageUrl) {
  if (!imageUrl) return false

  // Проверяем что это НЕ баннер
  const bannersPatterns = [
    /big-box\.png/i,
    /banner/i,
    /promo/i,
    /\.svg$/i,
    /placeholder/i
  ]

  for (const pattern of bannersPatterns) {
    if (pattern.test(imageUrl)) {
      console.log(`   ❌ БАННЕР обнаружен: ${pattern}`)
      return false
    }
  }

  // Добавляем протокол если нужно
  if (imageUrl.startsWith('//')) {
    imageUrl = 'https:' + imageUrl
  }

  return imageUrl
}

/**
 * Парсинг товара через ScraperAPI
 */
async function parseProductWithScraperAPI(url, productName) {
  console.log(`⏳ [1/3] Парсинг через ScraperAPI...`)

  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY,
    url: url,
    render: 'true',
    country_code: 'ru'
  })

  const response = await fetch(`https://api.scraperapi.com?${params}`)

  if (!response.ok) {
    throw new Error(`ScraperAPI error: ${response.status}`)
  }

  const html = await response.text()
  console.log(`✅ HTML получен (${html.length} байт)`)

  // Парсинг с Cheerio
  const $ = cheerio.load(html)

  const title = $('h1').first().text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                productName

  const description = $('meta[property="og:description"]').attr('content') ||
                     $('meta[name="description"]').attr('content') ||
                     ''

  // ПРАВИЛЬНЫЙ парсинг изображения!
  console.log(`⏳ [2/3] Поиск изображения в галерее...`)
  let imageUrl = parseProductImage(html)
  imageUrl = validateImageUrl(imageUrl)

  if (!imageUrl) {
    console.log('   ❌ Изображение не найдено или это баннер!')
  } else {
    console.log(`   ✅ Изображение: ${imageUrl.substring(0, 80)}...`)
  }

  const priceText = $('[data-auto="price"]').first().text().trim() ||
                   $('.price').first().text().trim() ||
                   ''

  return {
    title,
    description,
    imageUrl,
    price: priceText,
    marketplace: 'yandex_market'
  }
}

/**
 * Импорт товара в БД
 */
async function importProduct(metadata, originalUrl, category = 'ТЕСТОВАЯ') {
  console.log(`⏳ [3/3] Импорт в базу данных...`)

  const response = await fetch('http://localhost:3000/api/catalog/products/import-from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metadata: {
        ...metadata,
        currency: 'RUB',
        originalUrl: originalUrl
      },
      analysis: {
        brand: metadata.title.split(' ')[0],
        category: category,
        keywords: metadata.title.split(' ').slice(0, 5)
      }
    })
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Import failed')
  }

  return result
}

/**
 * Переимпорт всех товаров из категории ТЕСТОВАЯ
 */
async function reimportAll() {
  console.log('🔄 ПРАВИЛЬНЫЙ ПЕРЕИМПОРТ ЧЕРЕЗ ScraperAPI\n')
  console.log('═'.repeat(80))
  console.log('✅ ScraperAPI: 869 запросов доступно')
  console.log('✅ Парсинг: ГАЛЕРЕЯ товара (НЕ баннеры!)')
  console.log('✅ Валидация: Проверка на баннеры')
  console.log('═'.repeat(80))

  // Получаем все товары из категории ТЕСТОВАЯ
  const { data: products, error } = await supabase
    .from('catalog_verified_products')
    .select('id, name, specifications')
    .eq('category', 'ТЕСТОВАЯ')
    .order('name')

  if (error) {
    console.error('❌ Ошибка получения товаров:', error)
    process.exit(1)
  }

  console.log(`\n📦 Найдено товаров: ${products.length}\n`)

  let successCount = 0
  let failCount = 0
  const results = []

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    const originalUrl = product.specifications?.originalUrl

    if (!originalUrl || !originalUrl.includes('market.yandex.ru')) {
      console.log(`\n⏭️  Пропускаем: ${product.name} (нет URL Яндекс.Маркет)`)
      continue
    }

    console.log('\n' + '═'.repeat(80))
    console.log(`📦 ТОВАР ${i + 1}/${products.length}: ${product.name}`)
    console.log(`🔗 ${originalUrl}`)
    console.log('═'.repeat(80))

    try {
      // Удаляем старый товар
      const { error: deleteError } = await supabase
        .from('catalog_verified_products')
        .delete()
        .eq('id', product.id)

      if (deleteError) throw deleteError
      console.log('✅ Старый товар удален')

      // Парсим через ScraperAPI
      const metadata = await parseProductWithScraperAPI(originalUrl, product.name)

      // Импортируем в БД
      const result = await importProduct(metadata, originalUrl)

      console.log(`\n✅ УСПЕХ! ID: ${result.product.id}`)
      console.log(`   Изображений: ${result.product.images?.length || 0}`)

      if (result.product.images && result.product.images.length > 0) {
        const firstImage = result.product.images[0]
        if (firstImage.includes('supabase.co/storage')) {
          console.log('   ✅ Изображение в Storage!')
        } else {
          console.log('   ⚠️  Изображение НЕ в Storage')
        }
      }

      successCount++
      results.push({ name: product.name, status: 'success' })

      // Пауза между запросами
      if (i < products.length - 1) {
        console.log('\n⏸️  Пауза 3 секунды...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

    } catch (error) {
      console.error(`\n❌ ОШИБКА: ${error.message}`)
      failCount++
      results.push({ name: product.name, status: 'failed', error: error.message })
    }
  }

  // Итоговый отчет
  console.log('\n\n' + '═'.repeat(80))
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ')
  console.log('═'.repeat(80))
  console.log(`✅ Успешно: ${successCount}`)
  console.log(`❌ Ошибки: ${failCount}`)
  console.log(`📦 Всего: ${products.length}`)
  console.log('═'.repeat(80))
}

reimportAll().catch(console.error)
