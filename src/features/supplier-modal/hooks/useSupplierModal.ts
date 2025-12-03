/**
 * Хук для управления модальным окном поставщика
 * FSD: features/supplier-modal/hooks
 *
 * Извлечено из app/dashboard/catalog/page.tsx
 * для упрощения главной страницы и соблюдения SRP
 */

import { useState, useEffect, useCallback } from 'react'
import type { Supplier } from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'
import { fetchSupplierProducts } from '@/src/entities/product'
import type { UseSupplierModalResult } from '../model/types'
import { logger } from '@/src/shared/lib'

interface UseSupplierModalOptions {
  onStartProject?: (supplier: Supplier) => void
  selectedRoom?: 'orange' | 'blue'
}

/**
 * Хук для управления модальным окном поставщика
 *
 * Функциональность:
 * - Открытие/закрытие модалки
 * - Автоматическая загрузка товаров при открытии
 * - Управление состоянием загрузки
 */
export const useSupplierModal = (options: UseSupplierModalOptions = {}): UseSupplierModalResult => {
  const { onStartProject, selectedRoom = 'orange' } = options

  const [isOpen, setIsOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * Открытие модального окна с поставщиком
   */
  const open = useCallback((supplier: Supplier) => {
    logger.debug('Открытие модального окна поставщика:', supplier.name)
    setSelectedSupplier(supplier)
    setIsOpen(true)
  }, [])

  /**
   * Закрытие модального окна
   */
  const close = useCallback(() => {
    logger.debug('Закрытие модального окна поставщика')
    setIsOpen(false)
    setSelectedSupplier(null)
    setProducts([])
  }, [])

  /**
   * Загрузка товаров при открытии модалки
   */
  useEffect(() => {
    if (isOpen && selectedSupplier) {
      const loadSupplierProducts = async () => {
        setLoading(true)

        try {
          // Определяем тип поставщика
          const supplierType = selectedSupplier.room_type ||
            (selectedRoom === 'orange' ? 'verified' : 'user')

          logger.debug(`Загрузка товаров поставщика ${selectedSupplier.id} (${supplierType})`)

          const loadedProducts = await fetchSupplierProducts(selectedSupplier.id, supplierType)
          setProducts(loadedProducts)

          logger.info(`✅ Загружено ${loadedProducts.length} товаров`)
        } catch (error) {
          logger.error('❌ Ошибка загрузки товаров:', error)
          setProducts([])
        } finally {
          setLoading(false)
        }
      }

      loadSupplierProducts()
    }
  }, [isOpen, selectedSupplier, selectedRoom])

  return {
    isOpen,
    selectedSupplier,
    products,
    loading,
    open,
    close,
    onStartProject
  }
}
