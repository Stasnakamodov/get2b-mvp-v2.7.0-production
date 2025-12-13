#!/usr/bin/env node
/**
 * Импорт высокооборотных промышленных товаров через OTAPI
 * Цель: добавить 188 товаров в категорию "Промышленность"
 */

const { createClient } = require('@supabase/supabase-js')

const OTAPI_KEY = process.env.OTAPI_INSTANCE_KEY || '0e4fb57d-d80e-4274-acc5-f22f354e3577'

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Высокооборотные промышленные запросы
const INDUSTRY_QUERIES = [
  // Электроинструменты - очень популярно
  { query: 'electric drill', subcategory: 'Инструменты', count: 25 },
  { query: 'angle grinder', subcategory: 'Инструменты', count: 20 },
  { query: 'power tools', subcategory: 'Инструменты', count: 20 },

  // Электротехника - всегда в спросе
  { query: 'led driver', subcategory: 'Электротехника', count: 20 },
  { query: 'power supply 12v', subcategory: 'Электротехника', count: 20 },
  { query: 'cable connector', subcategory: 'Электротехника', count: 15 },

  // Расходные материалы - самые ходовые
  { query: 'cutting disc', subcategory: 'Расходные материалы', count: 20 },
  { query: 'sandpaper', subcategory: 'Расходные материалы', count: 15 },
  { query: 'drill bit set', subcategory: 'Расходные материалы', count: 18 },

  // Станки и оборудование
  { query: 'mini lathe', subcategory: 'Станки и оборудование', count: 15 }
]

async function searchOTAPI(query, limit) {
  const xmlParameters = `
    <SearchItemsParameters>
      <Provider>Taobao</Provider>
      <SearchMethod>Catalog</SearchMethod>
      <ItemTitle>${query}</ItemTitle>
    </SearchItemsParameters>
  `.trim()

  const params = new URLSearchParams({
    instanceKey: OTAPI_KEY,
    language: 'ru',
    xmlParameters,
    framePosition: '0',
    frameSize: limit.toString()
  })

  const response = await fetch('http://otapi.net/service-json/SearchItemsFrame', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  })

  const data = await response.json()

  return data.Result?.Items?.Content ||
         data.Result?.SearchResult?.Items?.Content ||
         data.OtapiResponse?.Result?.SearchResult?.Items?.Content ||
         []
}

function formatProduct(item, subcategoryId, supplierId) {
  const images = []
  if (item.MainPictureUrl) images.push(item.MainPictureUrl)
  if (item.Pictures?.length > 0) {
    item.Pictures.forEach(pic => {
      const url = pic.Url || pic
      if (url && typeof url === 'string') images.push(url)
    })
  }

  const specifications = {}
  if (item.FeaturedValues?.length > 0) {
    item.FeaturedValues.forEach(fv => {
      if (fv.Name === 'reviews') specifications['Отзывов'] = fv.Value
      if (fv.Name === 'SalesInLast30Days') specifications['Продаж за 30 дней'] = fv.Value + ' шт.'
      if (fv.Name === 'favCount') specifications['В избранном'] = fv.Value + ' раз'
    })
  }
  if (item.VendorName) specifications['Продавец'] = item.VendorName
  if (item.Location?.City) specifications['Город'] = item.Location.City

  let price = 0
  if (item.Price?.ConvertedPriceList?.Internal?.Price) {
    price = parseFloat(item.Price.ConvertedPriceList.Internal.Price)
  } else if (item.Price?.ConvertedPrice) {
    price = parseFloat(item.Price.ConvertedPrice.replace(/[^0-9.]/g, ''))
  } else if (item.Price?.OriginalPrice) {
    price = parseFloat(item.Price.OriginalPrice) * 13
  }

  return {
    name: item.Title || item.OriginalTitle || 'Товар без названия',
    description: item.Description || `${item.Title || ''}\n\nПромышленный товар с Taobao.\nПродавец: ${item.VendorName || 'неизвестен'}`,
    category: 'Промышленность',
    subcategory_id: subcategoryId,
    sku: `IND-${item.Id || Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    price: Math.round(price * 100) / 100,
    currency: 'RUB',
    min_order: '1 шт.',
    in_stock: true,
    specifications,
    images: images.filter(img => img).slice(0, 10),
    supplier_id: supplierId,
    is_active: true,
    is_featured: false
  }
}

async function main() {
  console.log('🏭 ИМПОРТ ПРОМЫШЛЕННЫХ ТОВАРОВ\n')
  console.log('Цель: 188 высокооборотных товаров\n')

  // 1. Получаем подкатегории Промышленности
  const { data: category } = await supabase
    .from('catalog_categories')
    .select('id')
    .eq('name', 'Промышленность')
    .single()

  const { data: subcategories } = await supabase
    .from('catalog_subcategories')
    .select('id, name')
    .eq('category_id', category.id)

  const subcatMap = {}
  subcategories.forEach(s => { subcatMap[s.name] = s.id })

  console.log('📂 Подкатегории:', Object.keys(subcatMap).join(', '))

  // 2. Получаем поставщика
  let { data: supplier } = await supabase
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'OTAPI Taobao Import')
    .single()

  if (!supplier) {
    const { data: newSup } = await supabase
      .from('catalog_verified_suppliers')
      .insert({
        name: 'OTAPI Taobao Import',
        company_name: 'Taobao через OTAPI',
        category: 'Промышленность',
        country: 'Китай',
        is_active: true,
        is_verified: true,
        moderation_status: 'approved'
      })
      .select('id')
      .single()
    supplier = newSup
  }

  console.log('🏪 Поставщик ID:', supplier.id)
  console.log('')

  // 3. Импортируем по каждому запросу
  let totalImported = 0
  let totalSkipped = 0

  for (const q of INDUSTRY_QUERIES) {
    console.log(`\n🔍 "${q.query}" → ${q.subcategory} (до ${q.count} шт)`)

    try {
      const items = await searchOTAPI(q.query, q.count + 10) // берем чуть больше на случай дублей
      console.log(`   Найдено: ${items.length}`)

      if (items.length === 0) {
        console.log('   ⚠️ Нет результатов')
        continue
      }

      const subcatId = subcatMap[q.subcategory]
      if (!subcatId) {
        console.log(`   ⚠️ Подкатегория "${q.subcategory}" не найдена`)
        continue
      }

      const products = []
      for (const item of items.slice(0, q.count)) {
        const product = formatProduct(item, subcatId, supplier.id)

        // Проверка дубликата по имени
        const { data: existing } = await supabase
          .from('catalog_verified_products')
          .select('id')
          .eq('name', product.name)
          .single()

        if (existing) {
          totalSkipped++
          continue
        }

        products.push(product)
      }

      if (products.length > 0) {
        const { data: inserted, error } = await supabase
          .from('catalog_verified_products')
          .insert(products)
          .select('id')

        if (error) {
          console.log(`   ❌ Ошибка: ${error.message}`)
        } else {
          totalImported += inserted.length
          console.log(`   ✅ Добавлено: ${inserted.length}`)
        }
      }

      // Небольшая пауза между запросами
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      console.log(`   ❌ Ошибка: ${err.message}`)
    }
  }

  // 4. Итоги
  console.log('\n' + '='.repeat(50))
  console.log('📊 ИТОГИ:')
  console.log(`   ✅ Импортировано: ${totalImported}`)
  console.log(`   ⏩ Пропущено дублей: ${totalSkipped}`)

  // Проверяем итоговое количество
  const { count } = await supabase
    .from('catalog_verified_products')
    .select('id', { count: 'exact', head: true })
    .eq('category', 'Промышленность')

  console.log(`   📦 Всего в "Промышленность": ${count}`)
  console.log('='.repeat(50))
}

main().catch(console.error)
