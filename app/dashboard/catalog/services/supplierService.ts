/**
 * Service layer для работы с поставщиками
 * Содержит бизнес-логику и комплексные операции
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Supplier } from '../hooks/useSuppliers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_RULES } from '../constants/supplierConfig'

export interface SupplierFormData {
  // Basic info
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
  min_order_amount?: number

  // Banking
  bank_name?: string
  bank_account?: string
  swift?: string

  // Terms
  delivery_terms?: string
  payment_terms?: string

  // Certifications (array of strings)
  certifications?: string[]
}

export interface SupplierSearchParams {
  query?: string
  country?: string
  city?: string
  minRating?: number
  hasProducts?: boolean
  status?: 'active' | 'inactive' | 'pending'
  sortBy?: 'name' | 'rating' | 'products' | 'created'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SupplierValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface SupplierStatistics {
  totalSuppliers: number
  activeSuppliers: number
  pendingSuppliers: number
  totalProducts: number
  averageRating: number
  topSuppliers: Supplier[]
}

class SupplierService {
  private supabase = createClientComponentClient()

  /**
   * Validate supplier form data
   */
  validateSupplier(data: SupplierFormData): SupplierValidationResult {
    const errors: Record<string, string> = {}

    // Validate name
    if (!data.name || data.name.length < VALIDATION_RULES.SUPPLIER_NAME.MIN_LENGTH) {
      errors.name = VALIDATION_RULES.SUPPLIER_NAME.MESSAGE
    }
    if (data.name && data.name.length > VALIDATION_RULES.SUPPLIER_NAME.MAX_LENGTH) {
      errors.name = VALIDATION_RULES.SUPPLIER_NAME.MESSAGE
    }

    // Validate email
    if (!data.email || !VALIDATION_RULES.EMAIL.PATTERN.test(data.email)) {
      errors.email = VALIDATION_RULES.EMAIL.MESSAGE
    }

    // Validate phone (optional)
    if (data.phone && !VALIDATION_RULES.PHONE.PATTERN.test(data.phone)) {
      errors.phone = VALIDATION_RULES.PHONE.MESSAGE
    }

    // Validate website (optional)
    if (data.website && !VALIDATION_RULES.WEBSITE.PATTERN.test(data.website)) {
      errors.website = VALIDATION_RULES.WEBSITE.MESSAGE
    }

    // Validate min order amount (optional)
    if (data.min_order_amount !== undefined) {
      if (data.min_order_amount < VALIDATION_RULES.MIN_ORDER.MIN ||
          data.min_order_amount > VALIDATION_RULES.MIN_ORDER.MAX) {
        errors.min_order_amount = VALIDATION_RULES.MIN_ORDER.MESSAGE
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Create a new supplier with validation
   */
  async createSupplier(data: SupplierFormData): Promise<{ success: boolean; supplier?: Supplier; error?: string }> {
    try {
      // Validate data
      const validation = this.validateSupplier(data)
      if (!validation.isValid) {
        return {
          success: false,
          error: ERROR_MESSAGES.VALIDATION_ERROR
        }
      }

      // Prepare data for insertion
      const supplierData = {
        ...data,
        certifications: data.certifications ? JSON.stringify(data.certifications) : null,
        status: 'pending' as const,
        rating: 0,
        total_products: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert into database
      const { data: newSupplier, error } = await this.supabase
        .from('suppliers')
        .insert(supplierData)
        .select()
        .single()

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        supplier: newSupplier
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      }
    }
  }

  /**
   * Search suppliers with filters
   */
  async searchSuppliers(params: SupplierSearchParams): Promise<{ suppliers: Supplier[]; total: number }> {
    try {
      let query = this.supabase
        .from('suppliers')
        .select('*', { count: 'exact' })

      // Apply filters
      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,company_name.ilike.%${params.query}%,email.ilike.%${params.query}%`)
      }

      if (params.country) {
        query = query.eq('country', params.country)
      }

      if (params.city) {
        query = query.eq('city', params.city)
      }

      if (params.status) {
        query = query.eq('status', params.status)
      }

      if (params.minRating !== undefined) {
        query = query.gte('rating', params.minRating)
      }

      if (params.hasProducts) {
        query = query.gt('total_products', 0)
      }

      // Apply sorting
      const sortColumn = {
        name: 'name',
        rating: 'rating',
        products: 'total_products',
        created: 'created_at'
      }[params.sortBy || 'name']

      query = query.order(sortColumn, { ascending: params.sortOrder !== 'desc' })

      // Apply pagination
      const page = params.page || 1
      const limit = params.limit || 10
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        suppliers: data || [],
        total: count || 0
      }
    } catch (err) {
      return {
        suppliers: [],
        total: 0
      }
    }
  }

  /**
   * Get supplier statistics
   */
  async getStatistics(): Promise<SupplierStatistics> {
    try {
      // Get all suppliers for statistics
      const { data: suppliers, error } = await this.supabase
        .from('suppliers')
        .select('*')

      if (error) {
        throw error
      }

      const allSuppliers = suppliers || []

      // Calculate statistics
      const stats: SupplierStatistics = {
        totalSuppliers: allSuppliers.length,
        activeSuppliers: allSuppliers.filter(s => s.status === 'active').length,
        pendingSuppliers: allSuppliers.filter(s => s.status === 'pending').length,
        totalProducts: allSuppliers.reduce((sum, s) => sum + (s.total_products || 0), 0),
        averageRating: allSuppliers.length > 0
          ? allSuppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / allSuppliers.length
          : 0,
        topSuppliers: allSuppliers
          .filter(s => s.status === 'active')
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 5)
      }

      return stats
    } catch (err) {
      return {
        totalSuppliers: 0,
        activeSuppliers: 0,
        pendingSuppliers: 0,
        totalProducts: 0,
        averageRating: 0,
        topSuppliers: []
      }
    }
  }

  /**
   * Bulk update supplier status
   */
  async bulkUpdateStatus(supplierIds: number[], status: 'active' | 'inactive' | 'pending'): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('suppliers')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', supplierIds)

      if (error) {
        return false
      }

      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Import suppliers from CSV/JSON
   */
  async importSuppliers(data: SupplierFormData[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const supplierData of data) {
      const result = await this.createSupplier(supplierData)
      if (result.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`${supplierData.name || 'Unknown'}: ${result.error}`)
      }
    }

    return results
  }

  /**
   * Export suppliers to JSON
   */
  async exportSuppliers(filters?: SupplierSearchParams): Promise<Supplier[]> {
    const { suppliers } = await this.searchSuppliers({
      ...filters,
      limit: 10000 // Get all suppliers for export
    })

    return suppliers
  }

  /**
   * Get supplier by ID with related data
   */
  async getSupplierWithProducts(id: number): Promise<{ supplier: Supplier | null; products: any[] }> {
    try {
      // Get supplier
      const { data: supplier, error: supplierError } = await this.supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (supplierError || !supplier) {
        return { supplier: null, products: [] }
      }

      // Get supplier's products
      const { data: products, error: productsError } = await this.supabase
        .from('catalog_verified_products')
        .select('*')
        .eq('supplier_id', id)
        .limit(100)

      if (productsError) {
      }

      return {
        supplier,
        products: products || []
      }
    } catch (err) {
      return { supplier: null, products: [] }
    }
  }

  /**
   * Check if email is already registered
   */
  async isEmailTaken(email: string, excludeId?: number): Promise<boolean> {
    try {
      let query = this.supabase
        .from('suppliers')
        .select('id', { count: 'exact', head: true })
        .eq('email', email)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { count, error } = await query

      if (error) {
        return false
      }

      return (count || 0) > 0
    } catch (err) {
      return false
    }
  }

  /**
   * Update supplier rating based on products and reviews
   */
  async updateSupplierRating(id: number): Promise<boolean> {
    try {
      // This would typically calculate rating based on:
      // - Product quality
      // - Delivery performance
      // - Customer reviews
      // For now, we'll use a simple random rating

      const rating = Math.floor(Math.random() * 3) + 3 // 3-5 stars

      const { error } = await this.supabase
        .from('suppliers')
        .update({
          rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        return false
      }

      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Archive old/inactive suppliers
   */
  async archiveInactiveSuppliers(daysInactive: number = 180): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

      const { data, error } = await this.supabase
        .from('suppliers')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'active')
        .lt('updated_at', cutoffDate.toISOString())
        .select()

      if (error) {
        return 0
      }

      return data?.length || 0
    } catch (err) {
      return 0
    }
  }
}

// Export singleton instance
export const supplierService = new SupplierService()

// Export types
export type { Supplier } from '../hooks/useSuppliers'