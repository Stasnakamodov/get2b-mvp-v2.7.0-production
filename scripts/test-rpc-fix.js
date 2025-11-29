#!/usr/bin/env node

/**
 * Тест исправленной RPC функции get_products_by_category
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function testRPCFunction() {
  console.log('🔍 ТЕСТИРОВАНИЕ ИСПРАВЛЕННОЙ RPC ФУНКЦИИ\n')

  // Тест 1: Получить все товары в категории ТЕСТОВАЯ
  console.log('📊 Тест 1: Получение товаров категории ТЕСТОВАЯ...')
  const { data: testData, error: testError } = await supabase
    .rpc('get_products_by_category', {
      category_name: 'ТЕСТОВАЯ',
      user_id_param: null,
      search_query: null,
      limit_param: 100,
      offset_param: 0
    })

  if (testError) {
    console.error('❌ Ошибка:', testError.message)
    process.exit(1)
  }

  const products = Array.isArray(testData) ? testData :
                  typeof testData === 'string' ? JSON.parse(testData) : []

  console.log(`\n✅ Результат: ${products.length} товаров`)

  if (products.length >= 32) {
    console.log('🎉 ПРОБЛЕМА ИСПРАВЛЕНА! Функция возвращает все товары\n')
  } else if (products.length === 1) {
    console.log('❌ ПРОБЛЕМА НЕ ИСПРАВЛЕНА! Функция все еще возвращает только 1 товар\n')
  } else {
    console.log(`⚠️  Функция возвращает ${products.length} товаров (ожидалось 32+)\n`)
  }

  // Показать первые 3 товара
  console.log('📦 Примеры товаров:')
  products.slice(0, 3).forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.product_name}`)
    console.log(`      ID: ${p.id}`)
    console.log(`      Цена: ${p.price} ${p.currency}`)
    console.log(`      Поставщик: ${p.supplier_name}`)
    console.log('')
  })

  // Тест 2: Проверить LIMIT
  console.log('📊 Тест 2: Проверка LIMIT (должно вернуться 10 товаров)...')
  const { data: limitData, error: limitError } = await supabase
    .rpc('get_products_by_category', {
      category_name: 'ТЕСТОВАЯ',
      user_id_param: null,
      search_query: null,
      limit_param: 10,
      offset_param: 0
    })

  if (limitError) {
    console.error('❌ Ошибка:', limitError.message)
  } else {
    const limitProducts = Array.isArray(limitData) ? limitData :
                         typeof limitData === 'string' ? JSON.parse(limitData) : []
    console.log(`✅ Результат: ${limitProducts.length} товаров (ожидалось 10)`)
    if (limitProducts.length === 10) {
      console.log('🎉 LIMIT работает корректно!\n')
    } else {
      console.log('⚠️  LIMIT работает не так как ожидалось\n')
    }
  }

  // Тест 3: Проверить что images присутствует
  if (products.length > 0) {
    console.log('📊 Тест 3: Проверка поля images...')
    const firstProduct = products[0]
    if (firstProduct.images) {
      console.log(`✅ Поле images присутствует (${Array.isArray(firstProduct.images) ? firstProduct.images.length : 0} изображений)`)
      if (firstProduct.image_url) {
        console.log(`✅ Поле image_url присутствует: ${firstProduct.image_url.substring(0, 50)}...`)
      }
      console.log('')
    } else {
      console.log('❌ Поле images отсутствует\n')
    }
  }

  console.log('✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ!\n')
}

testRPCFunction().catch(console.error)
