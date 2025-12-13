// FSD: entities/supplier - Бизнес сущность поставщика

// Экспорт всех типов
export * from './model/types'

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
  EchoCardsResponse
} from './model/types'

// Экспорт API функций
export {
  // Поставщики
  fetchUserSuppliers,
  fetchVerifiedSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,

  // Эхо карточки
  fetchEchoCards,
  importSupplierFromEchoCard,

  // Рекомендации
  fetchRecommendations
} from './api'