/**
 * Типы данных для сущности Category в каталоге
 * Извлечено из entities/supplier/model/types.ts при рефакторинге на FSD архитектуру
 */

// ========================================
// 🎯 ТИПЫ КАТЕГОРИЙ
// ========================================

/**
 * Категория товаров с поддержкой иерархии
 */
export interface CatalogCategory {
  id?: number
  key?: string
  name: string
  category: string  // Alias для обратной совместимости
  products_count: number
  suppliers_count: number
  min_price: number | null
  max_price: number | null
  available_rooms: ('verified' | 'user')[]
  countries: string[]
  icon: string
  description: string
  price_range?: string | null
  rooms_info: {
    has_verified: boolean
    has_user: boolean
    total_rooms: number
  }
  // Поля для иерархии
  parent_id?: number | null
  level?: number  // 1 = основная категория, 2 = подкатегория
  sort_order?: number
  has_subcategories?: boolean
  subcategories?: CatalogCategory[]
  category_path?: string  // Полный путь "Основная → Подкатегория"
}

/**
 * Дерево категорий
 */
export interface CategoryTree {
  main_category: CatalogCategory
  subcategories: CatalogCategory[]
  total_products: number
  total_suppliers: number
}

/**
 * Ответ API со списком категорий
 */
export interface CategoriesResponse {
  success: boolean
  categories: CatalogCategory[]
  error?: string
}
