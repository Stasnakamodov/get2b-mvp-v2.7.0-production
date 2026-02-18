/**
 * API слой для работы с товарами через Supabase и REST API
 * Извлечено из монолитного supabaseApi.ts при рефакторинге на FSD архитектуру
 */

import { supabase } from '@/lib/supabaseClient'
import type { Product } from '../model/types'

// ========================================
// 🎯 РАБОТА С ТОВАРАМИ
// ========================================

/**
 * Загрузка товаров поставщика
 */
interface FetchResult {
  products: Product[]
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
}

export const fetchSupplierProducts = async (
  supplierId: string,
  supplierType: 'user' | 'verified' = 'user',
  cursor?: string | null
): Promise<FetchResult> => {
  try {
    let headers: HeadersInit = {}

    if (supplierType === 'user') {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        return { products: [], nextCursor: null, hasMore: false, totalCount: 0 }
      }
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    let url = `/api/catalog/products?supplier_id=${supplierId}&supplier_type=${supplierType}&limit=50`
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`
    }

    const response = await fetch(url, { headers })
    const data = await response.json()

    return {
      products: data.products || [],
      nextCursor: data.nextCursor || null,
      hasMore: data.hasMore || false,
      totalCount: data.totalCount || 0,
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки товаров:', error)
    return { products: [], nextCursor: null, hasMore: false, totalCount: 0 }
  }
}

/**
 * Создание товара
 */
export const createProduct = async (
  supplierId: string,
  productData: Partial<Product>
): Promise<Product | null> => {
  console.log('📝 [API] Создание товара для поставщика:', supplierId)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const response = await fetch(`/api/catalog/suppliers/${supplierId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(productData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.product) {
      console.log('✅ [API] Товар создан:', data.product.id)
      return data.product
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка создания товара:', error)
    return null
  }
}

/**
 * Обновление товара
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<Product | null> => {
  console.log('✏️ [API] Обновление товара:', productId)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const response = await fetch(`/api/catalog/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.product) {
      console.log('✅ [API] Товар обновлен')
      return data.product
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка обновления товара:', error)
    return null
  }
}

/**
 * Удаление товара
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  console.log('🗑️ [API] Удаление товара:', productId)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const response = await fetch(`/api/catalog/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      console.log('✅ [API] Товар удален')
      return true
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка удаления товара:', error)
    return false
  }
}
