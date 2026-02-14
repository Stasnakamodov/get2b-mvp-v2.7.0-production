/**
 * Константы каталога TechnoModern
 */

import type { CatalogSort, CatalogViewMode } from './types'

// Категории по умолчанию
export const DEFAULT_CATEGORIES = [
  { key: 'electronics', name: 'Электроника', icon: '📱' },
  { key: 'home', name: 'Дом и быт', icon: '🏠' },
  { key: 'health', name: 'Здоровье и красота', icon: '💊' },
  { key: 'auto', name: 'Автотовары', icon: '🚗' },
  { key: 'construction', name: 'Строительство', icon: '🔨' },
  { key: 'textile', name: 'Текстиль и одежда', icon: '👕' },
  { key: 'industrial', name: 'Промышленность', icon: '⚙️' },
  { key: 'food', name: 'Продукты питания', icon: '🍽️' },
]

// Опции сортировки
export const SORT_OPTIONS: { label: string; value: CatalogSort }[] = [
  { label: 'Новые', value: { field: 'created_at', order: 'desc' } },
  { label: 'Популярные', value: { field: 'popularity', order: 'desc' } },
  { label: 'Цена: по возрастанию', value: { field: 'price', order: 'asc' } },
  { label: 'Цена: по убыванию', value: { field: 'price', order: 'desc' } },
  { label: 'По названию', value: { field: 'name', order: 'asc' } },
]

// Опции отображения
export const VIEW_OPTIONS: { label: string; value: CatalogViewMode; icon: string }[] = [
  { label: 'Сетка 4x4', value: 'grid-4', icon: '▦' },
  { label: 'Сетка 3x3', value: 'grid-3', icon: '▤' },
  { label: 'Сетка 2x2', value: 'grid-2', icon: '▥' },
  { label: 'Список', value: 'list', icon: '☰' },
]

// Лимиты пагинации
export const PRODUCTS_PER_PAGE = 50
export const MAX_PRODUCTS_PER_PAGE = 100

// Задержка debounce для поиска (мс)
export const SEARCH_DEBOUNCE_MS = 300

// Размеры карточек товаров (px)
export const CARD_HEIGHTS = {
  'grid-4': 320,
  'grid-3': 340,
  'grid-2': 360,
  'list': 120,
}

// Валюты
export const CURRENCIES = {
  RUB: '₽',
  USD: '$',
  CNY: '¥',
  EUR: '€',
}

// Страны поставщиков
export const SUPPLIER_COUNTRIES = [
  'Китай',
  'Турция',
  'Индия',
  'Вьетнам',
  'Россия',
]

// Ключ localStorage для корзины (unified)
export const CART_STORAGE_KEY = 'get2b_catalog_cart'

// Ключ для передачи корзины в конструктор проекта (deprecated - используем CART_STORAGE_KEY)
export const CART_FOR_PROJECT_KEY = 'get2b_catalog_cart'

// Максимум товаров в корзине
export const MAX_CART_ITEMS = 100

// Wishlist
export const WISHLIST_STORAGE_KEY = 'get2b_catalog_wishlist'
export const MAX_WISHLIST_ITEMS = 200
