/**
 * Типы данных для сущности Supplier в каталоге
 * Извлечено из монолитного файла page.tsx при рефакторинге на FSD архитектуру
 */

import type { Product, ProductFormData } from '@/src/entities/product'
import type { CatalogCategory } from '@/src/entities/category'

// ========================================
// 🎯 ОСНОВНЫЕ ТИПЫ ПОСТАВЩИКОВ
// ========================================

/**
 * Основная модель поставщика
 */
export interface Supplier {
  id: string
  name: string
  company_name: string | null
  category: string
  country: string
  city: string | null
  description: string | null
  logo_url: string | null

  // Контактная информация
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  contact_person: string | null

  // Бизнес информация
  min_order: string | null
  response_time: string | null
  employees: string | null
  established: string | null

  // Дополнительные поля
  certifications: string[]
  specialties: string[]
  rating: number | null
  reviews: number | null
  projects: number | null

  // Метаданные
  room_type?: 'verified' | 'user'
  source_type?: 'manual' | 'api' | 'echo_card'
  created_at?: string
  updated_at?: string
}

/**
 * Типы комнат каталога
 */
export type RoomType = 'orange' | 'blue'

export interface Room {
  type: RoomType
  name: string
  icon: string
  description: string
  color: string
  bgColor: string
  borderColor: string
}

// ========================================
// 🎯 ТИПЫ ДЛЯ ФОРМ И МОДАЛОК
// ========================================

/**
 * Данные формы создания/редактирования поставщика
 */
export interface SupplierFormData {
  // Шаг 1: Основная информация
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description: string
  logo_url: string

  // Шаг 2: Контактная информация
  email: string
  phone: string
  website: string
  contact_person: string

  // Шаг 3: Бизнес-профиль
  min_order: string
  response_time: string
  employees: string
  established: string
  certifications: string[]
  specialties: string[]

  // Шаг 4: Товары и каталог
  products: ProductFormData[]

  // Шаг 5: Платежи и реквизиты
  payment_methods: string[]
  payment_method: string
  bank_name: string
  bank_account: string
  swift_code: string
  bank_address: string
  payment_terms: string
  currency: string
  card_bank?: string
  card_number?: string
  card_holder?: string
  crypto_network?: string
  crypto_address?: string
}

// ========================================
// 🎯 ТИПЫ ДЛЯ ЭХО КАРТОЧЕК
// ========================================

/**
 * Эхо карточка поставщика (из существующих проектов)
 */
export interface EchoCard {
  supplier_key: string
  supplier_info: {
    id: string
    name: string
    company_name: string | null
    category: string
    country: string
    city: string | null
    description?: string | null
    contact_email?: string | null
    contact_phone?: string | null
    website?: string | null
    contact_person?: string | null
    payment_type?: string
    payment_methods?: {
      bank?: {
        bank_name: string
        account_number: string
        swift_code?: string
        bank_address?: string
      }
      card?: {
        bank: string
        number: string
        holder: string
      }
      crypto?: {
        network: string
        address: string
      }
    }
    min_order?: string
    response_time?: string
    employees?: string
    established?: string
  }
  products?: string[]
  products_detailed?: Array<{
    name: string
    price?: string
    quantity?: string
    image_url?: string
  }>
  project_count: number
  total_value: number
  last_project_date: string
  categories: string[]
}

/**
 * Выбор шагов для импорта из эхо карточки
 */
export interface ImportStepsSelection {
  [supplierKey: string]: {
    step2_products: boolean
    step4_payment: boolean
    step5_requisites: boolean
  }
}

// ========================================
// 🎯 ТИПЫ ДЛЯ API ОТВЕТОВ
// ========================================

/**
 * Ответ API со списком поставщиков
 */
export interface SuppliersResponse {
  success: boolean
  suppliers: Supplier[]
  total?: number
  page?: number
  error?: string
}

/**
 * Ответ API с эхо карточками
 */
export interface EchoCardsResponse {
  success: boolean
  echo_cards: EchoCard[]
  summary?: {
    total_cards: number
    unique_suppliers: number
    total_projects: number
    total_value: number
  }
  error?: string
}

// ========================================
// 🎯 ТИПЫ ДЛЯ УМНЫХ РЕКОМЕНДАЦИЙ
// ========================================

/**
 * Умная рекомендация поставщика
 */
export interface SmartRecommendation {
  supplier_id: string
  supplier_name: string
  score: number
  reasons: string[]
  predicted_success_rate: number
  similar_projects: Array<{
    id: string
    name: string
    date: string
    amount: number
  }>
}

// ========================================
// 🎯 ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// ========================================

/**
 * Режим отображения каталога
 */
export type CatalogMode = 'suppliers' | 'categories'

/**
 * Вкладки в модальном окне поставщика
 */
export type SupplierModalTab = 'info' | 'products' | 'management'

/**
 * Статус загрузки
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Ошибки формы
 */
export interface FormErrors {
  [key: string]: string
}

/**
 * Параметры пагинации
 */
export interface PaginationParams {
  page: number
  limit: number
  total?: number
}

/**
 * Фильтры каталога
 */
export interface CatalogFilters {
  search?: string
  category?: string
  room?: RoomType
  country?: string
  minOrder?: number
  maxOrder?: number
  rating?: number
  certified?: boolean
}

/**
 * Сортировка каталога
 */
export interface CatalogSort {
  field: 'name' | 'rating' | 'price' | 'created_at'
  direction: 'asc' | 'desc'
}