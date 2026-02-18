'use client'

import { useQuery } from '@tanstack/react-query'
import type { CatalogFilters, FacetData } from '@/lib/catalog/types'

interface FacetsResponse {
  success: boolean
  facets: FacetData
}

/**
 * Hook for loading faceted search counts.
 * Returns dynamic counts for categories, countries, stock status, and price range.
 */
export function useFacets(filters: CatalogFilters, enabled = true) {
  return useQuery<FacetData>({
    queryKey: ['facets', filters.category, filters.subcategory, filters.search, filters.inStock, filters.minPrice, filters.maxPrice, filters.country, filters.supplierId],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters.category) params.set('category', filters.category)
      if (filters.subcategory) params.set('subcategory', filters.subcategory)
      if (filters.search) params.set('search', filters.search)
      if (filters.inStock) params.set('in_stock', 'true')
      if (filters.minPrice !== undefined) params.set('min_price', String(filters.minPrice))
      if (filters.maxPrice !== undefined) params.set('max_price', String(filters.maxPrice))
      if (filters.country) params.set('supplier_country', filters.country)
      if (filters.supplierId) params.set('supplier_id', filters.supplierId)

      const response = await fetch(`/api/catalog/facets?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch facets')
      }

      const json: FacetsResponse = await response.json()
      return json.facets
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
