import { ProjectStatus } from './types/project-status';

// Брендированные типы для безопасности типов
export type ProjectID = string & { readonly brand: unique symbol }
export type UserID = string & { readonly brand: unique symbol }

// Создание брендированных типов
export const createProjectID = (id: string): ProjectID => id as ProjectID
export const createUserID = (id: string): UserID => id as UserID

// Типы для компаний
export interface CompanyCard {
  id: string
  name: string
  inn: string
  address: string
  email: string
  phone: string
}

// Типы для банковских счетов
export interface BankAccount {
  id: string
  companyId: string
  name: string
  accountNumber: string
  swift: string
  bankName: string
  country: string
  currency: string
  isDefault: boolean
}

// Типы для элементов спецификации (старый формат)
export interface SpecificationItem {
  id: string
  name: string
  code: string
  quantity: number
  unit: string
  pricePerUnit: number
  totalPrice: number
}

// Типы для проектной спецификации (новый формат project_specifications)
export interface ProjectSpecificationItem {
  id?: string
  project_id: string
  user_id: string
  role: 'client' | 'supplier'
  item_name: string
  item_code?: string | null
  quantity?: number | null
  unit?: string | null
  price?: number | null
  currency?: string | null
  total?: number | null
  supplier_name?: string | null
  image_url?: string | null
  invoice_file_url?: string | null
  category_name?: string | null
  subcategory_name?: string | null
  catalog_product_id?: string | null
  created_at?: string
  updated_at?: string
}

// Типы для запросов спецификации
export interface SpecificationItemsRequest {
  id: string
  title: string
  supplier: string
  status: string
  totalAmount: number
  currency: string
  createdAt: string
  items: SpecificationItem[]
  additionalInfo?: string
}

// Типы для типов инвойсов
export interface InvoiceType {
  id: string
  name: string
}

// Типы для черновиков проектов
export interface ProjectDraft {
  id: string
  createdAt: string
  company: string | null
  bankAccount: string | null
  invoiceType: string
  specificationItems: string | null
  selectedItems: { specId: string; itemIds: string[] }[]
  newSpecification?: {
    supplier: string
    currency: string
    expectedDeliveryDate: string
    additionalInfo: string
    items: {
      id: string
      name: string
      code: string
      quantity: number
      unit: string
      price: number
      total: number
    }[]
  } | null
}

// Типы для проектов
export interface Project {
  id: ProjectID
  title: string
  company: CompanyCard
  bankAccount: BankAccount
  invoiceType: string
  specificationItems: SpecificationItemsRequest | null
  selectedItems: {
    specificationItems: SpecificationItemsRequest
    items: SpecificationItem[]
  }[]
  createdAt: string
  updatedAt: string
  status: ProjectStatus
  current_step: number
  client_confirmation_url?: string
  client_confirmation_uploaded_at?: string
  client_confirmation_status?: string
}

// Типы ошибок
export class ProjectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectError"
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NetworkError"
  }
}

// ========================================
// 🎯 ТИПЫ ДЛЯ CATEGORY-FIRST КАТАЛОГА
// ========================================

// Типы категорий товаров с поддержкой иерархии
export interface CatalogCategory {
  id?: number
  key?: string
  name: string
  category: string  // ⚠️ Для обратной совместимости - alias для name
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
  // 🌳 Новые поля для иерархии
  parent_id?: number | null
  level?: number  // 1 = основная категория, 2 = подкатегория
  sort_order?: number
  has_subcategories?: boolean
  subcategories?: CatalogCategory[]  // Вложенные подкатегории
  category_path?: string  // Полный путь "Основная → Подкатегория"
}

// Тип для иерархического дерева категорий
export interface CategoryTree {
  main_category: CatalogCategory
  subcategories: CatalogCategory[]
  total_products: number
  total_suppliers: number
}

// Типы товаров по категориям
export interface CatalogProduct {
  id: string
  product_name: string
  description: string | null
  price: string
  currency: string
  min_order: string | null
  in_stock: boolean
  images: string[] | null
  item_code: string | null
  created_at: string
  
  // Информация о поставщике
  supplier_id: string
  supplier_name: string
  supplier_company_name: string | null
  supplier_category: string
  supplier_country: string
  supplier_city: string | null
  supplier_email: string | null
  supplier_phone: string | null
  supplier_website: string | null
  supplier_rating: number | null
  supplier_reviews: number | null
  supplier_projects: number | null
  
  // Метаданные комнаты
  room_type: 'verified' | 'user'
  room_icon: string
  room_description: string
  
  // Поля для Step2 интеграции
  item_name: string
  step2_supplier_name: string
  image_url: string
}

// Группированные товары по поставщикам
export interface CatalogSupplierGroup {
  supplier_id: string
  supplier_name: string
  supplier_company_name: string | null
  supplier_category: string
  supplier_country: string
  supplier_city: string | null
  supplier_email: string | null
  supplier_phone: string | null
  supplier_website: string | null
  supplier_rating: number | null
  supplier_reviews: number | null
  supplier_projects: number | null
  room_type: 'verified' | 'user'
  room_icon: string
  room_description: string
  products_count: number
  products: {
    id: string
    product_name: string
    description: string | null
    price: string
    currency: string
    min_order: string | null
    in_stock: boolean
    item_code: string | null
    image_url: string
    item_name: string
  }[]
}

// Данные автозаполнения поставщика
export interface SupplierAutofillData {
  supplier_info: {
    id: string
    name: string
    company_name: string | null
    category: string
    country: string
    city: string | null
    description: string | null
    logo_url: string | null
    contact_email: string | null
    contact_phone: string | null
    website: string | null
    contact_person: string | null
    room_type: 'verified' | 'user'
    room_icon: string
  }
  
  step2_data: {
    products: CatalogProduct[]
    supplier_name: string
  }
  
  step4_data: {
    payment_method: string
    payment_methods_available: string[]
    has_phantom_data: boolean
  }
  
  step5_data: {
    requisites: {
      company_name?: string
      contact_email?: string
      contact_phone?: string
      website?: string
      contact_person?: string
      country?: string
      city?: string
      bank_name?: string
      account_number?: string
      swift?: string
      recipient_name?: string
    }
    has_phantom_data: boolean
    phantom_projects_count: number
  }
  
  metadata: {
    supplier_type: 'verified' | 'user'
    has_products: boolean
    has_phantom_data: boolean
    phantom_data_confidence: number
  }
}

// API Responses
export interface CatalogCategoriesResponse {
  success: boolean
  categories: CatalogCategory[]
  summary: {
    total_categories: number
    total_products: number
    total_suppliers: number
    execution_time_ms: number
  }
  error?: string
}

export interface CatalogProductsByCategoryResponse {
  success: boolean
  category: string
  products: CatalogProduct[]
  suppliers: CatalogSupplierGroup[]
  pagination: {
    limit: number
    offset: number
    total: number
    has_more: boolean
  }
  summary: {
    total_products: number
    suppliers_count: number
    verified_products: number
    user_products: number
    execution_time_ms: number
  }
}

export interface SupplierAutofillResponse {
  success: boolean
  supplier_id: string
  autofill_data: SupplierAutofillData
  summary: {
    supplier_name: string
    supplier_type: 'verified' | 'user'
    products_count: number
    has_phantom_data: boolean
    execution_time_ms: number
  }
}

// Типы для Category-First режима CatalogModal
export type CatalogMode = 'supplier-first' | 'category-first'

export interface CategoryFirstState {
  selectedCategory: string | null
  selectedProduct: CatalogProduct | null
  selectedSupplier: CatalogSupplierGroup | null
  autofillData: SupplierAutofillData | null
  currentStep: 'categories' | 'products' | 'supplier' | 'autofill'
}
