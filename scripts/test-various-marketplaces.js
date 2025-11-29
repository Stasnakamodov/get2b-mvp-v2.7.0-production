/**
 * Тестовый скрипт для сбора каталога с различных маркетплейсов
 *
 * Тестируем:
 * - DNS Shop (Россия) - техника
 * - МВидео (Россия) - техника
 * - Яндекс.Маркет (уже работал)
 * - Citilink (Россия) - техника
 *
 * Запуск: SCRAPER_API_KEY=xxx node scripts/test-various-marketplaces.js
 */

const cheerio = require('cheerio')

// Разные маркетплейсы с техникой
const testProducts = [
  {
    name: 'DNS Shop - Смартфон',
    url: 'https://www.dns-shop.ru/product/6a1ebdbfb4e63332/65-smartfon-apple-iphone-15-128-gb-rozovyj/',
    marketplace: 'dns',
    expectedCategory: 'Электроника'
  },
  {
    name: 'Citilink - Ноутбук',
    url: 'https://www.citilink.ru/product/noutbuk-lenovo-ideapad-3-15iau7-15-6-ips-intel-core-i3-1215u-2-1-1818903/',
    marketplace: 'citilink',
    expectedCategory: 'Электроника'
  },
  {
    name: 'МВидео - Наушники',
    url: 'https://www.mvideo.ru/products/naushniki-apple-airpods-pro-2nd-generation-usb-c-belye-mqd83-400203479',
    marketplace: 'mvideo',
    expectedCategory: 'Электроника'
  }
]

async function testVariousMarketplaces() {
  console.log('🧪 ТЕСТ: Сбор каталога с различных маркетплейсов\n')
  console.log('📦 Количество товаров для парсинга:', testProducts.length)
  console.log('🌐 Маркетплейсы: DNS Shop, Citilink, МВидео')
  console.log('')

  const apiKey = process.env.SCRAPER_API_KEY

  if (!apiKey) {
    console.error('❌ ОШИБКА: SCRAPER_API_KEY не найден')
    process.exit(1)
  }

  console.log('✅ API ключ найден:', apiKey.substring(0, 12) + '...\n')

  let totalCreditsUsed = 0
  let successCount = 0
  let failCount = 0
  const parsedProducts = []

  for (let i = 0; i < testProducts.length; i++) {
    const test = testProducts[i]
    console.log(`\n${'='.repeat(70)}`)
    console.log(`📦 ТОВАР ${i + 1}/${testProducts.length}: ${test.name}`)
    console.log(`🔗 URL: ${test.url}`)
    console.log(`${'='.repeat(70)}\n`)

    try {
      console.log('⏳ Шаг 1/3: Парсинг через ScraperAPI...')

      // Для российских сайтов используем RU IP
      const params = new URLSearchParams({
        api_key: apiKey,
        url: test.url,
        render: 'true',
        country_code: 'ru'
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

      // Кредиты: JS (5) + RU geo (10) = 15
      const creditsUsed = 15
      totalCreditsUsed += creditsUsed
      console.log('💰 Использовано кредитов:', creditsUsed)

      console.log('\n⏳ Шаг 2/3: Парсинг HTML...')

      const $ = cheerio.load(html)

      // Универсальные селекторы для разных сайтов
      const title = $('h1').first().text().trim() ||
                   $('meta[property="og:title"]').attr('content') ||
                   $('title').text().trim()

      const description = $('meta[property="og:description"]').attr('content') ||
                         $('meta[name="description"]').attr('content') ||
                         $('.product-card-description').first().text().trim() ||
                         ''

      const priceText = $('.product-buy__price').first().text().trim() ||
                       $('[data-qa="product-price"]').first().text().trim() ||
                       $('.product-price').first().text().trim() ||
                       $('meta[property="og:price:amount"]').attr('content') ||
                       ''

      const imageUrl = $('meta[property="og:image"]').attr('content') ||
                      $('.product-images-slider img').first().attr('src') ||
                      ''

      console.log('📄 ИЗВЛЕЧЕННЫЕ ДАННЫЕ:')
      console.log('  Заголовок:', title?.substring(0, 80) || 'не найден')
      console.log('  Описание:', description?.substring(0, 100) || 'не найдено')
      console.log('  Цена:', priceText || 'не найдена')
      console.log('  Картинка:', imageUrl ? 'есть' : 'нет')

      if (!title || title.length < 5) {
        console.log('⚠️ СТАТУС: Мало данных, пропускаем')
        failCount++
        continue
      }

      console.log('\n⏳ Шаг 3/3: Анализ товара...')

      const analysis = analyzeProduct(title, description)

      console.log('🎯 АНАЛИЗ:')
      console.log('  Бренд:', analysis.brand || 'не определен')
      console.log('  Категория:', analysis.category || 'не определена')
      console.log('  Ключевые слова:', analysis.keywords.slice(0, 5).join(', '))

      parsedProducts.push({
        name: test.name,
        title: title,
        description: description.substring(0, 200),
        price: priceText,
        imageUrl: imageUrl,
        brand: analysis.brand,
        category: analysis.category,
        keywords: analysis.keywords,
        marketplace: test.marketplace,
        originalUrl: test.url
      })

      console.log('\n✅ СТАТУС: УСПЕШНО РАСПАРСЕНО')
      successCount++

    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
      failCount++
    }

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
  const remaining = 4915 - totalCreditsUsed
  console.log(`  ${remaining} кредитов`)
  console.log(`  ~${Math.floor(remaining / 15)} запросов`)
  console.log('')

  if (successCount > 0) {
    console.log('📦 СОБРАННЫЕ ТОВАРЫ:\n')
    parsedProducts.forEach((product, idx) => {
      console.log(`${idx + 1}. ${product.title}`)
      console.log(`   Маркетплейс: ${product.marketplace}`)
      console.log(`   Категория: ${product.category || 'не определена'}`)
      console.log(`   Бренд: ${product.brand || 'не определен'}`)
      console.log(`   Цена: ${product.price || 'не найдена'}`)
      console.log(`   Ключевые слова: ${product.keywords.slice(0, 3).join(', ')}`)
      console.log('')
    })

    console.log('✅ КАТАЛОГ УСПЕШНО СОБРАН!')
    console.log('')
    console.log('💡 Выводы:')
    console.log(`  - Российские маркетплейсы работают лучше AliExpress`)
    console.log(`  - Успешность: ${((successCount / testProducts.length) * 100).toFixed(0)}%`)
    console.log(`  - Средняя стоимость товара: ${(totalCreditsUsed / successCount).toFixed(1)} кредитов`)
    console.log('')
  }

  return parsedProducts
}

function analyzeProduct(title, description) {
  const text = (title + ' ' + description).toLowerCase()
  const words = title.split(/\s+/)
  const capitalizedWords = words.filter(w => /^[A-ZА-Я][a-zа-я]+/.test(w))
  const brand = capitalizedWords.find(w =>
    ['Apple', 'Samsung', 'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'Xiaomi', 'Huawei', 'Sony', 'LG'].includes(w)
  ) || capitalizedWords[0] || null

  let category = 'Электроника'
  if (text.includes('iphone') || text.includes('смартфон') || text.includes('phone')) {
    category = 'Электроника - Смартфоны'
  } else if (text.includes('ноутбук') || text.includes('laptop') || text.includes('notebook')) {
    category = 'Электроника - Ноутбуки'
  } else if (text.includes('наушник') || text.includes('airpods') || text.includes('headphone')) {
    category = 'Электроника - Наушники'
  }

  const titleWords = title.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3)
    .filter(w => !['для', 'with', 'from', 'this'].includes(w))

  const keywords = [...new Set([...titleWords, brand].filter(Boolean))]

  return { brand, category, keywords: keywords.slice(0, 10) }
}

testVariousMarketplaces()
  .then((products) => {
    console.log(`✅ Тест завершен. Собрано ${products.length} товаров\n`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Фатальная ошибка:', error)
    process.exit(1)
  })
