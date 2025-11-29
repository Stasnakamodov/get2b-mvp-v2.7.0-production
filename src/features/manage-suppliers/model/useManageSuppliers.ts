/**
 * Фича управления поставщиками
 * Features layer - пользовательские сценарии
 */

import { useState, useEffect, useCallback } from 'react'
import { supplierApi, type Supplier, type SupplierFilters } from '@/src/entities/supplier'

interface UseManageSuppliersReturn {
  suppliers: Supplier[]
  loading: boolean
  error: string | null

  // Actions
  createSupplier: (data: Partial<Supplier>) => Promise<Supplier | null>
  updateSupplier: (id: number | string, data: Partial<Supplier>) => Promise<boolean>
  deleteSupplier: (id: number | string) => Promise<boolean>
  loadSuppliers: (filters?: SupplierFilters) => Promise<void>

  // State
  selectedSupplier: Supplier | null
  setSelectedSupplier: (supplier: Supplier | null) => void
}

export function useManageSuppliers(initialFilters?: SupplierFilters): UseManageSuppliersReturn {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const loadSuppliers = useCallback(async (filters?: SupplierFilters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await supplierApi.getAll(filters || initialFilters)
      setSuppliers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load suppliers'
      setError(message)
      console.error('Error loading suppliers:', err)
    } finally {
      setLoading(false)
    }
  }, [initialFilters])

  const createSupplier = useCallback(async (data: Partial<Supplier>): Promise<Supplier | null> => {
    setError(null)

    try {
      const newSupplier = await supplierApi.create(data)
      setSuppliers(prev => [newSupplier, ...prev])
      return newSupplier
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create supplier'
      setError(message)
      console.error('Error creating supplier:', err)
      return null
    }
  }, [])

  const updateSupplier = useCallback(async (id: number | string, data: Partial<Supplier>): Promise<boolean> => {
    setError(null)

    try {
      const updatedSupplier = await supplierApi.update(id, data)
      setSuppliers(prev => prev.map(s =>
        s.id === id ? updatedSupplier : s
      ))

      if (selectedSupplier?.id === id) {
        setSelectedSupplier(updatedSupplier)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update supplier'
      setError(message)
      console.error('Error updating supplier:', err)
      return false
    }
  }, [selectedSupplier])

  const deleteSupplier = useCallback(async (id: number | string): Promise<boolean> => {
    setError(null)

    try {
      await supplierApi.delete(id)
      setSuppliers(prev => prev.filter(s => s.id !== id))

      if (selectedSupplier?.id === id) {
        setSelectedSupplier(null)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete supplier'
      setError(message)
      console.error('Error deleting supplier:', err)
      return false
    }
  }, [selectedSupplier])

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    loadSuppliers,
    selectedSupplier,
    setSelectedSupplier,
  }
}