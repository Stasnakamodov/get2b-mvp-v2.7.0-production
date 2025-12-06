/**
 * Улучшенный скрипт импорта с проверкой уникальности товаров
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Карта запросов для каждой подкатегории
const SUBCATEGORY_QUERIES = {
  // Здоровье и красота
  'Косметика': [
    'lipstick mascara eyeshadow',
    'foundation concealer powder',
    'nail polish manicure',
    'makeup brushes tools',
    'korean cosmetics skincare'
  ],
  'Витамины и БАД': [
    'vitamin C D3 B12',
    'omega 3 fish oil',
    'protein powder supplement',
    'collagen supplement',
    'multivitamin minerals'
  ],
  'Уход за кожей': [
    'face serum retinol',
    'moisturizer cream lotion',
    'sunscreen SPF protection',
    'face mask sheet',
    'anti aging cream'
  ],
  'Средства гигиены': [
    'electric toothbrush oral',
    'shampoo conditioner hair',
    'body wash shower gel',
    'deodorant antiperspirant',
    'hand sanitizer soap'
  ],

  // Автотовары
  'Автозапчасти': [
    'brake pads disc',
    'air filter cabin',
    'spark plugs ignition',
    'alternator starter motor',
    'suspension shock absorber'
  ],
  'Автохимия': [
    'engine oil 5w30 10w40',
    'coolant antifreeze',
    'brake fluid DOT4',
    'windshield washer fluid',
    'fuel injector cleaner'
  ],
  'Аксессуары': [
    'phone holder mount',
    'dash cam camera',
    'car vacuum cleaner',
    'seat covers leather',
    'steering wheel cover'
  ],
  'Шины и диски': [
    'alloy wheels rims',
    'tire pressure sensor',
    'wheel spacers adapters',
    'tire repair kit',
    'wheel center caps'
  ]
}

class UniqueOtapiImporter {
  constructor(instanceKey) {
    this.instanceKey = instanceKey
    this.baseUrl = 'http://otapi.net/service-json/'
    this.importedSkus = new Set() // Отслеживаем уже импортированные SKU
    this.importedNames = new Set() // Отслеживаем уже импортированные названия
  }

  async searchProducts(query, limit = 10) {
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
      frameSize: (limit * 2).toString() // Запрашиваем больше для фильтрации дубликатов
    })

    try {
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

      // Фильтруем уникальные товары
      const uniqueItems = []
      for (const item of items) {
        const sku = item.Id || item.ItemId
        const name = item.Title || item.OriginalTitle || ''

        // Пропускаем если SKU или название уже импортированы
        if (this.importedSkus.has(sku) || this.importedNames.has(name.substring(0, 50))) {
          continue
        }

        // Пропускаем товары с подозрительно низкими ценами
        const price = this.extractPrice(item)
        if (price < 5) continue

        uniqueItems.push(item)
        if (uniqueItems.length >= limit) break
      }

      return uniqueItems

    } catch (error) {
      console.error('Ошибка поиска:', error.message)
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

    // Собираем уникальные изображения
    const imageSet = new Set()

    if (item.MainPictureUrl) {
      imageSet.add(item.MainPictureUrl)
    }

    if (item.Pictures?.length > 0) {
      item.Pictures.forEach(pic => {
        const url = pic.Url || pic
        if (url && typeof url === 'string') {
          imageSet.add(url)
        }
      })
    }

    images.push(...Array.from(imageSet).slice(0, 5)) // Максимум 5 уникальных картинок

    const specifications = {}
    if (item.BrandName) specifications['Бренд'] = item.BrandName
    if (item.VendorName) specifications['Продавец'] = item.VendorName
    if (item.Location?.City) specifications['Город'] = item.Location.City
    if (item.MasterQuantity) specifications['В наличии'] = `${item.MasterQuantity} шт.`
    if (item.Rating) specifications['Рейтинг'] = `${item.Rating}/5`

    const price = this.extractPrice(item)
    const sku = item.Id || item.ItemId
    const name = (item.Title || item.OriginalTitle || 'Товар').substring(0, 100)

    // Добавляем в наши трекеры
    this.importedSkus.add(sku)
    this.importedNames.add(name.substring(0, 50))

    return {
      name: name,
      description: item.Description || `Качественный товар из категории ${category}`,
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

async function importUniqueProducts() {
  console.log('🚀 КАЧЕСТВЕННЫЙ ИМПОРТ УНИКАЛЬНЫХ ТОВАРОВ\n')
  console.log('=' .repeat(70))

  const importer = new UniqueOtapiImporter('0e4fb57d-d80e-4274-acc5-f22f354e3577')

  try {
    // Получаем поставщика
    let { data: supplier } = await supabase
      .from('catalog_verified_suppliers')
      .select('id')
      .eq('name', 'OTAPI Taobao Import')
      .single()

    if (!supplier) {
      const { data: newSupplier } = await supabase
        .from('catalog_verified_suppliers')
        .insert([{
          name: 'OTAPI Taobao Import',
          company_name: 'Taobao через OTAPI',
          category: 'Универсальный',
          country: 'Китай',
          city: 'Гуанчжоу',
          description: 'Прямые поставки из Китая',
          is_active: true,
          is_verified: true,
          moderation_status: 'approved',
          contact_email: 'import@otapi.net',
          min_order: 'От 1 шт.',
          response_time: '1-2 дня',
          public_rating: 4.5
        }])
        .select()
        .single()
      supplier = newSupplier
    }

    let totalImported = 0

    // Импортируем для каждой подкатегории
    for (const [subcategoryName, queries] of Object.entries(SUBCATEGORY_QUERIES)) {
      console.log(`\n📦 Импорт для подкатегории: ${subcategoryName}`)

      // Определяем категорию по подкатегории
      const categoryName = ['Косметика', 'Витамины и БАД', 'Уход за кожей', 'Средства гигиены'].includes(subcategoryName)
        ? 'Здоровье и красота'
        : 'Автотовары'

      // Получаем IDs категории и подкатегории
      const { data: category } = await supabase
        .from('catalog_categories')
        .select('id')
        .eq('name', categoryName)
        .single()

      const { data: subcategory } = await supabase
        .from('catalog_subcategories')
        .select('id')
        .eq('name', subcategoryName)
        .eq('category_id', category.id)
        .single()

      if (!subcategory) {
        console.log(`  ⏩ Подкатегория не найдена, пропускаем`)
        continue
      }

      const products = []
      const itemsPerQuery = Math.floor(20 / queries.length) // Распределяем поровну

      // Выполняем разные запросы для разнообразия
      for (const query of queries) {
        console.log(`  🔍 Запрос: "${query}"`)

        const items = await importer.searchProducts(query, itemsPerQuery)

        for (const item of items) {
          try {
            const product = importer.formatProductForDB(
              item,
              categoryName,
              subcategory.id,
              category.id,
              supplier.id
            )

            // Дополнительная проверка на уникальность в БД
            const { data: existing } = await supabase
              .from('catalog_verified_products')
              .select('id')
              .eq('sku', product.sku)
              .single()

            if (!existing) {
              products.push(product)
            }
          } catch (e) {
            console.error(`    Ошибка обработки товара: ${e.message}`)
          }
        }

        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Сохраняем в БД
      if (products.length > 0) {
        const { data: inserted, error } = await supabase
          .from('catalog_verified_products')
          .insert(products)
          .select('id')

        if (!error) {
          console.log(`  ✅ Импортировано: ${inserted.length} уникальных товаров`)
          totalImported += inserted.length
        } else {
          console.error(`  ❌ Ошибка: ${error.message}`)
        }
      }
    }

    console.log('\n' + '=' .repeat(70))
    console.log(`📊 ИТОГО ИМПОРТИРОВАНО: ${totalImported} уникальных товаров`)
    console.log('=' .repeat(70))

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
  }
}

importUniqueProducts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error)
    process.exit(1)
  })