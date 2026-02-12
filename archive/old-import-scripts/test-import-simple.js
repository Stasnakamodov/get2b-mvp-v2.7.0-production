/**
 * Простой тест импорта с готовыми данными
 * Проверяет что API работает и картинка сохраняется
 */

async function testSimpleImport() {
  console.log('🧪 ПРОСТОЙ ТЕСТ ИМПОРТА')
  console.log('='.repeat(70))
  console.log('')

  // Тестовые данные товара с картинкой
  const testProduct = {
    metadata: {
      title: 'Смартфон Apple iPhone 15 128GB Розовый [TEST]',
      description: 'Смартфон Apple iPhone 15 с дисплеем 6.1 дюйма и камерой 48 МП',
      imageUrl: 'https://avatars.mds.yandex.net/get-mpic/5235334/img_id5557305412093669590.jpeg/orig',
      price: '79990',
      currency: 'RUB',
      marketplace: 'test',
      originalUrl: 'https://test.com/product/123'
    },
    analysis: {
      brand: 'Apple',
      category: 'Электроника',
      keywords: ['iPhone', '15', 'смартфон', 'Apple', '128GB', 'розовый']
    }
  }

  console.log('📦 Тестовый товар:')
  console.log('  Название:', testProduct.metadata.title)
  console.log('  Картинка:', testProduct.metadata.imageUrl ? '✅ ЕСТЬ' : '❌ НЕТ')
  console.log('  Цена:', testProduct.metadata.price, testProduct.metadata.currency)
  console.log('')

  console.log('⏳ Отправляем в API...')
  console.log('')

  try {
    // Ждем 10 секунд пока сервер запустится
    await new Promise(resolve => setTimeout(resolve, 10000))

    const response = await fetch('http://localhost:3000/api/catalog/products/import-from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testProduct)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ ОШИБКА:', result.error)
      console.error('   Детали:', result.details)
      process.exit(1)
    }

    console.log('✅ УСПЕХ! Товар добавлен в каталог!')
    console.log('')
    console.log('📦 Результат:')
    console.log('  ID:', result.product.id)
    console.log('  Название:', result.product.name)
    console.log('  Категория:', result.product.category)
    console.log('  Цена:', result.product.price)
    console.log('  Картинок:', result.product.images?.length || 0)

    if (result.product.images && result.product.images.length > 0) {
      console.log('')
      console.log('🖼️ КАРТИНКА СОХРАНЕНА:')
      console.log('  ', result.product.images[0])
      console.log('')
      console.log('✅ ВСЕ РАБОТАЕТ! Картинка в каталоге!')
    } else {
      console.log('')
      console.log('⚠️ Картинка не сохранилась')
    }

    console.log('')
    console.log('='.repeat(70))
    console.log('🎉 ТЕСТ ПРОЙДЕН!')
    console.log('='.repeat(70))

  } catch (error) {
    console.error('')
    console.error('❌ ОШИБКА:', error.message)
    console.error('')
    process.exit(1)
  }
}

testSimpleImport()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Ошибка:', error)
    process.exit(1)
  })
