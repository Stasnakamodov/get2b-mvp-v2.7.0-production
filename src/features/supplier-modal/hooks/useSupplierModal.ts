/**
 * Хук для управления модальным окном поставщика
 * FSD: features/supplier-modal/hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Supplier } from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'
import { fetchSupplierProducts } from '@/src/entities/product'
import type { UseSupplierModalResult } from '../model/types'
import { logger } from '@/src/shared/lib'

interface UseSupplierModalOptions {
  onStartProject?: (supplier: Supplier) => void
  selectedRoom?: 'orange' | 'blue'
}

export const useSupplierModal = (options: UseSupplierModalOptions = {}): UseSupplierModalResult => {
  const { onStartProject, selectedRoom = 'orange' } = options

  const [isOpen, setIsOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const cursorRef = useRef<string | null>(null)

  const open = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setSelectedSupplier(null)
    setProducts([])
    setHasMore(false)
    setTotalCount(0)
    cursorRef.current = null
  }, [])

  const loadMore = useCallback(async () => {
    if (!selectedSupplier || !cursorRef.current || loadingMore) return

    setLoadingMore(true)
    try {
      const supplierType = selectedSupplier.room_type ||
        (selectedRoom === 'orange' ? 'verified' : 'user')

      const result = await fetchSupplierProducts(selectedSupplier.id, supplierType, cursorRef.current)
      setProducts(prev => [...prev, ...result.products])
      cursorRef.current = result.nextCursor
      setHasMore(result.hasMore)
    } catch (error) {
      logger.error('Ошибка загрузки товаров:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [selectedSupplier, selectedRoom, loadingMore])

  useEffect(() => {
    if (isOpen && selectedSupplier) {
      const loadInitial = async () => {
        setLoading(true)
        try {
          const supplierType = selectedSupplier.room_type ||
            (selectedRoom === 'orange' ? 'verified' : 'user')

          const result = await fetchSupplierProducts(selectedSupplier.id, supplierType)
          setProducts(result.products)
          cursorRef.current = result.nextCursor
          setHasMore(result.hasMore)
          setTotalCount(result.totalCount)
        } catch (error) {
          logger.error('Ошибка загрузки товаров:', error)
          setProducts([])
        } finally {
          setLoading(false)
        }
      }

      loadInitial()
    }
  }, [isOpen, selectedSupplier, selectedRoom])

  return {
    isOpen,
    selectedSupplier,
    products,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    open,
    close,
    loadMore,
    onStartProject
  }
}
