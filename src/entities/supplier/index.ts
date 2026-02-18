// FSD: entities/supplier - Бизнес сущность поставщика

// Экспорт всех типов
export * from './model/types'

// Экспорт UI компонентов
export { SupplierCard } from './ui/SupplierCard/SupplierCard'

// Реэкспорт основных типов для удобства
export type {
  Supplier,
  SupplierFormData,
  RoomType,
  Room,
  CatalogMode,
  LoadingState,
  SmartRecommendation,
  SuppliersResponse,
  SupplierFilters,
  CatalogFilters
} from './model/types'

// Экспорт API функций
export {
  // Поставщики
  fetchUserSuppliers,
  fetchVerifiedSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  supplierApi,

  // Рекомендации
  fetchRecommendations
} from './api'