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
  images: (string | { url: string })[]
  specifications?: Record<string, string>
  supplier_id: string
  supplier_name?: string
  supplier_country?: string
  is_featured?: boolean
  has_variants?: boolean
  variants?: ProductVariant[]
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
  // Дополнительные поля для аккредитованных поставщиков
  public_rating?: number
  projects_count?: number
  is_featured?: boolean
  is_active?: boolean
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
  totalCount: number
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
  variant?: ProductVariant
}

// Состояние корзины
export interface CartState {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

// Элемент избранного
export interface WishlistItem {
  product: CatalogProduct
  addedAt: Date
}

// ========== Feature 2: Faceted Search ==========

export interface FacetCount {
  name: string
  count: number
}

export interface FacetData {
  categories: FacetCount[]
  countries: FacetCount[]
  stock: { in_stock: boolean; count: number }[]
  priceRange: { min_price: number; max_price: number }
  totalCount: number
}

// ========== Feature 3: Server-Side Cart ==========

export interface ServerCartItem {
  id: string
  cart_id: string
  product_id: string
  product_table: string
  quantity: number
  added_at: string
  variant_id?: string
  product?: CatalogProduct
}

export interface ServerCart {
  id: string
  user_id: string
  items: ServerCartItem[]
  created_at: string
  updated_at: string
}

// ========== Feature 4: Dynamic Collections ==========

export interface CollectionCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like'
  value: string | number | boolean | string[]
}

export interface CatalogCollection {
  id: string
  slug: string
  name: string
  description?: string
  image_url?: string
  rules: Record<string, CollectionCondition[]>
  rule_type: 'auto' | 'manual'
  sort_field: string
  sort_order: string
  max_products: number
  is_active: boolean
  is_featured: boolean
  position: number
  created_at: string
  preview_products?: CatalogProduct[]
}

// ========== Feature 5: Product Variants ==========

export interface ProductVariant {
  id: string
  product_id: string
  sku?: string
  name: string
  attributes: Record<string, string>
  price?: number
  currency: string
  in_stock: boolean
  stock_quantity?: number
  images?: string[]
  is_active: boolean
  created_at: string
}
