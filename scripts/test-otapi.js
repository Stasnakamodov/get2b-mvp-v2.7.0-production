/**
 * Тестовый скрипт для проверки OTAPI
 *
 * Тестирует:
 * 1. Подключение к OTAPI
 * 2. Поиск товаров на Taobao, 1688, AliExpress
 * 3. Получение детальной информации о товаре
 * 4. Получение категорий
 *
 * Запуск: OTAPI_INSTANCE_KEY=xxx node scripts/test-otapi.js
 */

const fetch = require('node-fetch')

// Конфигурация OTAPI
const OTAPI_CONFIG = {
  baseUrl: 'http://otapi.net/service-json/',
  language: 'ru',
  currency: 'RUB'
}

// Тестовые запросы
const TEST_QUERIES = [
  {
    provider: 'Taobao',
    query: 'iPhone 15',
    expectedKeywords: ['iPhone', 'Apple', 'смартфон']
  },
  {
    provider: '1688',
    query: '手机配件', // Аксессуары для телефонов
    expectedKeywords: ['аксессуар', 'телефон', 'чехол']
  },
  {
    provider: 'AliExpress',
    query: 'laptop gaming',
    expectedKeywords: ['ноутбук', 'игровой', 'laptop']
  }
]

/**
 * Тестовый класс для OTAPI
 */
class OtapiTester {
  constructor(instanceKey) {
    this.instanceKey = instanceKey
  }

  /**
   * Проверка подключения
   */
  async testConnection() {
    console.log('🔌 Проверка подключения к OTAPI...')

    const params = new URLSearchParams({
      instanceKey: this.instanceKey,
      language: OTAPI_CONFIG.language
    })

    try {
      const response = await fetch(`${OTAPI_CONFIG.baseUrl}GetInstanceInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        timeout: 10000
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.OtapiResponse?.ErrorCode) {
        throw new Error(`${data.OtapiResponse.ErrorCode}: ${data.OtapiResponse.ErrorDescription}`)
      }

      console.log('✅ Подключение успешно!')

      if (data.OtapiResponse?.Result) {
        const info = data.OtapiResponse.Result
        console.log('📋 Информация об инстансе:')
        console.log(`  Версия: ${info.Version || 'неизвестно'}`)
        console.log(`  Тип: ${info.InstanceType || 'неизвестно'}`)
        console.log(`  Статус: ${info.Status || 'активен'}`)
      }

      return true

    } catch (error) {
      console.error('❌ Ошибка подключения:', error.message)
      return false
    }
  }

  /**
   * Тест поиска товаров
   */
  async testSearch(provider, query) {
    console.log(`\n🔍 Тест поиска на ${provider}: "${query}"`)

    // Формируем XML параметры для поиска
    const xmlParameters = `
      <SearchItemsParameters>
        <Provider>${provider}</Provider>
        <SearchMethod>Catalog</SearchMethod>
        <ItemTitle>${query}</ItemTitle>
      </SearchItemsParameters>
    `.trim()

    const params = new URLSearchParams({
      instanceKey: this.instanceKey,
      language: OTAPI_CONFIG.language,
      xmlParameters: xmlParameters,
      framePosition: '0',
      frameSize: '5' // Только 5 товаров для теста
    })

    try {
      const startTime = Date.now()

      const response = await fetch(`${OTAPI_CONFIG.baseUrl}SearchItemsFrame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      })

      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)

      console.log(`⏱️ Время ответа: ${duration}с`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Проверяем ошибки
      if (data.OtapiResponse?.ErrorCode) {
        throw new Error(`${data.OtapiResponse.ErrorCode}: ${data.OtapiResponse.ErrorDescription}`)
      }

      const items = data.OtapiResponse?.Result?.Items || []
      console.log(`✅ Найдено товаров: ${items.length}`)

      if (items.length > 0) {
        console.log('\n📦 Пример товара:')
        const item = items[0]
        console.log(`  ID: ${item.Id || item.ItemId}`)
        console.log(`  Название: ${(item.Title || item.Name || '').substring(0, 50)}...`)
        console.log(`  Цена: ${item.Price?.ConvertedPrice || item.Price?.Value || 0} ${OTAPI_CONFIG.currency}`)
        console.log(`  Оригинальная цена: ${item.Price?.OriginalPrice || 0} ${item.Price?.CurrencyCode || 'CNY'}`)
        console.log(`  Продавец: ${item.SellerName || 'неизвестен'}`)
        console.log(`  Рейтинг: ${item.Rating || 0}/5`)
        console.log(`  Продано: ${item.SoldCount || 0} шт.`)
        console.log(`  Картинка: ${item.MainPictureUrl ? '✅ есть' : '❌ нет'}`)

        return {
          success: true,
          count: items.length,
          example: item
        }
      }

      return {
        success: true,
        count: 0
      }

    } catch (error) {
      console.error(`❌ Ошибка поиска: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Тест получения категорий
   */
  async testCategories(provider = 'Taobao') {
    console.log(`\n📂 Тест получения категорий ${provider}`)

    const params = new URLSearchParams({
      instanceKey: this.instanceKey,
      language: OTAPI_CONFIG.language,
      provider: provider
    })

    try {
      const response = await fetch(`${OTAPI_CONFIG.baseUrl}GetRootCategoryInfoList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.OtapiResponse?.ErrorCode) {
        throw new Error(`${data.OtapiResponse.ErrorCode}: ${data.OtapiResponse.ErrorDescription}`)
      }

      const categories = data.OtapiResponse?.Result?.Categories || []
      console.log(`✅ Найдено категорий: ${categories.length}`)

      if (categories.length > 0) {
        console.log('\n📋 Примеры категорий:')
        categories.slice(0, 5).forEach(cat => {
          console.log(`  - ${cat.Name} (ID: ${cat.Id})`)
        })
      }

      return true

    } catch (error) {
      console.error(`❌ Ошибка получения категорий: ${error.message}`)
      return false
    }
  }
}

/**
 * Основная функция тестирования
 */
async function testOtapi() {
  console.log('🧪 ТЕСТ OTAPI - OpenTrade Commerce API\n')
  console.log('=' .repeat(70))

  // Проверяем ключ
  const instanceKey = process.env.OTAPI_INSTANCE_KEY

  if (!instanceKey) {
    console.error('\n❌ ОШИБКА: OTAPI_INSTANCE_KEY не найден')
    console.log('\n💡 Как получить ключ:')
    console.log('1. Зайдите на https://otcommerce.com/')
    console.log('2. Зарегистрируйтесь (есть 5 дней бесплатного тестирования)')
    console.log('3. Получите Instance Key в личном кабинете')
    console.log('4. Добавьте в .env.local:')
    console.log('   OTAPI_INSTANCE_KEY=ваш_ключ_здесь')
    console.log('5. Запустите: node scripts/test-otapi.js')
    console.log('')
    console.log('📖 Документация: http://docs.otapi.net/ru')
    console.log('')
    process.exit(1)
  }

  console.log('🔑 Instance Key найден:', instanceKey.substring(0, 8) + '...')

  const tester = new OtapiTester(instanceKey)

  // 1. Тест подключения
  console.log('\n' + '=' .repeat(70))
  console.log('ТЕСТ 1: ПОДКЛЮЧЕНИЕ')
  console.log('=' .repeat(70))

  const connected = await tester.testConnection()
  if (!connected) {
    console.log('\n⚠️ Не удалось подключиться к OTAPI')
    console.log('💡 Проверьте:')
    console.log('  1. Правильность Instance Key')
    console.log('  2. Активность аккаунта (не истек ли тестовый период)')
    console.log('  3. Доступность сервиса http://otapi.net')
    process.exit(1)
  }

  // Пауза
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 2. Тесты поиска
  console.log('\n' + '=' .repeat(70))
  console.log('ТЕСТ 2: ПОИСК ТОВАРОВ')
  console.log('=' .repeat(70))

  const searchResults = []

  for (const test of TEST_QUERIES) {
    const result = await tester.testSearch(test.provider, test.query)
    searchResults.push({
      ...test,
      ...result
    })

    // Пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // 3. Тест категорий
  console.log('\n' + '=' .repeat(70))
  console.log('ТЕСТ 3: КАТЕГОРИИ')
  console.log('=' .repeat(70))

  await tester.testCategories('Taobao')

  // 4. Итоги
  console.log('\n\n' + '=' .repeat(70))
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ')
  console.log('=' .repeat(70))

  console.log('\n✅ Результаты тестов:')
  console.log(`  Подключение: ✅ успешно`)

  console.log('\n🔍 Поиск товаров:')
  searchResults.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`  ${result.provider}: ${status} (найдено ${result.count || 0} товаров)`)
  })

  const successCount = searchResults.filter(r => r.success).length
  const totalCount = searchResults.length
  const successRate = Math.round((successCount / totalCount) * 100)

  console.log(`\n📈 Успешность: ${successCount}/${totalCount} (${successRate}%)`)

  if (successRate === 100) {
    console.log('\n🎉 OTAPI ПОЛНОСТЬЮ РАБОТАЕТ!')
    console.log('')
    console.log('💡 Следующие шаги:')
    console.log('  1. Запустите импорт товаров:')
    console.log('     node scripts/import-from-otapi.js --query="ваш запрос"')
    console.log('')
    console.log('  2. Настройте автоматический импорт')
    console.log('  3. Подключите webhook для обновления цен')
  } else if (successRate > 0) {
    console.log('\n⚠️ OTAPI РАБОТАЕТ ЧАСТИЧНО')
    console.log('')
    console.log('💡 Возможные причины:')
    console.log('  - Некоторые маркетплейсы могут быть недоступны')
    console.log('  - Проверьте настройки провайдеров в личном кабинете')
    console.log('  - Обратитесь в поддержку OTAPI')
  } else {
    console.log('\n❌ OTAPI НЕ РАБОТАЕТ')
    console.log('')
    console.log('💡 Что делать:')
    console.log('  1. Проверьте баланс и статус аккаунта')
    console.log('  2. Убедитесь, что Instance Key актуален')
    console.log('  3. Обратитесь в поддержку: support@otcommerce.com')
  }

  console.log('')
  console.log('📚 Полезные ссылки:')
  console.log('  Документация: http://docs.otapi.net/ru')
  console.log('  Личный кабинет: https://otcommerce.com/dashboard')
  console.log('  Тарифы: https://otcommerce.com/pricing')
  console.log('')
}

// Запуск тестов
testOtapi()
  .then(() => {
    console.log('✅ Тестирование завершено\n')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Критическая ошибка:', error)
    process.exit(1)
  })