#!/usr/bin/env node
/**
 * Скрипт импорта каталога в новый проект
 *
 * Использование:
 *   1. Скопировать этот файл в новый проект
 *   2. Установить зависимости: npm install @supabase/supabase-js node-fetch
 *   3. Установить переменные окружения:
 *      - SOURCE_CATALOG_URL - URL экспорта каталога (например https://get2b.ru/api/catalog/export)
 *      - SUPABASE_URL - URL вашей Supabase
 *      - SUPABASE_SERVICE_KEY - Service role key вашей Supabase
 *   4. Запустить: node import-catalog-to-new-project.js
 */

const { createClient } = require('@supabase/supabase-js')

// Конфигурация
const SOURCE_URL = process.env.SOURCE_CATALOG_URL || 'http://localhost:3000/api/catalog/export'
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Установите переменные окружения SUPABASE_URL и SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function importCatalog() {
  console.log('🚀 Импорт каталога Get2B')
  console.log(`📥 Источник: ${SOURCE_URL}`)
  console.log(`📤 Назначение: ${SUPABASE_URL}`)
  console.log('')

  try {
    // 1. Загружаем данные
    console.log('📦 Загрузка данных из источника...')
    const response = await fetch(SOURCE_URL)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const exportData = await response.json()

    console.log(`✅ Загружено:`)
    console.log(`   - ${exportData.stats.categories} категорий`)
    console.log(`   - ${exportData.stats.subcategories} подкатегорий`)
    console.log(`   - ${exportData.stats.products} товаров`)
    console.log(`   - ${exportData.stats.suppliers} поставщиков`)
    console.log('')

    // 2. Создаём таблицы (если не существуют)
    console.log('🏗️  Проверка структуры БД...')
    await ensureTables()

    // 3. Импортируем категории
    console.log('📁 Импорт категорий...')
    const categoryMap = await importCategories(exportData.data.categories)
    console.log(`   ✅ Импортировано ${Object.keys(categoryMap).length} категорий`)

    // 4. Импортируем подкатегории
    console.log('📂 Импорт подкатегорий...')
    const subcategoryMap = await importSubcategories(exportData.data.subcategories, categoryMap)
    console.log(`   ✅ Импортировано ${Object.keys(subcategoryMap).length} подкатегорий`)

    // 5. Импортируем поставщиков
    console.log('🏪 Импорт поставщиков...')
    const supplierMap = await importSuppliers(exportData.data.suppliers)
    console.log(`   ✅ Импортировано ${Object.keys(supplierMap).length} поставщиков`)

    // 6. Импортируем товары
    console.log('📦 Импорт товаров...')
    const productsCount = await importProducts(exportData.data.products, categoryMap, subcategoryMap, supplierMap)
    console.log(`   ✅ Импортировано ${productsCount} товаров`)

    console.log('')
    console.log('🎉 Импорт завершён успешно!')

  } catch (error) {
    console.error('❌ Ошибка импорта:', error.message)
    process.exit(1)
  }
}

// Создание таблиц
async function ensureTables() {
  // Таблицы должны создаваться через миграции Supabase
  // Здесь просто проверяем их наличие

  const tables = ['catalog_categories', 'catalog_subcategories', 'catalog_verified_suppliers', 'catalog_verified_products']

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    if (error && error.code === '42P01') {
      console.log(`   ⚠️  Таблица ${table} не существует. Создайте её через SQL Editor в Supabase.`)
      console.log(`   Скачайте SQL схему: ${SOURCE_URL}?format=sql`)
      process.exit(1)
    }
  }
}

// Импорт категорий
async function importCategories(categories) {
  const map = {} // oldName -> newId

  for (const cat of categories) {
    // Проверяем существует ли категория
    const { data: existing } = await supabase
      .from('catalog_categories')
      .select('id')
      .eq('name', cat.name)
      .single()

    if (existing) {
      map[cat.name] = existing.id
      continue
    }

    // Создаём новую
    const { data, error } = await supabase
      .from('catalog_categories')
      .insert({
        name: cat.name,
        key: cat.key,
        description: cat.description,
        icon: cat.icon,
        is_active: cat.is_active !== false
      })
      .select('id')
      .single()

    if (error) {
      console.error(`   ⚠️  Ошибка категории "${cat.name}":`, error.message)
      continue
    }

    map[cat.name] = data.id
  }

  return map
}

// Импорт подкатегорий
async function importSubcategories(subcategories, categoryMap) {
  const map = {} // oldId -> newId

  for (const sub of subcategories) {
    // Находим родительскую категорию по имени
    const parentCategory = Object.entries(categoryMap).find(([name, id]) => {
      // Ищем по category_id из оригинальных данных
      return true // Упрощённо - импортируем все
    })

    // Проверяем существует ли подкатегория
    const { data: existing } = await supabase
      .from('catalog_subcategories')
      .select('id')
      .eq('name', sub.name)
      .single()

    if (existing) {
      map[sub.id] = existing.id
      continue
    }

    // Создаём новую
    const { data, error } = await supabase
      .from('catalog_subcategories')
      .insert({
        name: sub.name,
        key: sub.key,
        category_id: sub.category_id, // Используем напрямую если UUID совпадают
        is_active: true
      })
      .select('id')
      .single()

    if (error) {
      console.error(`   ⚠️  Ошибка подкатегории "${sub.name}":`, error.message)
      continue
    }

    map[sub.id] = data.id
  }

  return map
}

// Импорт поставщиков
async function importSuppliers(suppliers) {
  const map = {} // oldId -> newId

  for (const sup of suppliers) {
    // Проверяем существует ли поставщик
    const { data: existing } = await supabase
      .from('catalog_verified_suppliers')
      .select('id')
      .eq('name', sup.name)
      .single()

    if (existing) {
      map[sup.id] = existing.id
      continue
    }

    // Создаём нового
    const { data, error } = await supabase
      .from('catalog_verified_suppliers')
      .insert({
        name: sup.name,
        company_name: sup.company_name,
        category: sup.category,
        country: sup.country,
        city: sup.city,
        description: sup.description,
        is_active: sup.is_active !== false,
        is_verified: sup.is_verified === true,
        moderation_status: sup.moderation_status || 'approved',
        contact_email: sup.contact_email,
        min_order: sup.min_order,
        response_time: sup.response_time,
        public_rating: sup.public_rating
      })
      .select('id')
      .single()

    if (error) {
      console.error(`   ⚠️  Ошибка поставщика "${sup.name}":`, error.message)
      continue
    }

    map[sup.id] = data.id
  }

  return map
}

// Импорт товаров
async function importProducts(products, categoryMap, subcategoryMap, supplierMap) {
  let imported = 0
  const batchSize = 50

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)

    const productsToInsert = batch.map(prod => ({
      name: prod.name,
      description: prod.description,
      category: prod.category,
      sku: prod.sku,
      price: prod.price,
      currency: prod.currency || 'RUB',
      min_order: prod.min_order,
      in_stock: prod.in_stock !== false,
      specifications: prod.specifications,
      images: prod.images,
      is_active: prod.is_active !== false,
      is_featured: prod.is_featured === true,
      // Маппинг ID
      category_id: prod.category_id,
      subcategory_id: subcategoryMap[prod.subcategory_id] || prod.subcategory_id,
      supplier_id: supplierMap[prod.supplier_id] || prod.supplier_id
    }))

    const { data, error } = await supabase
      .from('catalog_verified_products')
      .upsert(productsToInsert, {
        onConflict: 'sku',
        ignoreDuplicates: true
      })
      .select('id')

    if (error) {
      console.error(`   ⚠️  Ошибка batch ${i}-${i + batchSize}:`, error.message)
    } else {
      imported += data?.length || batch.length
    }

    // Прогресс
    process.stdout.write(`\r   📦 Прогресс: ${Math.min(i + batchSize, products.length)}/${products.length}`)
  }

  console.log('') // Новая строка после прогресса
  return imported
}

// Запуск
importCatalog()
