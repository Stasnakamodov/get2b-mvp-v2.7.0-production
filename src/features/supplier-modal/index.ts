/**
 * FSD: features/supplier-modal - Модальное окно поставщика
 *
 * Извлечено из app/dashboard/catalog/page.tsx для упрощения
 * главной страницы и соблюдения принципа единственной ответственности
 */

// Экспорт хука
export { useSupplierModal } from './hooks/useSupplierModal'

// Экспорт UI компонента
export { SupplierModal } from './ui/SupplierModal'

// Экспорт типов
export type {
  SupplierModalState,
  SupplierModalActions,
  UseSupplierModalResult
} from './model/types'
