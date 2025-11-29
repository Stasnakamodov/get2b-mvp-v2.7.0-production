/**
 * API для работы с поставщиками
 * Entities layer
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Supplier, SupplierFilters } from '../model/types'

class SupplierApi {
  private supabase = createClientComponentClient()

  async getAll(filters?: SupplierFilters): Promise<Supplier[]> {
    let query = this.supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.country) {
      query = query.eq('country', filters.country)
    }

    if (filters?.city) {
      query = query.eq('city', filters.city)
    }

    if (filters?.minRating !== undefined) {
      query = query.gte('rating', filters.minRating)
    }

    if (filters?.hasProducts) {
      query = query.gt('total_products', 0)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching suppliers:', error)
      throw error
    }

    return data || []
  }

  async getById(id: number | string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching supplier:', error)
      return null
    }

    return data
  }

  async create(supplier: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .insert({
        ...supplier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating supplier:', error)
      throw error
    }

    return data
  }

  async update(id: number | string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating supplier:', error)
      throw error
    }

    return data
  }

  async delete(id: number | string): Promise<boolean> {
    const { error } = await this.supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting supplier:', error)
      throw error
    }

    return true
  }

  async getStats(): Promise<{
    total: number
    active: number
    pending: number
    averageRating: number
  }> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('status, rating')

    if (error) {
      console.error('Error fetching supplier stats:', error)
      throw error
    }

    const suppliers = data || []

    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.status === 'active').length,
      pending: suppliers.filter(s => s.status === 'pending').length,
      averageRating: suppliers.length > 0
        ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length
        : 0,
    }
  }
}

export const supplierApi = new SupplierApi()