'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

export interface ListingItem {
  id: string
  author_id: string
  author_client_profile_id: string | null
  title: string
  description: string
  quantity: string | number
  unit: string
  category_id: string | null
  image_url: string | null
  deadline_date: string | null
  is_urgent: boolean
  status: 'draft' | 'open' | 'closed' | 'expired'
  expires_at: string
  views_count: number
  contacts_count: number
  created_at: string
  updated_at: string
}

interface ListingsResponse {
  success: boolean
  listings: ListingItem[]
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
}

export type ListingsSort = 'newest' | 'deadline' | 'urgent'

export interface UseInfiniteListingsOptions {
  categoryId?: string
  search?: string
  urgent?: boolean
  sort?: ListingsSort
  mine?: boolean
  excludeOwn?: boolean
  limit?: number
  enabled?: boolean
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('auth-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function useInfiniteListings(options: UseInfiniteListingsOptions = {}) {
  const {
    categoryId,
    search,
    urgent,
    sort = 'newest',
    mine = false,
    excludeOwn = false,
    limit = 50,
    enabled = true,
  } = options

  return useInfiniteQuery<ListingsResponse>({
    queryKey: ['listings', categoryId, search, urgent, sort, mine, excludeOwn, limit],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('sort', sort)
      if (pageParam) params.set('cursor', pageParam as string)
      if (categoryId) params.set('category_id', categoryId)
      if (search) params.set('search', search)
      if (typeof urgent === 'boolean') params.set('urgent', String(urgent))
      if (mine) params.set('mine', 'true')
      if (excludeOwn) params.set('exclude_own', 'true')

      const res = await fetch(`/api/listings?${params}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        throw new Error('Failed to fetch listings')
      }
      return res.json()
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

export function flattenListings(
  data: { pages: ListingsResponse[] } | undefined
): ListingItem[] {
  const all = data?.pages.flatMap((p) => p.listings) ?? []
  const seen = new Set<string>()
  return all.filter((l) => {
    if (seen.has(l.id)) return false
    seen.add(l.id)
    return true
  })
}

export function getListingsTotalCount(
  data: { pages: ListingsResponse[] } | undefined
): number {
  return data?.pages[0]?.totalCount ?? 0
}
