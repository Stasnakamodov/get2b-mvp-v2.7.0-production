/**
 * Тест: Ручной поиск по названию товара (без парсинга URL)
 * Это то, что будет работать СЕЙЧАС
 */

async function testManualSearch() {
  // Это то, что пользователь введет вручную после неудачного парсинга
  const productName = 'Тормозная жидкость ЛУКОЙЛ DOT 3'

  console.log('🎯 [DEMO] Ручной поиск товара')
  console.log('='.repeat(60))
  console.log('')
  console.log('👤 Пользователь:')
  console.log('   1. Пробовал вставить ссылку Ozon - не удалось')
  console.log('   2. Система предложила ввести название вручную')
  console.log('   3. Ввел:', productName)
  console.log('')

  try {
    console.log('🔄 [SYSTEM] Ищем в базе данных...')
    console.log('')

    // Обычный поиск по тексту
    const response = await fetch(
      `http://localhost:3000/api/catalog/products?search=${encodeURIComponent(productName)}&supplier_type=verified&limit=20`
    )

    const data = await response.json()

    if (data.products && data.products.length > 0) {
      console.log('✅ [RESULTS] Найдено товаров:', data.products.length)
      console.log('')

      data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`)
        console.log(`      Цена: ${product.price} ${product.currency}`)
        console.log(`      Поставщик: ${product.supplier_name || 'N/A'}`)
        console.log(`      Категория: ${product.category}`)
        console.log(`      В наличии: ${product.in_stock ? '✅ Да' : '❌ Нет'}`)
        console.log('')
      })

      console.log('=' .repeat(60))
      console.log('✅ [DEMO] Поиск успешен!')
      console.log('')
      console.log('💡 ЭТО РАБОТАЕТ ПРЯМО СЕЙЧАС!')
      console.log('   Пользователь может:')
      console.log('   - Увидеть найденные товары')
      console.log('   - Сравнить цены')
      console.log('   - Оставить заявку поставщику')

    } else {
      console.log('⚠️ [RESULTS] Товары не найдены')
      console.log('')
      console.log('💡 В этом случае показываем:')
      console.log('   - "Товары не найдены в нашем каталоге"')
      console.log('   - Кнопку: "Оставить заявку на добавление"')
    }

    console.log('')

  } catch (error) {
    console.log('❌ [ERROR]', error.message)
  }
}

console.log('')
testManualSearch()
