/**
 * OtapiService - Интеграция с OpenTrade Commerce API
 *
 * OTAPI - это платформа для работы с товарами из китайских маркетплейсов:
 * - Taobao, 1688, AliExpress, Alibaba
 * - Автоматический перевод на русский
 * - Конвертация валют
 * - Готовые структурированные данные
 *
 * Документация: http://docs.otapi.net/ru
 * Тарифы:
 * - K0 BASIC: для малых проектов
 * - K1 STANDARD: оптимальный для интернет-магазинов
 * - K2 LIGHT: оплата за запросы без абонплаты
 * - K3 ENTERPRISE: для больших объемов
 *
 * Тестовый период: 5 дней
 */

export interface OtapiConfig {
  instanceKey: string      // Ключ инстанса OTAPI
  apiKey?: string          // API ключ (если требуется)
  language?: string        // Язык ответов (ru, en, etc.)
  currency?: string        // Валюта цен (RUB, USD, EUR)
  endpoint?: string        // Базовый URL API
}

export interface OtapiProduct {
  // Идентификаторы
  id: string
  vendorId: string         // ID товара на маркетплейсе
  vendorName: string       // Название маркетплейса (Taobao, 1688, etc.)

  // Основная информация
  name: string
  description: string
  category: string
  brand?: string

  // Цены
  price: number
  originalPrice: number    // Цена в валюте источника
  currency: string
  minOrderQuantity: number

  // Изображения
  mainImage: string
  images: string[]

  // Характеристики
  specifications: Record<string, any>
  attributes: Array<{
    name: string
    value: string
  }>

  // Доставка
  shippingCost?: number
  deliveryTime?: string

  // Статус
  inStock: boolean
  availableQuantity?: number

  // Рейтинг и отзывы
  rating?: number
  reviewsCount?: number
  soldCount?: number

  // Поставщик
  seller: {
    id: string
    name: string
    rating?: number
    country: string
    city?: string
  }
}

export interface OtapiSearchParams {
  query: string            // Поисковый запрос
  provider?: string        // Маркетплейс (Taobao, 1688, AliExpress)
  category?: string        // Категория товаров
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
  sortBy?: 'price' | 'rating' | 'sales'
  sortOrder?: 'asc' | 'desc'
}

export class OtapiService {
  private instanceKey: string
  private language: string
  private currency: string
  private baseUrl: string

  constructor(config: OtapiConfig) {
    this.instanceKey = config.instanceKey
    this.language = config.language || 'ru'
    this.currency = config.currency || 'RUB'
    this.baseUrl = config.endpoint || 'http://otapi.net/service-json/'

    if (!this.instanceKey) {
      console.warn('⚠️ OTAPI instance key не найден')
      console.warn('⚠️ Получите ключ на https://otcommerce.com/')
    }
  }

  /**
   * Поиск товаров через OTAPI
   */
  async searchProducts(params: OtapiSearchParams): Promise<OtapiProduct[]> {
    console.log('🔍 [OTAPI] Поиск товаров:', params.query)

    try {
      // Формируем XML параметры для поиска
      const xmlParameters = `
        <SearchItemsParameters>
          <Provider>${params.provider || 'Taobao'}</Provider>
          <SearchMethod>Catalog</SearchMethod>
          <ItemTitle>${params.query}</ItemTitle>
          ${params.minPrice ? `<MinPrice>${params.minPrice}</MinPrice>` : ''}
          ${params.maxPrice ? `<MaxPrice>${params.maxPrice}</MaxPrice>` : ''}
          ${params.category ? `<CategoryId>${params.category}</CategoryId>` : ''}
        </SearchItemsParameters>
      `.trim()

      // Формируем параметры запроса
      const requestParams = new URLSearchParams({
        instanceKey: this.instanceKey,
        language: this.language,
        xmlParameters: xmlParameters,
        framePosition: '0',
        frameSize: (params.limit || 20).toString()
      })

      // Вызываем метод SearchItemsFrame
      const response = await fetch(`${this.baseUrl}SearchItemsFrame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: requestParams.toString()
      })

      if (!response.ok) {
        throw new Error(`OTAPI error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Проверяем успешность
      if (!data.OtapiResponse?.Result?.Items) {
        console.warn('⚠️ [OTAPI] Товары не найдены')
        return []
      }

      // Преобразуем ответ в наш формат
      const products = this.mapOtapiResponse(data.OtapiResponse.Result.Items)

      console.log(`✅ [OTAPI] Найдено товаров: ${products.length}`)

      return products

    } catch (error) {
      console.error('❌ [OTAPI] Ошибка поиска:', error)
      throw error
    }
  }

  /**
   * Получить детальную информацию о товаре
   */
  async getProductDetails(itemId: string, provider: string = 'Taobao'): Promise<OtapiProduct | null> {
    console.log('📦 [OTAPI] Получение товара:', itemId)

    try {
      const requestParams = new URLSearchParams({
        instanceKey: this.instanceKey,
        language: this.language,
        itemId: itemId,
        provider: provider,
        currency: this.currency
      })

      // Вызываем метод GetItemFullInfo
      const response = await fetch(`${this.baseUrl}GetItemFullInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: requestParams.toString()
      })

      if (!response.ok) {
        throw new Error(`OTAPI error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.OtapiResponse?.Result?.Item) {
        return null
      }

      const product = this.mapOtapiItem(data.OtapiResponse.Result.Item)

      console.log(`✅ [OTAPI] Товар получен: ${product.name}`)

      return product

    } catch (error) {
      console.error('❌ [OTAPI] Ошибка получения товара:', error)
      throw error
    }
  }

  /**
   * Получить категории товаров
   */
  async getCategories(provider: string = 'Taobao'): Promise<Array<{id: string, name: string, parent?: string}>> {
    console.log('📂 [OTAPI] Получение категорий')

    try {
      const requestParams = new URLSearchParams({
        instanceKey: this.instanceKey,
        language: this.language,
        provider: provider
      })

      const response = await fetch(`${this.baseUrl}GetCategoryInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: requestParams.toString()
      })

      if (!response.ok) {
        throw new Error(`OTAPI error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.OtapiResponse?.Result?.Categories) {
        return []
      }

      return data.OtapiResponse.Result.Categories.map((cat: any) => ({
        id: cat.Id,
        name: cat.Name,
        parent: cat.ParentId
      }))

    } catch (error) {
      console.error('❌ [OTAPI] Ошибка получения категорий:', error)
      throw error
    }
  }

  /**
   * Проверка доступности сервиса
   */
  async checkStatus(): Promise<{
    available: boolean
    instanceInfo?: any
    error?: string
  }> {
    try {
      const requestParams = new URLSearchParams({
        instanceKey: this.instanceKey,
        language: this.language
      })

      // Простой вызов для проверки
      const response = await fetch(`${this.baseUrl}GetInstanceInfo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: requestParams.toString()
      })

      if (!response.ok) {
        return {
          available: false,
          error: `HTTP ${response.status}`
        }
      }

      const data = await response.json()

      return {
        available: true,
        instanceInfo: data.OtapiResponse?.Result
      }

    } catch (error: any) {
      return {
        available: false,
        error: error.message
      }
    }
  }

  /**
   * Преобразование массива товаров из OTAPI формата
   */
  private mapOtapiResponse(items: any[]): OtapiProduct[] {
    return items.map(item => this.mapOtapiItem(item))
  }

  /**
   * Преобразование одного товара из OTAPI формата
   */
  private mapOtapiItem(item: any): OtapiProduct {
    return {
      // Идентификаторы
      id: item.Id || item.ItemId,
      vendorId: item.VendorId || item.Id,
      vendorName: item.VendorName || 'Taobao',

      // Основная информация
      name: item.Title || item.Name || 'Без названия',
      description: item.Description || '',
      category: item.CategoryName || item.Category || 'Другое',
      brand: item.BrandName || item.Brand,

      // Цены
      price: parseFloat(item.Price?.ConvertedPrice || item.Price?.Value || 0),
      originalPrice: parseFloat(item.Price?.OriginalPrice || item.Price?.Value || 0),
      currency: item.Price?.CurrencyCode || this.currency,
      minOrderQuantity: parseInt(item.MinOrderQuantity || '1'),

      // Изображения
      mainImage: item.MainPictureUrl || item.PictureUrl || '',
      images: item.Pictures?.map((pic: any) => pic.Url || pic) || [item.MainPictureUrl],

      // Характеристики
      specifications: item.Specifications || {},
      attributes: item.Attributes?.map((attr: any) => ({
        name: attr.Name || attr.PropertyName,
        value: attr.Value || attr.PropertyValue
      })) || [],

      // Доставка
      shippingCost: parseFloat(item.ShippingCost || '0'),
      deliveryTime: item.DeliveryTime || item.EstimatedDelivery,

      // Статус
      inStock: item.InStock !== false,
      availableQuantity: parseInt(item.Quantity || item.AvailableQuantity || '0'),

      // Рейтинг и отзывы
      rating: parseFloat(item.Rating || item.Score || '0'),
      reviewsCount: parseInt(item.ReviewsCount || item.FeedbackCount || '0'),
      soldCount: parseInt(item.SoldCount || item.Sales || '0'),

      // Поставщик
      seller: {
        id: item.SellerId || item.VendorId || '',
        name: item.SellerName || item.VendorName || 'Неизвестный поставщик',
        rating: parseFloat(item.SellerRating || item.SellerScore || '0'),
        country: item.SellerCountry || 'Китай',
        city: item.SellerCity || item.SellerLocation
      }
    }
  }
}

// Singleton instance
let otapiService: OtapiService | null = null

export function getOtapiService(): OtapiService {
  if (!otapiService) {
    otapiService = new OtapiService({
      instanceKey: process.env.OTAPI_INSTANCE_KEY || '',
      language: 'ru',
      currency: 'RUB'
    })
  }
  return otapiService
}