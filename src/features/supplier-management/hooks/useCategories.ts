/**
 * Хук для работы с категориями каталога
 * Часть FSD архитектуры - features/supplier-management
 */

import { useState, useEffect, useCallback } from 'react'
import {
  fetchCategories,
  fetchSubcategories,
  type CatalogCategory,
  type CategoryTree
} from '@/src/entities/category'
import { logger } from '@/src/shared/lib'
import { CATEGORY_CERTIFICATIONS } from '@/src/shared/config'

interface UseCategoriesResult {
  // Данные
  categories: CatalogCategory[]
  categoriesTree: CategoryTree[]
  selectedCategory: CatalogCategory | null
  selectedSubcategory: CatalogCategory | null
  subcategories: CatalogCategory[]

  // Состояния
  loading: boolean
  error: string | null

  // Методы
  loadCategories: () => Promise<void>
  selectCategory: (category: CatalogCategory | null) => void
  selectSubcategory: (subcategory: CatalogCategory | null) => void
  loadSubcategoriesForCategory: (categoryId: string) => Promise<void>
  getCategoryByName: (name: string) => CatalogCategory | undefined
  getCategoryById: (id: string | number) => CatalogCategory | undefined
  getCertifications: (categoryName: string) => string[]
}

/**
 * Основной хук для работы с категориями
 */
export const useCategories = (): UseCategoriesResult => {
  // Состояния данных
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [categoriesTree, setCategoriesTree] = useState<CategoryTree[]>([])
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<CatalogCategory | null>(null)
  const [subcategories, setSubcategories] = useState<CatalogCategory[]>([])

  // Состояния загрузки
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загрузка категорий
   */
  const loadCategories = useCallback(async () => {
    logger.debug('🔄 Загрузка категорий...')
    setLoading(true)
    setError(null)

    try {
      const loadedCategories = await fetchCategories()

      if (loadedCategories.length === 0) {
        // Если API не вернул категории, используем fallback
        logger.warn('⚠️ API не вернул категории, используем fallback')
        const fallbackCategories = CATEGORY_CERTIFICATIONS.map(cat => ({
          key: cat.category.toLowerCase().replace(/\s+/g, '_'),
          name: cat.category,
          category: cat.category,
          icon: '📦',
          description: '',
          products_count: 0,
          suppliers_count: 0,
          min_price: null,
          max_price: null,
          available_rooms: ['verified', 'user'] as ('verified' | 'user')[],
          countries: [],
          price_range: null,
          rooms_info: {
            has_verified: true,
            has_user: true,
            total_rooms: 2
          }
        }))
        setCategories(fallbackCategories)
      } else {
        setCategories(loadedCategories)
        logger.info(`✅ Загружено ${loadedCategories.length} категорий`)

        // Построение дерева категорий
        const tree = buildCategoriesTree(loadedCategories)
        setCategoriesTree(tree)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setError(message)
      logger.error('❌ Ошибка загрузки категорий:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Построение дерева категорий
   */
  const buildCategoriesTree = (cats: CatalogCategory[]): CategoryTree[] => {
    const tree: CategoryTree[] = []
    const mainCategories = cats.filter(cat => !cat.parent_id || cat.level === 1)

    for (const mainCat of mainCategories) {
      const subs = cats.filter(cat => cat.parent_id === mainCat.id)

      tree.push({
        main_category: mainCat,
        subcategories: subs,
        total_products: mainCat.products_count + subs.reduce((sum, sub) => sum + sub.products_count, 0),
        total_suppliers: mainCat.suppliers_count + subs.reduce((sum, sub) => sum + sub.suppliers_count, 0)
      })
    }

    return tree
  }

  /**
   * Выбор категории
   */
  const selectCategory = useCallback((category: CatalogCategory | null) => {
    logger.debug('📂 Выбрана категория:', category?.name)
    setSelectedCategory(category)
    setSelectedSubcategory(null) // Сбрасываем подкатегорию

    // Если выбрана категория, загружаем её подкатегории
    if (category?.id) {
      loadSubcategoriesForCategory(String(category.id))
    } else {
      setSubcategories([])
    }
  }, [])

  /**
   * Выбор подкатегории
   */
  const selectSubcategory = useCallback((subcategory: CatalogCategory | null) => {
    logger.debug('📁 Выбрана подкатегория:', subcategory?.name)
    setSelectedSubcategory(subcategory)
  }, [])

  /**
   * Загрузка подкатегорий для категории
   */
  const loadSubcategoriesForCategory = useCallback(async (categoryId: string) => {
    logger.debug('📂 Загрузка подкатегорий для категории:', categoryId)

    try {
      const subs = await fetchSubcategories(categoryId)

      if (subs.length > 0) {
        setSubcategories(subs)
        logger.info(`✅ Загружено ${subs.length} подкатегорий`)

        // Обновляем категорию с подкатегориями
        setSelectedCategory(prev => {
          if (prev) {
            return {
              ...prev,
              has_subcategories: true,
              subcategories: subs
            }
          }
          return prev
        })
      } else {
        setSubcategories([])
        logger.info('ℹ️ У категории нет подкатегорий')
      }
    } catch (error) {
      logger.error('❌ Ошибка загрузки подкатегорий:', error)
      setSubcategories([])
    }
  }, [])

  /**
   * Получение категории по имени
   */
  const getCategoryByName = useCallback((name: string): CatalogCategory | undefined => {
    return categories.find(cat =>
      cat.name.toLowerCase() === name.toLowerCase() ||
      cat.category.toLowerCase() === name.toLowerCase()
    )
  }, [categories])

  /**
   * Получение категории по ID
   */
  const getCategoryById = useCallback((id: string | number): CatalogCategory | undefined => {
    const idStr = String(id)
    return categories.find(cat =>
      String(cat.id) === idStr ||
      cat.key === idStr
    )
  }, [categories])

  /**
   * Получение сертификаций для категории
   */
  const getCertifications = useCallback((categoryName: string): string[] => {
    const categoryConfig = CATEGORY_CERTIFICATIONS.find(
      cat => cat.category.toLowerCase() === categoryName.toLowerCase()
    )
    return categoryConfig?.certifications || []
  }, [])

  /**
   * Загрузка при монтировании
   */
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  /**
   * Обработка URL параметров
   */
  useEffect(() => {
    // Early return optimization
    if (categories.length === 0 || typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const categoryParam = params.get('category')
    const subcategoryParam = params.get('subcategory')
    const viewParam = params.get('view')

    // Вариант 1: Клик на подкатегорию
    if (categoryParam && subcategoryParam && !viewParam) {
      logger.debug('🎯 [URL] Открываем подкатегорию:', { categoryParam, subcategoryParam })

      const category = getCategoryById(categoryParam)
      if (category) {
        selectCategory(category)

        // Загружаем и выбираем подкатегорию
        fetchSubcategories(String(category.id)).then(subs => {
          const subcategory = subs.find(sub => String(sub.id) === subcategoryParam)
          if (subcategory) {
            selectSubcategory(subcategory)
          }
        })
      }
    }

    // Вариант 2: Поиск по изображению
    if (categoryParam && viewParam === 'products') {
      logger.debug('🎯 [URL] Открываем категорию для товаров:', categoryParam)

      const category = getCategoryByName(categoryParam)
      if (category) {
        selectCategory(category)

        // Автоматически выбираем первую подкатегорию
        fetchSubcategories(String(category.id)).then(subs => {
          if (subs.length > 0) {
            selectSubcategory(subs[0])
          }
        })
      }
    }
  }, [categories, getCategoryById, getCategoryByName, selectCategory, selectSubcategory])

  return {
    // Данные
    categories,
    categoriesTree,
    selectedCategory,
    selectedSubcategory,
    subcategories,

    // Состояния
    loading,
    error,

    // Методы
    loadCategories,
    selectCategory,
    selectSubcategory,
    loadSubcategoriesForCategory,
    getCategoryByName,
    getCategoryById,
    getCertifications
  }
}

/**
 * Хук для работы с товарами категории
 */
export const useCategoryProducts = (
  categoryId: string | number | null,
  subcategoryId?: string | number | null
) => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    if (!categoryId) {
      setProducts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Здесь будет вызов API для загрузки товаров категории
      // const response = await fetch(`/api/catalog/categories/${categoryId}/products`)
      // const data = await response.json()
      // setProducts(data.products)

      logger.info('✅ Загружены товары категории')
      setProducts([]) // Временная заглушка
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
      setError(message)
      logger.error('❌ Ошибка загрузки товаров категории:', error)
    } finally {
      setLoading(false)
    }
  }, [categoryId, subcategoryId])

  useEffect(() => {
    loadProducts()
  }, [categoryId, subcategoryId])

  return {
    products,
    loading,
    error,
    reload: loadProducts
  }
}