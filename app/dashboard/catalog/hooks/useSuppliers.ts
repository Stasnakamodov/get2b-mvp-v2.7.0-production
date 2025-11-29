/**
 * Hook для управления поставщиками
 * Централизует всю логику работы с поставщиками
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ROOM_TYPES, ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION_CONFIG } from '../constants/supplierConfig'

export interface Supplier {
  id: number
  name: string
  company_name: string
  email: string
  phone?: string
  website?: string
  description?: string
  address?: string
  country?: string
  city?: string
  postal_code?: string
  tax_id?: string
  registration_number?: string
  bank_name?: string
  bank_account?: string
  swift?: string
  created_at: string
  updated_at: string
  status: 'active' | 'inactive' | 'pending'
  rating: number
  total_products: number
  min_order_amount?: number
  certifications?: string
  delivery_terms?: string
  payment_terms?: string
  specifications?: any
}

interface UseSuppliersReturn {
  // Data
  suppliers: Supplier[]
  loading: boolean
  error: string | null

  // Pagination
  currentPage: number
  totalPages: number
  totalCount: number

  // Filters
  searchQuery: string
  selectedRoom: string

  // Actions
  loadSuppliers: () => Promise<void>
  createSupplier: (data: Partial<Supplier>) => Promise<Supplier | null>
  updateSupplier: (id: number, data: Partial<Supplier>) => Promise<boolean>
  deleteSupplier: (id: number) => Promise<boolean>

  // Setters
  setSearchQuery: (query: string) => void
  setSelectedRoom: (room: string) => void
  setCurrentPage: (page: number) => void

  // Computed
  filteredSuppliers: Supplier[]
  paginatedSuppliers: Supplier[]
}

export function useSuppliers(initialRoom: string = ROOM_TYPES.ORANGE): UseSuppliersReturn {
  const supabase = createClientComponentClient()

  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(PAGINATION_CONFIG.INITIAL_PAGE)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoom, setSelectedRoom] = useState(initialRoom)

  // Computed values
  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers

    // Filter by room/category
    if (selectedRoom === ROOM_TYPES.ORANGE) {
      filtered = filtered.filter(s => s.status === 'active')
    } else if (selectedRoom === ROOM_TYPES.BLUE) {
      filtered = filtered.filter(s => s.specifications?.personal === true)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(query) ||
        s.company_name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.city?.toLowerCase().includes(query) ||
        s.country?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [suppliers, selectedRoom, searchQuery])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredSuppliers.length / PAGINATION_CONFIG.SUPPLIERS_PER_PAGE)
  }, [filteredSuppliers.length])

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * PAGINATION_CONFIG.SUPPLIERS_PER_PAGE
    const end = start + PAGINATION_CONFIG.SUPPLIERS_PER_PAGE
    return filteredSuppliers.slice(start, end)
  }, [filteredSuppliers, currentPage])

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError, count } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setSuppliers(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
      console.error('Error loading suppliers:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create supplier
  const createSupplier = useCallback(async (data: Partial<Supplier>): Promise<Supplier | null> => {
    setError(null)

    try {
      // Validate required fields
      if (!data.name || !data.email) {
        throw new Error(ERROR_MESSAGES.VALIDATION_ERROR)
      }

      const { data: newSupplier, error: createError } = await supabase
        .from('suppliers')
        .insert({
          ...data,
          status: data.status || 'pending',
          rating: data.rating || 0,
          total_products: data.total_products || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        throw new Error(createError.message)
      }

      // Update local state
      setSuppliers(prev => [newSupplier, ...prev])

      return newSupplier
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
      console.error('Error creating supplier:', err)
      return null
    }
  }, [supabase])

  // Update supplier
  const updateSupplier = useCallback(async (id: number, data: Partial<Supplier>): Promise<boolean> => {
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('suppliers')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update local state
      setSuppliers(prev => prev.map(s =>
        s.id === id ? { ...s, ...data } : s
      ))

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
      console.error('Error updating supplier:', err)
      return false
    }
  }, [supabase])

  // Delete supplier
  const deleteSupplier = useCallback(async (id: number): Promise<boolean> => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Update local state
      setSuppliers(prev => prev.filter(s => s.id !== id))

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
      console.error('Error deleting supplier:', err)
      return false
    }
  }, [supabase])

  // Load suppliers on mount
  useEffect(() => {
    // loadSuppliers() // TODO: Enable when suppliers table is created in DB
  }, [loadSuppliers])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(PAGINATION_CONFIG.INITIAL_PAGE)
  }, [searchQuery, selectedRoom])

  return {
    // Data
    suppliers,
    loading,
    error,

    // Pagination
    currentPage,
    totalPages,
    totalCount,

    // Filters
    searchQuery,
    selectedRoom,

    // Actions
    loadSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,

    // Setters
    setSearchQuery,
    setSelectedRoom,
    setCurrentPage,

    // Computed
    filteredSuppliers,
    paginatedSuppliers
  }
}

// Export helper hooks for specific use cases
export function useSupplierById(id: number | null) {
  const { suppliers, loading, loadSuppliers } = useSuppliers()

  const supplier = useMemo(() => {
    if (!id) return null
    return suppliers.find(s => s.id === id) || null
  }, [suppliers, id])

  return {
    supplier,
    loading,
    reload: loadSuppliers
  }
}

export function useActiveSuppliers() {
  const { suppliers, loading, error, loadSuppliers } = useSuppliers()

  const activeSuppliers = useMemo(() => {
    return suppliers.filter(s => s.status === 'active')
  }, [suppliers])

  return {
    suppliers: activeSuppliers,
    loading,
    error,
    reload: loadSuppliers
  }
}