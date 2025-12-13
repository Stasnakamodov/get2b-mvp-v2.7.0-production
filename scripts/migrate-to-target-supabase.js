#!/usr/bin/env node
/**
 * Миграция каталога Get2B в целевой Supabase
 * Учитывает разницу в структуре таблиц
 */

const { createClient } = require('@supabase/supabase-js')

// SOURCE - Get2B
const SOURCE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co'
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'

// TARGET - новый проект
const TARGET_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co'
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU5OTk0NywiZXhwIjoyMDY0MTc1OTQ3fQ.UnPSq_-7-PlzoYQFSvVUOwu4U6dirDoFyQQG08P7Jek'

const source = createClient(SOURCE_URL, SOURCE_KEY)
const target = createClient(TARGET_URL, TARGET_KEY)

async function migrate() {
  console.log('🚀 Миграция каталога Get2B → Целевой Supabase\n')

  try {
    // 1. Загрузка данных из источника
    console.log('📥 Загрузка данных из Get2B...')

    const [
      { data: srcCategories, error: e1 },
      { data: srcSubcategories, error: e2 },
      { data: srcSuppliers, error: e3 },
      { data: srcProducts, error: e4 }
    ] = await Promise.all([
      source.from('catalog_categories').select('*'),
      source.from('catalog_subcategories').select('*'),
      source.from('catalog_verified_suppliers').select('*'),
      source.from('catalog_verified_products').select('*')
    ])

    if (e1) throw new Error(`Ошибка категорий: ${e1.message}`)
    if (e2) throw new Error(`Ошибка подкатегорий: ${e2.message}`)
    if (e3) throw new Error(`Ошибка поставщиков: ${e3.message}`)
    if (e4) throw new Error(`Ошибка товаров: ${e4.message}`)

    console.log(`✅ Загружено:`)
    console.log(`   - ${srcCategories?.length || 0} категорий`)
    console.log(`   - ${srcSubcategories?.length || 0} подкатегорий`)
    console.log(`   - ${srcSuppliers?.length || 0} поставщиков`)
    console.log(`   - ${srcProducts?.length || 0} товаров\n`)

    // 2. Импорт категорий (level 1)
    console.log('📁 Импорт категорий...')
    const categoryMap = {} // old_id -> new_id

    for (const cat of srcCategories || []) {
      const slug = (cat.key || cat.name).toLowerCase()
        .replace(/[^a-zа-яё0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      const { data, error } = await target
        .from('categories')
        .upsert({
          name: cat.name,
          slug: slug,
          icon: cat.icon || null,
          parent_id: null,
          level: 1,
          display_order: 0
        }, { onConflict: 'slug' })
        .select('id, name')
        .single()

      if (error) {
        // Попробуем найти существующую
        const { data: existing } = await target
          .from('categories')
          .select('id')
          .eq('slug', slug)
          .single()

        if (existing) {
          categoryMap[cat.id] = existing.id
          console.log(`   ⚡ ${cat.name} (уже есть)`)
        } else {
          console.log(`   ⚠️ Ошибка "${cat.name}": ${error.message}`)
        }
      } else if (data) {
        categoryMap[cat.id] = data.id
        console.log(`   ✅ ${cat.name}`)
      }
    }

    // 3. Импорт подкатегорий (level 2)
    console.log('\n📂 Импорт подкатегорий...')
    const subcategoryMap = {} // old_id -> new_id

    for (const sub of srcSubcategories || []) {
      const parentId = categoryMap[sub.category_id]
      if (!parentId) {
        console.log(`   ⚠️ Пропуск "${sub.name}" - нет родителя`)
        continue
      }

      const slug = (sub.key || sub.name).toLowerCase()
        .replace(/[^a-zа-яё0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      const { data, error } = await target
        .from('categories')
        .upsert({
          name: sub.name,
          slug: slug,
          icon: sub.icon || null,
          parent_id: parentId,
          level: 2,
          display_order: 0
        }, { onConflict: 'slug' })
        .select('id')
        .single()

      if (error) {
        const { data: existing } = await target
          .from('categories')
          .select('id')
          .eq('slug', slug)
          .single()

        if (existing) {
          subcategoryMap[sub.id] = existing.id
          console.log(`   ⚡ ${sub.name} (уже есть)`)
        } else {
          console.log(`   ⚠️ Ошибка "${sub.name}": ${error.message}`)
        }
      } else if (data) {
        subcategoryMap[sub.id] = data.id
        console.log(`   ✅ ${sub.name}`)
      }
    }

    // 4. Импорт поставщиков
    console.log('\n🏪 Импорт поставщиков...')
    const supplierMap = {} // old_id -> new_id

    for (const sup of srcSuppliers || []) {
      const { data, error } = await target
        .from('suppliers')
        .upsert({
          name: sup.name || sup.company_name,
          description: sup.description || null,
          country: sup.country || null,
          logo_url: null,
          verified: sup.is_verified === true,
          rating: sup.public_rating || 0
        }, { onConflict: 'name' })
        .select('id')
        .single()

      if (error) {
        const { data: existing } = await target
          .from('suppliers')
          .select('id')
          .eq('name', sup.name || sup.company_name)
          .single()

        if (existing) {
          supplierMap[sup.id] = existing.id
          console.log(`   ⚡ ${sup.name} (уже есть)`)
        } else {
          console.log(`   ⚠️ Ошибка "${sup.name}": ${error.message}`)
        }
      } else if (data) {
        supplierMap[sup.id] = data.id
        console.log(`   ✅ ${sup.name}`)
      }
    }

    // 5. Импорт товаров батчами
    console.log('\n📦 Импорт товаров...')
    let imported = 0
    let skipped = 0
    const batchSize = 50

    for (let i = 0; i < (srcProducts?.length || 0); i += batchSize) {
      const batch = srcProducts.slice(i, i + batchSize)

      const productsToInsert = batch.map(p => {
        // Определяем category_id
        let categoryId = null
        if (p.subcategory_id && subcategoryMap[p.subcategory_id]) {
          categoryId = subcategoryMap[p.subcategory_id]
        } else if (p.category_id && categoryMap[p.category_id]) {
          categoryId = categoryMap[p.category_id]
        }

        // images: Get2B хранит как JSONB массив, целевой - как text[]
        let images = []
        if (p.images) {
          if (Array.isArray(p.images)) {
            images = p.images
          } else if (typeof p.images === 'string') {
            try { images = JSON.parse(p.images) } catch { images = [] }
          }
        }

        return {
          name: p.name,
          description: p.description || null,
          sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          price: parseFloat(p.price) || 0,
          currency: p.currency || 'USD',
          min_order: parseInt(p.min_order) || 1,
          in_stock: p.in_stock !== false,
          images: images,
          specifications: p.specifications || {},
          tags: [],
          supplier_id: supplierMap[p.supplier_id] || null,
          category_id: categoryId
        }
      })

      const { data, error } = await target
        .from('products')
        .upsert(productsToInsert, {
          onConflict: 'sku',
          ignoreDuplicates: false
        })
        .select('id')

      if (error) {
        console.log(`   ⚠️ Batch ${i}-${i + batchSize}: ${error.message}`)
        skipped += batch.length
      } else {
        imported += data?.length || batch.length
      }

      process.stdout.write(`\r   📦 Прогресс: ${Math.min(i + batchSize, srcProducts.length)}/${srcProducts.length}`)
    }

    console.log(`\n   ✅ Импортировано: ${imported}, пропущено: ${skipped}`)

    // 6. Обновление счётчиков product_count
    console.log('\n📊 Обновление счётчиков категорий...')

    const { data: allCategories } = await target.from('categories').select('id')
    for (const cat of allCategories || []) {
      const { count } = await target
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)

      await target
        .from('categories')
        .update({ product_count: count || 0 })
        .eq('id', cat.id)
    }

    console.log('\n🎉 Миграция завершена успешно!')

  } catch (error) {
    console.error('\n❌ Ошибка миграции:', error.message)
    process.exit(1)
  }
}

migrate()
