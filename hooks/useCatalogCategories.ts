'use client'

import { useQuery } from '@tanstack/react-query'
import type { CatalogCategory, CatalogSubcategory } from '@/lib/catalog/types'
import { DEFAULT_CATEGORIES } from '@/lib/catalog/constants'

interface CategoryStats {
  [category: string]: { verified: number; user: number; total: number }
}

interface ApiSubcategory {
  id: string
  name: string
  key?: string
  category_id: string
  products_count: number
}

interface ApiCategory {
  id: string
  key: string
  name: string
  icon?: string
  subcategories?: ApiSubcategory[]
}

/**
 * Hook for fetching real category counts and subcategories from the API.
 * Fetches the full category tree (with subcategories) and root-level stats,
 * then merges them into CatalogCategory[] with children populated.
 */
export function useCatalogCategories() {
  const { data, isLoading, error } = useQuery<CatalogCategory[]>({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      // Fetch both endpoints in parallel
      const [treeRes, statsRes] = await Promise.all([
        fetch('/api/catalog/categories?includeSubcategories=true'),
        fetch('/api/catalog/category-stats'),
      ])

      if (!treeRes.ok) throw new Error('Failed to fetch category tree')
      if (!statsRes.ok) throw new Error('Failed to fetch category stats')

      const treeJson = await treeRes.json()
      const statsJson = await statsRes.json()

      const apiCategories: ApiCategory[] = treeJson.categories || []
      const stats: CategoryStats = statsJson.categoryStats || {}

      // Build a lookup from API categories by name for subcategories
      const apiByName = new Map<string, ApiCategory>()
      for (const cat of apiCategories) {
        apiByName.set(cat.name, cat)
      }

      // Map DEFAULT_CATEGORIES (which define icon + ordering) with real data
      return DEFAULT_CATEGORIES.map(def => {
        const api = apiByName.get(def.name)
        const rootCount = stats[def.name]?.total || 0

        const children: CatalogSubcategory[] = (api?.subcategories || []).map(sub => ({
          id: sub.id,
          key: sub.key || sub.name.toLowerCase().replace(/\s+/g, '_'),
          name: sub.name,
          category_id: sub.category_id,
          products_count: sub.products_count || 0,
        }))

        return {
          id: api?.id || def.key,
          key: def.key,
          name: def.name,
          icon: def.icon,
          products_count: rootCount,
          children,
        }
      })
    },
    staleTime: 60 * 1000, // 1 min
    gcTime: 5 * 60 * 1000, // 5 min
  })

  return {
    categories: data || DEFAULT_CATEGORIES.map(cat => ({
      id: cat.key,
      key: cat.key,
      name: cat.name,
      icon: cat.icon,
      products_count: 0,
      children: [],
    })),
    isLoading,
    error,
  }
}
