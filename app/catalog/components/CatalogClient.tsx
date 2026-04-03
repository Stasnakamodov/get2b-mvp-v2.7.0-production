'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingCart, X, Package, ArrowLeft, Filter, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'
import CategorySidebar from './CategorySidebar'
import { ProductGridSkeleton } from './ProductSkeleton'
import CatalogHeader from './CatalogHeader'
import { useInfiniteProducts, flattenProducts, getTotalCount } from '@/hooks/useInfiniteProducts'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import { useProductCart } from '@/hooks/useProductCart'
import type { CatalogProduct } from '@/lib/catalog/types'
import { SEARCH_DEBOUNCE_MS } from '@/lib/catalog/constants'

type SortField = 'created_at' | 'price' | 'name'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS: { value: string; label: string; sortField: SortField; sortOrder: SortOrder }[] = [
  { value: 'created_at-desc', label: 'Сначала новые', sortField: 'created_at', sortOrder: 'desc' },
  { value: 'created_at-asc', label: 'Сначала старые', sortField: 'created_at', sortOrder: 'asc' },
  { value: 'price-asc', label: 'Сначала дешёвые', sortField: 'price', sortOrder: 'asc' },
  { value: 'price-desc', label: 'Сначала дорогие', sortField: 'price', sortOrder: 'desc' },
  { value: 'name-asc', label: 'По названию А-Я', sortField: 'name', sortOrder: 'asc' },
  { value: 'name-desc', label: 'По названию Я-А', sortField: 'name', sortOrder: 'desc' },
]

export default function CatalogClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filters from URL
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || '')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sortField') as SortField) || 'created_at'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'desc'
  )

  // UI state
  const [showCategorySidebar, setShowCategorySidebar] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const isProgrammaticNavigation = useRef(false)

  // Data hooks
  const { categories } = useCatalogCategories()
  const { addToCart, totalItems } = useProductCart()

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteProducts({
    supplierType: 'verified',
    category: selectedCategory || undefined,
    subcategory: selectedSubcategory || undefined,
    search: debouncedSearch || undefined,
    sortField,
    sortOrder,
    limit: 20,
  })

  const products = flattenProducts(data)
  const totalCount = getTotalCount(data)

  // URL sync
  const updateURL = useCallback((category: string, subcategory: string, search: string, sf: SortField, so: SortOrder) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (subcategory) params.set('subcategory', subcategory)
    if (search) params.set('search', search)
    if (sf !== 'created_at' || so !== 'desc') {
      params.set('sortField', sf)
      params.set('sortOrder', so)
    }
    const newURL = params.toString() ? `/catalog?${params}` : '/catalog'
    isProgrammaticNavigation.current = true
    router.push(newURL, { scroll: false })
  }, [router])

  // Category select
  const handleCategorySelect = useCallback((category: string, subcategory?: string) => {
    setSelectedCategory(category)
    setSelectedSubcategory(subcategory || '')
    updateURL(category, subcategory || '', debouncedSearch, sortField, sortOrder)
    setShowCategorySidebar(false)
  }, [debouncedSearch, sortField, sortOrder, updateURL])

  // Search with debounce
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(query)
      updateURL(selectedCategory, selectedSubcategory, query, sortField, sortOrder)
    }, SEARCH_DEBOUNCE_MS)
  }, [selectedCategory, selectedSubcategory, sortField, sortOrder, updateURL])

  // Sort change
  const handleSortChange = useCallback((value: string) => {
    const option = SORT_OPTIONS.find(o => o.value === value)
    if (!option) return
    setSortField(option.sortField)
    setSortOrder(option.sortOrder)
    updateURL(selectedCategory, selectedSubcategory, debouncedSearch, option.sortField, option.sortOrder)
  }, [selectedCategory, selectedSubcategory, debouncedSearch, updateURL])

  // Add to cart
  const handleAddToCart = useCallback((product: CatalogProduct) => {
    addToCart(product)
  }, [addToCart])

  // Sync with URL on browser back/forward
  useEffect(() => {
    if (isProgrammaticNavigation.current) {
      isProgrammaticNavigation.current = false
      return
    }
    const urlCategory = searchParams.get('category') || ''
    const urlSubcategory = searchParams.get('subcategory') || ''
    const urlSearch = searchParams.get('search') || ''
    const urlSortField = (searchParams.get('sortField') as SortField) || 'created_at'
    const urlSortOrder = (searchParams.get('sortOrder') as SortOrder) || 'desc'

    if (urlCategory !== selectedCategory || urlSubcategory !== selectedSubcategory ||
        urlSearch !== debouncedSearch || urlSortField !== sortField || urlSortOrder !== sortOrder) {
      setSelectedCategory(urlCategory)
      setSelectedSubcategory(urlSubcategory)
      setSearchQuery(urlSearch)
      setDebouncedSearch(urlSearch)
      setSortField(urlSortField)
      setSortOrder(urlSortOrder)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const trigger = loadMoreTriggerRef.current
    if (!trigger) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(trigger)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  const selectedCategoryName = selectedSubcategory || selectedCategory || 'Все товары'
  const currentSortValue = `${sortField}-${sortOrder}`

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800">
        <div className="px-6 py-4 max-md:px-3 max-md:py-2">
          <div className="flex items-center gap-4 max-md:gap-2">
            <Link href="/" className="inline-flex items-center gap-2 max-md:gap-1 px-3 py-2 max-md:px-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              <ArrowLeft className="h-4 w-4 max-md:h-3 max-md:w-3" />
              <span className="max-md:text-xs">На главную</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 max-md:text-lg">Каталог товаров</h1>
          </div>
        </div>
      </div>

      {/* Sticky Search */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-6 py-2 max-md:px-3 max-md:py-2">
          <div className="flex items-center gap-4 max-md:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategorySidebar(!showCategorySidebar)}
              className="lg:hidden max-md:px-2 max-md:text-xs"
            >
              <Filter className="h-4 w-4 mr-2 max-md:mr-1 max-md:h-3 max-md:w-3" />
              <span className="max-md:hidden">Категории</span>
            </Button>

            <div className="flex-1">
              <CatalogHeader
                searchQuery={searchQuery}
                setSearchQuery={handleSearchChange}
                totalProducts={totalCount}
                isSearching={isLoading}
                onClearSearch={() => handleSearchChange('')}
              />
            </div>

            <Button
              variant="outline"
              className="relative h-12 px-4 max-md:h-9 max-md:px-2"
              asChild
            >
              <Link href="/dashboard/catalog">
                <ShoppingCart className="h-5 w-5 mr-2 max-md:h-4 max-md:w-4 max-md:mr-0" />
                <span className="hidden sm:inline">Корзина</span>
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 max-md:-top-1 max-md:-right-1">
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 py-8 max-md:px-3 max-md:py-4">
        <div className="flex gap-8 max-md:gap-0">
          {/* Sidebar */}
          <div className={`
            ${showCategorySidebar ? 'fixed inset-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-6 overflow-y-auto max-md:p-4' : 'hidden lg:block'}
            lg:sticky lg:top-16 lg:self-start lg:w-[260px] lg:flex-shrink-0 lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto
            lg:bg-white/70 dark:lg:bg-gray-900/70 lg:backdrop-blur-sm lg:rounded-xl lg:border lg:border-white/50 dark:lg:border-gray-700 lg:shadow-lg lg:p-4
          `}>
            {showCategorySidebar && (
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h2 className="text-xl font-bold dark:text-gray-100 max-md:text-lg">Категории</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCategorySidebar(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              onCategorySelect={handleCategorySelect}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 max-md:mb-4 flex-wrap gap-4">
              <div>
                <h2 className="text-[40px] font-bold text-gray-900 dark:text-gray-100 leading-tight max-md:text-xl">
                  {selectedCategoryName}
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-1 max-md:text-sm">
                  {isLoading ? 'Загрузка...' : `Найдено ${totalCount} товаров`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500 max-md:hidden" />
                <Select value={currentSortValue} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px] max-md:w-[140px] max-md:text-xs">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          {option.sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading && products.length === 0 ? (
              <ProductGridSkeleton count={8} />
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Package className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Товары не найдены</p>
                <p className="text-sm text-gray-400 mt-2">Попробуйте изменить фильтры или поисковый запрос</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8 auto-rows-fr">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product as CatalogProduct}
                      onAddToCart={handleAddToCart}
                      onViewDetails={(p) => {
                        setSelectedProduct(p)
                        setIsModalOpen(true)
                      }}
                    />
                  ))}
                </div>

                {/* Infinite scroll trigger */}
                <div ref={loadMoreTriggerRef} className="h-1" aria-hidden="true" />

                {/* Manual load more fallback */}
                {hasNextPage && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="min-w-[200px]"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        `Загрузить ещё`
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedProduct(null) }}
        onAddToCart={handleAddToCart}
      />
    </div>
  )
}
