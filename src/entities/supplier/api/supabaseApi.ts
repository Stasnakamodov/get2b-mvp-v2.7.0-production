/**
 * API слой для работы с поставщиками через Supabase и REST API
 * Извлечено из монолитного файла page.tsx при рефакторинге на FSD архитектуру
 */

import { supabase } from '@/lib/supabaseClient'
import type {
  Supplier,
  Product,
  CatalogCategory,
  EchoCard,
  SuppliersResponse,
  ProductsResponse,
  CategoriesResponse,
  EchoCardsResponse,
  SmartRecommendation
} from '../model/types'

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
// 🎯 РАБОТА С ТОВАРАМИ
// ========================================

/**
 * Загрузка товаров поставщика
 */
export const fetchSupplierProducts = async (
  supplierId: string,
  supplierType: 'user' | 'verified' = 'user'
): Promise<Product[]> => {
  console.log('📦 [API] Загрузка товаров поставщика:', supplierId, supplierType)

  try {
    let headers: HeadersInit = {}

    // Для user поставщиков нужна авторизация
    if (supplierType === 'user') {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.error('❌ [API] Нет сессии для загрузки товаров')
        return []
      }

      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(
      `/api/catalog/products?supplier_id=${supplierId}&supplier_type=${supplierType}`,
      { headers }
    )

    const data = await response.json()

    if (data.products) {
      console.log('✅ [API] Загружено товаров:', data.products.length)
      return data.products
    } else {
      console.warn('⚠️ [API] Нет товаров в ответе')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки товаров:', error)
    return []
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

// ========================================
// 🎯 РАБОТА С КАТЕГОРИЯМИ
// ========================================

/**
 * Загрузка категорий из API
 */
export const fetchCategories = async (): Promise<CatalogCategory[]> => {
  console.log('🔧 [API] Загрузка категорий...')

  try {
    const response = await fetch('/api/catalog/categories')

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.categories && Array.isArray(data.categories)) {
      console.log(`✅ [API] Загружено ${data.categories.length} категорий`)
      return data.categories
    } else {
      console.warn('⚠️ [API] Некорректная структура данных категорий')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки категорий:', error)
    return []
  }
}

/**
 * Загрузка подкатегорий
 */
export const fetchSubcategories = async (categoryId: string): Promise<CatalogCategory[]> => {
  console.log('📂 [API] Загрузка подкатегорий для категории:', categoryId)

  try {
    const response = await fetch(`/api/catalog/categories/${categoryId}/subcategories`)
    const data = await response.json()

    if (data.subcategories && Array.isArray(data.subcategories)) {
      console.log('✅ [API] Загружено подкатегорий:', data.subcategories.length)
      return data.subcategories
    } else {
      console.warn('⚠️ [API] Нет подкатегорий')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки подкатегорий:', error)
    return []
  }
}

// ========================================
// 🎯 РАБОТА С ЭХО КАРТОЧКАМИ
// ========================================

/**
 * Загрузка эхо карточек пользователя
 */
export const fetchEchoCards = async (userId?: string): Promise<EchoCard[]> => {
  console.log('🔮 [API] Загрузка эхо карточек...')

  try {
    let currentUserId = userId

    // Если userId не передан, получаем текущего пользователя
    if (!currentUserId) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error('Не удалось получить ID пользователя')
      }
      currentUserId = userData.user.id
    }

    const response = await fetch(`/api/catalog/echo-cards?user_id=${currentUserId}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки эхо карточек')
    }

    if (data.success && data.echo_cards) {
      console.log('✅ [API] Загружено эхо карточек:', data.echo_cards.length)
      if (data.summary) {
        console.log('📊 [API] Статистика:', data.summary)
      }
      return data.echo_cards
    } else {
      console.warn('⚠️ [API] Нет эхо карточек')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки эхо карточек:', error)
    return []
  }
}

/**
 * Импорт поставщика из эхо карточки
 */
export const importSupplierFromEchoCard = async (echoCard: EchoCard): Promise<Supplier | null> => {
  console.log('📥 [API] Импорт поставщика из эхо карточки:', echoCard.supplier_key)

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user?.id) {
      throw new Error('Не удалось получить ID пользователя')
    }

    const requestData = {
      user_id: userData.user.id,
      supplier_key: echoCard.supplier_key,
      supplier_data: echoCard.supplier_info,
      products: echoCard.products || []
    }

    const response = await fetch('/api/catalog/echo-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка импорта поставщика')
    }

    if (data.success && data.supplier) {
      console.log('✅ [API] Поставщик импортирован:', data.supplier.id)
      return data.supplier
    } else {
      throw new Error('Не удалось импортировать поставщика')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка импорта поставщика:', error)
    return null
  }
}

// ========================================
// 🎯 УМНЫЕ РЕКОМЕНДАЦИИ
// ========================================

/**
 * Загрузка умных рекомендаций
 */
export const fetchRecommendations = async (
  userId?: string,
  limit: number = 10
): Promise<SmartRecommendation[]> => {
  console.log('🧠 [API] Загрузка умных рекомендаций...')

  try {
    let currentUserId = userId

    // Если userId не передан, получаем текущего пользователя
    if (!currentUserId) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error('Не удалось получить ID пользователя')
      }
      currentUserId = userData.user.id
    }

    const response = await fetch(
      `/api/catalog/recommendations?user_id=${currentUserId}&limit=${limit}`
    )
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки рекомендаций')
    }

    if (data.success && data.recommendations) {
      console.log('✅ [API] Загружено рекомендаций:', data.recommendations.length)
      return data.recommendations
    } else {
      console.warn('⚠️ [API] Нет рекомендаций')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки рекомендаций:', error)
    return []
  }
}

// ========================================
// 🎯 ЗАГРУЗКА ИЗОБРАЖЕНИЙ
// ========================================

/**
 * Загрузка изображения на сервер
 */
export const uploadImage = async (
  file: File,
  folder: 'suppliers' | 'products' = 'products'
): Promise<string | null> => {
  console.log('📤 [API] Загрузка изображения:', file.name)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.url) {
      console.log('✅ [API] Изображение загружено:', data.url)
      return data.url
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки изображения:', error)
    return null
  }
}

// ========================================
// 🎯 ПРОВЕРКА ПОДКЛЮЧЕНИЯ
// ========================================

/**
 * Проверка подключения к Supabase
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[SUPABASE CONNECTION ERROR]', error)
      return false
    }

    console.log('✅ [SUPABASE] Подключение активно')
    return true
  } catch (err) {
    console.error('[SUPABASE IMPORT ERROR]', err)
    return false
  }
}