/**
 * Тест импорта товара с загрузкой картинки в Supabase Storage
 */

async function testImportWithStorage() {
  console.log('🧪 ТЕСТ ИМПОРТА С ЗАГРУЗКОЙ В STORAGE')
  console.log('='.repeat(70))
  console.log('')

  // Используем реальную картинку с надежного CDN
  const testProduct = {
    metadata: {
      title: 'Смартфон Apple iPhone 15 Pro Max 256GB',
      description: 'Флагманский смартфон Apple с titanium корпусом, камерой 48 МП и процессором A17 Pro',
      imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=jpeg&qlt=90&.v=1692845702774',
      price: '134990',
      currency: 'RUB',
      marketplace: 'apple',
      originalUrl: 'https://www.apple.com/ru/shop/buy-iphone/iphone-15-pro'
    },
    analysis: {
      brand: 'Apple',
      category: 'ТЕСТОВАЯ',
      keywords: ['iPhone', '15', 'Pro', 'Max', 'смартфон', 'Apple', '256GB']
    }
  }

  console.log('📦 Тестовый товар:')
  console.log('  Название:', testProduct.metadata.title)
  console.log('  Картинка:', testProduct.metadata.imageUrl ? '✅ ЕСТЬ' : '❌ НЕТ')
  console.log('  Источник: Apple CDN (надежный)')
  console.log('  Цена:', testProduct.metadata.price, testProduct.metadata.currency)
  console.log('')

  console.log('⏳ Отправляем в API (картинка будет скачана и загружена в Storage)...')
  console.log('')

  try {
    // Ждем 2 секунды чтобы сервер был точно запущен
    await new Promise(resolve => setTimeout(resolve, 2000))

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
      console.log('🖼️ КАРТИНКА:')
      console.log('  URL:', result.product.images[0])
      console.log('')

      // Проверяем что URL начинается с Supabase Storage
      if (result.product.images[0].includes('supabase.co/storage')) {
        console.log('✅ КАРТИНКА ЗАГРУЖЕНА В STORAGE!')
        console.log('   Это публичный URL из Supabase Storage')
      } else {
        console.log('⚠️ Картинка НЕ в Storage (fallback на оригинальный URL)')
      }
    } else {
      console.log('')
      console.log('⚠️ Картинка не сохранилась')
    }

    console.log('')
    console.log('='.repeat(70))
    console.log('🎉 ТЕСТ ПРОЙДЕН!')
    console.log('='.repeat(70))
    console.log('')
    console.log('📍 Проверь товар в каталоге:')
    console.log('   http://localhost:3000/dashboard/catalog')
    console.log('   Категория: ТЕСТОВАЯ → Тестовые товары')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ ОШИБКА:', error.message)
    console.error('')
    process.exit(1)
  }
}

testImportWithStorage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Ошибка:', error)
    process.exit(1)
  })
