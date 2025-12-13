/**
 * API слой для работы с категориями через REST API
 * Извлечено из монолитного supabaseApi.ts при рефакторинге на FSD архитектуру
 */

import type { CatalogCategory } from '../model/types'

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
