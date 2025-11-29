#!/usr/bin/env node

/**
 * Добавление большого количества товаров в категорию ТЕСТОВАЯ
 * для полноценного тестирования каталога
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Читаем .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      let value = match[2]
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      process.env[match[1]] = value
    }
  })
}

// Инициализация Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

// Статистика
let stats = {
  total: 0,
  success: 0,
  failed: 0
}

// ========== Тестовые товары для категории ТЕСТОВАЯ ==========
const testProducts = [
  // Смартфоны
  { name: 'iPhone 15 Pro Max 512GB', price: 149990, subcategory: 'Смартфоны' },
  { name: 'Samsung Galaxy S24 Ultra', price: 129990, subcategory: 'Смартфоны' },
  { name: 'Xiaomi 14 Pro', price: 89990, subcategory: 'Смартфоны' },
  { name: 'Google Pixel 8 Pro', price: 99990, subcategory: 'Смартфоны' },
  { name: 'OnePlus 12', price: 79990, subcategory: 'Смартфоны' },
  { name: 'Honor Magic 6 Pro', price: 69990, subcategory: 'Смартфоны' },
  { name: 'Realme GT 5 Pro', price: 49990, subcategory: 'Смартфоны' },
  { name: 'Vivo X100 Pro', price: 74990, subcategory: 'Смартфоны' },
  { name: 'OPPO Find X7 Ultra', price: 84990, subcategory: 'Смартфоны' },
  { name: 'Nothing Phone (2a)', price: 39990, subcategory: 'Смартфоны' },

  // Ноутбуки
  { name: 'MacBook Pro 16" M3 Max', price: 399990, subcategory: 'Ноутбуки' },
  { name: 'MacBook Air 15" M2', price: 149990, subcategory: 'Ноутбуки' },
  { name: 'Dell XPS 15', price: 189990, subcategory: 'Ноутбуки' },
  { name: 'Lenovo ThinkPad X1 Carbon', price: 169990, subcategory: 'Ноутбуки' },
  { name: 'ASUS ROG Strix G18', price: 209990, subcategory: 'Ноутбуки' },
  { name: 'HP Spectre x360', price: 159990, subcategory: 'Ноутбуки' },
  { name: 'MSI Stealth 16', price: 239990, subcategory: 'Ноутбуки' },
  { name: 'Razer Blade 16', price: 349990, subcategory: 'Ноутбуки' },
  { name: 'Microsoft Surface Laptop Studio 2', price: 279990, subcategory: 'Ноутбуки' },
  { name: 'Huawei MateBook X Pro', price: 139990, subcategory: 'Ноутбуки' },

  // Наушники
  { name: 'Apple AirPods Pro 2', price: 24990, subcategory: 'Наушники' },
  { name: 'Sony WH-1000XM5', price: 34990, subcategory: 'Наушники' },
  { name: 'Bose QuietComfort Ultra', price: 39990, subcategory: 'Наушники' },
  { name: 'Sennheiser Momentum 4', price: 29990, subcategory: 'Наушники' },
  { name: 'JBL Tour One M2', price: 19990, subcategory: 'Наушники' },
  { name: 'Samsung Galaxy Buds3 Pro', price: 17990, subcategory: 'Наушники' },
  { name: 'Beats Studio Pro', price: 34990, subcategory: 'Наушники' },
  { name: 'Marshall Monitor III ANC', price: 27990, subcategory: 'Наушники' },
  { name: 'B&O Beoplay HX', price: 49990, subcategory: 'Наушники' },
  { name: 'Audio-Technica ATH-M50xBT2', price: 15990, subcategory: 'Наушники' },

  // Планшеты
  { name: 'iPad Pro 13" M4', price: 139990, subcategory: 'Планшеты' },
  { name: 'iPad Air 11" M2', price: 69990, subcategory: 'Планшеты' },
  { name: 'Samsung Galaxy Tab S9 Ultra', price: 119990, subcategory: 'Планшеты' },
  { name: 'Microsoft Surface Pro 10', price: 129990, subcategory: 'Планшеты' },
  { name: 'Xiaomi Pad 6 Pro', price: 44990, subcategory: 'Планшеты' },
  { name: 'Huawei MatePad Pro 13.2', price: 79990, subcategory: 'Планшеты' },
  { name: 'Lenovo Tab P12 Pro', price: 59990, subcategory: 'Планшеты' },
  { name: 'OnePlus Pad Go', price: 29990, subcategory: 'Планшеты' },
  { name: 'Google Pixel Tablet', price: 54990, subcategory: 'Планшеты' },
  { name: 'Amazon Fire Max 11', price: 19990, subcategory: 'Планшеты' },

  // Умные часы
  { name: 'Apple Watch Ultra 2', price: 89990, subcategory: 'Умные часы' },
  { name: 'Apple Watch Series 9', price: 49990, subcategory: 'Умные часы' },
  { name: 'Samsung Galaxy Watch6 Classic', price: 34990, subcategory: 'Умные часы' },
  { name: 'Garmin Fenix 7X Pro', price: 79990, subcategory: 'Умные часы' },
  { name: 'Huawei Watch GT 4', price: 24990, subcategory: 'Умные часы' },
  { name: 'Xiaomi Watch 2 Pro', price: 19990, subcategory: 'Умные часы' },
  { name: 'Amazfit Balance', price: 14990, subcategory: 'Умные часы' },
  { name: 'Fitbit Sense 2', price: 29990, subcategory: 'Умные часы' },
  { name: 'Polar Vantage V3', price: 64990, subcategory: 'Умные часы' },
  { name: 'Suunto Race', price: 54990, subcategory: 'Умные часы' },

  // Телевизоры
  { name: 'Samsung QN900C 8K 75"', price: 599990, subcategory: 'Телевизоры' },
  { name: 'LG OLED C3 65"', price: 199990, subcategory: 'Телевизоры' },
  { name: 'Sony Bravia XR A95L 55"', price: 349990, subcategory: 'Телевизоры' },
  { name: 'TCL QM8 75"', price: 149990, subcategory: 'Телевизоры' },
  { name: 'Hisense U8K 65"', price: 119990, subcategory: 'Телевизоры' },
  { name: 'Philips OLED808 55"', price: 169990, subcategory: 'Телевизоры' },
  { name: 'Xiaomi TV S Pro 85"', price: 179990, subcategory: 'Телевизоры' },
  { name: 'Haier S9 Ultra 75"', price: 139990, subcategory: 'Телевизоры' },
  { name: 'Panasonic MZ2000 65"', price: 289990, subcategory: 'Телевизоры' },
  { name: 'Sharp Aquos XLED 70"', price: 219990, subcategory: 'Телевизоры' },

  // Игровые консоли
  { name: 'PlayStation 5 Pro', price: 79990, subcategory: 'Игровые консоли' },
  { name: 'Xbox Series X', price: 59990, subcategory: 'Игровые консоли' },
  { name: 'Nintendo Switch OLED', price: 34990, subcategory: 'Игровые консоли' },
  { name: 'Steam Deck OLED', price: 64990, subcategory: 'Игровые консоли' },
  { name: 'ASUS ROG Ally', price: 69990, subcategory: 'Игровые консоли' },
  { name: 'Lenovo Legion Go', price: 74990, subcategory: 'Игровые консоли' },
  { name: 'MSI Claw', price: 79990, subcategory: 'Игровые консоли' },
  { name: 'PlayStation Portal', price: 24990, subcategory: 'Игровые консоли' },
  { name: 'Meta Quest 3', price: 59990, subcategory: 'Игровые консоли' },
  { name: 'PICO 4 Ultra', price: 44990, subcategory: 'Игровые консоли' },

  // Камеры
  { name: 'Canon EOS R5 Mark II', price: 399990, subcategory: 'Камеры' },
  { name: 'Sony A7R V', price: 349990, subcategory: 'Камеры' },
  { name: 'Nikon Z9', price: 479990, subcategory: 'Камеры' },
  { name: 'Fujifilm X-T5', price: 179990, subcategory: 'Камеры' },
  { name: 'Panasonic Lumix S5 II', price: 189990, subcategory: 'Камеры' },
  { name: 'DJI Pocket 3', price: 64990, subcategory: 'Камеры' },
  { name: 'GoPro Hero 12', price: 44990, subcategory: 'Камеры' },
  { name: 'Insta360 X4', price: 54990, subcategory: 'Камеры' },
  { name: 'Leica Q3', price: 599990, subcategory: 'Камеры' },
  { name: 'Hasselblad X2D 100C', price: 799990, subcategory: 'Камеры' },

  // Дроны
  { name: 'DJI Mavic 3 Pro', price: 189990, subcategory: 'Дроны' },
  { name: 'DJI Air 3', price: 119990, subcategory: 'Дроны' },
  { name: 'DJI Mini 4 Pro', price: 79990, subcategory: 'Дроны' },
  { name: 'Autel EVO Lite+', price: 94990, subcategory: 'Дроны' },
  { name: 'Parrot Anafi USA', price: 149990, subcategory: 'Дроны' },
  { name: 'Skydio 2+', price: 139990, subcategory: 'Дроны' },
  { name: 'DJI FPV', price: 134990, subcategory: 'Дроны' },
  { name: 'DJI Avata 2', price: 94990, subcategory: 'Дроны' },
  { name: 'PowerVision PowerEgg X', price: 84990, subcategory: 'Дроны' },
  { name: 'Hubsan Zino Mini Pro', price: 44990, subcategory: 'Дроны' },

  // Умный дом
  { name: 'Яндекс Станция Макс', price: 34990, subcategory: 'Умный дом' },
  { name: 'Apple HomePod 2', price: 39990, subcategory: 'Умный дом' },
  { name: 'Amazon Echo Studio', price: 24990, subcategory: 'Умный дом' },
  { name: 'Google Nest Hub Max', price: 29990, subcategory: 'Умный дом' },
  { name: 'Aqara Hub M3', price: 9990, subcategory: 'Умный дом' },
  { name: 'Philips Hue Bridge', price: 6990, subcategory: 'Умный дом' },
  { name: 'Xiaomi Mi Home Security 360', price: 3990, subcategory: 'Умный дом' },
  { name: 'Ring Video Doorbell Pro 2', price: 34990, subcategory: 'Умный дом' },
  { name: 'Nest Learning Thermostat', price: 29990, subcategory: 'Умный дом' },
  { name: 'August Wi-Fi Smart Lock', price: 24990, subcategory: 'Умный дом' }
]

// ========== Функция добавления товаров ==========
async function addTestProducts() {
  console.log(`${colors.bright}${colors.magenta}🚀 ДОБАВЛЕНИЕ ТОВАРОВ В КАТЕГОРИЮ ТЕСТОВАЯ${colors.reset}`)
  console.log(`${colors.cyan}📅 Дата: ${new Date().toLocaleString('ru-RU')}${colors.reset}`)
  console.log('═'.repeat(60))

  // Получаем или создаем поставщика
  let supplierId
  const { data: existingSupplier } = await supabase
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'Тестовый магазин электроники')
    .single()

  if (existingSupplier) {
    supplierId = existingSupplier.id
    console.log(`${colors.green}✅ Используем существующего поставщика${colors.reset}`)
  } else {
    const { data: newSupplier, error } = await supabase
      .from('catalog_verified_suppliers')
      .insert({
        name: 'Тестовый магазин электроники',
        company_name: 'Test Electronics Store',
        category: 'Электроника',
        description: 'Тестовый поставщик для категории ТЕСТОВАЯ',
        country: 'RU',
        is_verified: true,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error(`${colors.red}Ошибка создания поставщика:${colors.reset}`, error)
      return
    }

    supplierId = newSupplier.id
    console.log(`${colors.green}✅ Создан новый поставщик${colors.reset}`)
  }

  console.log(`\n${colors.bright}Добавляем ${testProducts.length} товаров...${colors.reset}\n`)

  // Добавляем товары
  for (let i = 0; i < testProducts.length; i++) {
    const product = testProducts[i]
    stats.total++

    // Генерируем уникальные данные для каждого товара
    const imageUrl = `https://picsum.photos/seed/${Date.now()}-${i}/400/400`
    const description = `${product.name} - высококачественный товар из категории ${product.subcategory}.
    Современный дизайн, надежность и функциональность.
    Гарантия производителя 2 года. Бесплатная доставка по России.`

    const { data, error } = await supabase
      .from('catalog_verified_products')
      .insert({
        supplier_id: supplierId,
        name: product.name,
        description: description,
        category: 'ТЕСТОВАЯ',
        price: product.price,
        currency: 'RUB',
        images: [imageUrl],
        specifications: {
          subcategory: product.subcategory,
          brand: product.name.split(' ')[0],
          warranty: '24 месяца',
          delivery: 'Бесплатная доставка',
          rating: (4 + Math.random()).toFixed(1),
          reviews: Math.floor(Math.random() * 500) + 10,
          in_stock: Math.floor(Math.random() * 50) + 1
        },
        is_active: true,
        in_stock: true
      })
      .select()
      .single()

    if (error) {
      stats.failed++
      console.log(`${colors.red}❌ [${i + 1}/${testProducts.length}] ${product.name}: ${error.message}${colors.reset}`)
    } else {
      stats.success++
      console.log(`${colors.green}✅ [${i + 1}/${testProducts.length}] ${product.name} - ${product.subcategory}${colors.reset}`)
    }

    // Небольшая задержка
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Статистика
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${colors.bright}${colors.magenta}📊 РЕЗУЛЬТАТЫ${colors.reset}`)
  console.log('═'.repeat(60))
  console.log(`• Всего попыток: ${stats.total}`)
  console.log(`• ${colors.green}Успешно добавлено: ${stats.success}${colors.reset}`)
  console.log(`• ${colors.red}Ошибки: ${stats.failed}${colors.reset}`)
  console.log(`• Процент успеха: ${((stats.success / stats.total) * 100).toFixed(1)}%`)
  console.log('═'.repeat(60))

  // Проверяем общее количество в категории ТЕСТОВАЯ
  const { count } = await supabase
    .from('catalog_verified_products')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'ТЕСТОВАЯ')

  console.log(`\n${colors.bright}${colors.cyan}📦 Всего товаров в категории ТЕСТОВАЯ: ${count}${colors.reset}`)

  // Показываем подкатегории
  const { data: subcategories } = await supabase
    .from('catalog_verified_products')
    .select('specifications')
    .eq('category', 'ТЕСТОВАЯ')

  const subcategoryCount = {}
  subcategories?.forEach(item => {
    const subcat = item.specifications?.subcategory
    if (subcat) {
      subcategoryCount[subcat] = (subcategoryCount[subcat] || 0) + 1
    }
  })

  console.log(`\n${colors.bright}Распределение по подкатегориям:${colors.reset}`)
  Object.entries(subcategoryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subcat, count]) => {
      console.log(`  • ${subcat}: ${count} товаров`)
    })

  console.log(`\n${colors.green}✅ Готово! Теперь в категории ТЕСТОВАЯ достаточно товаров для тестирования.${colors.reset}`)
  console.log(`${colors.cyan}Откройте каталог: http://localhost:3000/catalog${colors.reset}`)
}

// Запуск
addTestProducts().catch(error => {
  console.error(`${colors.red}Критическая ошибка:${colors.reset}`, error)
  process.exit(1)
})