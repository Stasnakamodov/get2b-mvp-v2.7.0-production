#!/usr/bin/env node

/**
 * Переимпорт 9 товаров через ПРАВИЛЬНЫЙ парсер (Playwright с валидацией изображений)
 *
 * ПРОБЛЕМА: Предыдущий скрипт использовал неправильный API endpoint
 * РЕШЕНИЕ: Используем /api/catalog/products/parse-and-import который вызывает Playwright
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY не найден')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// 9 товаров которые нужно переимпортировать
const productsToReimport = [
  { name: 'Honor X8a', url: 'https://market.yandex.ru/product--smartfon-honor-x8a-6-128gb/1873395704' },
  { name: 'Acer Aspire 3', url: 'https://market.yandex.ru/product--noutbuk-acer-aspire-3-a315-59/1829464891' },
  { name: 'Samsung Galaxy S23', url: 'https://market.yandex.ru/product--smartfon-samsung-galaxy-s23-8-128gb/1965359484' },
  { name: 'Lenovo IdeaPad 3', url: 'https://market.yandex.ru/product--noutbuk-lenovo-ideapad-3-15iau7/1828575647' },
  { name: 'MSI Modern 15', url: 'https://market.yandex.ru/product--noutbuk-msi-modern-15-b12mo/1835721948' },
  { name: 'Samsung Galaxy Buds2 Pro', url: 'https://market.yandex.ru/product--naushniki-samsung-galaxy-buds2-pro/1774958334' },
  { name: 'JBL Tune 520BT', url: 'https://market.yandex.ru/product--naushniki-jbl-tune-520bt/1870743289' },
  { name: 'Колье ОптимаБизнес', url: 'https://market.yandex.ru/product--kole-optimabiznes-s-naturalnym-agatom-s-pozolotoy-v-podarochnoy-upakovke/1870735854' },
  { name: 'Масло эфирное Розмарин', url: 'https://market.yandex.ru/product--maslo-efirnoe-rozmarin-vitateka-10-ml/1715834607' }
]

// НОВЫЙ API endpoint который ПРАВИЛЬНО парсит с Playwright
const API_ENDPOINT = 'http://localhost:3000/api/catalog/products/parse-and-import'

async function reimportProducts() {
  console.log('🔄 ПЕРЕИМПОРТ С ПРАВИЛЬНЫМ ПАРСЕРОМ\n')
  console.log('═'.repeat(80))
  console.log(`📦 Всего товаров: ${productsToReimport.length}`)
  console.log('🎭 API: /api/catalog/products/parse-and-import (с Playwright!)')
  console.log('═'.repeat(80))

  // Шаг 1: Удаляем неправильно импортированные товары (без изображений)
  console.log('\n🗑️  Удаление товаров без изображений...\n')

  const { data: productsWithoutImages, error: selectError } = await supabase
    .from('catalog_verified_products')
    .select('id, name, images')
    .eq('category', 'ТЕСТОВАЯ')
    .eq('images', '[]')

  if (selectError) {
    console.error('❌ Ошибка поиска товаров:', selectError.message)
  } else if (productsWithoutImages && productsWithoutImages.length > 0) {
    console.log(`Найдено ${productsWithoutImages.length} товаров без изображений:`)
    productsWithoutImages.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`)
    })

    const { error: deleteError } = await supabase
      .from('catalog_verified_products')
      .delete()
      .eq('images', '[]')
      .eq('category', 'ТЕСТОВАЯ')

    if (deleteError) {
      console.error('❌ Ошибка удаления:', deleteError.message)
    } else {
      console.log(`\n✅ Удалено ${productsWithoutImages.length} товаров без изображений`)
    }
  } else {
    console.log('ℹ️  Товары без изображений не найдены')
  }

  // Шаг 2: Импортируем каждый товар через ПРАВИЛЬНЫЙ API
  let successCount = 0
  let failCount = 0
  const results = []

  for (let i = 0; i < productsToReimport.length; i++) {
    const product = productsToReimport[i]
    const productNum = i + 1

    console.log('\n' + '═'.repeat(80))
    console.log(`📦 ТОВАР ${productNum}/${productsToReimport.length}: ${product.name}`)
    console.log('═'.repeat(80))
    console.log(`🔗 URL: ${product.url}`)

    try {
      console.log('\n⏳ Импорт через parse-and-import API (с Playwright)...')

      const startTime = Date.now()

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: product.url,
          category: 'ТЕСТОВАЯ'
        })
      })

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()

      console.log(`\n✅ Импорт завершен за ${duration}с!`)
      console.log(`   Новый ID: ${result.product?.id}`)
      console.log(`   Название: ${result.product?.name}`)
      console.log(`   Изображений: ${result.product?.images?.length || 0}`)

      if (result.product?.images && result.product.images.length > 0) {
        const firstImage = result.product.images[0]
        console.log(`   Первое изображение: ${firstImage.substring(0, 80)}...`)

        if (firstImage.includes('supabase.co/storage')) {
          console.log('   ✅ Изображение в Storage!')

          // Проверяем размер файла
          try {
            const imgResponse = await fetch(firstImage, { method: 'HEAD' })
            const fileSize = parseInt(imgResponse.headers.get('content-length') || '0')
            console.log(`   Размер: ${(fileSize / 1024).toFixed(2)} KB`)

            if (fileSize < 30000) {
              console.log('   ⚠️  Маленький файл (возможно баннер?)')
            } else {
              console.log('   ✅ Размер OK (реальное фото)')
            }
          } catch (sizeError) {
            console.log('   ⚠️  Не удалось проверить размер')
          }
        } else {
          console.log('   ⚠️  ВНИМАНИЕ: Изображение НЕ в Storage')
        }
      } else {
        console.log('   ❌ ВНИМАНИЕ: Изображения не найдены!')
      }

      successCount++
      results.push({
        name: product.name,
        status: 'success',
        newId: result.product?.id,
        imagesCount: result.product?.images?.length || 0
      })

      // Пауза между импортами
      if (i < productsToReimport.length - 1) {
        console.log('\n⏸️  Пауза 3 секунды...')
        await sleep(3000)
      }

    } catch (error) {
      console.error('\n❌ ОШИБКА:', error.message)
      failCount++
      results.push({
        name: product.name,
        status: 'failed',
        error: error.message
      })
    }
  }

  // Итоговый отчет
  console.log('\n\n' + '═'.repeat(80))
  console.log('📊 ИТОГОВЫЙ ОТЧЕТ')
  console.log('═'.repeat(80))
  console.log(`✅ Успешно: ${successCount}`)
  console.log(`❌ Ошибки: ${failCount}`)
  console.log(`📦 Всего: ${productsToReimport.length}`)

  console.log('\n📋 Детальные результаты:\n')
  results.forEach((r, i) => {
    const icon = r.status === 'success' ? '✅' : '❌'
    console.log(`${icon} ${i + 1}. ${r.name}`)
    if (r.status === 'success') {
      console.log(`      Новый ID: ${r.newId}`)
      console.log(`      Изображений: ${r.imagesCount}`)
    } else {
      console.log(`      Ошибка: ${r.error}`)
    }
  })

  console.log('\n' + '═'.repeat(80))
  if (successCount === productsToReimport.length) {
    console.log('🎉 ВСЕ ТОВАРЫ УСПЕШНО ИМПОРТИРОВАНЫ!')
  } else {
    console.log(`⚠️  Импортировано ${successCount} из ${productsToReimport.length}`)
  }
  console.log('═'.repeat(80))
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

console.log('⚠️  ВАЖНО: Убедитесь что dev сервер запущен (npm run dev)\n')

reimportProducts().catch(console.error)
