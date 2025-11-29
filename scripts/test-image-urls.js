#!/usr/bin/env node

/**
 * Тест форматирования image_url в RPC функции
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function testImageUrls() {
  console.log('🔍 ТЕСТИРОВАНИЕ ФОРМАТИРОВАНИЯ IMAGE_URL\n')

  const { data, error } = await supabase
    .rpc('get_products_by_category', {
      category_name: 'ТЕСТОВАЯ',
      user_id_param: null,
      search_query: null,
      limit_param: 5,
      offset_param: 0
    })

  if (error) {
    console.error('❌ Ошибка:', error.message)
    return
  }

  const products = Array.isArray(data) ? data :
                  typeof data === 'string' ? JSON.parse(data) : []

  console.log(`📦 Получено ${products.length} товаров\n`)

  products.forEach((product, index) => {
    console.log(`${index + 1}. ${product.product_name}`)
    console.log(`   image_url type: ${typeof product.image_url}`)
    console.log(`   image_url value: ${product.image_url}`)

    // Проверяем наличие лишних кавычек
    if (product.image_url && product.image_url.startsWith('"') && product.image_url.endsWith('"')) {
      console.log('   ❌ ПРОБЛЕМА: image_url содержит лишние кавычки!')
    } else if (product.image_url && product.image_url.startsWith('http')) {
      console.log('   ✅ OK: image_url корректный URL')
    } else {
      console.log('   ⚠️  WARNING: необычный формат image_url')
    }

    // Проверяем images массив
    console.log(`   images type: ${typeof product.images}`)
    if (Array.isArray(product.images)) {
      console.log(`   images length: ${product.images.length}`)
      if (product.images.length > 0) {
        console.log(`   images[0]: ${product.images[0]}`)
      }
    } else if (typeof product.images === 'string') {
      console.log('   ⚠️  images это строка, нужно парсить!')
      try {
        const parsed = JSON.parse(product.images)
        console.log(`   parsed images length: ${parsed.length}`)
      } catch (e) {
        console.log('   ❌ Ошибка парсинга images')
      }
    }

    console.log('')
  })

  console.log('✅ ТЕСТ ЗАВЕРШЕН\n')
}

testImageUrls().catch(console.error)
