#!/usr/bin/env node

/**
 * Проверка изображений в Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function checkStorageImages() {
  console.log('🔍 ПРОВЕРКА ИЗОБРАЖЕНИЙ В STORAGE\n')

  // Получаем товары с изображениями
  const { data: products, error } = await supabase
    .from('catalog_verified_products')
    .select('id, name, images')
    .eq('category', 'ТЕСТОВАЯ')
    .limit(5)

  if (error) {
    console.error('❌ Ошибка получения товаров:', error.message)
    return
  }

  console.log(`📦 Проверяем ${products.length} товаров...\n`)

  for (const product of products) {
    console.log(`\n📦 ${product.name}`)
    console.log(`   ID: ${product.id}`)

    let images = []
    try {
      images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    } catch (e) {
      console.log('   ❌ Ошибка парсинга images:', e.message)
      continue
    }

    if (!images || images.length === 0) {
      console.log('   ⚠️  Нет изображений')
      continue
    }

    console.log(`   🖼️  Изображений: ${images.length}`)

    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i]
      console.log(`\n   Изображение ${i + 1}:`)
      console.log(`   URL: ${imageUrl}`)

      // Проверяем доступность URL
      try {
        const response = await fetch(imageUrl, { method: 'HEAD' })
        if (response.ok) {
          console.log(`   ✅ Доступно (${response.status})`)
        } else {
          console.log(`   ❌ Недоступно (${response.status} ${response.statusText})`)
        }
      } catch (e) {
        console.log(`   ❌ Ошибка загрузки: ${e.message}`)
      }
    }
  }

  // Проверяем bucket политики
  console.log('\n\n🔐 ПРОВЕРКА BUCKET ПОЛИТИК\n')

  const { data: buckets, error: bucketsError } = await supabase
    .storage
    .listBuckets()

  if (bucketsError) {
    console.error('❌ Ошибка получения buckets:', bucketsError.message)
    return
  }

  const productImagesBucket = buckets.find(b => b.name === 'product-images')
  if (productImagesBucket) {
    console.log('✅ Bucket "product-images" существует')
    console.log(`   ID: ${productImagesBucket.id}`)
    console.log(`   Public: ${productImagesBucket.public}`)
    console.log(`   Created: ${productImagesBucket.created_at}`)
  } else {
    console.log('❌ Bucket "product-images" не найден!')
  }

  // Пробуем список файлов
  console.log('\n\n📁 ФАЙЛЫ В BUCKET:\n')
  const { data: files, error: filesError } = await supabase
    .storage
    .from('product-images')
    .list('imported', {
      limit: 10,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (filesError) {
    console.error('❌ Ошибка получения файлов:', filesError.message)
  } else {
    console.log(`Файлов в папке imported: ${files.length}`)
    files.slice(0, 5).forEach(file => {
      console.log(`   - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`)
    })
  }
}

checkStorageImages().catch(console.error)
