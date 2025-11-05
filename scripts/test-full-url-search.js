/**
 * Полный тест поиска по URL - имитируем реальный запрос пользователя
 */

async function testFullUrlSearch() {
  // Это URL который пользователь вставит
  const testUrl = 'https://www.ozon.ru/product/tormoznaya-zhidkost-lukoil-dot-3-1-l-142950385/'

  console.log('🎯 [DEMO] Имитируем действия пользователя')
  console.log('=' .repeat(60))
  console.log('')
  console.log('👤 Пользователь:')
  console.log('   1. Нажал кнопку глобуса 🌐 в строке поиска')
  console.log('   2. Вставил ссылку:', testUrl)
  console.log('   3. Нажал "Найти"')
  console.log('')
  console.log('🔄 Система начинает работу...')
  console.log('')

  try {
    // Вызываем API
    console.log('📡 [API] POST /api/catalog/search-by-url')

    const response = await fetch('http://localhost:3000/api/catalog/search-by-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: testUrl })
    })

    const data = await response.json()

    console.log('📊 [API] Статус:', response.status, response.statusText)
    console.log('')

    if (!response.ok) {
      console.log('❌ [API] Ошибка:', data.error)
      console.log('')
      console.log('💡 [DEMO] Что происходит в UI:')
      console.log('   - Показываем сообщение: "Не удалось распарсить URL"')
      console.log('   - Предлагаем ввести название товара вручную')
      console.log('   - Или попробовать другую ссылку')
      return
    }

    console.log('✅ [API] Успешно!')
    console.log('')
    console.log('📦 [METADATA] Данные товара с маркетплейса:')
    console.log('   Title:', data.metadata.title)
    console.log('   Description:', data.metadata.description?.substring(0, 80) + '...')
    console.log('   Marketplace:', data.metadata.marketplace)
    console.log('   Price:', data.metadata.price, data.metadata.currency)
    console.log('')

    console.log('🤖 [AI ANALYSIS] YandexGPT анализ:')
    console.log('   Brand:', data.analysis.brand)
    console.log('   Category:', data.analysis.category)
    console.log('   Product Type:', data.analysis.productType)
    console.log('   Keywords:', data.analysis.keywords.join(', '))
    console.log('')

    console.log('🔍 [DATABASE SEARCH] Поиск в базе по ключевым словам...')
    console.log('')

    if (data.products && data.products.length > 0) {
      console.log('✅ [RESULTS] Найдено товаров:', data.products.length)
      console.log('')

      data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`)
        console.log(`      Цена: ${product.price} ${product.currency}`)
        console.log(`      Поставщик: ${product.supplier?.name || 'N/A'}`)
        console.log(`      В наличии: ${product.in_stock ? '✅ Да' : '❌ Нет'}`)
        console.log('')
      })

      console.log('💡 [DEMO] Что видит пользователь в UI:')
      console.log(`   - Закрывается модальное окно поиска по URL`)
      console.log(`   - Открывается каталог с категорией "${data.products[0].category}"`)
      console.log(`   - Показываются найденные товары`)
      console.log(`   - Пользователь может оставить заявку поставщику`)

    } else {
      console.log('⚠️ [RESULTS] Товары не найдены')
      console.log('')
      console.log('💡 [DEMO] Что видит пользователь:')
      console.log('   - Сообщение: "Товары не найдены"')
      console.log('   - Кнопка: "Оставить заявку на добавление товара"')
    }

    console.log('')
    console.log('=' .repeat(60))
    console.log('✅ [DEMO] Тест завершен')

  } catch (error) {
    console.log('')
    console.log('❌ [ERROR]', error.message)
    console.log('')
    console.log('💡 Убедитесь что dev сервер запущен: npm run dev')
  }
}

console.log('')
console.log('🚀 ДЕМО: Полный цикл поиска по URL с маркетплейса')
console.log('')

testFullUrlSearch()
