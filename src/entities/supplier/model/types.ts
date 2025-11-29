/**
 * Типы для сущности Поставщик
 * Entities layer - бизнес-сущности
 */

export interface Supplier {
  id: number | string
  name: string
  company_name: string
  email: string
  phone?: string
  website?: string
  description?: string

  // Address
  address?: string
  country?: string
  city?: string
  postal_code?: string

  // Business info
  tax_id?: string
  registration_number?: string
  bank_name?: string
  bank_account?: string
  swift?: string
  min_order_amount?: number

  // Terms
  delivery_terms?: string
  payment_terms?: string

  // Metadata
  status: 'active' | 'inactive' | 'pending'
  rating: number
  total_products: number
  certifications?: string | string[]
  created_at: string
  updated_at: string
  specifications?: Record<string, any>
}

export interface SupplierFilters {
  search?: string
  status?: Supplier['status']
  country?: string
  city?: string
  minRating?: number
  hasProducts?: boolean
}

export interface SupplierStats {
  total: number
  active: number
  pending: number
  averageRating: number
  totalProducts: number
}