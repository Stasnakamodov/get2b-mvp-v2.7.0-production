/**
 * Типы для фичи модального окна поставщика
 * FSD: features/supplier-modal/model
 */

import type { Supplier } from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'

/**
 * Состояние модального окна поставщика
 */
export interface SupplierModalState {
  isOpen: boolean
  selectedSupplier: Supplier | null
  products: Product[]
  loading: boolean
}

/**
 * Действия модального окна
 */
export interface SupplierModalActions {
  open: (supplier: Supplier) => void
  close: () => void
  onStartProject?: (supplier: Supplier) => void
}

/**
 * Результат хука useSupplierModal
 */
export interface UseSupplierModalResult extends SupplierModalState, SupplierModalActions {}
