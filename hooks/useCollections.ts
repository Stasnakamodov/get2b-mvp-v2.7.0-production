'use client'

import { useQuery } from '@tanstack/react-query'
import type { CatalogCollection, CatalogProduct } from '@/lib/catalog/types'

interface CollectionsResponse {
  success: boolean
  collections: CatalogCollection[]
}

interface CollectionDetailResponse {
  success: boolean
  collection: CatalogCollection
  products: CatalogProduct[]
}

/**
 * Hook for loading featured collections list
 */
export function useCollections(enabled = true) {
  return useQuery<CatalogCollection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await fetch('/api/catalog/collections')
      if (!response.ok) throw new Error('Failed to fetch collections')
      const json: CollectionsResponse = await response.json()
      return json.collections
    },
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for loading products for a specific collection by slug
 */
export function useCollectionProducts(slug: string | null) {
  return useQuery<{ collection: CatalogCollection; products: CatalogProduct[] }>({
    queryKey: ['collection', slug],
    queryFn: async () => {
      const response = await fetch(`/api/catalog/collections/${slug}`)
      if (!response.ok) throw new Error('Failed to fetch collection')
      const json: CollectionDetailResponse = await response.json()
      return { collection: json.collection, products: json.products }
    },
    enabled: !!slug,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
