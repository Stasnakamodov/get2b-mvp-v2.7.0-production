#!/usr/bin/env node
/**
 * Миграция товаров из A-SPECTORG (code) → Get2B catalog_verified_products
 *
 * Источник: /Users/user/Downloads/code/database-dump/products.json  (~1,489 товаров)
 *           /Users/user/Downloads/code/database-dump/categories.json (42 категории)
 *
 * Запуск:
 *   node scripts/migrate-aspec-to-get2b.mjs --dry-run   # превью без записи
 *   node scripts/migrate-aspec-to-get2b.mjs              # реальная миграция
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ─── Конфигурация ──────────────────────────────────────────────
const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'

const DUMP_DIR = '/Users/user/Downloads/code/database-dump'
const BATCH_SIZE = 50
const DRY_RUN = process.argv.includes('--dry-run')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ─── Маппинг category_id → плоская категория Get2B ─────────────
// Построим из categories.json: subcategory UUID → top-level category name
function buildCategoryMap(categories) {
  const map = {}

  // Родительские категории (parent_id === null)
  const parents = {}
  for (const cat of categories) {
    if (!cat.parent_id) {
      parents[cat.id] = cat.name
    }
  }

  // Маппинг родительских категорий A-SPECTORG → плоские Get2B категории
  const parentToGet2b = {
    'Электроника': 'Электроника',
    'Дом и быт': 'Дом и быт',
    'Здоровье и красота': 'Здоровье и красота',
    'Строительство': 'Строительство',
    'Автотовары': 'Автотовары',
    'Промышленность': 'Строительство', // промышленность → строительство
    'Профессиональная литература': 'Дом и быт', // книги → дом и быт
  }

  // Каждый category_id (включая подкатегории) → Get2B category
  for (const cat of categories) {
    let parentName
    if (!cat.parent_id) {
      parentName = cat.name
    } else {
      parentName = parents[cat.parent_id] || null
    }

    if (parentName && parentToGet2b[parentName]) {
      map[cat.id] = parentToGet2b[parentName]
    }
  }

  return map
}

// ─── Фильтрация изображений ────────────────────────────────────
function filterImages(images) {
  if (!images || !Array.isArray(images)) return []

  const seen = new Set()
  const good = []

  for (const url of images) {
    if (!url || typeof url !== 'string') continue
    // Отбрасываем placeholder-ы и сломанные URL
    if (url.includes('_XXX_KKK_')) continue
    if (url.includes('dummyimage')) continue
    if (url.includes('loremflickr')) continue
    if (url.includes('picsum.photos')) continue
    if (url.includes('placeholder')) continue
    // Оставляем только реальные alicdn URL
    if (!url.includes('alicdn.com')) continue
    // Дедупликация
    if (seen.has(url)) continue
    seen.add(url)
    good.push(url)
  }

  return good.slice(0, 10) // Максимум 10 изображений
}

// ─── Трансформация продукта ─────────────────────────────────────
function transformProduct(product, categoryMap, supplierId) {
  const images = filterImages(product.images)
  if (images.length === 0) return null

  const price = parseFloat(product.price)
  if (!price || price <= 0) return null

  const category = categoryMap[product.category_id]
  if (!category) return null

  const minOrder = product.min_order
    ? `${product.min_order} шт.`
    : '1 шт.'

  return {
    name: product.name,
    description: product.description || '',
    category,
    sku: `ASPEC-${product.sku}`,
    price: product.price,
    currency: product.currency || 'RUB',
    min_order: minOrder,
    in_stock: product.in_stock !== false,
    images,
    specifications: product.specifications || {},
    supplier_id: supplierId,
    is_active: true,
    is_featured: false,
  }
}

// ─── Создание / получение поставщика ────────────────────────────
async function getOrCreateSupplier() {
  const supplierName = 'A-SPECTORG Import'

  const { data: existing } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .eq('name', supplierName)
    .single()

  if (existing) {
    console.log(`Поставщик "${supplierName}" уже существует: ${existing.id}`)
    return existing.id
  }

  const { data: newSupplier, error } = await supabase
    .from('catalog_verified_suppliers')
    .insert([{
      name: supplierName,
      company_name: 'A-SPECTORG (импорт из каталога)',
      category: 'Дом и быт',
      country: 'Китай',
      city: 'Гуанчжоу',
      description: 'Импорт товаров из каталога A-SPECTORG. Широкий ассортимент: дом и быт, электроника, здоровье, строительство, автотовары.',
      is_active: true,
      is_verified: true,
      moderation_status: 'approved',
      contact_email: 'import@a-spectorg.ru',
      min_order: 'От 1 шт.',
      response_time: '1-3 дня',
      public_rating: 4.5,
      certifications: ['Verified Catalog'],
      specialties: ['Дом и быт', 'Электроника', 'Здоровье и красота', 'Строительство', 'Автотовары'],
    }])
    .select()
    .single()

  if (error) {
    console.error('Ошибка создания поставщика:', error.message)
    process.exit(1)
  }

  console.log(`Поставщик "${supplierName}" создан: ${newSupplier.id}`)
  return newSupplier.id
}

// ─── Batch upsert ───────────────────────────────────────────────
async function batchInsert(rows) {
  let totalInserted = 0
  let totalSkipped = 0
  let totalErrors = 0
  const errors = []

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const totalBatches = Math.ceil(rows.length / BATCH_SIZE)

    const { data, error } = await supabase
      .from('catalog_verified_products')
      .upsert(batch, { onConflict: 'sku', ignoreDuplicates: true })
      .select('id')

    if (error) {
      // Fallback: вставляем по одному
      let batchOk = 0
      for (const row of batch) {
        const { error: singleErr } = await supabase
          .from('catalog_verified_products')
          .upsert([row], { onConflict: 'sku', ignoreDuplicates: true })

        if (singleErr) {
          totalErrors++
          errors.push(`${row.sku}: ${singleErr.message}`)
        } else {
          batchOk++
        }
      }
      totalInserted += batchOk
      console.log(`  Batch ${batchNum}/${totalBatches}: ${batchOk}/${batch.length} (fallback, ошибок: ${batch.length - batchOk})`)
    } else {
      const count = data?.length || batch.length
      totalInserted += count
      if (batchNum % 5 === 0 || batchNum === totalBatches) {
        console.log(`  Batch ${batchNum}/${totalBatches}: +${count} (всего: ${totalInserted})`)
      }
    }
  }

  return { totalInserted, totalSkipped, totalErrors, errors }
}

// ─── Верификация ────────────────────────────────────────────────
async function verify() {
  console.log('\n══════════════════════════════════════════════')
  console.log('  ВЕРИФИКАЦИЯ')
  console.log('══════════════════════════════════════════════\n')

  // Подсчёт по категориям
  const categories = ['Дом и быт', 'Строительство', 'Электроника', 'Здоровье и красота', 'Автотовары']

  for (const cat of categories) {
    const { count } = await supabase
      .from('catalog_verified_products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('category', cat)

    console.log(`  ${cat}: ${count}`)
  }

  // Общий подсчёт
  const { count: total } = await supabase
    .from('catalog_verified_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  console.log(`\n  ВСЕГО активных: ${total}`)

  // Подсчёт ASPEC
  const { count: aspecCount } = await supabase
    .from('catalog_verified_products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .like('sku', 'ASPEC-%')

  console.log(`  Из них ASPEC-: ${aspecCount}`)

  // Spot-check: 5 случайных товаров ASPEC
  const { data: samples } = await supabase
    .from('catalog_verified_products')
    .select('sku, name, category, images')
    .like('sku', 'ASPEC-%')
    .eq('is_active', true)
    .limit(5)

  if (samples?.length) {
    console.log('\n  Примеры импортированных товаров:')
    for (const s of samples) {
      const imgCount = s.images?.length || 0
      const firstImg = s.images?.[0]?.substring(0, 60) || 'нет'
      console.log(`    ${s.sku} | ${s.category} | ${s.name.substring(0, 40)}`)
      console.log(`      Изображений: ${imgCount}, первое: ${firstImg}...`)
    }
  }
}

// ─── MAIN ───────────────────────────────────────────────────────
async function main() {
  console.log('══════════════════════════════════════════════')
  console.log('  МИГРАЦИЯ A-SPECTORG → Get2B')
  console.log(`  Режим: ${DRY_RUN ? 'DRY RUN (без записи)' : 'РЕАЛЬНАЯ МИГРАЦИЯ'}`)
  console.log(`  Дата: ${new Date().toISOString()}`)
  console.log('══════════════════════════════════════════════\n')

  // 1. Загрузка дампов
  console.log('Шаг 1: Загрузка JSON дампов...')
  const products = JSON.parse(readFileSync(`${DUMP_DIR}/products.json`, 'utf-8'))
  const categories = JSON.parse(readFileSync(`${DUMP_DIR}/categories.json`, 'utf-8'))
  console.log(`  Товаров: ${products.length}`)
  console.log(`  Категорий: ${categories.length}`)

  // 2. Построение маппинга категорий
  console.log('\nШаг 2: Построение маппинга категорий...')
  const categoryMap = buildCategoryMap(categories)
  const mappedCategories = new Set(Object.values(categoryMap))
  console.log(`  Замаплено UUID → категория: ${Object.keys(categoryMap).length}`)
  console.log(`  Целевые категории: ${[...mappedCategories].join(', ')}`)

  // 3. Создание поставщика
  let supplierId = 'dry-run-supplier-id'
  if (!DRY_RUN) {
    console.log('\nШаг 3: Создание поставщика...')
    supplierId = await getOrCreateSupplier()
  } else {
    console.log('\nШаг 3: [DRY RUN] Пропуск создания поставщика')
  }

  // 4. Трансформация товаров
  console.log('\nШаг 4: Трансформация товаров...')
  const transformed = []
  const rejected = { noImages: 0, noPrice: 0, noCategory: 0 }

  for (const p of products) {
    // Пропускаем удалённые
    if (p.deleted_at) {
      rejected.noCategory++
      continue
    }
    const row = transformProduct(p, categoryMap, supplierId)
    if (row) {
      transformed.push(row)
    } else {
      // Определяем причину отказа
      const images = filterImages(p.images)
      if (images.length === 0) rejected.noImages++
      else if (!parseFloat(p.price) || parseFloat(p.price) <= 0) rejected.noPrice++
      else rejected.noCategory++
    }
  }

  console.log(`  Прошли фильтр: ${transformed.length}`)
  console.log(`  Отклонено:`)
  console.log(`    Нет изображений: ${rejected.noImages}`)
  console.log(`    Нет цены: ${rejected.noPrice}`)
  console.log(`    Нет категории: ${rejected.noCategory}`)

  // Статистика по категориям
  const catStats = {}
  for (const row of transformed) {
    catStats[row.category] = (catStats[row.category] || 0) + 1
  }
  console.log('\n  По категориям:')
  for (const [cat, count] of Object.entries(catStats).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat}: ${count}`)
  }

  // 5. Вставка
  if (DRY_RUN) {
    console.log('\n══════════════════════════════════════════════')
    console.log('  DRY RUN завершён. Для реальной миграции:')
    console.log('  node scripts/migrate-aspec-to-get2b.mjs')
    console.log('══════════════════════════════════════════════')
    return
  }

  console.log(`\nШаг 5: Вставка ${transformed.length} товаров батчами по ${BATCH_SIZE}...`)
  const t0 = Date.now()
  const result = await batchInsert(transformed)
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)

  console.log(`\n  Вставлено: ${result.totalInserted}`)
  console.log(`  Ошибок: ${result.totalErrors}`)
  console.log(`  Время: ${elapsed}с`)

  if (result.errors.length > 0) {
    console.log(`\n  Первые ошибки:`)
    for (const e of result.errors.slice(0, 10)) {
      console.log(`    ${e}`)
    }
  }

  // 6. Верификация
  await verify()

  console.log('\n══════════════════════════════════════════════')
  console.log('  МИГРАЦИЯ ЗАВЕРШЕНА')
  console.log('══════════════════════════════════════════════')
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
