/**
 * API слой для работы с поставщиками через Supabase и REST API
 * Извлечено из монолитного supabaseApi.ts при рефакторинге на FSD архитектуру
 */

import { supabase } from '@/lib/supabaseClient'
import type { Supplier } from '../model/types'

// ========================================
// 🎯 РАБОТА С ПОСТАВЩИКАМИ
// ========================================

/**
 * Загрузка пользовательских поставщиков из API
 */
export const fetchUserSuppliers = async (): Promise<Supplier[]> => {
  console.log('🔄 [API] Загрузка пользовательских поставщиков...')

  try {
    // Получаем токен авторизации
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ [API] Нет активной сессии для загрузки поставщиков')
      return []
    }

    console.log('✅ [API] Сессия найдена, запрос к API...')
    const response = await fetch('/api/catalog/user-suppliers', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    console.log('📡 [API] Ответ получен, статус:', response.status)
    const data = await response.json()

    if (data.suppliers) {
      console.log('✅ [API] Загружено пользовательских поставщиков:', data.suppliers.length)
      return data.suppliers
    } else {
      console.warn('⚠️ [API] Нет пользовательских поставщиков в ответе')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки пользовательских поставщиков:', error)
    return []
  }
}

/**
 * Загрузка аккредитованных поставщиков из API
 */
export const fetchVerifiedSuppliers = async (): Promise<Supplier[]> => {
  console.log('🔄 [API] Загрузка аккредитованных поставщиков...')

  try {
    const response = await fetch('/api/catalog/verified-suppliers')
    const data = await response.json()

    if (data.suppliers) {
      console.log('✅ [API] Загружено аккредитованных поставщиков:', data.suppliers.length)
      return data.suppliers
    } else {
      console.warn('⚠️ [API] Нет аккредитованных поставщиков в ответе')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки аккредитованных поставщиков:', error)
    return []
  }
}

/**
 * Создание нового поставщика
 */
export const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier | null> => {
  console.log('📝 [API] Создание поставщика:', supplierData.name)

  try {
    const { data: { session } } = await supabase.auth.getSession()
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
      console.log('✅ [API] Поставщик создан:', data.supplier.id)
      return data.supplier
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка создания поставщика:', error)
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
  console.log('✏️ [API] Обновление поставщика:', supplierId)

  try {
    const { data: { session } } = await supabase.auth.getSession()
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
      console.log('✅ [API] Поставщик обновлен')
      return data.supplier
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка обновления поставщика:', error)
    return null
  }
}

/**
 * Удаление поставщика
 */
export const deleteSupplier = async (supplierId: string): Promise<boolean> => {
  console.log('🗑️ [API] Удаление поставщика:', supplierId)

  try {
    const { data: { session } } = await supabase.auth.getSession()
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
      console.log('✅ [API] Поставщик удален')
      return true
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка удаления поставщика:', error)
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
