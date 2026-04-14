'use client'

import { useQuery } from '@tanstack/react-query'
import type { CatalogCategory, CatalogSubcategory } from '@/lib/catalog/types'

interface ApiChild {
  id: string
  key?: string
  name: string
  icon?: string
  category_id: string
  products_count?: number
}

interface ApiCategory {
  id: string
  key: string
  name: string
  icon?: string
  sort_order?: number
  products_count?: number
  subcategories?: ApiChild[]
}

/**
 * Fetch the 2-level category tree from the API.
 * Source of truth = DB (`catalog_categories` with parent_id/level).
 * No client-side merge with hardcoded constants.
 */
export function useCatalogCategories() {
  const { data, isLoading, error } = useQuery<CatalogCategory[]>({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const res = await fetch('/api/catalog/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')

      const json = await res.json()
      const apiCategories: ApiCategory[] = json.categories || []

      return apiCategories.map(api => {
        const children: CatalogSubcategory[] = (api.subcategories || []).map(sub => ({
          id: sub.id,
          key: sub.key || sub.name.toLowerCase().replace(/\s+/g, '_'),
          name: sub.name,
          icon: sub.icon,
          category_id: sub.category_id,
          products_count: sub.products_count || 0,
        }))

        return {
          id: api.id,
          key: api.key,
          name: api.name,
          icon: api.icon,
          products_count: api.products_count || 0,
          children,
        }
      })
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  return {
    categories: data || [],
    isLoading,
    error,
  }
}
