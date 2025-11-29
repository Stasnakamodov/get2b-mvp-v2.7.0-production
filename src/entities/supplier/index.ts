/**
 * Public API сущности Supplier
 * Экспортирует только то, что нужно другим слоям
 */

// Types
export type { Supplier, SupplierFilters, SupplierStats } from './model/types'

// API
export { supplierApi } from './api/supplierApi'

// UI Components
export { SupplierCard } from './ui/SupplierCard/SupplierCard'