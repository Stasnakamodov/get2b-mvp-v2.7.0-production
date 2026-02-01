import { useInfiniteQuery } from '@tanstack/react-query'

interface Product {
  id: string
  name: string
  description?: string
  category: string
  price?: number
  currency?: string
  images?: string[]
  supplier_id: string
  is_active: boolean
  created_at: string
  [key: string]: any
}

interface ProductsResponse {
  success: boolean
  products: Product[]
  nextCursor: string | null
  hasMore: boolean
  meta: {
    count: number
    limit: number
    supplierType: string
    executionTime: number
  }
}

interface UseInfiniteProductsOptions {
  supplierType?: 'verified' | 'user'
  category?: string
  search?: string
  supplierId?: string
  limit?: number
  enabled?: boolean
}

/**
 * Хук для загрузки товаров с infinite scroll
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading
 * } = useInfiniteProducts({
 *   supplierType: 'verified',
 *   category: 'Электроника',
 *   limit: 50
 * })
 *
 * // Все товары (плоский массив)
 * const allProducts = data?.pages.flatMap(page => page.products) ?? []
 */
export function useInfiniteProducts(options: UseInfiniteProductsOptions = {}) {
  const {
    supplierType = 'verified',
    category,
    search,
    supplierId,
    limit = 50,
    enabled = true
  } = options

  return useInfiniteQuery<ProductsResponse>({
    queryKey: ['products', supplierType, category, search, supplierId, limit],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('supplier_type', supplierType)
      params.set('limit', String(limit))

      if (pageParam) {
        params.set('cursor', pageParam as string)
      }
      if (category) {
        params.set('category', category)
      }
      if (search) {
        params.set('search', search)
      }
      if (supplierId) {
        params.set('supplier_id', supplierId)
      }

      const response = await fetch(`/api/catalog/products-paginated?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      return response.json()
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 30 * 1000, // 30 секунд
    gcTime: 5 * 60 * 1000, // 5 минут (было cacheTime)
  })
}

/**
 * Утилита для получения плоского массива товаров из pages
 */
export function flattenProducts(data: { pages: ProductsResponse[] } | undefined): Product[] {
  return data?.pages.flatMap(page => page.products) ?? []
}

/**
 * Утилита для подсчета общего количества загруженных товаров
 */
export function getTotalLoadedCount(data: { pages: ProductsResponse[] } | undefined): number {
  return data?.pages.reduce((sum, page) => sum + page.products.length, 0) ?? 0
}
