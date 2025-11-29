#!/usr/bin/env node

/**
 * Импорт с ПРОСТЫХ сайтов (без мощной защиты)
 * DNS-shop, М.Видео, Ситилинк
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

// ПРОСТЫЕ сайты с актуальными товарами
const products = [
  // DNS-shop (без жесткой защиты)
  { url: 'https://www.dns-shop.ru/product/d42de00dc84eed20/smartfon-apple-iphone-14-128-gb-cernyj/', name: 'iPhone 14', site: 'dns' },
  { url: 'https://www.dns-shop.ru/product/7a4b59aac94eed20/smartfon-samsung-galaxy-s23-128-gb-zelenyj/', name: 'Samsung S23', site: 'dns' },

  // М.Видео (простая защита)
  { url: 'https://www.mvideo.ru/products/smartfon-apple-iphone-14-128gb-midnight-400218252', name: 'iPhone 14', site: 'mvideo' },
  { url: 'https://www.mvideo.ru/products/noutbuk-apple-macbook-air-13-m2-2022-256gb-midnight-400232134', name: 'MacBook Air', site: 'mvideo' },

  // Ситилинк (еще проще)
  { url: 'https://www.citilink.ru/product/smartfon-apple-iphone-14-128gb-midnight-cernyy-1758086/', name: 'iPhone 14', site: 'citilink' }
]

/**
 * Получить HTML через ScraperAPI
 */
async function getHTML(url) {
  const params = new URLSearchParams({
    api_key: SCRAPER_API_KEY,
    url: url,
    country_code: 'ru'
    // БЕЗ premium и render для простых сайтов!
  })

  const response = await fetch(`https://api.scraperapi.com?${params}`)

  if (!response.ok) {
    throw new Error(`ScraperAPI: ${response.status}`)
  }

  return await response.text()
}

/**
 * Парсинг изображения
 */
function parseImage(html, site) {
  const $ = cheerio.load(html)

  let selectors = []

  switch(site) {
    case 'dns':
      selectors = [
        '.product-images-slider__main-img',
        '[data-id="product-buy-gallery"] img',
        '.product-card-top__gallery img'
      ]
      break
    case 'mvideo':
      selectors = [
        '.product-gallery__picture img',
        '[class*="ProductGallery"] img',
        '.carousel-item img'
      ]
      break
    case 'citilink':
      selectors = [
        '.ProductHeader__gallery-picture img',
        '[class*="Gallery"] img',
        '.product__gallery img'
      ]
      break
  }

  for (const sel of selectors) {
    const img = $(sel).first()
    let src = img.attr('src') || img.attr('data-src')

    if (src && !src.includes('placeholder') && !src.includes('noimage')) {
      return src.startsWith('//') ? 'https:' + src : src
    }
  }

  // Fallback на og:image
  return $('meta[property="og:image"]').attr('content')
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
  console.log('🚀 ИМПОРТ С ПРОСТЫХ САЙТОВ\n')
  console.log('═'.repeat(80))
  console.log(`📦 Товаров: ${products.length}`)
  console.log('🎯 Сайты: DNS-shop, М.Видео, Ситилинк (простая защита)')
  console.log('✅ ScraperAPI: Без premium (дешевле)')
  console.log('═'.repeat(80))

  let successCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    console.log('\n' + '═'.repeat(80))
    console.log(`📦 ТОВАР ${i + 1}/${products.length}: ${product.name} (${product.site})`)
    console.log(`🔗 ${product.url}`)
    console.log('═'.repeat(80))

    try {
      console.log('\n⏳ [1/3] Получение HTML...')
      const html = await getHTML(product.url)
      console.log(`✅ HTML: ${html.length} байт`)

      console.log('⏳ [2/3] Парсинг...')
      const $ = cheerio.load(html)

      const title = $('h1').first().text().trim() || product.name
      const description = $('meta[name="description"]').attr('content') || ''
      const price = $('.product-buy__price').first().text().trim() ||
                   $('[class*="Price"]').first().text().trim() || ''

      const imageUrl = parseImage(html, product.site)

      console.log(`   Название: ${title.substring(0, 50)}`)
      console.log(`   Цена: ${price || 'нет'}`)
      console.log(`   Изображение: ${imageUrl ? '✅' : '❌'}`)

      if (imageUrl) {
        console.log(`   URL: ${imageUrl.substring(0, 80)}...`)
      } else {
        console.log('   ⚠️  Пропускаем (нет изображения)')
        continue
      }

      console.log('⏳ [3/3] Импорт...')
      const result = await importProduct({
        title,
        description,
        imageUrl,
        price,
        marketplace: product.site
      }, product.url)

      console.log(`\n✅ УСПЕХ!`)
      console.log(`   ID: ${result.product.id}`)
      console.log(`   Изображений: ${result.product.images?.length || 0}`)

      successCount++

      if (i < products.length - 1) {
        console.log('\n⏸️  Пауза 2 сек...')
        await new Promise(resolve => setTimeout(resolve, 2000))
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
    console.log('\n✨ Проверь: http://localhost:3000/dashboard/catalog')
  }
}

main().catch(console.error)
