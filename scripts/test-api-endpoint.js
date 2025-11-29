#!/usr/bin/env node

/**
 * Тест API endpoint /api/catalog/products-by-category/[category]
 */

async function testAPIEndpoint() {
  console.log('🔍 ТЕСТИРОВАНИЕ API ENDPOINT\n')

  const baseUrl = 'http://localhost:3000'
  const category = 'ТЕСТОВАЯ'
  const url = `${baseUrl}/api/catalog/products-by-category/${category}?limit=100`

  console.log(`📊 URL: ${url}\n`)

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`)
      process.exit(1)
    }

    const data = await response.json()

    console.log(`✅ Статус: ${response.status} OK`)
    console.log(`📦 Получено товаров: ${data.products?.length || 0}`)
    console.log(`📊 Total: ${data.total}`)
    console.log(`📄 Page: ${data.page}`)
    console.log(`🔢 Limit: ${data.limit}`)

    if (data.products && data.products.length >= 32) {
      console.log('\n🎉 API ENDPOINT РАБОТАЕТ КОРРЕКТНО!')
      console.log('   Все товары возвращаются как ожидается\n')
    } else if (data.products && data.products.length === 1) {
      console.log('\n❌ ПРОБЛЕМА НЕ ИСПРАВЛЕНА!')
      console.log('   API endpoint все еще возвращает только 1 товар\n')
    } else {
      console.log(`\n⚠️  Получено ${data.products?.length || 0} товаров (ожидалось 32+)\n`)
    }

    // Показать первые 3 товара
    if (data.products && data.products.length > 0) {
      console.log('📦 Примеры товаров:')
      data.products.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.product_name || p.name}`)
        console.log(`      ID: ${p.id}`)
        console.log(`      Поставщик: ${p.supplier_name}`)
        console.log('')
      })
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Сервер не запущен!')
      console.log('\n💡 Запустите сервер командой: npm run dev\n')
    } else {
      console.error('❌ Ошибка:', error.message)
    }
    process.exit(1)
  }
}

testAPIEndpoint()
