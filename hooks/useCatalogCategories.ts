'use client'

import { useQuery } from '@tanstack/react-query'
import type { CatalogCategory, CatalogSubcategory } from '@/lib/catalog/types'
import { DEFAULT_CATEGORIES } from '@/lib/catalog/constants'

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

// Build ordering/icon lookup from DEFAULT_CATEGORIES
const DEFAULT_BY_NAME = new Map(
  DEFAULT_CATEGORIES.map((d, i) => [d.name, { ...d, order: i }])
)

/**
 * Hook for fetching real categories from the API.
 * API-first: uses ALL categories from API, not just those in DEFAULT_CATEGORIES.
 * DEFAULT_CATEGORIES provides icon and ordering fallback only.
 */
export function useCatalogCategories() {
  const { data, isLoading, error } = useQuery<CatalogCategory[]>({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const treeRes = await fetch('/api/catalog/categories?includeSubcategories=true')
      if (!treeRes.ok) throw new Error('Failed to fetch category tree')

      const treeJson = await treeRes.json()
      const apiCategories: ApiCategory[] = treeJson.categories || []

      // Map ALL API categories, using DEFAULT_CATEGORIES for icon/ordering
      const mapped: (CatalogCategory & { _order: number })[] = apiCategories.map(api => {
        const def = DEFAULT_BY_NAME.get(api.name)

        const children: CatalogSubcategory[] = (api.subcategories || []).map(sub => ({
          id: sub.id,
          key: sub.key || sub.name.toLowerCase().replace(/\s+/g, '_'),
          name: sub.name,
          category_id: sub.category_id,
          products_count: sub.products_count || 0,
        }))

        const childrenTotal = children.reduce((sum, c) => sum + c.products_count, 0)
        // Use API-provided products_count (direct category count) when children sum is 0
        const totalProducts = childrenTotal > 0 ? childrenTotal : ((api as any).products_count || 0)

        return {
          id: api.id,
          key: api.key || (def?.key ?? api.name.toLowerCase().replace(/\s+/g, '_')),
          name: api.name,
          icon: api.icon || def?.icon || '📦',
          products_count: totalProducts,
          children,
          _order: def?.order ?? 999,
        }
      })

      // Sort: known categories first (by DEFAULT order), then unknown alphabetically
      mapped.sort((a, b) => {
        if (a._order !== b._order) return a._order - b._order
        return a.name.localeCompare(b.name, 'ru')
      })

      // Strip internal _order field
      return mapped.map(({ _order, ...cat }) => cat)
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
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
