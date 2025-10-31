/**
 * Скрипт для добавления поставщика тормозных жидкостей
 * Запуск: node scripts/add-brake-fluid-supplier.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function addBrakeFluidSupplier() {
  console.log('🚀 Начинаем добавление поставщика тормозных жидкостей...')

  // 1. Добавляем поставщика
  const { data: supplier, error: supplierError } = await supabase
    .from('catalog_verified_suppliers')
    .insert({
      name: 'АвтоХимПром',
      company_name: 'ООО "АвтоХимПром"',
      category: 'Автотовары',
      country: 'Россия',
      city: 'Москва',
      description: 'Поставщик автомобильных жидкостей и химии: тормозные жидкости, антифризы, моторные масла',
      contact_email: 'sales@avtohimprom.ru',
      contact_phone: '+7 (495) 123-45-67',
      website: 'https://avtohimprom.ru',
      specialties: ['Тормозные жидкости', 'Автохимия', 'DOT-3', 'DOT-4', 'DOT-5.1'],
      is_active: true
    })
    .select()
    .single()

  if (supplierError) {
    console.error('❌ Ошибка добавления поставщика:', supplierError)
    return
  }

  console.log('✅ Поставщик добавлен:', supplier.name, '(ID:', supplier.id, ')')

  // 2. Добавляем товары (тормозные жидкости)
  const products = [
    {
      supplier_id: supplier.id,
      name: 'Тормозная жидкость ЛУКОЙЛ DOT 3',
      description: 'Тормозная жидкость ЛУКОЙЛ DOT 3, 1 л. Для гидравлических тормозных систем автомобилей. Температура кипения сухой жидкости не менее 205°C. Бренд: ЛУКОЙЛ, тип DOT-3, объем 1 литр.',
      price: '314.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://ir.ozone.ru/s3/multimedia-1-g/wc1000/7105109468.jpg"]',
      sku: 'LUKOIL-DOT3-1L',
      category: 'Автотовары',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Тормозная жидкость G-Energy Expert DOT 4',
      description: 'G-Energy Expert DOT 4 - синтетическая тормозная жидкость, 0.9 л. Обеспечивает надежную работу тормозной системы в любых условиях. Температура кипения сухой жидкости не менее 230°C. Бренд: G-Energy, Газпромнефть, DOT-4, объем 0.9 литра.',
      price: '425.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://ir.ozone.ru/s3/multimedia-1-e/wc1000/6933944582.jpg"]',
      sku: 'GENERGY-DOT4-09L',
      category: 'Автотовары',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Тормозная жидкость SINTEC SUPER DOT-4',
      description: 'SINTEC SUPER DOT-4 - высококачественная синтетическая тормозная жидкость, 910 г (1 л). Превосходит требования стандарта DOT-4. Температура кипения сухой жидкости не менее 250°C. Бренд: SINTEC, DOT-4 SUPER, вес 910 грамм.',
      price: '257.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://ir.ozone.ru/s3/multimedia-1-r/wc1000/7038495035.jpg"]',
      sku: 'SINTEC-DOT4-910G',
      category: 'Автотовары',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Тормозная жидкость ЛУКОЙЛ DOT 4',
      description: 'Тормозная жидкость ЛУКОЙЛ DOT 4, 1 л. Синтетическая тормозная жидкость для современных автомобилей. Температура кипения сухой жидкости не менее 230°C. Бренд: ЛУКОЙЛ, LUKOIL, DOT-4, объем 1 литр.',
      price: '351.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://ir.ozone.ru/s3/multimedia-1-q/wc1000/7105109470.jpg"]',
      sku: 'LUKOIL-DOT4-1L',
      category: 'Автотовары',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Тормозная жидкость Felix DOT 4',
      description: 'Felix DOT 4 - качественная синтетическая тормозная жидкость, 0.455 л. Соответствует международным стандартам качества. Температура кипения сухой жидкости не менее 230°C. Бренд: Felix, DOT-4, объем 455 мл.',
      price: '189.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '[]',
      sku: 'FELIX-DOT4-455ML',
      category: 'Автотовары',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Тормозная жидкость Rosdot DOT 4',
      description: 'Rosdot DOT 4 - универсальная тормозная жидкость для всех типов гидравлических тормозных систем, 0.91 кг. Высокая температура кипения и стабильность характеристик. Бренд: Rosdot, DOT-4, вес 910 грамм.',
      price: '295.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '[]',
      sku: 'ROSDOT-DOT4-910G',
      category: 'Автотовары',
      is_active: true
    }
  ]

  console.log(`\n📦 Добавляем ${products.length} товаров...`)

  const { data: insertedProducts, error: productsError } = await supabase
    .from('catalog_verified_products')
    .insert(products)
    .select()

  if (productsError) {
    console.error('❌ Ошибка добавления товаров:', productsError)
    return
  }

  console.log(`✅ Добавлено товаров: ${insertedProducts.length}`)
  console.log('\n📋 Список добавленных товаров:')
  insertedProducts.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.name} - ${product.price} ₽`)
  })

  console.log('\n🎉 Готово! Поставщик и товары успешно добавлены в базу данных.')
  console.log('\n📝 Тестовые ссылки для проверки поиска по URL:')
  console.log('   Ozon ЛУКОЙЛ DOT 3: https://www.ozon.ru/product/tormoznaya-zhidkost-lukoil-dot-3-1-l-142950385/')
  console.log('   Ozon G-Energy DOT 4: https://www.ozon.ru/product/g-energy-zhidkost-tormoznaya-expert-dot-4-0-9-l-469360934/')
  console.log('   Ozon SINTEC DOT-4: https://www.ozon.ru/product/tormoznaya-zhidkost-sintec-super-dot-4-tk-250os-910-g-693389246/')
}

// Запускаем скрипт
addBrakeFluidSupplier()
  .then(() => {
    console.log('\n✅ Скрипт успешно выполнен')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Критическая ошибка:', error)
    process.exit(1)
  })
