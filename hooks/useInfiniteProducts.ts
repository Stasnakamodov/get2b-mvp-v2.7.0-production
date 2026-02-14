import { useInfiniteQuery } from '@tanstack/react-query'

interface Product {
  id: string
  name: string
  description?: string
  category: string
  subcategory?: string
  sku?: string
  price?: number
  currency: string
  min_order?: string
  in_stock: boolean
  images: string[]
  specifications?: Record<string, string>
  supplier_id: string
  supplier_name?: string
  supplier_country?: string
  is_featured?: boolean
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface ProductsResponse {
  success: boolean
  products: Product[]
  nextCursor: string | null
  hasMore: boolean
  totalCount: number
  meta: {
    count: number
    limit: number
    supplierType: string
    executionTime: number
  }
}

type SortField = 'created_at' | 'price' | 'name'
type SortOrder = 'asc' | 'desc'

interface UseInfiniteProductsOptions {
  supplierType?: 'verified' | 'user'
  category?: string
  subcategory?: string
  search?: string
  supplierId?: string
  inStock?: boolean
  minPrice?: number
  maxPrice?: number
  country?: string
  limit?: number
  enabled?: boolean
  sortField?: SortField
  sortOrder?: SortOrder
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
    subcategory,
    search,
    supplierId,
    inStock,
    minPrice,
    maxPrice,
    country,
    limit = 50,
    enabled = true,
    sortField = 'created_at',
    sortOrder = 'desc'
  } = options

  return useInfiniteQuery<ProductsResponse>({
    queryKey: ['products', supplierType, category, subcategory, search, supplierId, inStock, minPrice, maxPrice, country, limit, sortField, sortOrder],
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
      if (subcategory) {
        params.set('subcategory', subcategory)
      }
      if (search) {
        params.set('search', search)
      }
      if (supplierId) {
        params.set('supplier_id', supplierId)
      }
      if (inStock) {
        params.set('in_stock', 'true')
      }
      if (sortField) {
        params.set('sort_field', sortField)
      }
      if (sortOrder) {
        params.set('sort_order', sortOrder)
      }
      if (minPrice !== undefined) {
        params.set('min_price', String(minPrice))
      }
      if (maxPrice !== undefined) {
        params.set('max_price', String(maxPrice))
      }
      if (country) {
        params.set('supplier_country', country)
      }

      const response = await fetch(`/api/catalog/products?${params}`)

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

/**
 * Утилита для получения totalCount (общее количество товаров по фильтрам)
 */
export function getTotalCount(data: { pages: ProductsResponse[] } | undefined): number {
  return data?.pages[0]?.totalCount ?? 0
}
