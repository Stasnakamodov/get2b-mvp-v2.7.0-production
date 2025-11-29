#!/usr/bin/env node

async function checkProgress() {
  const response = await fetch('http://localhost:3002/api/catalog/products?supplier_type=verified&category=ТЕСТОВАЯ')
  const data = await response.json()

  console.log('\n📊 ПРОГРЕСС ИМПОРТА:\n')
  console.log('Товаров в категории ТЕСТОВАЯ:', data.products?.length || 0)
  console.log('\n✅ Последние 10 добавленных товаров:\n')

  data.products?.slice(0, 10).forEach((p, i) => {
    const hasImage = p.images && p.images.length > 0
    console.log(`  ${i+1}. ${p.name}`)
    console.log(`     Картинка: ${hasImage ? '✅ ЕСТЬ' : '❌ НЕТ'}`)
    console.log(`     ID: ${p.id}`)
    console.log('')
  })
}

checkProgress().catch(console.error)
