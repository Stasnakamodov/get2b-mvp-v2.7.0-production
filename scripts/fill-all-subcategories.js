#!/usr/bin/env node
/**
 * Массовый импорт товаров во все незаполненные подкатегории
 * Цель: довести каждую до 188 товаров
 * Импорт в оба Supabase: Get2B и целевой
 */

const { createClient } = require('@supabase/supabase-js')

const OTAPI_KEY = '0e4fb57d-d80e-4274-acc5-f22f354e3577'

// Get2B Supabase
const get2b = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Target Supabase
const target = createClient(
  'https://rbngpxwamfkunktxjtqh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU5OTk0NywiZXhwIjoyMDY0MTc1OTQ3fQ.UnPSq_-7-PlzoYQFSvVUOwu4U6dirDoFyQQG08P7Jek'
)

// План импорта с OTAPI запросами
const IMPORT_PLAN = [
  {
    category: 'Автотовары',
    subcategory: 'Автохимия',
    subcategoryId: '50ff139b-44da-4e8b-a425-5482e6d877b8',
    needToAdd: 179,
    queries: ['car wash', 'car wax', 'car polish', 'engine oil', 'car cleaner', 'car coating', 'tire shine']
  },
  {
    category: 'Дом и быт',
    subcategory: 'Спальня',
    subcategoryId: '62cce76e-b71c-49b4-a5f0-1053db95512c',
    needToAdd: 170,
    queries: ['bedding set', 'pillow', 'mattress topper', 'bed sheet', 'blanket', 'duvet cover', 'sleeping pillow']
  },
  {
    category: 'Здоровье и красота',
    subcategory: 'Уход за кожей',
    subcategoryId: '163a62b5-cb16-4722-a2a1-153d4b398812',
    needToAdd: 178,
    queries: ['face cream', 'skin care', 'moisturizer', 'face serum', 'sunscreen', 'face mask', 'eye cream']
  },
  {
    category: 'Здоровье и медицина',
    subcategory: 'Медицинские изделия',
    subcategoryId: 'dabd00b9-d303-4a85-bb15-88deca77af94',
    needToAdd: 188,
    queries: ['blood pressure monitor', 'thermometer', 'pulse oximeter', 'medical mask', 'first aid', 'bandage', 'medical gloves']
  },
  {
    category: 'Продукты питания',
    subcategory: 'Напитки',
    subcategoryId: '060aff64-9663-46cb-b56b-766bd3eda375',
    needToAdd: 188,
    queries: ['tea', 'coffee beans', 'green tea', 'herbal tea', 'instant coffee', 'oolong tea', 'black tea']
  },
  {
    category: 'Промышленность',
    subcategory: 'Станки и оборудование',
    subcategoryId: '5593b601-d55e-4e3c-b992-79c3572700d1',
    needToAdd: 158,
    queries: ['cnc machine', 'lathe machine', 'milling machine', 'drilling machine', 'grinding machine', 'cutting machine']
  },
  {
    category: 'Строительство',
    subcategory: 'Электрика',
    subcategoryId: '77b61a5e-53fc-4b65-b492-2c4167f0b5e9',
    needToAdd: 181,
    queries: ['wire cable', 'circuit breaker', 'electrical switch', 'socket outlet', 'led bulb', 'junction box', 'wire connector']
  },
  {
    category: 'Текстиль и одежда',
    subcategory: 'Домашний текстиль',
    subcategoryId: '6b80bf36-7b65-4ccc-a42d-5c4a174d80f8',
    needToAdd: 188,
    queries: ['towel', 'bath towel', 'kitchen towel', 'curtain', 'tablecloth', 'carpet', 'rug mat']
  },
  {
    category: 'Электроника',
    subcategory: 'Компьютеры и ноутбуки',
    subcategoryId: '1b0e18f8-e062-4c12-8d0f-955edfbc59cd',
    needToAdd: 188,
    queries: ['laptop stand', 'keyboard', 'mouse', 'usb hub', 'webcam', 'monitor stand', 'laptop bag', 'ssd']
  }
]

async function searchOTAPI(query, limit) {
  const xmlParameters = `<SearchItemsParameters><Provider>Taobao</Provider><SearchMethod>Catalog</SearchMethod><ItemTitle>${query}</ItemTitle></SearchItemsParameters>`
  const params = new URLSearchParams({
    instanceKey: OTAPI_KEY,
    language: 'ru',
    xmlParameters,
    framePosition: '0',
    frameSize: limit.toString()
  })

  try {
    const response = await fetch('http://otapi.net/service-json/SearchItemsFrame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: params.toString()
    })
    const data = await response.json()
    return data.Result?.Items?.Content || []
  } catch (err) {
    console.log('    OTAPI error:', err.message)
    return []
  }
}

function formatProduct(item, category, subcategoryId, supplierId) {
  const images = []
  if (item.MainPictureUrl) images.push(item.MainPictureUrl)
  if (item.Pictures?.length > 0) {
    item.Pictures.slice(0, 5).forEach(pic => {
      const url = pic.Url || pic
      if (url && typeof url === 'string') images.push(url)
    })
  }

  const specifications = {}
  if (item.FeaturedValues?.length > 0) {
    item.FeaturedValues.forEach(fv => {
      if (fv.Name === 'SalesInLast30Days') specifications['Продаж за 30 дней'] = fv.Value + ' шт.'
    })
  }
  if (item.VendorName) specifications['Продавец'] = item.VendorName

  let price = 0
  if (item.Price?.ConvertedPriceList?.Internal?.Price) {
    price = parseFloat(item.Price.ConvertedPriceList.Internal.Price)
  } else if (item.Price?.OriginalPrice) {
    price = parseFloat(item.Price.OriginalPrice) * 13
  }

  return {
    name: item.Title || item.OriginalTitle || 'Товар',
    description: `${item.Title || ''}\n\nТовар с Taobao. Продавец: ${item.VendorName || 'н/д'}`,
    category: category,
    subcategory_id: subcategoryId,
    sku: `OTAPI-${item.Id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    price: Math.round(price * 100) / 100,
    currency: 'RUB',
    min_order: '1 шт.',
    in_stock: true,
    specifications,
    images: images.slice(0, 6),
    supplier_id: supplierId,
    is_active: true,
    is_featured: false
  }
}

// Get or create supplier
async function getSupplier() {
  let { data: supplier } = await get2b
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'OTAPI Taobao Import')
    .single()

  if (!supplier) {
    const { data: newSup } = await get2b
      .from('catalog_verified_suppliers')
      .insert({
        name: 'OTAPI Taobao Import',
        company_name: 'Taobao через OTAPI',
        country: 'Китай',
        is_active: true,
        is_verified: true,
        moderation_status: 'approved'
      })
      .select('id')
      .single()
    supplier = newSup
  }
  return supplier.id
}

// Get target category mapping
async function getTargetCategoryMap() {
  const { data: cats } = await target.from('categories').select('id, name, slug')
  const map = {}
  for (const c of cats || []) {
    map[c.name.toLowerCase()] = c.id
    map[c.slug] = c.id
  }
  return map
}

// Get target supplier
async function getTargetSupplier() {
  const { data: suppliers } = await target.from('suppliers').select('id, name')
  const otapi = suppliers?.find(s => s.name.includes('OTAPI'))
  return otapi?.id || null
}

async function main() {
  console.log('🚀 МАССОВЫЙ ИМПОРТ В ОБА КАТАЛОГА')
  console.log('='.repeat(60))
  console.log('Цель: довести каждую подкатегорию до 188 товаров\n')

  const supplierId = await getSupplier()
  const targetCatMap = await getTargetCategoryMap()
  const targetSupplierId = await getTargetSupplier()

  console.log('📦 Поставщик Get2B:', supplierId)
  console.log('📦 Поставщик Target:', targetSupplierId)
  console.log('')

  let totalAdded = 0
  let totalSynced = 0

  for (const plan of IMPORT_PLAN) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📁 ${plan.category} → ${plan.subcategory}`)
    console.log(`   Нужно добавить: ${plan.needToAdd}`)
    console.log('='.repeat(60))

    let addedThisCategory = 0
    const productsToSync = []

    for (const query of plan.queries) {
      if (addedThisCategory >= plan.needToAdd) break

      const remaining = plan.needToAdd - addedThisCategory
      const fetchCount = Math.min(remaining + 10, 40) // fetch extra for duplicates

      console.log(`\n🔍 "${query}" (нужно ещё ${remaining})...`)

      const items = await searchOTAPI(query, fetchCount)
      console.log(`   Найдено: ${items.length}`)

      if (items.length === 0) continue

      for (const item of items) {
        if (addedThisCategory >= plan.needToAdd) break

        const product = formatProduct(item, plan.category, plan.subcategoryId, supplierId)

        // Check duplicate by name
        const { data: existing } = await get2b
          .from('catalog_verified_products')
          .select('id')
          .eq('name', product.name)
          .single()

        if (existing) continue

        // Insert to Get2B
        const { data: inserted, error } = await get2b
          .from('catalog_verified_products')
          .insert(product)
          .select('id, name, sku, price, images, specifications')
          .single()

        if (error) {
          console.log(`   ❌ ${error.message}`)
          continue
        }

        addedThisCategory++
        totalAdded++
        productsToSync.push({ ...product, get2bId: inserted.id })

        if (addedThisCategory % 20 === 0) {
          console.log(`   ✅ Добавлено: ${addedThisCategory}/${plan.needToAdd}`)
        }
      }

      // Small delay between queries
      await new Promise(r => setTimeout(r, 300))
    }

    console.log(`\n   📊 Добавлено в Get2B: ${addedThisCategory}`)

    // Sync to target Supabase
    if (productsToSync.length > 0 && targetSupplierId) {
      console.log(`   🔄 Синхронизация в целевой Supabase...`)

      // Find target category
      const catKey = plan.category.toLowerCase()
      let targetCatId = targetCatMap[catKey]

      // Try slug match
      if (!targetCatId) {
        const slug = plan.category.toLowerCase()
          .replace(/[^a-zа-яё0-9]/gi, '-')
          .replace(/-+/g, '-')
        targetCatId = targetCatMap[slug]
      }

      if (targetCatId) {
        const batchSize = 50
        for (let i = 0; i < productsToSync.length; i += batchSize) {
          const batch = productsToSync.slice(i, i + batchSize).map(p => ({
            name: p.name,
            description: p.description,
            sku: p.sku,
            price: p.price,
            currency: 'USD',
            min_order: 1,
            in_stock: true,
            images: p.images || [],
            specifications: p.specifications || {},
            tags: [],
            supplier_id: targetSupplierId,
            category_id: targetCatId
          }))

          const { data, error } = await target
            .from('products')
            .upsert(batch, { onConflict: 'sku' })
            .select('id')

          if (!error && data) {
            totalSynced += data.length
          }
        }
        console.log(`   ✅ Синхронизировано: ${productsToSync.length}`)
      } else {
        console.log(`   ⚠️ Категория не найдена в целевом Supabase`)
      }
    }
  }

  // Final stats
  console.log('\n' + '='.repeat(60))
  console.log('📊 ИТОГОВАЯ СТАТИСТИКА')
  console.log('='.repeat(60))
  console.log(`✅ Добавлено в Get2B: ${totalAdded}`)
  console.log(`✅ Синхронизировано в Target: ${totalSynced}`)

  // Count totals
  const { count: get2bTotal } = await get2b.from('catalog_verified_products').select('id', { count: 'exact', head: true })
  const { count: targetTotal } = await target.from('products').select('id', { count: 'exact', head: true })

  console.log(`\n📦 Всего товаров:`)
  console.log(`   Get2B: ${get2bTotal}`)
  console.log(`   Target: ${targetTotal}`)
  console.log('='.repeat(60))
}

main().catch(console.error)
