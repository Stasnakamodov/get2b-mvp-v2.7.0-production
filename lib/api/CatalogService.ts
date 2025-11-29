/**
 * CatalogService - сервис для работы с API каталога
 * Инкапсулирует всю логику работы с товарами, категориями и поставщиками
 */

import apiClient, { type ApiResponse } from './ApiClient'

// Типы данных
export interface Category {
  id: string
  name: string
  icon?: string
  description?: string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  name: string
  category_id: string
  description?: string
}

export interface Product {
  id: string
  name: string
  product_name?: string
  description?: string
  price: number
  currency: string
  images?: string[]
  category?: string
  subcategory?: string
  supplier_id?: string
  supplier_name?: string
  supplier_company_name?: string
  specifications?: Record<string, any>
  room_type?: 'orange' | 'blue'
}

export interface Supplier {
  id: string
  name: string
  company_name?: string
  logo_url?: string
  category?: string
  description?: string
  contact_email?: string
  contact_phone?: string
  website?: string
  min_order?: string
  response_time?: string
  employees?: string
  established?: string
  is_verified?: boolean
}

export interface CartItem extends Product {
  quantity: number
  total_price: number
}

class CatalogService {
  /**
   * Получить все категории
   */
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>('/api/catalog/categories')
  }

  /**
   * Получить подкатегории для категории
   */
  async getSubcategories(categoryId: string): Promise<ApiResponse<Subcategory[]>> {
    return apiClient.get<Subcategory[]>(`/api/catalog/categories/${categoryId}/subcategories`)
  }

  /**
   * Получить товары по категории
   */
  async getProductsByCategory(
    category: string,
    options?: {
      subcategory?: string
      search?: string
      limit?: number
      token?: string
    }
  ): Promise<ApiResponse<{ products: Product[], category: string }>> {
    const params: Record<string, any> = {
      limit: options?.limit || 100
    }

    if (options?.subcategory) {
      params.subcategory = options.subcategory
    }

    if (options?.search) {
      params.search = options.search
    }

    return apiClient.get<{ products: Product[], category: string }>(
      `/api/catalog/products-by-category/${encodeURIComponent(category)}`,
      {
        params,
        token: options?.token
      }
    )
  }

  /**
   * Получить поставщиков
   */
  async getSuppliers(options?: {
    room?: 'orange' | 'blue'
    category?: string
    search?: string
  }): Promise<ApiResponse<Supplier[]>> {
    return apiClient.get<Supplier[]>('/api/catalog/suppliers', {
      params: options
    })
  }

  /**
   * Получить верифицированных поставщиков
   */
  async getVerifiedSuppliers(): Promise<ApiResponse<Supplier[]>> {
    return apiClient.get<Supplier[]>('/api/catalog/verified-suppliers')
  }

  /**
   * Получить персональных поставщиков
   */
  async getPersonalSuppliers(userId: string): Promise<ApiResponse<Supplier[]>> {
    return apiClient.get<Supplier[]>(`/api/catalog/personal-suppliers/${userId}`)
  }

  /**
   * Добавить товар в корзину
   */
  async addToCart(product: Product, quantity: number = 1): Promise<CartItem> {
    return {
      ...product,
      quantity,
      total_price: product.price * quantity
    }
  }

  /**
   * Создать поставщика
   */
  async createSupplier(supplier: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    return apiClient.post<Supplier>('/api/catalog/suppliers', supplier)
  }

  /**
   * Обновить поставщика
   */
  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    return apiClient.put<Supplier>(`/api/catalog/suppliers/${id}`, supplier)
  }

  /**
   * Удалить поставщика
   */
  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/catalog/suppliers/${id}`)
  }

  /**
   * Создать товар
   */
  async createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('/api/catalog/products', product)
  }

  /**
   * Обновить товар
   */
  async updateProduct(id: string, product: Partial<Product>): Promise<ApiResponse<Product>> {
    return apiClient.put<Product>(`/api/catalog/products/${id}`, product)
  }

  /**
   * Удалить товар
   */
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/catalog/products/${id}`)
  }

  /**
   * Загрузить изображение товара
   */
  async uploadProductImage(productId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('image', file)

    return apiClient.post<{ url: string }>(
      `/api/catalog/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  }

  /**
   * Загрузить логотип поставщика
   */
  async uploadSupplierLogo(supplierId: string, file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('logo', file)

    return apiClient.post<{ url: string }>(
      `/api/catalog/suppliers/${supplierId}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  }

  /**
   * Создать проект из корзины
   */
  async createProjectFromCart(cart: CartItem[], supplierId: string): Promise<ApiResponse<{ projectId: string }>> {
    return apiClient.post<{ projectId: string }>('/api/projects/from-cart', {
      cart,
      supplier_id: supplierId
    })
  }

  /**
   * Получить рекомендации
   */
  async getRecommendations(): Promise<ApiResponse<any>> {
    return apiClient.get<any>('/api/catalog/recommendations')
  }
}

// Создаем singleton экземпляр
const catalogService = new CatalogService()

export default catalogService
export { CatalogService }