// FSD: entities/product - Бизнес сущность товара

// Model
export type { Product, ProductFormData, ProductsResponse } from './model/types'

// API
export { fetchSupplierProducts, createProduct, updateProduct, deleteProduct } from './api'
