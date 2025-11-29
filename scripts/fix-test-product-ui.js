/**
 * Создает подкатегорию для ТЕСТОВАЯ и привязывает к ней товар
 * Чтобы товар отображался в UI
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixTestProduct() {
  console.log('🔧 ИСПРАВЛЕНИЕ UI ДЛЯ ТЕСТОВОГО ТОВАРА')
  console.log('='.repeat(70))
  console.log('')

  const categoryId = 'a3bb6211-4c81-44c6-a328-42092b27234b'
  const productId = '71286c51-441d-4402-ba7d-94a230eb1138'

  // Шаг 1: Создаем подкатегорию
  console.log('📁 Создаем подкатегорию "Тестовые товары"...')

  const { data: subcategory, error: subError } = await supabase
    .from('catalog_subcategories')
    .insert({
      category_id: categoryId,
      name: 'Тестовые товары',
      key: 'test_products'
    })
    .select()
    .single()

  if (subError) {
    console.error('❌ Ошибка создания подкатегории:', subError.message)
    process.exit(1)
  }

  console.log('✅ Подкатегория создана!')
  console.log('   ID:', subcategory.id)
  console.log('   Название:', subcategory.name)
  console.log('   Key:', subcategory.key)
  console.log('')

  // Шаг 2: Обновляем товар - добавляем subcategory_id
  console.log('🔗 Привязываем товар к подкатегории...')

  const { data: product, error: updateError } = await supabase
    .from('catalog_verified_products')
    .update({ subcategory_id: subcategory.id })
    .eq('id', productId)
    .select()

  if (updateError) {
    console.error('❌ Ошибка обновления товара:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Товар обновлен!')
  console.log('   Товар ID:', product[0].id)
  console.log('   Название:', product[0].name)
  console.log('   Категория:', product[0].category)
  console.log('   Подкатегория ID:', product[0].subcategory_id)
  console.log('')

  console.log('='.repeat(70))
  console.log('🎉 ГОТОВО! Товар теперь должен быть виден в UI!')
  console.log('='.repeat(70))
  console.log('')
  console.log('📍 Откройте каталог:')
  console.log('   http://localhost:3000/dashboard/catalog')
  console.log('')
  console.log('🔍 Навигация:')
  console.log('   1. Категория: 🧪 ТЕСТОВАЯ')
  console.log('   2. Подкатегория: Тестовые товары')
  console.log('   3. Товар: Смартфон Apple iPhone 15 128GB Розовый [TEST]')
  console.log('')
}

fixTestProduct()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('')
    console.error('❌ Критическая ошибка:', error.message)
    console.error('')
    process.exit(1)
  })
