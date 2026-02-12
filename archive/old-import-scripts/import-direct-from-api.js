#!/usr/bin/env node

/**
 * Прямой импорт товаров из открытых API без парсинга
 * Быстрое заполнение БД тестовыми данными
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
      // Убираем кавычки если есть
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
  failed: 0,
  startTime: Date.now()
}

// ========== Получение или создание поставщика ==========
async function getOrCreateSupplier(name, category) {
  // Проверяем существует ли поставщик
  const { data: existing } = await supabase
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', name)
    .single()

  if (existing) {
    return existing.id
  }

  // Создаем нового поставщика
  const { data: newSupplier, error } = await supabase
    .from('catalog_verified_suppliers')
    .insert({
      name: name,
      company_name: name,
      category: category,
      description: `Тестовый поставщик для категории ${category}`,
      country: 'TEST',
      is_verified: true,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    console.error(`${colors.red}Ошибка создания поставщика:${colors.reset}`, error)
    return null
  }

  return newSupplier.id
}

// ========== ИСТОЧНИК 1: FakeStore API ==========
async function importFromFakeStoreAPI() {
  console.log(`\n${colors.bright}${colors.cyan}📦 ИМПОРТ ИЗ FAKESTORE API${colors.reset}`)
  console.log('─'.repeat(60))

  try {
    // Получаем поставщика
    const supplierId = await getOrCreateSupplier('FakeStore Electronics', 'Электроника')
    if (!supplierId) {
      console.error('Не удалось создать поставщика')
      return
    }

    // Загружаем товары электроники
    const response = await fetch('https://fakestoreapi.com/products/category/electronics')
    const products = await response.json()

    console.log(`${colors.green}✅ Загружено ${products.length} товаров${colors.reset}`)

    // Добавляем товары в БД
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      stats.total++

      console.log(`[${i + 1}/${products.length}] ${product.title.substring(0, 50)}...`)

      const { data, error } = await supabase
        .from('catalog_verified_products')
        .insert({
          supplier_id: supplierId,
          name: product.title,
          description: product.description,
          category: 'ЭЛЕКТРОНИКА',
          subcategory: 'Гаджеты',
          price: product.price,
          currency: 'USD',
          images: [product.image],
          specifications: {
            source: 'FakeStore API',
            rating: product.rating,
            original_id: product.id
          },
          is_active: true,
          in_stock: true
        })
        .select()
        .single()

      if (error) {
        stats.failed++
        console.log(`${colors.red}❌ Ошибка: ${error.message}${colors.reset}`)
      } else {
        stats.success++
        console.log(`${colors.green}✅ Добавлен (ID: ${data.id})${colors.reset}`)
      }

      // Небольшая задержка
      await new Promise(resolve => setTimeout(resolve, 200))
    }

  } catch (error) {
    console.error(`${colors.red}Ошибка FakeStore API:${colors.reset}`, error.message)
  }
}

// ========== ИСТОЧНИК 2: DummyJSON API ==========
async function importFromDummyJSON() {
  console.log(`\n${colors.bright}${colors.cyan}🛍️ ИМПОРТ ИЗ DUMMYJSON API${colors.reset}`)
  console.log('─'.repeat(60))

  try {
    const supplierId = await getOrCreateSupplier('DummyJSON Store', 'Разное')
    if (!supplierId) return

    // Загружаем товары
    const response = await fetch('https://dummyjson.com/products?limit=30')
    const data = await response.json()
    const products = data.products

    console.log(`${colors.green}✅ Загружено ${products.length} товаров${colors.reset}`)

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      stats.total++

      console.log(`[${i + 1}/${products.length}] ${product.title.substring(0, 50)}...`)

      // Определяем категорию на русском
      const categoryMap = {
        'smartphones': 'СМАРТФОНЫ',
        'laptops': 'НОУТБУКИ',
        'fragrances': 'ПАРФЮМЕРИЯ',
        'skincare': 'КОСМЕТИКА',
        'groceries': 'ПРОДУКТЫ',
        'home-decoration': 'ДОМ И САД',
        'furniture': 'МЕБЕЛЬ',
        'tops': 'ОДЕЖДА',
        'womens-dresses': 'ОДЕЖДА',
        'womens-shoes': 'ОБУВЬ',
        'mens-shirts': 'ОДЕЖДА',
        'mens-shoes': 'ОБУВЬ',
        'mens-watches': 'ЧАСЫ',
        'womens-watches': 'ЧАСЫ',
        'womens-bags': 'СУМКИ',
        'womens-jewellery': 'УКРАШЕНИЯ',
        'sunglasses': 'АКСЕССУАРЫ',
        'automotive': 'АВТО',
        'motorcycle': 'МОТО',
        'lighting': 'ОСВЕЩЕНИЕ'
      }

      const category = categoryMap[product.category] || 'РАЗНОЕ'

      const { data: savedProduct, error } = await supabase
        .from('catalog_verified_products')
        .insert({
          supplier_id: supplierId,
          name: product.title,
          description: product.description,
          category: category,
          subcategory: product.category,
          price: product.price,
          currency: 'USD',
          images: product.images || [product.thumbnail],
          specifications: {
            source: 'DummyJSON API',
            brand: product.brand,
            rating: product.rating,
            stock: product.stock,
            discount: product.discountPercentage,
            original_id: product.id
          },
          is_active: true,
          in_stock: product.stock > 0
        })
        .select()
        .single()

      if (error) {
        stats.failed++
        console.log(`${colors.red}❌ Ошибка: ${error.message}${colors.reset}`)
      } else {
        stats.success++
        console.log(`${colors.green}✅ Добавлен: ${category} (ID: ${savedProduct.id})${colors.reset}`)
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

  } catch (error) {
    console.error(`${colors.red}Ошибка DummyJSON:${colors.reset}`, error.message)
  }
}

// ========== ИСТОЧНИК 3: Генерация тестовых данных ==========
async function generateTestProducts() {
  console.log(`\n${colors.bright}${colors.cyan}🔧 ГЕНЕРАЦИЯ ТЕСТОВЫХ ТОВАРОВ${colors.reset}`)
  console.log('─'.repeat(60))

  const supplierId = await getOrCreateSupplier('Тестовый генератор', 'Тест')
  if (!supplierId) return

  // Категории и примеры товаров
  const categories = [
    {
      name: 'КНИГИ',
      products: [
        'Война и мир', 'Мастер и Маргарита', '1984', 'Гарри Поттер',
        'Властелин колец', 'Код да Винчи', 'Алхимик', 'Маленький принц'
      ]
    },
    {
      name: 'ИГРУШКИ',
      products: [
        'LEGO City', 'Кукла Барби', 'Hot Wheels трек', 'Настольная игра Монополия',
        'Пазл 1000 деталей', 'Конструктор металлический', 'Мягкая игрушка Медведь'
      ]
    },
    {
      name: 'СПОРТ',
      products: [
        'Беговая дорожка', 'Гантели 10кг', 'Йога коврик', 'Велосипед горный',
        'Ролики', 'Скейтборд', 'Палатка туристическая', 'Спальный мешок'
      ]
    },
    {
      name: 'МУЗЫКА',
      products: [
        'Гитара акустическая', 'Синтезатор Yamaha', 'Микрофон Shure',
        'Наушники студийные', 'Колонки JBL', 'Виниловый проигрыватель'
      ]
    }
  ]

  for (const category of categories) {
    console.log(`\n${colors.yellow}Категория: ${category.name}${colors.reset}`)

    for (const productName of category.products) {
      stats.total++

      // Генерируем случайную цену
      const price = Math.floor(Math.random() * 50000) + 500

      // Генерируем фейковое изображение
      const imageUrl = `https://picsum.photos/400/400?random=${Date.now()}-${Math.random()}`

      const { data, error } = await supabase
        .from('catalog_verified_products')
        .insert({
          supplier_id: supplierId,
          name: productName,
          description: `Описание товара ${productName}. Отличное качество, быстрая доставка.`,
          category: category.name,
          price: price,
          currency: 'RUB',
          images: [imageUrl],
          specifications: {
            source: 'Generated',
            generated_at: new Date().toISOString()
          },
          is_active: true,
          in_stock: true
        })
        .select()
        .single()

      if (error) {
        stats.failed++
        console.log(`❌ ${productName}: ${error.message}`)
      } else {
        stats.success++
        console.log(`✅ ${productName}: ${price} RUB`)
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

// ========== ГЛАВНАЯ ФУНКЦИЯ ==========
async function main() {
  console.log(`${colors.bright}${colors.magenta}🚀 ПРЯМОЙ ИМПОРТ 200+ ТОВАРОВ ИЗ API${colors.reset}`)
  console.log(`${colors.cyan}📅 Дата: ${new Date().toLocaleString('ru-RU')}${colors.reset}`)
  console.log('═'.repeat(60))

  console.log(`\n${colors.bright}ПЛАН ИМПОРТА:${colors.reset}`)
  console.log('1. FakeStore API - реальные товары электроники')
  console.log('2. DummyJSON API - разнообразные категории')
  console.log('3. Генерация - тестовые товары для полноты')

  // Последовательный импорт
  await importFromFakeStoreAPI()
  await importFromDummyJSON()
  await generateTestProducts()

  // Финальная статистика
  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2)
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${colors.bright}${colors.magenta}📊 РЕЗУЛЬТАТЫ ИМПОРТА${colors.reset}`)
  console.log('═'.repeat(60))
  console.log(`• Всего попыток: ${stats.total}`)
  console.log(`• ${colors.green}Успешно добавлено: ${stats.success}${colors.reset}`)
  console.log(`• ${colors.red}Ошибки: ${stats.failed}${colors.reset}`)
  console.log(`• Процент успеха: ${((stats.success / stats.total) * 100).toFixed(1)}%`)
  console.log(`• Время выполнения: ${duration} минут`)
  console.log('═'.repeat(60))

  // Проверка в БД
  if (stats.success > 0) {
    console.log(`\n${colors.green}✅ Импорт завершен!${colors.reset}`)

    // Получаем статистику по категориям
    const { data: categoryStats } = await supabase
      .from('catalog_verified_products')
      .select('category')

    const categoryCounts = {}
    categoryStats?.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    })

    console.log(`\n${colors.bright}Статистика по категориям:${colors.reset}`)
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([category, count]) => {
        console.log(`  • ${category}: ${count} товаров`)
      })
  }
}

// Запуск
main().catch(error => {
  console.error(`${colors.red}Критическая ошибка:${colors.reset}`, error)
  process.exit(1)
})