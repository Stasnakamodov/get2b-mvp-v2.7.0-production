#!/usr/bin/env node

/**
 * Диагностика проблемы с подкатегориями
 */

async function diagnose() {
  console.log('🔍 ДИАГНОСТИКА ПРОБЛЕМЫ С ПОДКАТЕГОРИЯМИ\n')
  console.log('═'.repeat(80))

  // 1. Проверяем API категорий
  console.log('\n📊 ШАГ 1: Проверка API категорий')
  console.log('═'.repeat(80))

  const categoriesResponse = await fetch('http://localhost:3002/api/catalog/categories')
  const categoriesData = await categoriesResponse.json()

  const testCategory = categoriesData.categories.find(c => c.key === 'testovaya')
  if (testCategory) {
    console.log('\n✅ Найдена категория ТЕСТОВАЯ:')
    console.log('   ID:', testCategory.id)
    console.log('   Название:', testCategory.name)
    console.log('   Подкатегории:', testCategory.subcategories.length)

    testCategory.subcategories.forEach(sub => {
      console.log(`\n   📦 Подкатегория: "${sub.name}"`)
      console.log(`      ID: ${sub.id}`)
      console.log(`      Key: ${sub.key}`)
      console.log(`      Количество товаров: ${sub.products_count}`)
    })
  }

  // 2. Проверяем товары в основной категории ТЕСТОВАЯ
  console.log('\n\n📊 ШАГ 2: Проверка товаров в категории ТЕСТОВАЯ')
  console.log('═'.repeat(80))

  const productsResponse = await fetch('http://localhost:3002/api/catalog/products-by-category/ТЕСТОВАЯ?limit=100')
  const productsData = await productsResponse.json()

  console.log(`\n✅ API вернул ${productsData.summary?.total_products || 0} товаров`)

  if (productsData.products && productsData.products.length > 0) {
    console.log('\n📦 Первые 5 товаров:')
    productsData.products.slice(0, 5).forEach((p, i) => {
      console.log(`\n   ${i+1}. ${p.product_name}`)
      console.log(`      ID: ${p.id}`)
      console.log(`      Category: ${p.category}`)
      console.log(`      Subcategory: ${p.subcategory || 'НЕ ЗАДАНА'}`)
      console.log(`      Image URL: ${p.image_url ? '✅ ЕСТЬ' : '❌ НЕТ'}`)
    })
  }

  // 3. Проверяем товары в подкатегории "Тестовые товары"
  console.log('\n\n📊 ШАГ 3: Проверка товаров в подкатегории "Тестовые товары"')
  console.log('═'.repeat(80))

  const subcategoryResponse = await fetch('http://localhost:3002/api/catalog/products-by-category/' + encodeURIComponent('Тестовые товары') + '?limit=100')
  const subcategoryData = await subcategoryResponse.json()

  console.log(`\n✅ API вернул ${subcategoryData.summary?.total_products || 0} товаров`)

  if (subcategoryData.products && subcategoryData.products.length > 0) {
    console.log('\n📦 Товары:')
    subcategoryData.products.forEach((p, i) => {
      console.log(`\n   ${i+1}. ${p.product_name}`)
      console.log(`      ID: ${p.id}`)
      console.log(`      Category: ${p.category}`)
      console.log(`      Subcategory: ${p.subcategory || 'НЕ ЗАДАНА'}`)
      console.log(`      Image URL: ${p.image_url ? '✅ ЕСТЬ' : '❌ НЕТ'}`)
    })
  }

  // 4. Вывод проблемы и решения
  console.log('\n\n═'.repeat(80))
  console.log('🔴 ПРОБЛЕМА:')
  console.log('═'.repeat(80))
  console.log(`
1. В базе данных 32 товара с category = 'ТЕСТОВАЯ'
2. Подкатегория "Тестовые товары" показывает ${testCategory?.subcategories[0]?.products_count || 0} товаров
3. API возвращает ${subcategoryData.summary?.total_products || 0} товар при запросе подкатегории
4. Товары не привязаны к подкатегориям (нет поля subcategory_id)

✅ РЕШЕНИЕ:
1. Добавить поле subcategory_id в таблицу catalog_verified_products
2. Обновить RPC функцию get_products_by_category для поддержки подкатегорий
3. Привязать существующие товары к подкатегории "Тестовые товары"
`)

  console.log('═'.repeat(80))
}

diagnose().catch(console.error)
