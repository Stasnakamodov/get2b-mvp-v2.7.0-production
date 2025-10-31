/**
 * Тестовый скрипт для проверки поиска по URL
 * Запуск: node scripts/test-url-search.js
 */

// Тестовые ссылки
const testUrls = [
  {
    name: 'ЛУКОЙЛ DOT 3 с Ozon',
    url: 'https://www.ozon.ru/product/tormoznaya-zhidkost-lukoil-dot-3-1-l-142950385/'
  },
  {
    name: 'G-Energy DOT 4 с Ozon',
    url: 'https://www.ozon.ru/product/g-energy-zhidkost-tormoznaya-expert-dot-4-0-9-l-469360934/'
  },
  {
    name: 'SINTEC DOT-4 с Ozon',
    url: 'https://www.ozon.ru/product/tormoznaya-zhidkost-sintec-super-dot-4-tk-250os-910-g-693389246/'
  }
]

async function testUrlSearch(testCase) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`🧪 Тест: ${testCase.name}`)
  console.log(`🔗 URL: ${testCase.url}`)
  console.log('='.repeat(80))

  try {
    const response = await fetch('http://localhost:3000/api/catalog/search-by-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testCase.url })
    })

    const data = await response.json()

    if (!response.ok) {
      console.log('❌ Ошибка:', data.error)
      console.log('   Детали:', data.details || 'Нет деталей')
      return false
    }

    console.log('\n✅ Успешно!')
    console.log('\n📋 Метаданные товара:')
    console.log('   Название:', data.metadata.title)
    console.log('   Описание:', data.metadata.description?.substring(0, 100) + '...')
    console.log('   Маркетплейс:', data.metadata.marketplace)

    console.log('\n🤖 Анализ YandexGPT:')
    console.log('   Бренд:', data.analysis.brand || 'не определен')
    console.log('   Категория:', data.analysis.category || 'не определена')
    console.log('   Ключевые слова:', data.analysis.keywords.slice(0, 5).join(', '))

    console.log('\n🔍 Поисковые термины:')
    console.log('  ', data.searchTerms.join(', '))

    console.log(`\n📦 Найдено товаров в каталоге: ${data.productsCount}`)

    if (data.products && data.products.length > 0) {
      console.log('\n📋 Топ-5 найденных товаров:')
      data.products.slice(0, 5).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - ${product.price} ₽`)
        console.log(`      Поставщик: ${product.supplier_name || 'не указан'}`)
      })
    } else {
      console.log('   ⚠️ Товары не найдены в каталоге')
    }

    return true
  } catch (error) {
    console.log('❌ Критическая ошибка:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Начинаем тестирование поиска по URL...')
  console.log('📍 API endpoint: http://localhost:3000/api/catalog/search-by-url\n')

  let passed = 0
  let failed = 0

  for (const testCase of testUrls) {
    const result = await testUrlSearch(testCase)
    if (result) {
      passed++
    } else {
      failed++
    }

    // Пауза между тестами
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ')
  console.log('='.repeat(80))
  console.log(`✅ Успешно: ${passed}/${testUrls.length}`)
  console.log(`❌ Ошибок: ${failed}/${testUrls.length}`)
  console.log('='.repeat(80))

  if (failed === 0) {
    console.log('\n🎉 Все тесты прошли успешно!')
  } else {
    console.log('\n⚠️ Некоторые тесты завершились с ошибками')
  }
}

// Запускаем тесты
runTests()
  .then(() => {
    console.log('\n✅ Тестирование завершено')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Критическая ошибка тестирования:', error)
    process.exit(1)
  })
