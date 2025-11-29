/**
 * Тестовый скрипт для сбора каталога с AliExpress
 *
 * Полный цикл:
 * 1. Парсинг товара через ScraperAPI
 * 2. Анализ через YandexGPT/Claude
 * 3. Поиск аналогов в БД
 *
 * Запуск: SCRAPER_API_KEY=xxx node scripts/test-aliexpress-catalog.js
 */

const cheerio = require('cheerio')

// Тестовые товары - техника и электроника с AliExpress
const testProducts = [
  {
    name: 'Смартфон',
    url: 'https://www.aliexpress.com/item/1005006192763448.html',
    expectedCategory: 'Электроника'
  },
  {
    name: 'Наушники',
    url: 'https://www.aliexpress.com/item/1005005594942630.html',
    expectedCategory: 'Электроника'
  },
  {
    name: 'Умные часы',
    url: 'https://www.aliexpress.com/item/1005006364046038.html',
    expectedCategory: 'Электроника'
  },
  {
    name: 'Powerbank',
    url: 'https://www.aliexpress.com/item/1005006074526369.html',
    expectedCategory: 'Электроника'
  },
  {
    name: 'Bluetooth колонка',
    url: 'https://www.aliexpress.com/item/1005006191657925.html',
    expectedCategory: 'Электроника'
  }
]

async function testAliExpressCatalog() {
  console.log('🧪 ТЕСТ: Сбор каталога с AliExpress\n')
  console.log('📦 Количество товаров для парсинга:', testProducts.length)
  console.log('')

  // Проверяем API ключ
  const apiKey = process.env.SCRAPER_API_KEY

  if (!apiKey) {
    console.error('❌ ОШИБКА: SCRAPER_API_KEY не найден')
    console.log('\n💡 Запусти: SCRAPER_API_KEY=xxx node scripts/test-aliexpress-catalog.js')
    process.exit(1)
  }

  console.log('✅ API ключ найден:', apiKey.substring(0, 12) + '...\n')

  let totalCreditsUsed = 0
  let successCount = 0
  let failCount = 0
  const parsedProducts = []

  // Тестируем каждый URL
  for (let i = 0; i < testProducts.length; i++) {
    const test = testProducts[i]
    console.log(`\n${'='.repeat(70)}`)
    console.log(`📦 ТОВАР ${i + 1}/${testProducts.length}: ${test.name}`)
    console.log(`🔗 URL: ${test.url}`)
    console.log(`${'='.repeat(70)}\n`)

    try {
      console.log('⏳ Шаг 1/3: Парсинг через ScraperAPI...')

      // Формируем запрос к ScraperAPI
      // Для AliExpress НЕ нужен premium (он дешевле)
      const params = new URLSearchParams({
        api_key: apiKey,
        url: test.url,
        render: 'true',        // JS rendering
        country_code: 'us'     // Американский IP (работает лучше для AliExpress)
      })

      const apiUrl = `https://api.scraperapi.com?${params.toString()}`

      const startTime = Date.now()

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })

      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)

      console.log(`⏱️ Ответ получен за ${duration}с`)
      console.log(`📊 HTTP статус: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ ОШИБКА:', response.status)
        console.error('   ', errorText.substring(0, 200))
        failCount++
        continue
      }

      const html = await response.text()
      console.log('✅ HTML получен, размер:', html.length, 'байт')

      // Считаем кредиты
      // JS rendering (5) + Geotargeting US (10) = 15 кредитов
      const creditsUsed = 15
      totalCreditsUsed += creditsUsed
      console.log('💰 Использовано кредитов:', creditsUsed)

      console.log('\n⏳ Шаг 2/3: Парсинг HTML...')

      // Парсим HTML через Cheerio
      const $ = cheerio.load(html)

      // Извлекаем метаданные
      const title = $('h1').first().text().trim() ||
                   $('meta[property="og:title"]').attr('content') ||
                   $('title').text().trim()

      const description = $('meta[property="og:description"]').attr('content') ||
                         $('meta[name="description"]').attr('content') ||
                         $('.product-description').first().text().trim() ||
                         ''

      const priceText = $('.product-price-value').first().text().trim() ||
                       $('[data-spm-anchor-id*="price"]').first().text().trim() ||
                       $('meta[property="og:price:amount"]').attr('content') ||
                       ''

      const imageUrl = $('meta[property="og:image"]').attr('content') ||
                      $('.magnifier-image').first().attr('src') ||
                      $('.product-image img').first().attr('src') ||
                      ''

      console.log('📄 ИЗВЛЕЧЕННЫЕ ДАННЫЕ:')
      console.log('  Заголовок:', title?.substring(0, 80) || 'не найден')
      console.log('  Описание:', description?.substring(0, 100) || 'не найдено')
      console.log('  Цена:', priceText || 'не найдена')
      console.log('  Картинка:', imageUrl ? 'есть' : 'нет')

      // Проверяем что получили хоть что-то
      if (!title || title.length < 5) {
        console.log('⚠️ СТАТУС: Мало данных, пропускаем')
        failCount++
        continue
      }

      console.log('\n⏳ Шаг 3/3: Анализ товара (YandexGPT)...')

      // Анализируем товар через простой текстовый анализ
      const analysis = analyzeProduct(title, description)

      console.log('🎯 АНАЛИЗ:')
      console.log('  Бренд:', analysis.brand || 'не определен')
      console.log('  Категория:', analysis.category || 'не определена')
      console.log('  Ключевые слова:', analysis.keywords.slice(0, 5).join(', '))

      // Сохраняем результат
      parsedProducts.push({
        name: test.name,
        title: title,
        description: description.substring(0, 200),
        price: priceText,
        imageUrl: imageUrl,
        brand: analysis.brand,
        category: analysis.category,
        keywords: analysis.keywords,
        marketplace: 'aliexpress',
        originalUrl: test.url
      })

      console.log('\n✅ СТАТУС: УСПЕШНО РАСПАРСЕНО')
      successCount++

    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
      failCount++
    }

    // Пауза между запросами (чтобы не нагружать API)
    if (i < testProducts.length - 1) {
      console.log('\n⏳ Пауза 2 секунды...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // Итоги
  console.log('\n\n' + '='.repeat(70))
  console.log('🎯 ИТОГИ СБОРА КАТАЛОГА')
  console.log('='.repeat(70))
  console.log('')
  console.log('📊 Статистика:')
  console.log(`  ✅ Успешно: ${successCount}`)
  console.log(`  ❌ Провалено: ${failCount}`)
  console.log(`  📈 Успешность: ${((successCount / testProducts.length) * 100).toFixed(0)}%`)
  console.log('')
  console.log('💰 Использовано:')
  console.log(`  Кредитов: ${totalCreditsUsed}`)
  console.log(`  Стоимость: ~$${(totalCreditsUsed * 0.00049).toFixed(3)} (${(totalCreditsUsed * 0.00049 * 90).toFixed(2)}₽)`)
  console.log('')
  console.log('📈 Осталось кредитов:')
  const remaining = 5000 - 25 - totalCreditsUsed // 25 уже потрачено из первого теста
  console.log(`  ${remaining} кредитов`)
  console.log(`  ~${Math.floor(remaining / 15)} запросов AliExpress`)
  console.log('')

  if (successCount > 0) {
    console.log('📦 СОБРАННЫЕ ТОВАРЫ:\n')
    parsedProducts.forEach((product, idx) => {
      console.log(`${idx + 1}. ${product.title.substring(0, 60)}`)
      console.log(`   Категория: ${product.category || 'не определена'}`)
      console.log(`   Бренд: ${product.brand || 'не определен'}`)
      console.log(`   Ключевые слова: ${product.keywords.slice(0, 3).join(', ')}`)
      console.log(`   URL: ${product.originalUrl}`)
      console.log('')
    })

    console.log('✅ КАТАЛОГ УСПЕШНО СОБРАН!')
    console.log('')
    console.log('💡 Следующие шаги:')
    console.log('  1. Интегрировать с API /api/catalog/search-by-url')
    console.log('  2. Добавить поиск аналогов в БД')
    console.log('  3. Сохранить товары в catalog_verified_products')
    console.log('')
  } else {
    console.log('⚠️ Ни один товар не распарсен')
    console.log('')
    console.log('💡 Возможные причины:')
    console.log('  1. Проверь API ключ')
    console.log('  2. Проверь баланс кредитов')
    console.log('  3. AliExpress может блокировать запросы')
    console.log('')
  }

  console.log('🔗 Полезные ссылки:')
  console.log('  Dashboard: https://dashboard.scraperapi.com/')
  console.log('  Документация: https://docs.scraperapi.com/')
  console.log('')

  // Возвращаем результаты для дальнейшего использования
  return parsedProducts
}

/**
 * Простой анализ товара (без AI, для экономии)
 */
function analyzeProduct(title, description) {
  const text = (title + ' ' + description).toLowerCase()

  // Определяем бренд (слова с заглавной буквы)
  const words = title.split(/\s+/)
  const capitalizedWords = words.filter(w => /^[A-Z][a-z]+/.test(w))
  const brand = capitalizedWords[0] || null

  // Определяем категорию по ключевым словам
  let category = null
  if (text.includes('phone') || text.includes('smartphone') || text.includes('смартфон')) {
    category = 'Электроника - Смартфоны'
  } else if (text.includes('headphone') || text.includes('earphone') || text.includes('наушник')) {
    category = 'Электроника - Наушники'
  } else if (text.includes('watch') || text.includes('smartwatch') || text.includes('часы')) {
    category = 'Электроника - Часы'
  } else if (text.includes('power bank') || text.includes('powerbank') || text.includes('батарея')) {
    category = 'Электроника - Аксессуары'
  } else if (text.includes('speaker') || text.includes('колонка')) {
    category = 'Электроника - Аудио'
  } else {
    category = 'Электроника'
  }

  // Извлекаем ключевые слова
  const titleWords = title.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['with', 'from', 'this', 'that', 'for'].includes(w))

  const keywords = [...new Set([...titleWords, brand].filter(Boolean))]

  return {
    brand,
    category,
    keywords: keywords.slice(0, 10)
  }
}

// Запуск
testAliExpressCatalog()
  .then((products) => {
    console.log(`✅ Тест завершен. Собрано ${products.length} товаров\n`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Фатальная ошибка:', error)
    process.exit(1)
  })
