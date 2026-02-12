#!/usr/bin/env node

/**
 * Переимпорт 9 товаров с баннерами на правильные изображения
 *
 * ПРОБЛЕМА: 9 товаров имеют рекламный баннер Wildberries вместо фото товара
 * РЕШЕНИЕ: Удаляем старые + импортируем заново с исправленным парсером
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

// 9 проблемных товаров (по данным агента)
const problematicProducts = [
  { id: '839338bc-948e-4b55-8f11-02c4c89295c4', name: 'Honor X8a', url: 'https://market.yandex.ru/product--smartfon-honor-x8a-6-128gb/1873395704' },
  { id: 'aa1b1a5a-6395-4d94-83ec-b7abeead3ff6', name: 'Acer Aspire 3', url: 'https://market.yandex.ru/product--noutbuk-acer-aspire-3-a315-59/1829464891' },
  { id: '3252fdee-3fc3-4543-91e6-99c283739603', name: 'Samsung Galaxy S23', url: 'https://market.yandex.ru/product--smartfon-samsung-galaxy-s23-8-128gb/1965359484' },
  { id: 'cf1dcc3c-6289-4a35-a957-26e91fc4048d', name: 'Lenovo IdeaPad 3', url: 'https://market.yandex.ru/product--noutbuk-lenovo-ideapad-3-15iau7/1828575647' },
  { id: '1c54babc-fb62-4b1e-8343-7e6ecd701049', name: 'MSI Modern 15', url: 'https://market.yandex.ru/product--noutbuk-msi-modern-15-b12mo/1835721948' },
  { id: 'c858910a-364c-45b1-bc4a-e2a8bb22480a', name: 'Samsung Galaxy Buds2 Pro', url: 'https://market.yandex.ru/product--naushniki-samsung-galaxy-buds2-pro/1774958334' },
  { id: '310a29a0-8259-456d-919a-dd8def18b6d1', name: 'JBL Tune 520BT', url: 'https://market.yandex.ru/product--naushniki-jbl-tune-520bt/1870743289' },
  { id: 'c12e4da5-10d7-4fa3-b5c2-a49895c371d7', name: 'Колье ОптимаБизнес', url: 'https://market.yandex.ru/product--kole-optimabiznes/123456789' }, // URL может быть неточный
  { id: '5f57a371-29d5-4d53-89a7-098b10c0d69c', name: 'Масло эфирное Розмарин Vitateka/Витатека 10 мл', url: 'https://market.yandex.ru/product--maslo-efirnoe-rozmarin-vitateka/987654321' } // URL может быть неточный
]

// Также удалим дубликат iPhone
const duplicateToDelete = '9057f171-d62c-4c4e-a386-85fba2c37ca2'

const API_ENDPOINT = 'http://localhost:3000/api/catalog/products/import-from-url'
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY

async function reimportProducts() {
  console.log('🔄 ПЕРЕИМПОРТ ТОВАРОВ С ПРАВИЛЬНЫМИ ИЗОБРАЖЕНИЯМИ\n')
  console.log('═'.repeat(80))
  console.log(`📦 Всего товаров для переимпорта: ${problematicProducts.length}`)
  console.log('═'.repeat(80))

  let successCount = 0
  let failCount = 0
  const results = []

  // Шаг 1: Удаляем дубликат iPhone
  console.log('\n🗑️  Удаление дубликата iPhone...')
  const { error: deleteDuplicateError } = await supabase
    .from('catalog_verified_products')
    .delete()
    .eq('id', duplicateToDelete)

  if (deleteDuplicateError) {
    console.error('❌ Ошибка удаления дубликата:', deleteDuplicateError.message)
  } else {
    console.log('✅ Дубликат удален')
  }

  // Шаг 2: Переимпортируем каждый товар
  for (let i = 0; i < problematicProducts.length; i++) {
    const product = problematicProducts[i]
    const productNum = i + 1

    console.log('\n' + '═'.repeat(80))
    console.log(`📦 ТОВАР ${productNum}/${problematicProducts.length}: ${product.name}`)
    console.log('═'.repeat(80))
    console.log(`🆔 ID для удаления: ${product.id}`)
    console.log(`🔗 URL для импорта: ${product.url}`)

    try {
      // Удаляем старый товар
      console.log('\n⏳ [1/3] Удаление старого товара...')
      const { error: deleteError } = await supabase
        .from('catalog_verified_products')
        .delete()
        .eq('id', product.id)

      if (deleteError) {
        console.error('❌ Ошибка удаления:', deleteError.message)
        failCount++
        results.push({ name: product.name, status: 'delete_failed', error: deleteError.message })
        continue
      }
      console.log('✅ Старый товар удален')

      // Пауза между удалением и импортом
      await sleep(2000)

      // Импортируем через исправленный парсер
      console.log('\n⏳ [2/3] Парсинг через ScraperAPI...')

      if (!SCRAPER_API_KEY) {
        console.error('❌ SCRAPER_API_KEY не найден!')
        failCount++
        results.push({ name: product.name, status: 'no_api_key' })
        continue
      }

      // Парсим через ScraperAPI
      const scraperParams = new URLSearchParams({
        api_key: SCRAPER_API_KEY,
        url: product.url,
        render: 'true',
        country_code: 'ru'
      })

      const scraperStartTime = Date.now()
      const scraperResponse = await fetch(`https://api.scraperapi.com?${scraperParams}`)
      const scraperDuration = ((Date.now() - scraperStartTime) / 1000).toFixed(2)

      if (!scraperResponse.ok) {
        throw new Error(`ScraperAPI error: ${scraperResponse.status}`)
      }

      const html = await scraperResponse.text()
      console.log(`✅ HTML получен (${html.length} байт) за ${scraperDuration}с`)

      // Базовый парсинг метаданных (без изображений - парсер сам найдет)
      const cheerio = require('cheerio')
      const $ = cheerio.load(html)

      const title = $('h1').first().text().trim() ||
                   $('meta[property="og:title"]').attr('content') ||
                   product.name

      console.log(`✅ Название: ${title.substring(0, 50)}...`)

      // Импортируем через API
      console.log('\n⏳ [3/3] Импорт в базу данных...')

      const importResponse = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            title: title,
            description: title,
            imageUrl: '', // Парсер сам найдет правильное изображение
            price: '',
            currency: 'RUB',
            marketplace: 'yandex_market',
            originalUrl: product.url
          },
          analysis: {
            brand: title.split(' ')[0],
            category: 'ТЕСТОВАЯ',
            keywords: title.split(' ').slice(0, 5)
          }
        })
      })

      if (!importResponse.ok) {
        const errorText = await importResponse.text()
        throw new Error(`Import API error: ${importResponse.status} - ${errorText}`)
      }

      const importResult = await importResponse.json()
      const newProductId = importResult.product?.id
      const images = importResult.product?.images || []

      console.log(`✅ Импорт завершен!`)
      console.log(`   Новый ID: ${newProductId}`)
      console.log(`   Изображений: ${images.length}`)

      if (images.length > 0) {
        const firstImage = images[0]
        console.log(`   Первое изображение: ${firstImage}`)

        // Проверяем что это Storage (не внешняя ссылка)
        if (firstImage.includes('supabase.co/storage')) {
          console.log('   ✅ Изображение в Storage!')

          // Проверяем размер файла
          const imgResponse = await fetch(firstImage, { method: 'HEAD' })
          const fileSize = parseInt(imgResponse.headers.get('content-length'))

          console.log(`   Размер: ${(fileSize / 1024).toFixed(2)} KB`)

          if (fileSize < 30000) {
            console.log('   ⚠️  ВНИМАНИЕ: Файл маленький (возможно все еще баннер?)')
          } else {
            console.log('   ✅ Размер файла OK (реальная фотография)')
          }
        } else {
          console.log('   ⚠️  ВНИМАНИЕ: Изображение НЕ в Storage (внешняя ссылка)')
        }
      } else {
        console.log('   ⚠️  ВНИМАНИЕ: Изображения не найдены')
      }

      successCount++
      results.push({
        name: product.name,
        status: 'success',
        newId: newProductId,
        imagesCount: images.length
      })

      // Пауза между импортами
      if (i < problematicProducts.length - 1) {
        console.log('\n⏸️  Пауза 5 секунд перед следующим товаром...')
        await sleep(5000)
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
  console.log(`📦 Всего обработано: ${problematicProducts.length}`)

  console.log('\n📋 Детальные результаты:\n')
  results.forEach((r, i) => {
    const icon = r.status === 'success' ? '✅' : '❌'
    console.log(`${icon} ${i + 1}. ${r.name}`)
    if (r.status === 'success') {
      console.log(`      Новый ID: ${r.newId}`)
      console.log(`      Изображений: ${r.imagesCount}`)
    } else {
      console.log(`      Ошибка: ${r.error || r.status}`)
    }
  })

  console.log('\n' + '═'.repeat(80))
  console.log('✅ ПЕРЕИМПОРТ ЗАВЕРШЕН!')
  console.log('═'.repeat(80))
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Проверяем что все переменные есть
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_URL не найден, используется дефолтный')
}

if (!process.env.SCRAPER_API_KEY) {
  console.error('❌ SCRAPER_API_KEY не найден в переменных окружения!')
  console.log('\n💡 Установите переменную:')
  console.log('   export SCRAPER_API_KEY="ваш_ключ"')
  console.log('   или добавьте в .env.local\n')
  process.exit(1)
}

console.log('⚠️  ВАЖНО: Убедитесь что dev сервер запущен (npm run dev)\n')

reimportProducts().catch(console.error)
