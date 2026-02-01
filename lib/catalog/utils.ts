/**
 * Утилиты каталога TechnoModern
 */

import { CURRENCIES } from './constants'
import type { CatalogProduct, CartItem, CatalogFilters } from './types'

/**
 * Форматирование цены с валютой
 */
export function formatPrice(price: number | undefined, currency: string = 'RUB'): string {
  if (price === undefined || price === null) return 'Цена по запросу'

  const symbol = CURRENCIES[currency as keyof typeof CURRENCIES] || currency

  return `${price.toLocaleString('ru-RU')} ${symbol}`
}

/**
 * Получение первого изображения товара
 */
export function getProductImage(product: CatalogProduct): string | null {
  if (!product.images || product.images.length === 0) return null

  const firstImage = product.images[0]

  // Проверяем что это валидный URL
  if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
    return firstImage
  }

  // Если это объект с url
  if (typeof firstImage === 'object' && firstImage !== null) {
    return (firstImage as any).url || null
  }

  return null
}

/**
 * Форматирование минимального заказа
 */
export function formatMinOrder(minOrder: string | number | undefined): string {
  if (!minOrder) return ''

  if (typeof minOrder === 'number') {
    return `от ${minOrder} шт`
  }

  // Если уже строка с форматированием
  if (minOrder.includes('шт') || minOrder.includes('от')) {
    return minOrder
  }

  return `от ${minOrder} шт`
}

/**
 * Сокращение длинного текста
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Построение URL с фильтрами
 */
export function buildCatalogUrl(baseUrl: string, filters: CatalogFilters): string {
  const params = new URLSearchParams()

  if (filters.search) params.set('q', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.subcategory) params.set('subcategory', filters.subcategory)
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.inStock !== undefined) params.set('inStock', String(filters.inStock))
  if (filters.country) params.set('country', filters.country)
  if (filters.supplierId) params.set('supplier', filters.supplierId)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Парсинг фильтров из URL
 */
export function parseFiltersFromUrl(searchParams: URLSearchParams): CatalogFilters {
  return {
    search: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    subcategory: searchParams.get('subcategory') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    inStock: searchParams.get('inStock') === 'true' ? true : undefined,
    country: searchParams.get('country') || undefined,
    supplierId: searchParams.get('supplier') || undefined,
  }
}

/**
 * Подсчёт суммы корзины
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.product.price || 0
    return sum + price * item.quantity
  }, 0)
}

/**
 * Подсчёт количества товаров в корзине
 */
export function calculateCartItemsCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Проверка наличия товара в корзине
 */
export function isProductInCart(items: CartItem[], productId: string): boolean {
  return items.some(item => item.product.id === productId)
}

/**
 * Получение количества товара в корзине
 */
export function getProductQuantityInCart(items: CartItem[], productId: string): number {
  const item = items.find(item => item.product.id === productId)
  return item?.quantity || 0
}

/**
 * Генерация класса сетки по режиму отображения
 */
export function getGridClass(viewMode: string): string {
  switch (viewMode) {
    case 'grid-4':
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    case 'grid-3':
      return 'grid grid-cols-2 md:grid-cols-3 gap-4'
    case 'grid-2':
      return 'grid grid-cols-1 md:grid-cols-2 gap-4'
    case 'list':
      return 'flex flex-col gap-3'
    default:
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
  }
}
