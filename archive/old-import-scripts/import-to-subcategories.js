/**
 * Скрипт импорта товаров из OTAPI с поддержкой подкатегорий
 *
 * Использование:
 * node scripts/import-to-subcategories.js --query="запрос" --category="Категория" --subcategory="Подкатегория" --limit=20
 */

const { createClient } = require('@supabase/supabase-js')

// Инициализация Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Класс для работы с OTAPI
class OtapiImporter {
  constructor(instanceKey) {
    this.instanceKey = instanceKey
    this.baseUrl = 'http://otapi.net/service-json/'
    this.language = 'ru'
    this.currency = 'RUB'
  }

  async searchProducts(query, provider = 'Taobao', limit = 20) {
    console.log(`🔍 Поиск товаров: "${query}" на ${provider}...`)

    const xmlParameters = `
      <SearchItemsParameters>
        <Provider>${provider}</Provider>
        <SearchMethod>Catalog</SearchMethod>
        <ItemTitle>${query}</ItemTitle>
      </SearchItemsParameters>
    `.trim()

    const params = new URLSearchParams({
      instanceKey: this.instanceKey,
      language: this.language,
      xmlParameters: xmlParameters,
      framePosition: '0',
      frameSize: limit.toString()
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
                   data.Result?.SearchResult?.Items?.Content ||
                   data.OtapiResponse?.Result?.SearchResult?.Items?.Content ||
                   data.OtapiResponse?.Result?.Items?.Content ||
                   data.OtapiResponse?.Result?.Items ||
                   []

      console.log(`✅ Найдено товаров: ${items.length}`)
      return items

    } catch (error) {
      console.error('❌ Ошибка поиска:', error.message)
      throw error
    }
  }

  formatProductForDB(item, category, subcategoryId, categoryId, supplierId) {
    const images = []
    if (item.MainPictureUrl) {
      images.push(item.MainPictureUrl)
    }
    if (item.Pictures?.length > 0) {
      item.Pictures.forEach(pic => {
        const url = pic.Url || pic
        if (url && typeof url === 'string') {
          images.push(url)
        }
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

    if (item.BrandName) specifications['Бренд'] = item.BrandName
    if (item.VendorName) specifications['Продавец'] = item.VendorName
    if (item.Location?.City) specifications['Город'] = item.Location.City
    if (item.MasterQuantity) specifications['В наличии'] = `${item.MasterQuantity} шт.`

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
      description: item.Description || `${item.Title || ''}\n\nТовар с ${item.ProviderType || 'китайского маркетплейса'}.\nПродавец: ${item.VendorName || 'неизвестен'}`,
      category: category,
      subcategory_id: subcategoryId, // Добавляем подкатегорию
      category_id: categoryId, // Добавляем ID категории
      sku: item.Id || item.ItemId,
      price: Math.round(price * 100) / 100,
      currency: 'RUB',
      min_order: '1 шт.',
      in_stock: item.MasterQuantity > 0,
      specifications: specifications,
      images: images.filter(img => img).slice(0, 10),
      supplier_id: supplierId,
      is_active: true,
      is_featured: false
    }
  }
}

async function importToSubcategories() {
  console.log('🚀 ИМПОРТ ТОВАРОВ В ПОДКАТЕГОРИИ\n')
  console.log('=' .repeat(70))

  const args = process.argv.slice(2)
  const params = {}
  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=')
    params[key] = value || true
  })

  const query = params.query || 'electronics'
  const provider = params.provider || 'Taobao'
  const limit = parseInt(params.limit) || 20
  const categoryName = params.category
  const subcategoryName = params.subcategory

  if (!categoryName || !subcategoryName) {
    console.error('❌ Необходимо указать категорию и подкатегорию!')
    console.log('Пример: node scripts/import-to-subcategories.js --category="Здоровье и красота" --subcategory="Косметика" --query="cosmetics"')
    process.exit(1)
  }

  console.log('\n📋 Параметры импорта:')
  console.log(`  Запрос: ${query}`)
  console.log(`  Маркетплейс: ${provider}`)
  console.log(`  Количество: ${limit}`)
  console.log(`  Категория: ${categoryName}`)
  console.log(`  Подкатегория: ${subcategoryName}`)

  const importer = new OtapiImporter(process.env.OTAPI_INSTANCE_KEY || '0e4fb57d-d80e-4274-acc5-f22f354e3577')

  try {
    // Получаем информацию о категории и подкатегории
    const { data: category } = await supabase
      .from('catalog_categories')
      .select('id')
      .eq('name', categoryName)
      .single()

    if (!category) {
      throw new Error(`Категория "${categoryName}" не найдена`)
    }

    const { data: subcategory } = await supabase
      .from('catalog_subcategories')
      .select('id')
      .eq('category_id', category.id)
      .eq('name', subcategoryName)
      .single()

    if (!subcategory) {
      throw new Error(`Подкатегория "${subcategoryName}" не найдена в категории "${categoryName}"`)
    }

    console.log(`✅ Категория и подкатегория найдены`)

    // Получаем или создаем поставщика
    let { data: supplier } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name')
      .eq('name', `OTAPI ${provider} Import`)
      .single()

    if (!supplier) {
      console.log('  Создаем нового поставщика...')
      const { data: newSupplier } = await supabase
        .from('catalog_verified_suppliers')
        .insert([{
          name: `OTAPI ${provider} Import`,
          company_name: `${provider} через OTAPI`,
          category: categoryName,
          country: 'Китай',
          city: 'Гуанчжоу',
          description: `Автоматический импорт товаров с ${provider} через OTAPI.`,
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

    console.log(`✅ Поставщик готов: ${supplier.name}`)

    // Ищем товары
    const items = await importer.searchProducts(query, provider, limit)

    if (items.length === 0) {
      console.log('\n⚠️ Товары не найдены')
      return
    }

    // Импортируем товары
    console.log(`\n📦 Импорт ${items.length} товаров...`)

    const products = []
    let successCount = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log(`  ${i + 1}/${items.length}: ${(item.Title || item.Name || 'Без названия').substring(0, 50)}...`)

      try {
        const product = importer.formatProductForDB(item, categoryName, subcategory.id, category.id, supplier.id)

        // Проверяем дубликаты
        if (product.sku) {
          const { data: existing } = await supabase
            .from('catalog_verified_products')
            .select('id')
            .eq('sku', product.sku)
            .single()

          if (existing) {
            console.log(`    ⏩ Пропущен (уже существует)`)
            continue
          }
        }

        products.push(product)
        successCount++
      } catch (error) {
        console.error(`    ❌ Ошибка: ${error.message}`)
      }
    }

    // Сохраняем в БД
    if (products.length > 0) {
      console.log(`\n💾 Сохранение ${products.length} товаров...`)

      const { data: inserted, error: insertError } = await supabase
        .from('catalog_verified_products')
        .insert(products)
        .select('id, name')

      if (insertError) {
        throw new Error(`Ошибка вставки: ${insertError.message}`)
      }

      console.log(`✅ Успешно добавлено: ${inserted.length} товаров`)
    }

    console.log('\n' + '=' .repeat(70))
    console.log('📊 ИТОГИ:')
    console.log(`  ✅ Импортировано: ${successCount}`)
    console.log(`  ⏩ Пропущено: ${items.length - successCount}`)
    console.log('\n🎉 Импорт завершен!')

  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message)
    process.exit(1)
  }
}

importToSubcategories()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error)
    process.exit(1)
  })