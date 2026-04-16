'use client'

import { useQuery } from '@tanstack/react-query'

export interface ListingFacets {
  total: number
  categories: Record<string, number>
  uncategorized: number
}

interface FacetsResponse {
  success: boolean
  facets: ListingFacets
}

interface UseListingFacetsOptions {
  search?: string
  urgent?: boolean
  excludeOwn?: boolean
  enabled?: boolean
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('auth-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function useListingFacets(options: UseListingFacetsOptions = {}) {
  const { search, urgent, excludeOwn, enabled = true } = options

  return useQuery<ListingFacets>({
    queryKey: ['listing-facets', search, urgent, excludeOwn],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeof urgent === 'boolean') params.set('urgent', String(urgent))
      if (excludeOwn) params.set('exclude_own', 'true')

      const res = await fetch(`/api/listings/facets?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        throw new Error('Failed to fetch listing facets')
      }
      const json: FacetsResponse = await res.json()
      return json.facets
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
