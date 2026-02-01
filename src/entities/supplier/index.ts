// FSD: entities/supplier - Бизнес сущность поставщика

// Экспорт всех типов
export * from './model/types'

// Экспорт UI компонентов
export { SupplierCard } from './ui/SupplierCard/SupplierCard'

// Реэкспорт основных типов для удобства
export type {
  Supplier,
  EchoCard,
  SupplierFormData,
  RoomType,
  Room,
  CatalogMode,
  LoadingState,
  SmartRecommendation,
  SuppliersResponse,
  EchoCardsResponse,
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

  // Эхо карточки
  fetchEchoCards,
  importSupplierFromEchoCard,

  // Рекомендации
  fetchRecommendations
} from './api'