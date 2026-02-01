/**
 * Типы для каталога TechnoModern
 */

// Товар в каталоге
export interface CatalogProduct {
  id: string
  name: string
  description?: string
  category: string
  subcategory?: string
  sku?: string
  price?: number
  currency: string
  min_order?: string
  in_stock: boolean
  images: string[]
  specifications?: Record<string, string>
  supplier_id: string
  supplier_name?: string
  supplier_country?: string
  is_featured?: boolean
  created_at: string
  updated_at?: string
}

// Поставщик
export interface CatalogSupplier {
  id: string
  name: string
  company_name?: string
  country: string
  city?: string
  description?: string
  logo_url?: string
  rating?: number
  reviews_count?: number
  products_count?: number
  is_verified: boolean
}

// Категория
export interface CatalogCategory {
  id: string
  key: string
  name: string
  icon?: string
  description?: string
  products_count: number
  children?: CatalogSubcategory[]
}

// Подкатегория
export interface CatalogSubcategory {
  id: string
  key: string
  name: string
  category_id: string
  products_count: number
}

// Фильтры каталога
export interface CatalogFilters {
  search?: string
  category?: string
  subcategory?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  country?: string
  supplierId?: string
}

// Сортировка
export type CatalogSortField = 'created_at' | 'price' | 'name' | 'popularity'
export type CatalogSortOrder = 'asc' | 'desc'

export interface CatalogSort {
  field: CatalogSortField
  order: CatalogSortOrder
}

// Режим отображения
export type CatalogViewMode = 'grid-4' | 'grid-3' | 'grid-2' | 'list'

// Ответ API с пагинацией
export interface PaginatedProductsResponse {
  success: boolean
  products: CatalogProduct[]
  nextCursor: string | null
  hasMore: boolean
  meta: {
    count: number
    limit: number
    executionTime: number
  }
}

// Элемент корзины
export interface CartItem {
  product: CatalogProduct
  quantity: number
  addedAt: Date
}

// Состояние корзины
export interface CartState {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}
