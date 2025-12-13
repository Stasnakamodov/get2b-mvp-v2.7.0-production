/**
 * Типы данных для сущности Product в каталоге
 * Извлечено из entities/supplier/model/types.ts при рефакторинге на FSD архитектуру
 */

// ========================================
// 🎯 ТИПЫ ТОВАРОВ
// ========================================

/**
 * Модель товара в каталоге
 */
export interface Product {
  id: string
  supplier_id: string
  product_name: string
  name?: string // Alias для совместимости
  description: string | null
  price: string
  currency: string
  min_order: string | null
  in_stock: boolean
  images: string[] | null
  image_url?: string | null
  item_code: string | null
  sku?: string | null
  specifications?: Record<string, string>
  category?: string
  created_at: string
  updated_at?: string
}

/**
 * Данные формы товара
 */
export interface ProductFormData {
  id: string
  name: string
  price: string
  description: string
  images: string[]
  specifications: Record<string, string>
  category: string
  inStock: boolean
  minOrder: string
}

/**
 * Ответ API со списком товаров
 */
export interface ProductsResponse {
  success: boolean
  products: Product[]
  total?: number
  error?: string
}
