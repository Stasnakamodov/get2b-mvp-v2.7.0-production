#!/usr/bin/env node

/**
 * Импорт СВЕЖИХ товаров с правильными изображениями
 * Используем АКТУАЛЬНЫЕ URL-ы с разных маркетплейсов
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
      process.env[match[1]] = match[2].replace(/['"]/g, '')
    }
  })
}

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY

// СВЕЖИЕ URL-ы товаров (проверенные, актуальные!)
const products = [
  // Wildberries - свежие товары
  { url: 'https://www.wildberries.ru/catalog/210862698/detail.aspx', name: 'Apple iPhone 14 Pro' },
  { url: 'https://www.wildberries.ru/catalog/168590716/detail.aspx', name: 'Samsung Galaxy S23' },
  { url: 'https://www.wildberries.ru/catalog/177936164/detail.aspx', name: 'Apple AirPods Pro 2' },
  { url: 'https://www.wildberries.ru/catalog/171418498/detail.aspx', name: 'MacBook Air M2' },
  { url: 'https://www.wildberries.ru/catalog/210759485/detail.aspx', name: 'iPad 10.2' }
]

const API_ENDPOINT = 'http://localhost:3000/api/catalog/products/parse-and-import'

async function importProducts() {
  console.log('🚀 ИМПОРТ СВЕЖИХ ТОВАРОВ\n')
  console.log('═'.repeat(80))
  console.log(`📦 Товаров: ${products.length}`)
  console.log('🎯 Источник: Wildberries (актуальные URL)')
  console.log('✅ Парсер: Исправленный (галерея → валидация → Storage)')
  console.log('═'.repeat(80))

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    console.log('\n' + '═'.repeat(80))
    console.log(`📦 ТОВАР ${i + 1}/${products.length}: ${product.name}`)
    console.log(`🔗 ${product.url}`)
    console.log('═'.repeat(80))

    try {
      console.log('\n⏳ Импорт через parse-and-import API...')

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: product.url,
          category: 'ТЕСТОВАЯ'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      console.log('\n✅ УСПЕХ!')
      console.log(`   ID: ${result.product.id}`)
      console.log(`   Название: ${result.product.name}`)
      console.log(`   Изображений: ${result.product.images?.length || 0}`)

      if (result.product.images && result.product.images.length > 0) {
        const img = result.product.images[0]
        console.log(`   URL: ${img.substring(0, 80)}...`)

        if (img.includes('supabase.co/storage')) {
          console.log('   ✅ В Storage!')
        }
      } else {
        console.log('   ⚠️  БЕЗ изображений!')
      }

      successCount++

      // Пауза между импортами
      if (i < products.length - 1) {
        console.log('\n⏸️  Пауза 5 секунд...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

    } catch (error) {
      console.error(`\n❌ ОШИБКА: ${error.message}`)
      failCount++
    }
  }

  // Итог
  console.log('\n\n' + '═'.repeat(80))
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ')
  console.log('═'.repeat(80))
  console.log(`✅ Успешно: ${successCount}`)
  console.log(`❌ Ошибки: ${failCount}`)
  console.log(`📦 Всего: ${products.length}`)
  console.log('═'.repeat(80))

  if (successCount > 0) {
    console.log('\n✨ Товары добавлены! Проверь UI: http://localhost:3000/dashboard/catalog')
  }
}

console.log('⚠️  ВАЖНО: Dev сервер должен быть запущен!\n')
importProducts().catch(console.error)
