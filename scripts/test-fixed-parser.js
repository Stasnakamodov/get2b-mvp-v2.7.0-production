#!/usr/bin/env node

/**
 * Тест исправленного парсера на Wildberries товаре
 */

const API_ENDPOINT = 'http://localhost:3000/api/catalog/products/import-from-url'

// Тестовый товар Wildberries (один из проблемных)
const testProduct = {
  url: 'https://www.wildberries.ru/catalog/39656207/detail.aspx',
  name: 'Samsung Galaxy S23' //  один из 9 с баннером
}

async function testParser() {
  console.log('🧪 ТЕСТ ИСПРАВЛЕННОГО ПАРСЕРА\n')
  console.log(`📦 Товар: ${testProduct.name}`)
  console.log(`🔗 URL: ${testProduct.url}\n`)

  try {
    console.log('⏳ Отправляем запрос на импорт...\n')

    const startTime = Date.now()

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: {
          title: testProduct.name,
          description: '',
          imageUrl: '', // Парсер сам найдет
          price: '',
          currency: 'RUB',
          marketplace: 'wildberries',
          originalUrl: testProduct.url
        },
        analysis: {
          brand: 'Samsung',
          category: 'ТЕСТОВАЯ_ПАРСЕР_ФИКС',
          keywords: ['Samsung', 'Galaxy', 'S23']
        }
      })
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()

    console.log(`\n✅ Импорт завершен за ${duration}с\n`)

    console.log('📊 РЕЗУЛЬТАТ:\n')
    console.log(`ID товара: ${result.product?.id}`)
    console.log(`Название: ${result.product?.name}`)
    console.log(`Изображения: ${result.product?.images?.length || 0}`)

    if (result.product?.images && result.product.images.length > 0) {
      const imageUrl = result.product.images[0]
      console.log(`\nПервое изображение: ${imageUrl}`)

      // Проверяем что это НЕ баннер
      if (imageUrl.includes('supabase.co/storage')) {
        console.log('\n✅ УСПЕХ! Изображение загружено в Storage')

        // Скачиваем и проверяем размеры
        console.log('\n🔍 Проверка размеров изображения...')
        const imgResponse = await fetch(imageUrl, { method: 'HEAD' })
        const contentLength = imgResponse.headers.get('content-length')
        const contentType = imgResponse.headers.get('content-type')

        console.log(`   Размер файла: ${(parseInt(contentLength) / 1024).toFixed(2)} KB`)
        console.log(`   Тип: ${contentType}`)

        if (parseInt(contentLength) < 30000) {
          console.log('\n❌ ОШИБКА! Это все еще баннер (< 30 KB)')
        } else {
          console.log('\n🎉 ВСЕ ХОРОШО! Это реальное изображение товара!')
        }

      } else {
        console.log('\n⚠️  ВНИМАНИЕ! Изображение НЕ в Storage (внешняя ссылка)')
        console.log('   Это может означать что парсер не смог найти изображение в галерее')
      }
    } else {
      console.log('\n❌ ОШИБКА! Изображения не найдены')
    }

    console.log('\n' + '═'.repeat(80))
    console.log('Полный ответ API:')
    console.log(JSON.stringify(result, null, 2))

  } catch (error) {
    console.error('\n❌ ОШИБКА ТЕСТА:', error.message)
    process.exit(1)
  }
}

console.log('⚠️  ВАЖНО: Убедитесь что dev сервер запущен (npm run dev)\n')

testParser()
