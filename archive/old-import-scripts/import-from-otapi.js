/**
 * Скрипт импорта товаров из OTAPI в базу данных
 *
 * Использование:
 * OTAPI_INSTANCE_KEY=xxx node scripts/import-from-otapi.js
 *
 * Параметры:
 * --query="запрос"       - поисковый запрос (по умолчанию "electronics")
 * --provider=Taobao      - маркетплейс (Taobao, 1688, AliExpress)
 * --limit=20             - количество товаров для импорта
 * --category="Электроника" - категория для сохранения в БД
 */

const { createClient } = require('@supabase/supabase-js')
// require('dotenv').config({ path: '.env.local' })

// Проверка переменных окружения
if (!process.env.OTAPI_INSTANCE_KEY) {
  console.error('❌ OTAPI_INSTANCE_KEY не найден в переменных окружения')
  console.log('\n💡 Как получить ключ OTAPI:')
  console.log('1. Зайдите на https://otcommerce.com/')
  console.log('2. Зарегистрируйтесь и получите тестовый ключ (5 дней бесплатно)')
  console.log('3. Добавьте в .env.local: OTAPI_INSTANCE_KEY=ваш_ключ')
  console.log('4. Запустите: OTAPI_INSTANCE_KEY=xxx node scripts/import-from-otapi.js')
  process.exit(1)
}

// Инициализация Supabase с явными значениями
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

  /**
   * Поиск товаров через OTAPI
   */
  async searchProducts(query, provider = 'Taobao', limit = 20) {
    console.log(`\n🔍 Поиск товаров: "${query}" на ${provider}...`)

    // Формируем XML параметры для поиска
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Проверяем ответ
      if (data.ErrorCode && data.ErrorCode !== 'Ok') {
        throw new Error(`OTAPI Error: ${data.ErrorCode} - ${data.ErrorDescription || 'Unknown error'}`)
      }

      // Правильный путь к товарам в ответе OTAPI (структура может варьироваться)
      const items = data.Result?.Items?.Content ||                 // Прямой ответ без OtapiResponse
                   data.Result?.SearchResult?.Items?.Content ||    // Альтернативная структура
                   data.OtapiResponse?.Result?.SearchResult?.Items?.Content || // С оберткой OtapiResponse
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

  /**
   * Преобразование товара OTAPI в формат нашей БД
   */
  formatProductForDB(item, category, supplierId) {
    // Собираем все изображения
    const images = []
    if (item.MainPictureUrl) {
      images.push(item.MainPictureUrl)
    }
    if (item.Pictures?.length > 0) {
      item.Pictures.forEach(pic => {
        // В OTAPI изображения имеют структуру {Url, Small, Medium, Large}
        const url = pic.Url || pic
        if (url && typeof url === 'string') {
          images.push(url)
        }
      })
    }

    // Формируем спецификации
    const specifications = {}

    // Извлекаем данные из FeaturedValues
    if (item.FeaturedValues?.length > 0) {
      item.FeaturedValues.forEach(fv => {
        if (fv.Name === 'reviews') specifications['Отзывов'] = fv.Value
        if (fv.Name === 'SalesInLast30Days') specifications['Продаж за 30 дней'] = fv.Value + ' шт.'
        if (fv.Name === 'favCount') specifications['В избранном'] = fv.Value + ' раз'
      })
    }

    // Добавляем дополнительную информацию
    if (item.BrandName) {
      specifications['Бренд'] = item.BrandName
    }
    if (item.VendorName) {
      specifications['Продавец'] = item.VendorName
    }
    if (item.Location?.City) {
      specifications['Город'] = item.Location.City
    }
    if (item.Location?.State) {
      specifications['Регион'] = item.Location.State
    }
    if (item.MasterQuantity) {
      specifications['В наличии'] = `${item.MasterQuantity} шт.`
    }

    // Получаем цену из структуры OTAPI
    let price = 0
    if (item.Price?.ConvertedPriceList?.Internal?.Price) {
      price = parseFloat(item.Price.ConvertedPriceList.Internal.Price)
    } else if (item.Price?.ConvertedPrice) {
      // Убираем символ валюты и парсим
      price = parseFloat(item.Price.ConvertedPrice.replace(/[^0-9.]/g, ''))
    } else if (item.Price?.OriginalPrice) {
      // Конвертируем из юаней в рубли (примерный курс 13 руб/юань)
      price = parseFloat(item.Price.OriginalPrice) * 13
    }

    return {
      // Основная информация
      name: item.Title || item.OriginalTitle || 'Товар без названия',
      description: item.Description || `${item.Title || ''}\n\nТовар с ${item.ProviderType || 'китайского маркетплейса'}.\nПродавец: ${item.VendorName || 'неизвестен'}`,
      category: category,
      sku: item.Id || item.ItemId,

      // Цены
      price: Math.round(price * 100) / 100, // Округляем до копеек
      currency: 'RUB',
      min_order: '1 шт.',
      in_stock: item.MasterQuantity > 0,

      // Характеристики и изображения
      specifications: specifications,
      images: images.filter(img => img).slice(0, 10), // Максимум 10 изображений

      // Связь с поставщиком
      supplier_id: supplierId,

      // Статус
      is_active: true,
      is_featured: false
    }
  }
}

/**
 * Основная функция импорта
 */
async function importFromOtapi() {
  console.log('🚀 ИМПОРТ ТОВАРОВ ИЗ OTAPI\n')
  console.log('=' .repeat(70))

  // Парсим аргументы командной строки
  const args = process.argv.slice(2)
  const params = {}
  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=')
    params[key] = value || true
  })

  // Параметры импорта
  const query = params.query || 'electronics smartphone laptop'
  const provider = params.provider || 'Taobao'
  const limit = parseInt(params.limit) || 20
  const category = params.category || 'Электроника'

  console.log('\n📋 Параметры импорта:')
  console.log(`  Запрос: ${query}`)
  console.log(`  Маркетплейс: ${provider}`)
  console.log(`  Количество: ${limit}`)
  console.log(`  Категория: ${category}`)
  console.log('')

  const importer = new OtapiImporter(process.env.OTAPI_INSTANCE_KEY)

  try {
    // 1. Получаем или создаем поставщика для OTAPI
    console.log('👥 Подготовка поставщика...')

    let { data: supplier, error: supplierError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name')
      .eq('name', `OTAPI ${provider} Import`)
      .single()

    if (supplierError || !supplier) {
      console.log('  Создаем нового поставщика...')

      const { data: newSupplier, error: createError } = await supabase
        .from('catalog_verified_suppliers')
        .insert([{
          name: `OTAPI ${provider} Import`,
          company_name: `${provider} через OTAPI`,
          category: category,
          country: 'Китай',
          city: provider === '1688' ? 'Иу' : 'Гуанчжоу',
          description: `Автоматический импорт товаров с ${provider} через OTAPI. Прямые поставки из Китая.`,
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

      if (createError) {
        throw new Error(`Ошибка создания поставщика: ${createError.message}`)
      }

      supplier = newSupplier
    }

    console.log(`✅ Поставщик готов: ${supplier.name} (ID: ${supplier.id})`)

    // 2. Ищем товары через OTAPI
    const items = await importer.searchProducts(query, provider, limit)

    if (items.length === 0) {
      console.log('\n⚠️ Товары не найдены. Попробуйте изменить запрос.')
      return
    }

    // 3. Импортируем товары в БД
    console.log(`\n📦 Импорт ${items.length} товаров в базу данных...`)

    const products = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      try {
        console.log(`  ${i + 1}/${items.length}: ${item.Title || item.Name || 'Без названия'}`)

        // Форматируем товар
        const product = importer.formatProductForDB(item, category, supplier.id)

        // Проверяем, не существует ли уже такой товар (по SKU)
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
        errorCount++
      }
    }

    // 4. Массовая вставка в БД
    if (products.length > 0) {
      console.log(`\n💾 Сохранение ${products.length} товаров в БД...`)

      const { data: inserted, error: insertError } = await supabase
        .from('catalog_verified_products')
        .insert(products)
        .select('id, name')

      if (insertError) {
        throw new Error(`Ошибка вставки в БД: ${insertError.message}`)
      }

      console.log(`✅ Успешно добавлено: ${inserted.length} товаров`)

      // Показываем первые несколько добавленных товаров
      console.log('\n📋 Добавленные товары:')
      inserted.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name}`)
      })

      if (inserted.length > 5) {
        console.log(`  ... и еще ${inserted.length - 5} товаров`)
      }
    }

    // 5. Итоги
    console.log('\n' + '=' .repeat(70))
    console.log('📊 ИТОГИ ИМПОРТА:')
    console.log('=' .repeat(70))
    console.log(`  ✅ Успешно импортировано: ${successCount}`)
    console.log(`  ❌ Ошибок: ${errorCount}`)
    console.log(`  ⏩ Пропущено дубликатов: ${items.length - successCount - errorCount}`)
    console.log('')
    console.log('🎉 Импорт завершен!')
    console.log('')
    console.log('💡 Что дальше:')
    console.log('  1. Проверьте товары в каталоге: /dashboard/catalog')
    console.log('  2. Настройте категории и цены')
    console.log('  3. Запустите импорт для других категорий')
    console.log('')
    console.log('📝 Примеры команд:')
    console.log('  node scripts/import-from-otapi.js --query="одежда" --category="Текстиль и одежда"')
    console.log('  node scripts/import-from-otapi.js --query="auto parts" --category="Автотовары"')
    console.log('  node scripts/import-from-otapi.js --provider=1688 --query="wholesale"')
    console.log('')

  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Запуск импорта
importFromOtapi()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error)
    process.exit(1)
  })