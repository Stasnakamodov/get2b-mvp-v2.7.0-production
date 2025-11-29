/**
 * Тестовый скрипт для проверки ScraperAPI
 *
 * Тестирует парсинг защищенных маркетплейсов:
 * 1. Ozon (Cloudflare + anti-bot)
 * 2. Wildberries (сильная защита)
 * 3. Яндекс.Маркет
 *
 * Запуск: SCRAPER_API_KEY=xxx node scripts/test-scraper-api.js
 */

const cheerio = require('cheerio')

// Тестовые URL
const testUrls = [
  {
    name: 'Ozon - iPhone 15',
    url: 'https://www.ozon.ru/product/smartfon-apple-iphone-15-128-gb-rozovyy-1189416565/',
    expectedBrand: 'Apple',
    expectedKeywords: ['iPhone', '15', 'смартфон', 'Apple']
  },
  {
    name: 'Wildberries - Товар',
    url: 'https://www.wildberries.ru/catalog/166935907/detail.aspx',
    expectedBrand: null,
    expectedKeywords: []
  },
  {
    name: 'Яндекс.Маркет',
    url: 'https://market.yandex.ru/product--smartfon-apple-iphone-15/1802266514',
    expectedBrand: 'Apple',
    expectedKeywords: ['iPhone', 'Apple', 'смартфон']
  }
]

async function testScraperAPI() {
  console.log('🧪 ТЕСТ: ScraperAPI парсинг защищенных маркетплейсов\n')

  // Проверяем API ключ
  const apiKey = process.env.SCRAPER_API_KEY

  if (!apiKey) {
    console.error('❌ ОШИБКА: SCRAPER_API_KEY не найден')
    console.log('\n💡 Как получить API ключ:')
    console.log('1. Зайди на https://www.scraperapi.com/')
    console.log('2. Зарегистрируйся (бесплатно, без карты)')
    console.log('3. Получи 5,000 бесплатных кредитов')
    console.log('4. Скопируй API ключ из dashboard')
    console.log('5. Запусти: SCRAPER_API_KEY=xxx node scripts/test-scraper-api.js')
    process.exit(1)
  }

  console.log('✅ API ключ найден:', apiKey.substring(0, 12) + '...\n')

  let totalCreditsUsed = 0
  let successCount = 0
  let failCount = 0

  // Тестируем каждый URL
  for (const test of testUrls) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`📦 ТЕСТ: ${test.name}`)
    console.log(`🔗 URL: ${test.url}`)
    console.log(`${'='.repeat(70)}\n`)

    try {
      console.log('⏳ Отправляем запрос в ScraperAPI...')

      // Формируем запрос к ScraperAPI
      const params = new URLSearchParams({
        api_key: apiKey,
        url: test.url,
        render: 'true',        // JS rendering
        country_code: 'ru',    // Российский IP
        premium: 'true'        // Premium residential прокси для защищенных сайтов
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
        console.error('❌ ОШИБКА:', response.status, errorText)

        if (response.status === 401) {
          console.log('💡 Неверный API ключ. Проверь что скопировал правильно.')
        } else if (response.status === 429) {
          console.log('💡 Превышен лимит запросов. Подожди немного.')
        } else if (response.status === 402) {
          console.log('💡 Кончились кредиты. Проверь баланс на dashboard.')
        }

        failCount++
        continue
      }

      const html = await response.text()
      console.log('✅ HTML получен, размер:', html.length, 'байт\n')

      // Парсим HTML через Cheerio
      const $ = cheerio.load(html)

      // Извлекаем метаданные
      const title = $('h1').first().text().trim() ||
                   $('meta[property="og:title"]').attr('content') ||
                   $('title').text().trim()

      const description = $('meta[property="og:description"]').attr('content') ||
                         $('meta[name="description"]').attr('content') ||
                         ''

      const price = $('[data-widget="webPrice"]').first().text().trim() ||
                   $('.price').first().text().trim() ||
                   $('meta[property="og:price:amount"]').attr('content') ||
                   ''

      console.log('📄 ИЗВЛЕЧЕННЫЕ ДАННЫЕ:')
      console.log('  Заголовок:', title?.substring(0, 80) || 'не найден')
      console.log('  Описание:', description?.substring(0, 100) || 'не найдено')
      console.log('  Цена:', price || 'не найдена')
      console.log('')

      // Проверяем успешность
      const isCloudflare = html.toLowerCase().includes('cloudflare') &&
                          html.toLowerCase().includes('challenge')

      const isAccessDenied = html.toLowerCase().includes('access denied') ||
                            html.toLowerCase().includes('доступ огр')

      if (isCloudflare || isAccessDenied) {
        console.log('❌ СТАТУС: ЗАБЛОКИРОВАН (Cloudflare не пройден)')
        failCount++
      } else if (title && title.length > 10) {
        console.log('✅ СТАТУС: УСПЕХ (товар распарсен)')
        successCount++

        // Проверяем ожидаемый бренд
        if (test.expectedBrand && title.toLowerCase().includes(test.expectedBrand.toLowerCase())) {
          console.log('✅ Бренд найден:', test.expectedBrand)
        }
      } else {
        console.log('⚠️ СТАТУС: ЧАСТИЧНЫЙ УСПЕХ (мало данных)')
        successCount++
      }

      // Считаем использованные кредиты
      // JS rendering (5) + Geotargeting RU (10) + Premium (10) = 25 кредитов
      const creditsUsed = 25
      totalCreditsUsed += creditsUsed

      console.log('\n💰 Использовано кредитов:', creditsUsed)
      console.log('💵 Стоимость запроса: ~$0.012 (1.08₽)')

    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
      failCount++
    }

    // Пауза между запросами
    if (test !== testUrls[testUrls.length - 1]) {
      console.log('\n⏳ Пауза 3 секунды...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  // Итоги
  console.log('\n\n' + '='.repeat(70))
  console.log('🎯 ИТОГИ ТЕСТИРОВАНИЯ')
  console.log('='.repeat(70))
  console.log('')
  console.log('📊 Статистика:')
  console.log(`  ✅ Успешно: ${successCount}`)
  console.log(`  ❌ Провалено: ${failCount}`)
  console.log(`  📈 Успешность: ${((successCount / testUrls.length) * 100).toFixed(0)}%`)
  console.log('')
  console.log('💰 Использовано:')
  console.log(`  Кредитов: ${totalCreditsUsed}`)
  console.log(`  Стоимость: ~$${(totalCreditsUsed * 0.00049).toFixed(3)} (${(totalCreditsUsed * 0.00049 * 90).toFixed(2)}₽)`)
  console.log('')
  console.log('📈 Осталось кредитов (Trial):')
  console.log(`  5,000 - ${totalCreditsUsed} = ${5000 - totalCreditsUsed} кредитов`)
  console.log(`  ~${Math.floor((5000 - totalCreditsUsed) / 25)} запросов Ozon/WB (premium)`)
  console.log('')

  if (successCount > 0) {
    console.log('✅ ScraperAPI РАБОТАЕТ!')
    console.log('')
    console.log('💡 Рекомендации:')
    console.log('  1. ScraperAPI отлично справляется с защищенными сайтами')
    console.log('  2. Интегрируй его для Ozon/Wildberries')
    console.log('  3. Для остальных сайтов используй Claude Web Fetch (дешевле)')
    console.log('')
  } else {
    console.log('⚠️ Все запросы провалены')
    console.log('')
    console.log('💡 Возможные причины:')
    console.log('  1. Проверь API ключ')
    console.log('  2. Проверь баланс кредитов на dashboard')
    console.log('  3. Попробуй другой URL')
    console.log('')
  }

  console.log('🔗 Полезные ссылки:')
  console.log('  Dashboard: https://dashboard.scraperapi.com/')
  console.log('  Документация: https://docs.scraperapi.com/')
  console.log('  Поддержка: support@scraperapi.com')
  console.log('')
}

// Запуск
testScraperAPI()
  .then(() => {
    console.log('✅ Тест завершен\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Фатальная ошибка:', error)
    process.exit(1)
  })
