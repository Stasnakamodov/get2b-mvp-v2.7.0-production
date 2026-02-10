/**
 * Качественный импорт каталога из OTAPI
 *
 * - Русские названия и описания
 * - Цены в рублях (конвертация CNY -> RUB)
 * - Несколько картинок на товар (до 5)
 * - Полные характеристики
 * - Дедупликация по SKU
 * - Поиск по разным маркетплейсам (Taobao, 1688, AliExpress)
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

const OTAPI_KEY = '4722589f-fded-4e56-8765-b422d6aebf03'
const OTAPI_URL = 'http://otapi.net/service-json/'
const CNY_TO_RUB = 12.8  // Актуальный курс юаня к рублю (февраль 2026)
const API_DELAY = 2000    // Задержка между запросами мс
const ITEMS_PER_QUERY = 20

// Запросы на РУССКОМ — OTAPI переведёт названия
// Формат: { query, provider, subcategoryName }
const IMPORT_PLAN = [
  // === Электроника ===
  { queries: [
    'беспроводные наушники bluetooth TWS',
    'умные часы смарт часы фитнес',
    'powerbank зарядка портативная',
    'LED кольцевая лампа для съемки',
    'веб камера HD 1080p USB',
  ], category: 'Электроника', subcategory: 'Электроника общего назначения', provider: 'Taobao' },

  { queries: [
    'чехол телефон силиконовый',
    'защитное стекло экран смартфон',
    'зарядный кабель USB Type-C быстрая зарядка',
    'наушники проводные вкладыши микрофон',
    'штатив телефон трипод гибкий',
  ], category: 'Электроника', subcategory: 'Смартфоны и планшеты', provider: 'Taobao' },

  { queries: [
    'клавиатура механическая RGB игровая',
    'мышь беспроводная эргономичная',
    'коврик мыши большой RGB',
    'USB хаб разветвитель',
    'кулер охлаждение ноутбук подставка',
  ], category: 'Электроника', subcategory: 'Компьютеры и ноутбуки', provider: 'Taobao' },

  { queries: [
    'робот пылесос умная уборка',
    'увлажнитель воздуха ультразвуковой',
    'фен волосы ионизация профессиональный',
    'блендер портативный USB',
    'электрочайник термос температура',
  ], category: 'Электроника', subcategory: 'Бытовая техника', provider: 'Taobao' },

  // === Дом и быт ===
  { queries: [
    'набор посуды кастрюля нержавеющая сталь',
    'сковорода антипригарная гранитная',
    'набор ножей кухонных керамика',
    'контейнер хранение еда стекло',
    'набор столовых приборов нержавейка',
  ], category: 'Дом и быт', subcategory: 'Посуда', provider: 'Taobao' },

  { queries: [
    'органайзер хранение ванная полка',
    'вешалка настенная крючки',
    'корзина бельё складная',
    'контейнер пластиковый хранение вещей',
    'полка стеллаж книжный модульный',
  ], category: 'Дом и быт', subcategory: 'Системы хранения', provider: 'Taobao' },

  { queries: [
    'подушка ортопедическая память',
    'постельное белье хлопок сатин',
    'одеяло легкое бамбук',
    'матрас наматрасник защитный',
    'ночник светильник спальня',
  ], category: 'Дом и быт', subcategory: 'Спальня', provider: 'Taobao' },

  { queries: [
    'светодиодная лампа LED E27',
    'торшер напольный современный',
    'настольная лампа LED зарядка',
    'гирлянда светодиодная декоративная',
    'бра настенный светильник',
  ], category: 'Дом и быт', subcategory: 'Освещение', provider: 'Taobao' },

  { queries: [
    'ваза декоративная керамика',
    'картина модульная постер',
    'зеркало декоративное настенное',
    'подсвечник декоративный металл',
    'часы настенные дизайнерские',
  ], category: 'Дом и быт', subcategory: 'Декор', provider: 'Taobao' },

  { queries: [
    'полотенце банное хлопок',
    'коврик ванная комната нескользящий',
    'штора ванная водонепроницаемая',
    'плед теплый флисовый',
    'скатерть водоотталкивающая',
  ], category: 'Дом и быт', subcategory: 'Текстиль', provider: 'Taobao' },

  { queries: [
    'кофемашина капсульная автоматическая',
    'тостер автоматический нержавеющая сталь',
    'мультиварка рисоварка электрическая',
    'миксер ручной кухонный',
    'электрическая мясорубка мощная',
  ], category: 'Дом и быт', subcategory: 'Кухонная техника', provider: 'Taobao' },

  { queries: [
    'диспенсер мыла автоматический',
    'смеситель кухонный нержавеющая сталь',
    'лейка душ насадка фильтр',
    'унитаз сиденье крышка мягкое',
    'полка ванная угловая',
  ], category: 'Дом и быт', subcategory: 'Сантехника', provider: 'Taobao' },

  { queries: [
    'рабочий стол компьютерный',
    'стул офисный эргономичный',
    'кресло мешок бескаркасное',
    'тумба прикроватная',
    'шкаф органайзер тканевый',
  ], category: 'Дом и быт', subcategory: 'Мебель', provider: 'Taobao' },

  { queries: [
    'швабра пароочиститель',
    'мешки мусорные большие',
    'перчатки хозяйственные',
    'щетка чистка многофункциональная',
    'средство чистки кухня',
  ], category: 'Дом и быт', subcategory: 'Хозяйственные товары', provider: 'Taobao' },

  { queries: [
    'умная розетка WiFi',
    'датчик движения умный дом',
    'камера видеонаблюдения WiFi',
    'умная лампочка RGB WiFi',
    'пульт управления универсальный ИК',
  ], category: 'Дом и быт', subcategory: 'Умный дом', provider: 'Taobao' },

  // === Здоровье и красота ===
  { queries: [
    'помада губная матовая стойкая',
    'тени палетка теней профессиональная',
    'тональный крем основа под макияж',
    'тушь ресницы водостойкая объем',
    'лак ногти гель UV стойкий',
  ], category: 'Здоровье и красота', subcategory: 'Косметика', provider: 'Taobao' },

  { queries: [
    'крем лицо увлажняющий гиалуроновая кислота',
    'сыворотка витамин С осветляющая',
    'маска лицо тканевая увлажняющая',
    'крем солнцезащитный SPF50',
    'патчи глаза коллагеновые',
  ], category: 'Здоровье и красота', subcategory: 'Уход за кожей', provider: 'Taobao' },

  { queries: [
    'зубная щетка электрическая',
    'шампунь безсульфатный натуральный',
    'дезодорант натуральный',
    'зубная паста отбеливающая',
    'расческа массажная деревянная',
  ], category: 'Здоровье и красота', subcategory: 'Средства гигиены', provider: 'Taobao' },

  { queries: [
    'витамин D3 капсулы',
    'омега 3 рыбий жир',
    'коллаген порошок пептиды',
    'пробиотики пищеварение',
    'мультивитамины комплекс',
  ], category: 'Здоровье и красота', subcategory: 'Витамины и БАД', provider: 'Taobao' },

  // === Автотовары ===
  { queries: [
    'тормозные колодки керамические',
    'фильтр воздушный двигатель',
    'свечи зажигания иридиевые комплект',
    'масляный фильтр',
    'ремень ГРМ комплект',
  ], category: 'Автотовары', subcategory: 'Автозапчасти', provider: 'Taobao' },

  { queries: [
    'масло моторное синтетическое 5W30',
    'антифриз концентрат охлаждающая жидкость',
    'тормозная жидкость DOT4',
    'жидкость стеклоомыватель концентрат',
    'очиститель инжектора',
  ], category: 'Автотовары', subcategory: 'Автохимия', provider: 'Taobao' },

  { queries: [
    'держатель телефон магнитный машина',
    'видеорегистратор автомобильный 4K',
    'пылесос автомобильный портативный',
    'чехлы сиденья автомобиля универсальные',
    'органайзер багажник автомобиль',
  ], category: 'Автотовары', subcategory: 'Аксессуары', provider: 'Taobao' },

  { queries: [
    'датчик давления шин TPMS',
    'домкрат автомобильный гидравлический',
    'насос автомобильный компрессор',
    'аптечка автомобильная',
    'трос буксировочный автомобильный',
  ], category: 'Автотовары', subcategory: 'Шины и диски', provider: 'Taobao' },

  // === Строительство ===
  { queries: [
    'дрель аккумуляторная шуруповерт',
    'болгарка угловая шлифмашина 125мм',
    'перфоратор электрический SDS',
    'лобзик электрический',
    'строительный фен термовоздуходувка',
  ], category: 'Строительство', subcategory: 'Инструменты', provider: 'Taobao' },

  { queries: [
    'плитка керамическая напольная',
    'ламинат напольное покрытие',
    'утеплитель теплоизоляция минеральная вата',
    'гипсокартон лист',
    'сухая смесь штукатурка',
  ], category: 'Строительство', subcategory: 'Строительные материалы', provider: 'Taobao' },

  { queries: [
    'смеситель кухня нержавеющая сталь',
    'душевая кабина стеклянная',
    'водонагреватель электрический',
    'раковина керамическая',
    'унитаз напольный',
  ], category: 'Строительство', subcategory: 'Сантехника', provider: 'Taobao' },

  { queries: [
    'LED светильник панельный',
    'автоматический выключатель',
    'кабель электрический медный',
    'розетка двойная с заземлением',
    'выключатель диммер',
  ], category: 'Строительство', subcategory: 'Электрика', provider: 'Taobao' },

  { queries: [
    'краска акриловая стены потолок',
    'грунтовка универсальная глубокого проникновения',
    'лак паркетный полиуретановый',
    'эмаль алкидная белая',
    'морилка дерево защитная',
  ], category: 'Строительство', subcategory: 'Краски и лаки', provider: 'Taobao' },

  { queries: [
    'анкер болт нержавеющая сталь',
    'саморезы универсальные оцинкованные',
    'дюбель распорный',
    'болт шестигранный DIN933',
    'гайка фланцевая нержавеющая',
  ], category: 'Строительство', subcategory: 'Крепеж и метизы', provider: 'Taobao' },

  { queries: [
    'дверь межкомнатная',
    'окно ПВХ стеклопакет',
    'дверная ручка замок',
    'петли дверные скрытые',
    'подоконник ПВХ',
  ], category: 'Строительство', subcategory: 'Двери и окна', provider: 'Taobao' },

  { queries: [
    'обои виниловые моющиеся',
    'декоративная штукатурка',
    'плинтус напольный МДФ',
    'потолочный плинтус',
    'панель стеновая МДФ',
  ], category: 'Строительство', subcategory: 'Отделочные материалы', provider: 'Taobao' },

  // === Промышленность ===
  { queries: [
    'фрезерный станок ЧПУ мини',
    'токарный станок по металлу',
    'сварочный аппарат MIG MAG',
    'гидравлический пресс',
    'ленточная пила по металлу',
  ], category: 'Промышленность', subcategory: 'Станки и оборудование', provider: 'Taobao' },

  { queries: [
    'динамометрический ключ',
    'микрометр цифровой 0-25мм',
    'штангенциркуль нержавеющая сталь',
    'набор ключей торцевых',
    'набор бит отвертка',
  ], category: 'Промышленность', subcategory: 'Инструменты', provider: 'Taobao' },

  { queries: [
    'частотный преобразователь инвертор VFD',
    'контроллер ПЛК программируемый',
    'серводвигатель',
    'реле промышленное 24В',
    'трансформатор понижающий',
  ], category: 'Промышленность', subcategory: 'Электротехника', provider: 'Taobao' },

  { queries: [
    'отрезной диск по металлу',
    'шлифовальный круг',
    'сверло набор HSS кобальт',
    'электроды сварочные',
    'наждачная бумага набор зернистость',
  ], category: 'Промышленность', subcategory: 'Расходные материалы', provider: 'Taobao' },
]

// ============================================================

class QualityImporter {
  constructor() {
    this.existingSkus = new Set()
    this.stats = { apiCalls: 0, imported: 0, skipped: 0, errors: 0 }
    this.subcategoryMap = {}  // name -> { id, categoryId }
  }

  async init() {
    console.log('=== ЗАГРУЗКА СУЩЕСТВУЮЩИХ ДАННЫХ ===\n')

    // Загружаем существующие SKU
    const { data: existing } = await supabase
      .from('catalog_verified_products')
      .select('sku')
    if (existing) {
      existing.forEach(p => { if (p.sku) this.existingSkus.add(p.sku) })
    }
    console.log('Существующих SKU:', this.existingSkus.size)

    // Строим карту подкатегорий
    const { data: categories } = await supabase
      .from('catalog_categories')
      .select('id, key, name')

    for (const cat of categories || []) {
      const { data: subs } = await supabase
        .from('catalog_subcategories')
        .select('id, name')
        .eq('category_id', cat.id)

      for (const sub of subs || []) {
        this.subcategoryMap[cat.name + '::' + sub.name] = {
          subcategoryId: sub.id,
          categoryId: cat.id,
          categoryName: cat.name
        }
      }
    }
    console.log('Подкатегорий в карте:', Object.keys(this.subcategoryMap).length)
  }

  async searchOTAPI(query, provider, limit) {
    this.stats.apiCalls++

    const xmlParameters = `<SearchItemsParameters><Provider>${provider}</Provider><SearchMethod>Catalog</SearchMethod><ItemTitle>${this.escapeXml(query)}</ItemTitle></SearchItemsParameters>`

    const params = new URLSearchParams({
      instanceKey: OTAPI_KEY,
      language: 'ru',
      xmlParameters,
      framePosition: '0',
      frameSize: String(limit)
    })

    try {
      const response = await fetch(OTAPI_URL + 'SearchItemsFrame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: params.toString()
      })

      if (!response.ok) throw new Error('HTTP ' + response.status)

      const data = await response.json()

      if (data.ErrorCode && data.ErrorCode !== 'Ok') {
        throw new Error('OTAPI: ' + data.ErrorCode + ' ' + (data.ErrorDescription || ''))
      }

      return data.Result?.Items?.Content || []
    } catch (err) {
      console.error('    [ERR] API: ' + err.message)
      return []
    }
  }

  async getFullProduct(itemId, provider) {
    this.stats.apiCalls++

    try {
      const params = new URLSearchParams({
        instanceKey: OTAPI_KEY,
        language: 'ru',
        itemId: itemId,
        blockList: 'Description'
      })

      const response = await fetch(OTAPI_URL + 'BatchGetItemFullInfo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: params.toString()
      })

      if (!response.ok) return null
      const data = await response.json()
      return data.Result?.Item || data.Result?.Items?.[0] || null
    } catch {
      return null
    }
  }

  escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  extractPrice(item) {
    // Берём оригинальную цену в CNY и конвертируем в RUB
    const cny = item.Price?.OriginalPrice || 0
    if (cny > 0) return Math.round(cny * CNY_TO_RUB)

    // Fallback на конвертированную (в USD) -> RUB
    const usd = item.Price?.ConvertedPriceList?.Internal?.Price || 0
    if (usd > 0) return Math.round(usd * 92) // ~92 RUB/USD

    return 0
  }

  extractImages(item) {
    const images = []
    const seen = new Set()

    // Картинки из Pictures (в большом размере)
    if (item.Pictures && Array.isArray(item.Pictures)) {
      for (const pic of item.Pictures) {
        const url = pic.Large?.Url || pic.Medium?.Url || pic.Url || pic
        if (url && typeof url === 'string' && !seen.has(url)) {
          seen.add(url)
          images.push(url)
        }
      }
    }

    // Главная картинка как fallback
    if (images.length === 0 && item.MainPictureUrl) {
      images.push(item.MainPictureUrl)
    }

    return images.slice(0, 5)
  }

  buildDescription(item, categoryName) {
    const parts = []

    // Основное название как заголовок
    const title = item.Title || item.OriginalTitle || ''
    if (title) parts.push(title)

    // Описание из OTAPI
    if (item.Description && item.Description.length > 10) {
      // Чистим HTML теги
      const clean = item.Description
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (clean.length > 10) parts.push(clean.substring(0, 500))
    }

    // Характеристики
    const specs = []
    if (item.BrandName && item.BrandName !== 'other/其他') specs.push('Бренд: ' + item.BrandName)
    if (item.MasterQuantity > 0 && item.MasterQuantity < 99999) specs.push('В наличии: ' + item.MasterQuantity + ' шт.')
    if (item.Volume > 0) specs.push('Продано: ' + item.Volume + ' шт.')
    if (item.Location?.City) specs.push('Склад: ' + item.Location.City)

    if (item.FeaturedValues && Array.isArray(item.FeaturedValues)) {
      item.FeaturedValues.forEach(fv => {
        if (fv.Name && fv.Value && fv.Value !== 'Expired') {
          specs.push(fv.Name + ': ' + fv.Value)
        }
      })
    }

    if (specs.length > 0) {
      parts.push('\nХарактеристики:\n' + specs.map(s => '• ' + s).join('\n'))
    }

    if (parts.length === 0) {
      return 'Качественный товар из категории ' + categoryName + '. Прямые поставки из Китая.'
    }

    return parts.join('\n\n')
  }

  buildSpecs(item) {
    const specs = {}

    if (item.BrandName && item.BrandName !== 'other/其他') specs['Бренд'] = item.BrandName
    if (item.VendorName) specs['Продавец'] = item.VendorName
    if (item.Volume > 0) specs['Продано'] = item.Volume + ' шт.'
    if (item.MasterQuantity > 0 && item.MasterQuantity < 99999) specs['Наличие'] = item.MasterQuantity + ' шт.'
    if (item.Location?.City) specs['Город отгрузки'] = item.Location.City
    if (item.StuffStatus) {
      const statusMap = { 'New': 'Новый', 'Used': 'Б/У', 'Refurbished': 'Восстановленный' }
      specs['Состояние'] = statusMap[item.StuffStatus] || item.StuffStatus
    }
    if (item.ProviderType) {
      const providerMap = { 'Taobao': 'Taobao', '1688': '1688', 'AliExpress': 'AliExpress' }
      specs['Маркетплейс'] = providerMap[item.ProviderType] || item.ProviderType
    }

    // FeaturedValues содержат конфигурации товара
    if (item.FeaturedValues && Array.isArray(item.FeaturedValues)) {
      item.FeaturedValues.forEach(fv => {
        if (fv.Name && fv.Value && fv.Value !== 'Expired') {
          specs[fv.Name] = fv.Value
        }
      })
    }

    // Attributes
    if (item.Attributes && Array.isArray(item.Attributes)) {
      item.Attributes.forEach(attr => {
        if (attr.PropertyName && attr.PropertyValue) {
          specs[attr.PropertyName] = attr.PropertyValue
        }
      })
    }

    return specs
  }

  cleanTitle(title) {
    if (!title) return null
    // Убираем лишние пробелы и мусор
    let clean = title
      .replace(/\s+/g, ' ')
      .replace(/[,，]{2,}/g, ',')
      .trim()

    // Обрезаем слишком длинные
    if (clean.length > 120) clean = clean.substring(0, 117) + '...'

    return clean
  }

  async processBlock(block, supplierId) {
    const key = block.category + '::' + block.subcategory
    const mapping = this.subcategoryMap[key]

    if (!mapping) {
      // Ищем подкатегорию по частичному совпадению
      const found = Object.keys(this.subcategoryMap).find(k => k.includes(block.subcategory))
      if (!found) {
        console.log('  [SKIP] Подкатегория не найдена: ' + key)
        return
      }
    }

    const { subcategoryId, categoryId } = mapping || this.subcategoryMap[Object.keys(this.subcategoryMap).find(k => k.includes(block.subcategory))]

    console.log('\n--- ' + block.category + ' > ' + block.subcategory + ' ---')

    const productsToInsert = []

    for (const query of block.queries) {
      console.log('  Запрос: "' + query + '"')

      const items = await this.searchOTAPI(query, block.provider, ITEMS_PER_QUERY)
      console.log('  Найдено: ' + items.length)

      for (const item of items) {
        const sku = item.Id || item.ItemId
        if (!sku) continue

        // Проверка дубликатов
        if (this.existingSkus.has(sku)) {
          this.stats.skipped++
          continue
        }

        const price = this.extractPrice(item)
        if (price < 50) { // Минимум 50 руб
          this.stats.skipped++
          continue
        }

        const title = this.cleanTitle(item.Title)
        if (!title || title.length < 5) {
          this.stats.skipped++
          continue
        }

        const images = this.extractImages(item)
        if (images.length === 0) {
          this.stats.skipped++
          continue
        }

        const description = this.buildDescription(item, block.category)
        const specifications = this.buildSpecs(item)

        productsToInsert.push({
          name: title,
          description: description,
          category: block.category,
          subcategory_id: subcategoryId,
          category_id: categoryId,
          sku: sku,
          price: price,
          currency: 'RUB',
          min_order: (item.FirstLotQuantity || 1) + ' шт.',
          in_stock: true,
          specifications: specifications,
          images: images,
          supplier_id: supplierId,
          is_active: true,
          is_featured: item.Volume > 100 // Популярные товары
        })

        this.existingSkus.add(sku)
      }

      // Пауза между запросами
      await this.sleep(API_DELAY)
    }

    // Сохраняем в БД батчами по 20
    if (productsToInsert.length > 0) {
      for (let i = 0; i < productsToInsert.length; i += 20) {
        const batch = productsToInsert.slice(i, i + 20)
        const { data, error } = await supabase
          .from('catalog_verified_products')
          .insert(batch)
          .select('id')

        if (error) {
          console.error('  [DB ERR] ' + error.message)
          this.stats.errors += batch.length
        } else {
          this.stats.imported += data.length
          console.log('  [OK] Сохранено: ' + data.length + ' товаров')
        }
      }
    }
  }

  async getOrCreateSupplier() {
    const name = 'OTAPI Каталог'
    let { data: supplier } = await supabase
      .from('catalog_verified_suppliers')
      .select('id')
      .eq('name', name)
      .single()

    if (!supplier) {
      const { data } = await supabase
        .from('catalog_verified_suppliers')
        .insert([{
          name: name,
          company_name: 'OTAPI - Прямые поставки из Китая',
          category: 'Универсальный',
          country: 'Китай',
          city: 'Гуанчжоу',
          description: 'Каталог товаров с Taobao, 1688 и AliExpress. Прямые поставки с фабрик Китая. Автоматический перевод и актуальные цены.',
          is_active: true,
          is_verified: true,
          moderation_status: 'approved',
          min_order: 'От 1 шт.',
          response_time: '1-3 дня',
          public_rating: 4.7,
          certifications: ['OTAPI Verified', 'Direct Import'],
          specialties: ['Прямые поставки', 'Taobao', '1688', 'AliExpress', 'Оптовые цены']
        }])
        .select('id')
        .single()
      supplier = data
    }

    return supplier.id
  }

  sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

  printStats() {
    console.log('\n' + '='.repeat(60))
    console.log('ИТОГО:')
    console.log('  API запросов: ' + this.stats.apiCalls)
    console.log('  Импортировано: ' + this.stats.imported)
    console.log('  Пропущено (дубликаты/фильтр): ' + this.stats.skipped)
    console.log('  Ошибок: ' + this.stats.errors)
    console.log('='.repeat(60))
  }
}

// ============================================================

async function main() {
  console.log('='.repeat(60))
  console.log('КАЧЕСТВЕННЫЙ ИМПОРТ КАТАЛОГА ИЗ OTAPI')
  console.log('Ключ: ' + OTAPI_KEY.substring(0, 8) + '...')
  console.log('Курс: 1 CNY = ' + CNY_TO_RUB + ' RUB')
  console.log('='.repeat(60))

  const importer = new QualityImporter()
  await importer.init()

  const supplierId = await importer.getOrCreateSupplier()
  console.log('Поставщик ID: ' + supplierId)

  // Фильтр по категории (опционально)
  const targetCategory = process.argv[2] || 'all'
  console.log('Целевая категория: ' + targetCategory)

  let plan = IMPORT_PLAN
  if (targetCategory !== 'all') {
    plan = IMPORT_PLAN.filter(b => b.category === targetCategory)
  }

  console.log('Блоков к импорту: ' + plan.length)
  console.log('Запросов: ' + plan.reduce((sum, b) => sum + b.queries.length, 0))
  console.log('')

  for (let i = 0; i < plan.length; i++) {
    const block = plan[i]
    console.log('\n[' + (i + 1) + '/' + plan.length + '] ' + block.category + ' > ' + block.subcategory)
    await importer.processBlock(block, supplierId)
  }

  importer.printStats()
}

main()
  .then(() => {
    console.log('\nГотово!')
    process.exit(0)
  })
  .catch(err => {
    console.error('FATAL:', err)
    process.exit(1)
  })
