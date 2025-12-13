// FSD: features/supplier-management - $8G8 C?@02;5=8O ?>AB02I8:0<8

// -:A?>@B 2A5E EC:>2
export { useSuppliers, useSupplier } from './hooks/useSuppliers'
export { useCategories, useCategoryProducts } from './hooks/useCategories'
export { useProducts } from './hooks/useProducts'

// useCart перенесен в features/cart-management

//  5M:A?>@B B8?>2 4;O C4>1AB20
export type {
  Supplier,
  EchoCard,
  SupplierFormData,
  RoomType,
  Room,
  CatalogMode,
  LoadingState
} from '@/src/entities/supplier'

export type {
  Product,
  ProductFormData
} from '@/src/entities/product'

export type { CatalogCategory } from '@/src/entities/category'