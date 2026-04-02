import { db } from "@/lib/db/client"
/**
 * API слой для работы с поставщиками через Supabase и REST API
 * Извлечено из монолитного supabaseApi.ts при рефакторинге на FSD архитектуру
 */

import { logger } from '@/src/shared/lib'
import type { Supplier } from '../model/types'

// ========================================
// 🎯 РАБОТА С ПОСТАВЩИКАМИ
// ========================================

/**
 * Загрузка пользовательских поставщиков из API
 */
export const fetchUserSuppliers = async (): Promise<Supplier[]> => {
  
  try {
    // Получаем токен авторизации
    const { data: { session } } = await db.auth.getSession()
    if (!session) {
      return []
    }

    const response = await fetch('/api/catalog/user-suppliers', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error('fetchUserSuppliers HTTP error:', response.status)
      return []
    }

    if (data.suppliers) {
      return data.suppliers as Supplier[]
    } else {
      return []
    }
  } catch (error) {
    logger.error('fetchUserSuppliers error:', error)
    return []
  }
}

/**
 * Загрузка аккредитованных поставщиков из API
 */
export const fetchVerifiedSuppliers = async (): Promise<Supplier[]> => {

  try {
    const response = await fetch('/api/catalog/suppliers?verified=true')
    const data = await response.json()

    if (!response.ok) {
      logger.error('fetchVerifiedSuppliers HTTP error:', response.status)
      return []
    }

    if (data.suppliers) {
      return data.suppliers.map((s: Record<string, unknown>) => ({
        ...s,
        rating: (s.public_rating as number | null) ?? (s.rating as number | null) ?? null,
        total_products: (s.total_products as number | null) ?? null,
      })) as Supplier[]
    } else {
      return []
    }
  } catch (error) {
    logger.error('fetchVerifiedSuppliers error:', error)
    return []
  }
}

/**
 * Создание нового поставщика
 */
export const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier | null> => {

  try {
    const { data: { session } } = await db.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const response = await fetch('/api/catalog/suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(supplierData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.supplier) {
      return data.supplier
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    return null
  }
}

/**
 * Обновление поставщика
 */
export const updateSupplier = async (
  supplierId: string,
  updates: Partial<Supplier>
): Promise<Supplier | null> => {

  try {
    const { data: { session } } = await db.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const response = await fetch(`/api/catalog/suppliers/${supplierId}`, {
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

    if (data.success && data.supplier) {
      return data.supplier
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    return null
  }
}

/**
 * Удаление поставщика
 */
export const deleteSupplier = async (supplierId: string): Promise<boolean> => {

  try {
    const { data: { session } } = await db.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const response = await fetch(`/api/catalog/suppliers/${supplierId}`, {
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
      return true
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    return false
  }
}

// ========================================
// 🎯 SUPPLIER API OBJECT (for hooks)
// ========================================

export const supplierApi = {
  getAll: async (filters?: { room?: string }) => {
    if (filters?.room === 'orange') {
      return fetchVerifiedSuppliers()
    }
    return fetchUserSuppliers()
  },
  create: createSupplier,
  update: async (id: number | string, data: Partial<Supplier>) => {
    const result = await updateSupplier(String(id), data)
    return result !== null
  },
  delete: async (id: number | string) => {
    return deleteSupplier(String(id))
  }
}
