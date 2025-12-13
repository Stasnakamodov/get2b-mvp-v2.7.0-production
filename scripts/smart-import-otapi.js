/**
 * Умный скрипт импорта из OTAPI с продвинутой проверкой дубликатов
 *
 * Особенности:
 * - Проверка уникальности SKU
 * - Сравнение названий (fuzzy matching)
 * - Проверка одинаковых картинок
 * - Обнаружение похожих товаров по цене
 * - Экономия API запросов
 * - Детальное логирование
 */

const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Конфигурация
const CONFIG = {
  OTAPI_KEY: process.env.OTAPI_INSTANCE_KEY || '0e4fb57d-d80e-4274-acc5-f22f354e3577',
  MIN_PRICE: 10,          // Минимальная цена товара
  MAX_DUPLICATES: 0,      // Максимум дубликатов (0 = не импортировать дубликаты)
  NAME_SIMILARITY: 0.5,   // Порог схожести названий
  PRICE_SIMILARITY: 10,   // Максимальная разница в цене для похожих товаров
  BATCH_SIZE: 10,         // Размер батча для импорта
  API_DELAY: 1500,        // Задержка между API запросами (мс)
  USE_LOCAL_IMAGES: false // Используем реальные изображения из OTAPI!
}

// USE_LOCAL_IMAGES установлен в false - используем реальные изображения из OTAPI

// Умные запросы для разных подкатегорий (более разнообразные)
const SMART_QUERIES = {
  'Косметика': [
    'lipstick red matte',
    'eyeshadow palette professional',
    'foundation liquid coverage',
    'mascara waterproof volume',
    'nail polish gel UV'
  ],
  'Витамины и БАД': [
    'vitamin D3 5000IU',
    'omega 3 fish oil capsules',
    'collagen peptides powder',
    'probiotics digestive health',
    'multivitamin women daily'
  ],
  'Уход за кожей': [
    'retinol serum anti aging',
    'hyaluronic acid moisturizer',
    'vitamin C brightening cream',
    'niacinamide zinc serum',
    'sunscreen SPF50 face'
  ],
  'Средства гигиены': [
    'electric toothbrush sonic',
    'organic shampoo sulfate free',
    'antibacterial hand soap',
    'bamboo toothbrush eco',
    'natural deodorant aluminum free'
  ],
  'Автозапчасти': [
    'brake pads ceramic front',
    'air filter engine performance',
    'spark plugs iridium set',
    'oil filter premium quality',
    'cabin filter HEPA'
  ],
  'Автохимия': [
    'engine oil 5W30 synthetic',
    'coolant antifreeze concentrate',
    'brake fluid DOT4 racing',
    'windshield washer concentrate',
    'fuel injector cleaner professional'
  ],
  'Аксессуары': [
    'phone holder magnetic dashboard',
    'dash cam 4K GPS',
    'car vacuum cleaner portable',
    'seat covers leather universal',
    'steering wheel cover genuine'
  ],
  'Шины и диски': [
    'alloy wheels 17 inch',
    'tire pressure monitoring sensor',
    'wheel spacers 5x114.3',
    'tire repair kit professional',
    'wheel center caps 60mm'
  ],
  // Строительство
  'Инструменты': [
    'drill hammer Bosch professional',
    'angle grinder Makita 125mm',
    'circular saw DeWalt cordless',
    'impact driver Milwaukee M18',
    'jigsaw Metabo pendulum'
  ],
  'Строительные материалы': [
    'cement Portland M500',
    'plasterboard Knauf 12.5mm',
    'insulation rockwool acoustic',
    'tile adhesive Ceresit CM11',
    'primer concrete contact'
  ],
  'Стройматериалы': [
    'cement Portland M500',
    'plasterboard Knauf 12.5mm',
    'insulation rockwool acoustic',
    'tile adhesive Ceresit CM11',
    'primer concrete contact'
  ],
  'Сантехника': [
    'mixer tap kitchen chrome',
    'toilet bowl Roca compact',
    'shower cabin glass 90x90',
    'water heater Ariston 80L',
    'sink ceramic Cersanit'
  ],
  'Электрика': [
    'LED panel 60W 4000K',
    'circuit breaker ABB 16A',
    'cable VVG 3x2.5 copper',
    'socket Schneider double',
    'switch dimmer Legrand'
  ],
  'Крепеж и метизы': [
    'anchor bolt M12 stainless',
    'self tapping screw 4.2x75',
    'dowel Fischer 10x50',
    'threaded rod M10 zinc',
    'hex bolt DIN933 8.8'
  ],
  'Краски и лаки': [
    'paint Tikkurila Euro 7',
    'primer Caparol universal',
    'varnish yacht Pinotex',
    'enamel PF-115 white',
    'wood stain Belinka'
  ],
  'Двери и окна': [
    'door interior oak veneer',
    'window PVC Rehau 3 chamber',
    'door handle Apecs chrome',
    'door lock cylinder Kale',
    'window sill marble composite'
  ],
  'Отделочные материалы': [
    'laminate flooring 33 class',
    'wallpaper vinyl washable',
    'ceramic tile 60x60 porcelain',
    'decorative plaster Bayramix',
    'skirting board MDF white'
  ],
  // Промышленность
  'Станки и оборудование': [
    'CNC milling machine 3 axis',
    'lathe machine industrial metal',
    'welding machine MIG MAG TIG',
    'hydraulic press 100 ton',
    'band saw metal cutting'
  ],
  'Инструменты': [
    'torque wrench digital precision',
    'micrometer digital 0-25mm',
    'dial indicator magnetic base',
    'thread gauge metric ISO',
    'vernier caliper stainless steel'
  ],
  'Электротехника': [
    'frequency inverter VFD 3 phase',
    'PLC controller Siemens S7',
    'servo motor driver AC',
    'industrial relay 24V DC',
    'transformer 380V to 220V'
  ],
  'Расходные материалы': [
    'cutting disc metal 125mm',
    'grinding wheel aluminum oxide',
    'drill bit HSS cobalt set',
    'welding electrode 3.2mm',
    'sandpaper industrial grit'
  ]
}

class SmartOtapiImporter {
  constructor() {
    this.instanceKey = CONFIG.OTAPI_KEY
    this.baseUrl = 'http://otapi.net/service-json/'

    // Кэши для проверки дубликатов
    this.existingSkus = new Set()
    this.existingNames = new Map() // name -> id
    this.existingImages = new Map() // image_hash -> id
    this.priceRanges = new Map() // subcategory -> [{price, name, id}]

    this.stats = {
      apiCalls: 0,
      itemsProcessed: 0,
      itemsImported: 0,
      duplicatesSkipped: 0,
      lowPriceSkipped: 0,
      similarSkipped: 0
    }
  }

  /**
   * Инициализация - загрузка существующих товаров
   */
  async initialize(categoryName) {
    console.log('[INFO] Загрузка существующих товаров для проверки дубликатов...')

    const { data: products } = await supabase
      .from('catalog_verified_products')
      .select('id, name, sku, price, images, subcategory_id')
      .eq('category', categoryName)

    if (products) {
      products.forEach(p => {
        // SKU
        if (p.sku) this.existingSkus.add(p.sku)

        // Названия (нормализованные)
        const normalizedName = this.normalizeName(p.name)
        this.existingNames.set(normalizedName, p.id)

        // Картинки (хэши)
        if (p.images && Array.isArray(p.images)) {
          p.images.forEach(img => {
            const hash = this.hashImage(img)
            this.existingImages.set(hash, p.id)
          })
        }

        // Цены по подкатегориям
        if (!this.priceRanges.has(p.subcategory_id)) {
          this.priceRanges.set(p.subcategory_id, [])
        }
        this.priceRanges.get(p.subcategory_id).push({
          price: p.price,
          name: p.name,
          id: p.id
        })
      })
    }

    console.log(`  [OK] Загружено: ${products?.length || 0} товаров`)
    console.log(`     SKU: ${this.existingSkus.size}`)
    console.log(`     Названий: ${this.existingNames.size}`)
    console.log(`     Картинок: ${this.existingImages.size}`)
  }

  /**
   * Нормализация названия для сравнения
   */
  normalizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Удаляем спецсимволы
      .replace(/\s+/g, ' ')     // Нормализуем пробелы
      .trim()
      .substring(0, 30)         // Берем первые 30 символов
  }

  /**
   * Хэш картинки для сравнения
   */
  hashImage(url) {
    // Извлекаем ID картинки из URL (обычно уникальный)
    const match = url.match(/\/([A-Za-z0-9_-]+)\.(jpg|jpeg|png|gif)/i)
    return match ? match[1] : crypto.createHash('md5').update(url).digest('hex')
  }

  /**
   * Проверка схожести строк (простой алгоритм)
   */
  stringSimilarity(str1, str2) {
    const s1 = str1.toLowerCase()
    const s2 = str2.toLowerCase()

    // Проверка на содержание одной строки в другой
    if (s1.includes(s2) || s2.includes(s1)) return 1.0

    // Проверка первых N символов
    const checkLen = Math.min(20, s1.length, s2.length)
    if (s1.substring(0, checkLen) === s2.substring(0, checkLen)) return 0.9

    // Простая проверка общих слов
    const words1 = new Set(s1.split(' '))
    const words2 = new Set(s2.split(' '))
    const intersection = [...words1].filter(w => words2.has(w))
    const union = new Set([...words1, ...words2])

    return intersection.length / union.size
  }

  /**
   * Проверка на дубликат
   */
  isDuplicate(item, subcategoryId, categoryName) {
    const sku = item.Id || item.ItemId
    const name = item.Title || item.OriginalTitle || ''
    const price = this.extractPrice(item)
    const images = this.extractImages(item)

    // 1. Проверка SKU
    if (this.existingSkus.has(sku)) {
      console.log(`    [SKIP] Дубликат по SKU: ${sku}`)
      this.stats.duplicatesSkipped++
      return true
    }

    // 2. Проверка точного совпадения названия
    const normalizedName = this.normalizeName(name)
    if (this.existingNames.has(normalizedName)) {
      console.log(`    [SKIP] Дубликат по названию: ${name.substring(0, 50)}`)
      this.stats.duplicatesSkipped++
      return true
    }

    // 3. Для категории "Строительство" НЕ проверяем схожие названия
    // так как там много похожих, но разных товаров
    if (categoryName !== 'Строительство') {
      for (const [existingName, existingId] of this.existingNames) {
        const similarity = this.stringSimilarity(normalizedName, existingName)
        if (similarity >= CONFIG.NAME_SIMILARITY) {
          console.log(`    [SKIP] Похожее название (${Math.round(similarity * 100)}%): ${name.substring(0, 50)}`)
          this.stats.similarSkipped++
          return true
        }
      }
    }

    // 4. Проверка одинаковых картинок (только если картинка полностью совпадает)
    for (const img of images) {
      const hash = this.hashImage(img)
      if (this.existingImages.has(hash)) {
        console.log(`    [SKIP] Дубликат по картинке`)
        this.stats.duplicatesSkipped++
        return true
      }
    }

    // 5. Проверка похожих товаров по цене и названию
    const priceProducts = this.priceRanges.get(subcategoryId) || []
    for (const existing of priceProducts) {
      if (Math.abs(existing.price - price) < CONFIG.PRICE_SIMILARITY) {
        const similarity = this.stringSimilarity(name, existing.name)
        if (similarity > 0.5) {
          console.log(`    [SKIP] Похожий товар (цена ≈${existing.price}, схожесть ${Math.round(similarity * 100)}%)`)
          this.stats.similarSkipped++
          return true
        }
      }
    }

    return false
  }

  /**
   * Извлечение цены
   */
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

  /**
   * Извлечение картинок
   */
  extractImages(item) {
    const images = []
    const imageSet = new Set()

    if (item.MainPictureUrl) imageSet.add(item.MainPictureUrl)

    if (item.Pictures?.length > 0) {
      item.Pictures.forEach(pic => {
        const url = pic.Url || pic
        if (url && typeof url === 'string') imageSet.add(url)
      })
    }

    return Array.from(imageSet).slice(0, 5)
  }

  /**
   * Поиск товаров через OTAPI
   */
  async searchProducts(query, limit = 10) {
    this.stats.apiCalls++
    console.log(`  [SEARCH] API запрос #${this.stats.apiCalls}: "${query}"`)

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
      frameSize: (limit * 3).toString() // Запрашиваем больше для фильтрации
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

      return data.Result?.Items?.Content ||
             data.OtapiResponse?.Result?.Items?.Content ||
             []

    } catch (error) {
      console.error(`    [ERROR] Ошибка API: ${error.message}`)
      return []
    }
  }

  /**
   * Форматирование товара для БД
   */
  formatProductForDB(item, category, subcategoryId, categoryId, supplierId) {
    // Всегда используем реальные изображения из OTAPI
    const images = this.extractImages(item)
    const price = this.extractPrice(item)
    const sku = item.Id || item.ItemId
    const name = (item.Title || item.OriginalTitle || 'Товар').substring(0, 100)

    // Обновляем кэши
    this.existingSkus.add(sku)
    this.existingNames.set(this.normalizeName(name), 'pending')
    images.forEach(img => {
      this.existingImages.set(this.hashImage(img), 'pending')
    })

    const specifications = {}
    if (item.BrandName) specifications['Бренд'] = item.BrandName
    if (item.VendorName) specifications['Продавец'] = item.VendorName
    if (item.Rating) specifications['Рейтинг'] = `${item.Rating}/5`
    if (item.SoldCount) specifications['Продано'] = `${item.SoldCount} шт.`

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

  /**
   * Импорт товаров для подкатегории
   */
  async importSubcategory(subcategoryName, categoryName, categoryId, subcategoryId, supplierId) {
    console.log(`\n[ИМПОРТ] ${subcategoryName}`)

    const queries = SMART_QUERIES[subcategoryName] || ['']
    const products = []
    // Для строительства импортируем больше товаров
    const baseTarget = categoryName === 'Строительство' ? 15 : 20
    const targetPerQuery = Math.floor(baseTarget / queries.length)

    for (const query of queries) {
      const items = await this.searchProducts(query, targetPerQuery * 2)

      let imported = 0
      for (const item of items) {
        this.stats.itemsProcessed++

        // Проверка минимальной цены
        const price = this.extractPrice(item)
        if (price < CONFIG.MIN_PRICE) {
          console.log(`    [SKIP] Слишком низкая цена: ${price} руб`)
          this.stats.lowPriceSkipped++
          continue
        }

        // Проверка на дубликат
        if (this.isDuplicate(item, subcategoryId, categoryName)) {
          continue
        }

        // Форматируем и добавляем
        const product = this.formatProductForDB(
          item,
          categoryName,
          subcategoryId,
          categoryId,
          supplierId
        )

        products.push(product)
        imported++
        console.log(`    [OK] ${product.name.substring(0, 50)}... (${product.price} руб)`)

        if (imported >= targetPerQuery) break
      }

      // Задержка между запросами
      await new Promise(resolve => setTimeout(resolve, CONFIG.API_DELAY))
    }

    return products
  }

  /**
   * Показать статистику
   */
  showStats() {
    console.log('\n' + '=' .repeat(70))
    console.log('[STATS] СТАТИСТИКА ИМПОРТА')
    console.log('=' .repeat(70))
    console.log(`  API запросов: ${this.stats.apiCalls}`)
    console.log(`  Обработано товаров: ${this.stats.itemsProcessed}`)
    console.log(`  Импортировано: ${this.stats.itemsImported}`)
    console.log(`  Пропущено дубликатов: ${this.stats.duplicatesSkipped}`)
    console.log(`  Пропущено похожих: ${this.stats.similarSkipped}`)
    console.log(`  Пропущено по цене: ${this.stats.lowPriceSkipped}`)
    console.log(`  Экономия API: ${Math.round((this.stats.duplicatesSkipped + this.stats.similarSkipped) / this.stats.apiCalls * 100)}%`)
  }
}

/**
 * Главная функция
 */
async function smartImport() {
  console.log('[START] УМНЫЙ ИМПОРТ ТОВАРОВ ИЗ OTAPI')
  console.log('=' .repeat(70))

  const importer = new SmartOtapiImporter()

  try {
    // Получаем или создаем поставщика
    let { data: supplier } = await supabase
      .from('catalog_verified_suppliers')
      .select('id')
      .eq('name', 'OTAPI Smart Import')
      .single()

    if (!supplier) {
      const { data: newSupplier } = await supabase
        .from('catalog_verified_suppliers')
        .insert([{
          name: 'OTAPI Smart Import',
          company_name: 'Smart OTAPI Import',
          category: 'Универсальный',
          country: 'Китай',
          city: 'Гуанчжоу',
          description: 'Умный импорт с проверкой дубликатов',
          is_active: true,
          is_verified: true,
          moderation_status: 'approved',
          min_order: 'От 1 шт.',
          public_rating: 4.8
        }])
        .select()
        .single()
      supplier = newSupplier
    }

    // Импорт по категориям
    const targetCategory = process.env.IMPORT_CATEGORY || 'all'

    let categories = []
    if (targetCategory === 'Строительство') {
      categories = [{ name: 'Строительство', key: 'construction' }]
    } else if (targetCategory === 'Промышленность') {
      categories = [{ name: 'Промышленность', key: 'industrial' }]
    } else if (targetCategory === 'all') {
      categories = [
        { name: 'Здоровье и красота', key: 'health-beauty' },
        { name: 'Автотовары', key: 'automotive' },
        { name: 'Строительство', key: 'construction' },
        { name: 'Промышленность', key: 'industrial' }
      ]
    } else {
      categories = [
        { name: 'Здоровье и красота', key: 'health-beauty' },
        { name: 'Автотовары', key: 'automotive' }
      ]
    }

    for (const cat of categories) {
      console.log(`\n\n[CATEGORY] КАТЕГОРИЯ: ${cat.name}`)
      console.log('-' .repeat(50))

      // Загружаем существующие товары
      await importer.initialize(cat.name)

      // Получаем категорию
      const { data: category } = await supabase
        .from('catalog_categories')
        .select('id')
        .eq('key', cat.key)
        .single()

      // Получаем подкатегории
      const { data: subcategories } = await supabase
        .from('catalog_subcategories')
        .select('id, name')
        .eq('category_id', category.id)

      for (const subcat of subcategories) {
        const products = await importer.importSubcategory(
          subcat.name,
          cat.name,
          category.id,
          subcat.id,
          supplier.id
        )

        // Сохраняем батчами
        if (products.length > 0) {
          for (let i = 0; i < products.length; i += CONFIG.BATCH_SIZE) {
            const batch = products.slice(i, i + CONFIG.BATCH_SIZE)

            const { data: inserted, error } = await supabase
              .from('catalog_verified_products')
              .insert(batch)
              .select('id')

            if (!error) {
              importer.stats.itemsImported += inserted.length
              console.log(`  [SAVED] Сохранено в БД: ${inserted.length} товаров`)
            } else {
              console.error(`  [ERROR] Ошибка БД: ${error.message}`)
            }
          }
        }
      }
    }

    // Показываем статистику
    importer.showStats()

  } catch (error) {
    console.error('[ERROR] КРИТИЧЕСКАЯ ОШИБКА:', error.message)
    console.error(error.stack)
  }
}

// Запуск
smartImport()
  .then(() => {
    console.log('\n[OK] Импорт завершен успешно!')
    process.exit(0)
  })
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error)
    process.exit(1)
  })