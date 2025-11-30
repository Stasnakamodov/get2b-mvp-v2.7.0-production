// FSD: widgets/catalog-suppliers - Виджет каталога поставщиков

// Экспорт UI компонентов
export { SupplierCard } from './ui/SupplierCard'
export { SupplierGrid } from './ui/SupplierGrid'
export { ProductCard } from './ui/ProductCard'
export { CategoryView, SubcategorySelector } from './ui/CategoryView'

// Реэкспорт типов для удобства
export type {
  Supplier,
  Product,
  CatalogCategory,
  RoomType,
  CatalogMode
} from '@/src/entities/supplier'