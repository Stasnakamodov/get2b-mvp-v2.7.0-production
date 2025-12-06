/**
 * Добавление дополнительных товаров в категорию "Строительство"
 * Цель: добавить еще 26 товаров для достижения 88
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Новые более разнообразные запросы
const ADDITIONAL_QUERIES = {
  'Инструменты': [
    'screwdriver set professional',
    'laser level measuring tool',
    'tool box organizer'
  ],
  'Строительные материалы': [
    'brick red clay',
    'concrete blocks hollow',
    'sand construction bag'
  ],
  'Сантехника': [
    'pipe fittings brass',
    'bathroom accessories set',
    'drain pipe PVC'
  ],
  'Электрика': [
    'extension cord reel',
    'electrical tape insulation',
    'wire connectors terminal'
  ],
  'Крепеж и метизы': [
    'nails galvanized steel',
    'washers stainless steel',
    'nuts bolts set'
  ],
  'Краски и лаки': [
    'paint roller professional',
    'paint brush set',
    'spray paint aerosol'
  ],
  'Двери и окна': [
    'door hinges heavy duty',
    'window locks security',
    'door closer automatic'
  ],
  'Отделочные материалы': [
    'baseboard molding wood',
    'ceiling tiles decorative',
    'wall panels 3D'
  ]
}

class AdditionalImporter {
  constructor(instanceKey) {
    this.instanceKey = instanceKey
    this.baseUrl = 'http://otapi.net/service-json/'
    this.existingSkus = new Set()
  }

  async loadExistingProducts() {
    const { data: products } = await supabase
      .from('catalog_verified_products')
      .select('sku')
      .eq('category', 'Строительство')

    if (products) {
      products.forEach(p => this.existingSkus.add(p.sku))
    }
    console.log(`  📊 Загружено существующих товаров: ${this.existingSkus.size}`)
  }

  async searchProducts(query, limit = 5) {
    const xmlParameters = `
      <SearchItemsParameters>
        <Provider>Taobao</Provider>
        <SearchMethod>Catalog</SearchMethod>
        <ItemTitle>${query}</ItemTitle>
      </SearchItemsParameters>
    `.trim()

    const params = new URLSearchParams({
      instanceKey: this.instanceKey,
      language: 'ru',
      xmlParameters: xmlParameters,
      framePosition: '0',
      frameSize: limit.toString()
    })

    try {
      console.log(`  🔍 Поиск: "${query}"`)

      const response = await fetch(`${this.baseUrl}SearchItemsFrame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.ErrorCode && data.ErrorCode !== 'Ok') {
        throw new Error(`OTAPI Error: ${data.ErrorCode}`)
      }

      const items = data.Result?.Items?.Content ||
                   data.OtapiResponse?.Result?.Items?.Content ||
                   []

      // Фильтруем только новые товары
      return items.filter(item => {
        const sku = item.Id || item.ItemId
        const price = this.extractPrice(item)
        return !this.existingSkus.has(sku) && price >= 15 // Минимальная цена 15 руб
      })

    } catch (error) {
      console.error(`    ❌ Ошибка: ${error.message}`)
      return []
    }
  }

  extractPrice(item) {
    if (item.Price?.ConvertedPriceList?.Internal?.Price) {
      return parseFloat(item.Price.ConvertedPriceList.Internal.Price)
    } else if (item.Price?.ConvertedPrice) {
      return parseFloat(item.Price.ConvertedPrice.replace(/[^0-9.]/g, ''))
    } else if (item.Price?.OriginalPrice) {
      return parseFloat(item.Price.OriginalPrice) * 13
    }
    return 0
  }

  formatProductForDB(item, category, subcategoryId, categoryId, supplierId) {
    const images = []

    if (item.MainPictureUrl) {
      images.push(item.MainPictureUrl)
    }

    if (item.Pictures?.length > 0) {
      item.Pictures.slice(0, 4).forEach(pic => {
        const url = pic.Url || pic
        if (url && typeof url === 'string') {
          images.push(url)
        }
      })
    }

    const specifications = {}
    if (item.BrandName) specifications['Бренд'] = item.BrandName
    if (item.VendorName) specifications['Продавец'] = item.VendorName
    if (item.Rating) specifications['Рейтинг'] = `${item.Rating}/5`

    const price = this.extractPrice(item)
    const sku = item.Id || item.ItemId
    const name = (item.Title || item.OriginalTitle || 'Товар').substring(0, 100)

    this.existingSkus.add(sku)

    return {
      name: name,
      description: item.Description || `Профессиональный товар из категории ${category}`,
      category: category,
      subcategory_id: subcategoryId,
      category_id: categoryId,
      sku: sku,
      price: Math.round(price * 100) / 100,
      currency: 'RUB',
      min_order: '1 шт.',
      in_stock: true,
      specifications: specifications,
      images: images,
      supplier_id: supplierId,
      is_active: true,
      is_featured: false
    }
  }
}

async function addMoreProducts() {
  console.log('🚀 ДОБАВЛЕНИЕ ДОПОЛНИТЕЛЬНЫХ ТОВАРОВ В СТРОИТЕЛЬСТВО\n')
  console.log('=' .repeat(60))

  const importer = new AdditionalImporter('0e4fb57d-d80e-4274-acc5-f22f354e3577')

  try {
    await importer.loadExistingProducts()

    // Получаем поставщика
    const { data: supplier } = await supabase
      .from('catalog_verified_suppliers')
      .select('id')
      .eq('name', 'OTAPI Smart Import')
      .single()

    // Получаем категорию
    const { data: category } = await supabase
      .from('catalog_categories')
      .select('id')
      .eq('key', 'construction')
      .single()

    let totalImported = 0

    for (const [subcategoryName, queries] of Object.entries(ADDITIONAL_QUERIES)) {
      console.log(`\n📦 Подкатегория: ${subcategoryName}`)

      // Получаем подкатегорию
      const { data: subcategory } = await supabase
        .from('catalog_subcategories')
        .select('id')
        .eq('name', subcategoryName)
        .eq('category_id', category.id)
        .single()

      if (!subcategory) {
        console.log(`  ⏩ Подкатегория не найдена`)
        continue
      }

      const products = []

      for (const query of queries) {
        const items = await importer.searchProducts(query, 3)

        for (const item of items) {
          const product = importer.formatProductForDB(
            item,
            'Строительство',
            subcategory.id,
            category.id,
            supplier.id
          )
          products.push(product)

          if (products.length >= 4) break // Максимум 4 товара на подкатегорию
        }

        if (products.length >= 4) break
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (products.length > 0) {
        const { data: inserted, error } = await supabase
          .from('catalog_verified_products')
          .insert(products)
          .select('id')

        if (!error) {
          console.log(`  ✅ Импортировано: ${inserted.length} товаров`)
          totalImported += inserted.length
        } else {
          console.error(`  ❌ Ошибка: ${error.message}`)
        }
      }

      if (totalImported >= 26) {
        console.log('\n🎯 Цель достигнута!')
        break
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log(`📊 ИТОГО ДОБАВЛЕНО: ${totalImported} товаров`)

    // Проверяем общее количество
    const { data: total } = await supabase
      .from('catalog_verified_products')
      .select('id', { count: 'exact', head: true })
      .eq('category', 'Строительство')

    console.log(`📈 ВСЕГО В КАТЕГОРИИ: ${total} товаров`)
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message)
  }
}

addMoreProducts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error)
    process.exit(1)
  })