/**
 * Hook для управления категориями и подкатегориями
 * Централизует логику работы с категориями товаров
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ERROR_MESSAGES } from '../constants/supplierConfig'

export interface Category {
  id: number
  name: string
  description?: string
  icon?: string
  parent_id?: number
  slug?: string
  order?: number
  is_active: boolean
  created_at: string
  updated_at: string
  products_count?: number
  specifications?: any
}

export interface Subcategory {
  id: string | number
  name: string
  category: string
  count?: number
  icon?: string
}

interface UseCategoriesReturn {
  // Data
  categories: Category[]
  subcategories: Subcategory[]
  loading: boolean
  error: string | null

  // Filters
  selectedCategory: string | null
  selectedSubcategory: string | null

  // Actions
  loadCategories: () => Promise<void>
  loadSubcategories: (category: string) => Promise<void>
  createCategory: (data: Partial<Category>) => Promise<Category | null>
  updateCategory: (id: number, data: Partial<Category>) => Promise<boolean>
  deleteCategory: (id: number) => Promise<boolean>

  // Setters
  setSelectedCategory: (category: string | null) => void
  setSelectedSubcategory: (subcategory: string | null) => void

  // Computed
  categoryTree: Map<number, Category[]>
  getCategoryByName: (name: string) => Category | undefined
  getSubcategoriesByCategory: (category: string) => Subcategory[]
  getTotalProductsInCategory: (category: string) => number
}

export function useCategories(): UseCategoriesReturn {
  const supabase = createClientComponentClient()

  // State
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)

  // Build category tree (parent -> children)
  const categoryTree = useMemo(() => {
    const tree = new Map<number, Category[]>()

    categories.forEach(category => {
      const parentId = category.parent_id || 0
      if (!tree.has(parentId)) {
        tree.set(parentId, [])
      }
      tree.get(parentId)?.push(category)
    })

    return tree
  }, [categories])

  // Load categories from database
  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // First, get categories from catalog_categories table
      const { data: catalogCategories, error: catalogError } = await supabase
        .from('catalog_categories')
        .select('*')
        .order('name')

      if (catalogError) {
      }

      // Also get unique categories from products
      const { data: productCategories, error: productError } = await supabase
        .from('catalog_verified_products')
        .select('category')
        .not('category', 'is', null)

      if (productError) {
      }

      // Combine and deduplicate
      const categoryMap = new Map<string, Category>()

      // Add catalog categories
      if (catalogCategories) {
        catalogCategories.forEach(cat => {
          categoryMap.set(cat.name, {
            id: cat.id,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            parent_id: cat.parent_id,
            slug: cat.slug,
            order: cat.sort_order || cat.order,
            is_active: cat.is_active !== false,
            created_at: cat.created_at,
            updated_at: cat.updated_at || cat.created_at,
            specifications: cat.specifications
          })
        })
      }

      // Add unique product categories if not already present
      if (productCategories) {
        const uniqueCategories = [...new Set(productCategories.map(p => p.category))]
        uniqueCategories.forEach((catName, index) => {
          if (!categoryMap.has(catName)) {
            categoryMap.set(catName, {
              id: 1000 + index, // Temporary ID for product-only categories
              name: catName,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        })
      }

      // Count products per category
      for (const [catName, category] of categoryMap.entries()) {
        const { count, error: countError } = await supabase
          .from('catalog_verified_products')
          .select('*', { count: 'exact', head: true })
          .eq('category', catName)

        if (!countError) {
          category.products_count = count || 0
        }
      }

      setCategories(Array.from(categoryMap.values()))
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Load subcategories for a specific category
  const loadSubcategories = useCallback(async (category: string) => {
    setLoading(true)
    setError(null)

    try {
      // Get all products in this category
      const { data: products, error: fetchError } = await supabase
        .from('catalog_verified_products')
        .select('specifications')
        .eq('category', category)

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      // Extract unique subcategories from specifications
      const subcategoryMap = new Map<string, number>()

      products?.forEach(product => {
        if (product.specifications) {
          let specs = product.specifications

          // Parse if it's a string
          if (typeof specs === 'string') {
            try {
              specs = JSON.parse(specs)
            } catch {
              return
            }
          }

          // Extract subcategory
          const subcategory = specs.subcategory || specs.subCategory || specs.sub_category
          if (subcategory && typeof subcategory === 'string') {
            subcategoryMap.set(subcategory, (subcategoryMap.get(subcategory) || 0) + 1)
          }
        }
      })

      // Convert to array format
      const subcategoriesArray: Subcategory[] = Array.from(subcategoryMap.entries()).map(([name, count], index) => ({
        id: `${category}_${index}`,
        name,
        category,
        count
      }))

      setSubcategories(subcategoriesArray)
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create a new category
  const createCategory = useCallback(async (data: Partial<Category>): Promise<Category | null> => {
    setError(null)

    try {
      if (!data.name) {
        throw new Error('Category name is required')
      }

      const { data: newCategory, error: createError } = await supabase
        .from('catalog_categories')
        .insert({
          name: data.name,
          description: data.description,
          icon: data.icon,
          parent_id: data.parent_id,
          slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          sort_order: data.order || 0,
          is_active: data.is_active !== false,
          created_at: new Date().toISOString(),
          specifications: data.specifications
        })
        .select()
        .single()

      if (createError) {
        throw new Error(createError.message)
      }

      // Update local state
      const category: Category = {
        ...newCategory,
        order: newCategory.sort_order,
        updated_at: newCategory.created_at,
        products_count: 0
      }

      setCategories(prev => [...prev, category])

      return category
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
      return null
    }
  }, [supabase])

  // Update an existing category
  const updateCategory = useCallback(async (id: number, data: Partial<Category>): Promise<boolean> => {
    setError(null)

    try {
      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.parent_id !== undefined) updateData.parent_id = data.parent_id
      if (data.slug !== undefined) updateData.slug = data.slug
      if (data.order !== undefined) updateData.sort_order = data.order
      if (data.is_active !== undefined) updateData.is_active = data.is_active
      if (data.specifications !== undefined) updateData.specifications = data.specifications

      const { error: updateError } = await supabase
        .from('catalog_categories')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update local state
      setCategories(prev => prev.map(cat =>
        cat.id === id ? { ...cat, ...data } : cat
      ))

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
      return false
    }
  }, [supabase])

  // Delete a category
  const deleteCategory = useCallback(async (id: number): Promise<boolean> => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('catalog_categories')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Update local state
      setCategories(prev => prev.filter(cat => cat.id !== id))

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
      return false
    }
  }, [supabase])

  // Helper functions
  const getCategoryByName = useCallback((name: string): Category | undefined => {
    return categories.find(cat => cat.name === name)
  }, [categories])

  const getSubcategoriesByCategory = useCallback((category: string): Subcategory[] => {
    return subcategories.filter(sub => sub.category === category)
  }, [subcategories])

  const getTotalProductsInCategory = useCallback((category: string): number => {
    const cat = getCategoryByName(category)
    return cat?.products_count || 0
  }, [getCategoryByName])

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Load subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory)
    } else {
      setSubcategories([])
    }
  }, [selectedCategory, loadSubcategories])

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategory(null)
  }, [selectedCategory])

  return {
    // Data
    categories,
    subcategories,
    loading,
    error,

    // Filters
    selectedCategory,
    selectedSubcategory,

    // Actions
    loadCategories,
    loadSubcategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Setters
    setSelectedCategory,
    setSelectedSubcategory,

    // Computed
    categoryTree,
    getCategoryByName,
    getSubcategoriesByCategory,
    getTotalProductsInCategory
  }
}

// Export helper hooks for specific use cases
export function useCategoryProducts(category: string | null) {
  const supabase = createClientComponentClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    if (!category) {
      setProducts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('catalog_verified_products')
        .select('*')
        .eq('category', category)
        .limit(100)

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setProducts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [category, supabase])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return {
    products,
    loading,
    error,
    reload: loadProducts
  }
}

export function useCategoryTree() {
  const { categories, categoryTree, loading } = useCategories()

  const rootCategories = useMemo(() => {
    return categoryTree.get(0) || []
  }, [categoryTree])

  const getChildren = useCallback((parentId: number): Category[] => {
    return categoryTree.get(parentId) || []
  }, [categoryTree])

  return {
    categories,
    rootCategories,
    getChildren,
    loading
  }
}