#!/usr/bin/env node

/**
 * Тест фильтрации по подкатегориям в RPC функции
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function testSubcategoryFilter() {
  console.log('🔍 ТЕСТИРОВАНИЕ ФИЛЬТРАЦИИ ПО ПОДКАТЕГОРИЯМ\n')

  // Тест 1: Фильтр по категории "ТЕСТОВАЯ"
  console.log('📊 Тест 1: Фильтр по категории "ТЕСТОВАЯ"...')
  const { data: categoryData, error: categoryError } = await supabase
    .rpc('get_products_by_category', {
      category_name: 'ТЕСТОВАЯ',
      user_id_param: null,
      search_query: null,
      limit_param: 100,
      offset_param: 0
    })

  if (categoryError) {
    console.error('❌ Ошибка:', categoryError.message)
  } else {
    const products = Array.isArray(categoryData) ? categoryData :
                    typeof categoryData === 'string' ? JSON.parse(categoryData) : []
    console.log(`✅ Результат: ${products.length} товаров\n`)
  }

  // Тест 2: Фильтр по подкатегории "Тестовые товары"
  console.log('📊 Тест 2: Фильтр по подкатегории "Тестовые товары"...')
  const { data: subcategoryData, error: subcategoryError } = await supabase
    .rpc('get_products_by_category', {
      category_name: 'Тестовые товары',
      user_id_param: null,
      search_query: null,
      limit_param: 100,
      offset_param: 0
    })

  if (subcategoryError) {
    console.error('❌ Ошибка:', subcategoryError.message)
  } else {
    const products = Array.isArray(subcategoryData) ? subcategoryData :
                    typeof subcategoryData === 'string' ? JSON.parse(subcategoryData) : []
    console.log(`✅ Результат: ${products.length} товаров`)

    if (products.length > 0) {
      console.log('\n📦 Примеры товаров из подкатегории:')
      products.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.product_name}`)
        console.log(`      Category: ${p.category}`)
        console.log(`      ID: ${p.id}`)
      })
    }
    console.log('')
  }

  // Тест 3: Все товары (без фильтра)
  console.log('📊 Тест 3: Все товары (без фильтра)...')
  const { data: allData, error: allError } = await supabase
    .rpc('get_products_by_category', {
      category_name: null,
      user_id_param: null,
      search_query: null,
      limit_param: 100,
      offset_param: 0
    })

  if (allError) {
    console.error('❌ Ошибка:', allError.message)
  } else {
    const products = Array.isArray(allData) ? allData :
                    typeof allData === 'string' ? JSON.parse(allData) : []
    console.log(`✅ Результат: ${products.length} товаров\n`)
  }

  console.log('✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!\n')

  // Итоговый отчет
  const categoryCount = Array.isArray(categoryData) ? categoryData.length : 0
  const subcategoryCount = Array.isArray(subcategoryData) ? subcategoryData.length : 0

  console.log('📊 ИТОГОВЫЙ ОТЧЕТ:')
  console.log(`   Товары по категории "ТЕСТОВАЯ": ${categoryCount}`)
  console.log(`   Товары по подкатегории "Тестовые товары": ${subcategoryCount}`)

  if (subcategoryCount > 0) {
    console.log('\n🎉 ФИЛЬТРАЦИЯ ПО ПОДКАТЕГОРИЯМ РАБОТАЕТ!')
  } else {
    console.log('\n❌ ФИЛЬТРАЦИЯ ПО ПОДКАТЕГОРИЯМ НЕ РАБОТАЕТ')
  }
}

testSubcategoryFilter().catch(console.error)
