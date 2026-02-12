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

/** Количество локальных placeholder SVG в /public/images/products/ */
const PLACEHOLDER_COUNT = 12

/**
 * Проверяет, является ли URL нерабочим внешним placeholder-ом
 * (picsum.photos возвращает 403 из РФ, alicdn — фейковые URL)
 */
function isUnreachableUrl(url: string): boolean {
  return url.includes('picsum.photos/')
    || /img\.alicdn\.com\/imgextra\/i\d\/(smart_device|iot_product|home_auto|sensor)_/.test(url)
    || /ae04\.alicdn\.com\/kf\/smart_/.test(url)
}

/**
 * Генерирует локальный placeholder на основе product id/name.
 * Использует SVG из /public/images/products/ — не зависит от внешних сервисов.
 */
function getLocalPlaceholder(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  const index = Math.abs(hash) % PLACEHOLDER_COUNT
  return `/images/products/placeholder-${index}.svg`
}

/**
 * Очищает массив изображений: заменяет нерабочие URL на локальные placeholder-ы.
 * Используется в компонентах, которые итерируют по всему массиву images (модалки, карусели).
 */
export function getCleanImages(product: CatalogProduct): string[] {
  if (!product.images || product.images.length === 0) {
    return [getLocalPlaceholder(product.id || product.name || 'default')]
  }

  return product.images.map((img, index) => {
    if (typeof img !== 'string' || !img.startsWith('http')) {
      return getLocalPlaceholder(`${product.id || 'default'}_${index}`)
    }
    if (isUnreachableUrl(img)) {
      return getLocalPlaceholder(`${product.id || 'default'}_${index}`)
    }
    return img
  })
}

/**
 * Получение первого изображения товара
 */
export function getProductImage(product: CatalogProduct): string {
  if (!product.images || product.images.length === 0) {
    return getLocalPlaceholder(product.id || product.name || 'default')
  }

  const firstImage = product.images[0]

  // Если это объект с url
  if (typeof firstImage === 'object' && firstImage !== null) {
    const url = (firstImage as any).url
    if (!url) return getLocalPlaceholder(product.id || product.name || 'default')
    if (isUnreachableUrl(url)) return getLocalPlaceholder(product.id || product.name || 'default')
    return url
  }

  // Проверяем что это валидный URL
  if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
    if (isUnreachableUrl(firstImage)) {
      return getLocalPlaceholder(product.id || product.name || 'default')
    }
    return firstImage
  }

  return getLocalPlaceholder(product.id || product.name || 'default')
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
 * Поддерживает как URLSearchParams, так и ReadonlyURLSearchParams из Next.js
 */
export function parseFiltersFromUrl(searchParams: URLSearchParams | { get: (key: string) => string | null }): CatalogFilters {
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
