#!/usr/bin/env node

/**
 * ПРАВИЛЬНЫЙ ИМПОРТ через ScraperAPI
 * ✅ ScraperAPI получает HTML (обходит антибот)
 * ✅ Парсим ГАЛЕРЕЮ товара (НЕ og:image баннер!)
 * ✅ Импортируем через API
 */

const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

// Читаем .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      process.env[match[1]] = match[2].replace(/['"]/g, '')
    }
  })
}

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY

// Свежие товары с Wildberries
const products = [
  { url: 'https://www.wildberries.ru/catalog/210862698/detail.aspx', name: 'iPhone 14' },
  { url: 'https://www.wildberries.ru/catalog/168590716/detail.aspx', name: 'Samsung S23' },
  { url: 'https://www.wildberries.ru/catalog/177936164/detail.aspx', name: 'AirPods Pro' },
  { url: 'https://www.wildberries.ru/catalog/171418498/detail.aspx', name: 'MacBook Air' },
  { url: 'https://www.wildberries.ru/catalog/210759485/detail.aspx', name: 'iPad' }
]

/**
 * Получить HTML через ScraperAPI с премиум прокси
 */
async function getHTML(url) {
  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY,
    url: url,
    render: 'true',         // JavaScript rendering
    country_code: 'ru',     // Российский IP
    premium: 'true'         // Premium прокси для обхода защиты
  })

  const response = await fetch(`https://api.scraperapi.com?${params}`)

  if (!response.ok) {
    throw new Error(`ScraperAPI error: ${response.status}`)
  }

  return await response.text()
}

/**
 * Парсинг изображения из ГАЛЕРЕИ (НЕ баннер!)
 */
function parseGalleryImage(html) {
  const $ = cheerio.load(html)

  // Wildberries галереи
  const selectors = [
    '.slide__content img',
    '.product-gallery__picture img',
    '[class*="swiper-zoom-container"] img',
    '[class*="ProductPage__image"] img',
    '.product-page__img-wrap img'
  ]

  for (const selector of selectors) {
    const img = $(selector).first()
    let src = img.attr('src') || img.attr('data-src')

    if (src && !src.includes('big-box') && !src.includes('banner')) {
      // Убираем /tm/ из URL (уменьшенная версия)
      src = src.replace('/tm/', '/big/')
      return src.startsWith('//') ? 'https:' + src : src
    }
  }

  return null
}

/**
 * Импорт товара
 */
async function importProduct(metadata, url) {
  const response = await fetch('http://localhost:3000/api/catalog/products/import-from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metadata: {
        ...metadata,
        currency: 'RUB',
        originalUrl: url
      },
      analysis: {
        brand: metadata.title.split(' ')[0],
        category: 'ТЕСТОВАЯ',
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

async function main() {
  console.log('🚀 ИМПОРТ ЧЕРЕЗ ScraperAPI + РУЧНОЙ ПАРСИНГ ГАЛЕРЕИ\n')
  console.log('═'.repeat(80))
  console.log(`📦 Товаров: ${products.length}`)
  console.log('✅ ScraperAPI: Premium прокси (обход антибота)')
  console.log('✅ Парсинг: Галерея товара (НЕ баннеры!)')
  console.log('═'.repeat(80))

  let successCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    console.log('\n' + '═'.repeat(80))
    console.log(`📦 ТОВАР ${i + 1}/${products.length}: ${product.name}`)
    console.log(`🔗 ${product.url}`)
    console.log('═'.repeat(80))

    try {
      // Шаг 1: Получить HTML через ScraperAPI
      console.log('\n⏳ [1/3] Получение HTML через ScraperAPI...')
      const html = await getHTML(product.url)
      console.log(`✅ HTML получен (${html.length} байт)`)

      // Шаг 2: Парсинг с Cheerio
      console.log('⏳ [2/3] Парсинг метаданных...')
      const $ = cheerio.load(html)

      const title = $('h1').first().text().trim() || product.name
      const description = $('meta[name="description"]').attr('content') || ''
      const price = $('.price-block__final-price').first().text().trim() || ''

      // ВАЖНО: Парсим из ГАЛЕРЕИ!
      const imageUrl = parseGalleryImage(html)

      console.log(`   Название: ${title.substring(0, 50)}`)
      console.log(`   Цена: ${price || 'нет'}`)
      console.log(`   Изображение: ${imageUrl ? '✅' : '❌'}`)

      if (imageUrl) {
        console.log(`   URL: ${imageUrl.substring(0, 80)}...`)
      }

      if (!imageUrl) {
        console.log('   ⚠️  Изображение не найдено, пропускаем')
        continue
      }

      // Шаг 3: Импорт
      console.log('⏳ [3/3] Импорт в базу...')
      const result = await importProduct({
        title,
        description,
        imageUrl,
        price,
        marketplace: 'wildberries'
      }, product.url)

      console.log(`\n✅ УСПЕХ!`)
      console.log(`   ID: ${result.product.id}`)
      console.log(`   Изображений: ${result.product.images?.length || 0}`)

      if (result.product.images && result.product.images.length > 0) {
        const img = result.product.images[0]
        if (img.includes('supabase.co/storage')) {
          console.log('   ✅ В Storage!')
        }
      }

      successCount++

      // Пауза
      if (i < products.length - 1) {
        console.log('\n⏸️  Пауза 3 секунды...')
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

    } catch (error) {
      console.error(`\n❌ ОШИБКА: ${error.message}`)
    }
  }

  console.log('\n\n' + '═'.repeat(80))
  console.log('📊 ИТОГ')
  console.log('═'.repeat(80))
  console.log(`✅ Успешно: ${successCount}/${products.length}`)
  console.log('═'.repeat(80))

  if (successCount > 0) {
    console.log('\n✨ Проверь UI: http://localhost:3000/dashboard/catalog')
  }
}

main().catch(console.error)
