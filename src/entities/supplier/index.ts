// FSD: entities/supplier - Бизнес сущность поставщика

// Экспорт всех типов
export * from './model/types'

// Реэкспорт основных типов для удобства
export type {
  Supplier,
  Product,
  CatalogCategory,
  EchoCard,
  SupplierFormData,
  ProductFormData,
  RoomType,
  Room,
  CatalogMode,
  LoadingState
} from './model/types'

// Экспорт API функций
export {
  // Поставщики
  fetchUserSuppliers,
  fetchVerifiedSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,

  // Товары
  fetchSupplierProducts,
  createProduct,
  updateProduct,
  deleteProduct,

  // Категории
  fetchCategories,
  fetchSubcategories,

  // Эхо карточки
  fetchEchoCards,
  importSupplierFromEchoCard,

  // Рекомендации
  fetchRecommendations,

  // Утилиты
  uploadImage,
  checkSupabaseConnection
} from './api/supabaseApi'