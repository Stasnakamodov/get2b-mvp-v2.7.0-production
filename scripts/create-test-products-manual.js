#!/usr/bin/env node

/**
 * Создание тестовых товаров вручную
 * С публичными URL изображений (БЕЗ парсинга!)
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

// Тестовые товары с публичными изображениями
const products = [
  {
    name: 'Apple iPhone 14 Pro 128GB',
    description: 'Смартфон Apple iPhone 14 Pro с экраном 6.1" Super Retina XDR, процессором A16 Bionic, тройной камерой 48MP',
    price: '89990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5235334/img_id5941207212935165883.jpeg/orig',
    brand: 'Apple',
    category: 'ТЕСТОВАЯ'
  },
  {
    name: 'Samsung Galaxy S23 Ultra 256GB',
    description: 'Флагманский смартфон Samsung Galaxy S23 Ultra с экраном 6.8" Dynamic AMOLED 2X, камерой 200MP и стилусом S Pen',
    price: '99990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5220626/img_id6632339126545844726.jpeg/orig',
    brand: 'Samsung',
    category: 'ТЕСТОВАЯ'
  },
  {
    name: 'Apple AirPods Pro 2',
    description: 'Беспроводные наушники Apple AirPods Pro 2 с активным шумоподавлением, чипом H2 и USB-C зарядкой',
    price: '24990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/4903352/img_id5793431243099966846.jpeg/orig',
    brand: 'Apple',
    category: 'ТЕСТОВАЯ'
  },
  {
    name: 'MacBook Air 13" M2 256GB',
    description: 'Ноутбук Apple MacBook Air 13" с процессором M2, экраном Liquid Retina, 8GB RAM и SSD 256GB',
    price: '119990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5235527/img_id2739595916104671732.png/orig',
    brand: 'Apple',
    category: 'ТЕСТОВАЯ'
  },
  {
    name: 'iPad 10.9" 2022 64GB Wi-Fi',
    description: 'Планшет Apple iPad 10.9" с процессором A14 Bionic, экраном Liquid Retina, камерой 12MP',
    price: '44990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5210024/img_id7629904368649851853.jpeg/orig',
    brand: 'Apple',
    category: 'ТЕСТОВАЯ'
  },
  {
    name: 'Xiaomi Redmi Note 12 Pro 256GB',
    description: 'Смартфон Xiaomi Redmi Note 12 Pro с экраном 6.67" AMOLED 120Hz, камерой 50MP и быстрой зарядкой 67W',
    price: '27990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5234819/img_id7606254726054584352.jpeg/orig',
    brand: 'Xiaomi',
    category: 'ТЕСТОВАЯ'
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Беспроводные наушники Sony WH-1000XM5 с активным шумоподавлением, звуком Hi-Res и временем работы до 30 часов',
    price: '34990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5235178/img_id3576208903743635843.jpeg/orig',
    brand: 'Sony',
    category: 'ТЕСТОВАЯ'
  },
  {
    name: 'Lenovo IdeaPad 3 15" Ryzen 5',
    description: 'Ноутбук Lenovo IdeaPad 3 15" с процессором AMD Ryzen 5 5500U, 8GB RAM, SSD 512GB',
    price: '49990',
    currency: 'RUB',
    imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5221811/img_id7503078691330950768.jpeg/orig',
    brand: 'Lenovo',
    category: 'ТЕСТОВАЯ'
  }
]

async function createProducts() {
  console.log('🚀 СОЗДАНИЕ ТЕСТОВЫХ ТОВАРОВ ВРУЧНУЮ\n')
  console.log('═'.repeat(80))
  console.log(`📦 Товаров: ${products.length}`)
  console.log('✅ Изображения: Публичные URL (БЕЗ парсинга)')
  console.log('✅ Качество: Настоящие фото товаров')
  console.log('═'.repeat(80))

  let successCount = 0

  for (let i = 0; i < products.length; i++) {
    const product = products[i]

    console.log('\n' + '═'.repeat(80))
    console.log(`📦 ТОВАР ${i + 1}/${products.length}: ${product.name}`)
    console.log('═'.repeat(80))

    try {
      const response = await fetch('http://localhost:3000/api/catalog/products/import-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            title: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            price: product.price,
            currency: product.currency,
            marketplace: 'manual',
            originalUrl: product.imageUrl
          },
          analysis: {
            brand: product.brand,
            category: product.category,
            keywords: product.name.split(' ').slice(0, 5)
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      console.log('✅ УСПЕХ!')
      console.log(`   ID: ${result.product.id}`)
      console.log(`   Изображений: ${result.product.images?.length || 0}`)

      if (result.product.images && result.product.images.length > 0) {
        const img = result.product.images[0]
        if (img.includes('supabase.co/storage')) {
          console.log('   ✅ В Supabase Storage!')
        } else {
          console.log(`   ⚠️  Прямой URL: ${img.substring(0, 60)}...`)
        }
      }

      successCount++

      // Пауза
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error(`❌ ОШИБКА: ${error.message}`)
    }
  }

  console.log('\n\n' + '═'.repeat(80))
  console.log('📊 ИТОГ')
  console.log('═'.repeat(80))
  console.log(`✅ Успешно: ${successCount}/${products.length}`)
  console.log('═'.repeat(80))

  if (successCount > 0) {
    console.log('\n✨ ГОТОВО! Проверь UI: http://localhost:3000/dashboard/catalog')
    console.log('   Категория: ТЕСТОВАЯ')
  }
}

createProducts().catch(console.error)
