'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Grid3X3, Users, ShoppingCart, Plus, RefreshCw, SlidersHorizontal, Search, Filter, List } from 'lucide-react'
// FSD imports for supplier mode
import {
  useSuppliers,
} from '@/src/features/supplier-management'
import { useSupplierModal, SupplierModal } from '@/src/features/supplier-modal'
import {
  SupplierGrid,
  AddSupplierModal
} from '@/src/widgets/catalog-suppliers'
import type { Supplier, RoomType, CatalogMode } from '@/src/entities/supplier'
import type { Product } from '@/src/entities/product'
import { ROOM_TYPES } from '@/src/shared/config'
import { logger } from '@/src/shared/lib'
import { supabase } from '@/lib/supabaseClient'

// Catalog components for categories mode
import { CatalogHeader } from './components/CatalogHeader'
import type { SearchMode } from './components/CatalogHeader'
import { CatalogSidebar } from './components/CatalogSidebar'
import { CatalogGrid } from './components/CatalogGrid'
import { ProductModal } from './components/ProductModal'
import { FilterTags } from './components/FilterTags'
import { WishlistSheet } from './components/WishlistSheet'
import { useInfiniteProducts, flattenProducts, getTotalCount } from '@/hooks/useInfiniteProducts'
import { useProductCart } from '@/hooks/useProductCart'
import { useWishlist } from '@/hooks/useWishlist'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
import { useFacets } from '@/hooks/useFacets'
import { useCollections } from '@/hooks/useCollections'
import { useIsMobile } from '@/hooks/use-mobile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Trash2, Minus, Plus as PlusIcon, ArrowRight, X } from 'lucide-react'
import type { CatalogProduct, CatalogFilters, CatalogSort, CatalogViewMode, CatalogCollection } from '@/lib/catalog/types'
import { formatPrice } from '@/lib/catalog/utils'

import { useEffect } from 'react'

/** Adapts FSD Product to CatalogProduct for cart/modal use */
function productToCatalogProduct(p: Product): CatalogProduct {
  return {
    id: p.id,
    name: p.product_name || p.name || '',
    description: p.description ?? undefined,
    category: p.category || '',
    price: p.price ? parseFloat(p.price) : undefined,
    currency: p.currency || 'RUB',
    min_order: p.min_order ?? undefined,
    in_stock: p.in_stock,
    images: p.images || [],
    supplier_id: p.supplier_id,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }
}

/**
 * Unified catalog page:
 * - "Categories" mode: virtualized, cursor pagination
 * - "Suppliers" mode: keeps existing SupplierGrid (not slow)
 */
export default function CatalogPage() {
  const router = useRouter()
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('categories')
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('orange')

  // ========== Supplier mode state ==========
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierCategory, setSupplierCategory] = useState('all')
  const [supplierViewMode, setSupplierViewMode] = useState<'grid' | 'list'>('grid')

  const {
    userSuppliers,
    verifiedSuppliers,
    isLoading: loadingSuppliers,
    userError,
    verifiedError,
    refreshSuppliers,
    filterByRoom
  } = useSuppliers()

  const supplierModal = useSupplierModal()
  const displayedSuppliers = filterByRoom(selectedRoom)

  // Unique categories for supplier filter
  const supplierCategories = useMemo(() => {
    const cats = new Set(displayedSuppliers.map(s => s.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [displayedSuppliers])

  // Filtered suppliers based on search + category
  const filteredSuppliers = useMemo(() => {
    let result = displayedSuppliers
    if (supplierSearch.trim()) {
      const q = supplierSearch.toLowerCase()
      result = result.filter(s =>
        [s.name, s.company_name, s.category, s.country, s.city, s.description]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      )
    }
    if (supplierCategory !== 'all') {
      result = result.filter(s => s.category === supplierCategory)
    }
    return result
  }, [displayedSuppliers, supplierSearch, supplierCategory])

  const handleSupplierClick = (supplier: Supplier) => {
    supplierModal.open(supplier)
  }

  const handleStartProject = (supplier: Supplier) => {
    const params = new URLSearchParams({
      mode: 'catalog',
      supplierId: supplier.id,
      supplierName: supplier.name,
    })
    router.push(`/dashboard/create-project?${params.toString()}`)
  }

  // ========== Categories mode state ==========
  const [filters, setFilters] = useState<CatalogFilters>({})
  const [sort, setSort] = useState<CatalogSort>({ field: 'created_at', order: 'desc' })
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid-4')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)
  const [searchResults, setSearchResults] = useState<CatalogProduct[] | null>(null)
  const [searchMode, setSearchMode] = useState<SearchMode>('normal')

  const isMobile = useIsMobile()
  const { categories, isLoading: categoriesLoading } = useCatalogCategories()
  const { data: collections } = useCollections(catalogMode === 'categories')

  const {
    items: cartItems,
    totalItems,
    totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getQuantity,
  } = useProductCart()

  const {
    items: wishlistItems,
    count: wishlistCount,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  } = useWishlist()

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteProducts({
    supplierType: 'verified',
    category: filters.category,
    subcategory: filters.subcategory,
    search: filters.search,
    inStock: filters.inStock,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    country: filters.country,
    sortField: sort.field === 'popularity' ? 'created_at' : sort.field,
    sortOrder: sort.order,
    limit: 50,
    enabled: catalogMode === 'categories',
  })

  const { data: facetData } = useFacets(filters, catalogMode === 'categories')

  const products = useMemo(() => flattenProducts(data), [data])
  const totalCount = facetData?.totalCount ?? getTotalCount(data)

  const handleFiltersChange = useCallback((f: CatalogFilters) => setFilters(f), [])
  const handleSortChange = useCallback((s: CatalogSort) => setSort(s), [])
  const handleViewModeChange = useCallback((m: CatalogViewMode) => setViewMode(m), [])
  const handleAddToCart = useCallback((p: CatalogProduct) => addToCart(p, 1), [addToCart])
  const handleModalAddToCart = useCallback((p: CatalogProduct, q: number) => addToCart(p, q), [addToCart])
  const handleProductClick = useCallback((p: CatalogProduct) => setSelectedProduct(p), [])
  const handleCategorySelect = useCallback((c: string | undefined, subcategory?: string) => {
    setFilters(prev => ({ ...prev, category: c, subcategory, search: undefined }))
    setIsSidebarOpen(false)
  }, [])
  const handleToggleWishlist = useCallback((p: CatalogProduct) => toggleWishlist(p), [toggleWishlist])
  const handleRemoveFilter = useCallback((key: keyof CatalogFilters) => {
    if (key === 'minPrice') {
      setFilters(prev => ({ ...prev, minPrice: undefined, maxPrice: undefined }))
    } else {
      setFilters(prev => ({ ...prev, [key]: undefined }))
    }
  }, [])
  const handleCreateProject = useCallback(() => {
    if (typeof window !== 'undefined' && cartItems.length > 0) {
      const cartForProject = cartItems.map(item => ({
        name: item.product.name,
        sku: item.product.sku || '',
        quantity: item.quantity,
        unit: 'шт',
        price: item.product.price,
        total_price: item.quantity * (item.product.price || 0),
        description: item.product.description || '',
        images: item.product.images || [],
        supplier_name: item.product.supplier_name || '',
        supplier_id: item.product.supplier_id || '',
      }))
      sessionStorage.setItem('project_cart', JSON.stringify(cartForProject))
    }
    setIsCartOpen(false)
    router.push('/dashboard/create-project?from_cart=true')
  }, [router, cartItems])

  const handleSearchResults = useCallback((results: CatalogProduct[], mode: SearchMode) => {
    setSearchResults(results)
    setSearchMode(mode)
  }, [])

  const handleClearSearchResults = useCallback(() => {
    setSearchResults(null)
    setSearchMode('normal')
  }, [])

  const handleSupplierInquiry = useCallback(async (query: string): Promise<boolean> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`
    const res = await fetch('/api/catalog/submit-supplier-inquiry', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    })
    return res.ok
  }, [])

  // Products to display: search results override normal catalog
  const displayProducts = searchResults ?? products

  const handleCollectionClick = useCallback((collection: CatalogCollection) => {
    const rules = collection.rules as Record<string, unknown>
    const newFilters: CatalogFilters = {}
    if (rules.in_stock) newFilters.inStock = true
    if (rules.price_max) newFilters.maxPrice = rules.price_max as number
    if (rules.price_min) newFilters.minPrice = rules.price_min as number
    if (rules.category) newFilters.category = rules.category as string
    if (rules.supplier_country) newFilters.country = rules.supplier_country as string
    setFilters(newFilters)
  }, [])

  // Find selected subcategory name for breadcrumbs
  const selectedSubcategoryName = useMemo(() => {
    if (!filters.subcategory || !categories) return undefined
    for (const cat of categories) {
      const sub = cat.children?.find(s => s.id === filters.subcategory)
      if (sub) return sub.name
    }
    return undefined
  }, [filters.subcategory, categories])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/30 to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="max-w-7xl mx-auto">

        {/* Content */}
        {catalogMode === 'categories' ? (
          /* ========== CATEGORIES MODE — compact header ========== */
          <div className="min-h-[calc(100vh-64px)] flex flex-col">
            {/* Row 1: Tabs + Search + Cart */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-inner shrink-0">
                <button
                  onClick={() => setCatalogMode('categories')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    catalogMode === 'categories'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/5'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Категории
                </button>
                <button
                  onClick={() => setCatalogMode('suppliers')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Поставщики
                </button>
              </div>

              <CatalogHeader
                filters={filters}
                onFiltersChange={handleFiltersChange}
                sort={sort}
                onSortChange={handleSortChange}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                cartItemsCount={totalItems}
                onCartClick={() => setIsCartOpen(true)}
                wishlistCount={wishlistCount}
                onWishlistClick={() => setIsWishlistOpen(true)}
                countryCounts={facetData?.countries}
                onSearchResults={handleSearchResults}
                onSupplierInquiry={handleSupplierInquiry}
                categories={categories}
                onCategorySelect={handleCategorySelect}
              />
            </div>

            {/* Row 2: Breadcrumbs + mobile filter + count */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <button
                className="md:hidden flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors shrink-0"
                onClick={() => setIsSidebarOpen(true)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Фильтры
              </button>

              <Breadcrumb className="flex-1">
                <BreadcrumbList className="text-xs">
                  <BreadcrumbItem>
                    {filters.category ? (
                      <BreadcrumbLink
                        className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => handleCategorySelect(undefined)}
                      >
                        Каталог
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="font-medium text-gray-900 dark:text-gray-100">Каталог</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {filters.category && (
                    <>
                      <BreadcrumbSeparator className="text-gray-400">/</BreadcrumbSeparator>
                      <BreadcrumbItem>
                        {filters.subcategory ? (
                          <BreadcrumbLink
                            className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => handleCategorySelect(filters.category)}
                          >
                            {filters.category}
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="font-medium text-gray-900 dark:text-gray-100">{filters.category}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}
                  {filters.subcategory && selectedSubcategoryName && (
                    <>
                      <BreadcrumbSeparator className="text-gray-400">/</BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium text-gray-900 dark:text-gray-100">{selectedSubcategoryName}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              <FilterTags
                filters={filters}
                selectedCategoryName={filters.category}
                selectedSubcategoryName={selectedSubcategoryName}
                onRemoveFilter={handleRemoveFilter}
              />

              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                {totalCount > 0
                  ? `${products.length.toLocaleString('ru-RU')} из ${totalCount.toLocaleString('ru-RU')} товаров`
                  : products.length > 0
                    ? `${products.length.toLocaleString('ru-RU')} товаров`
                    : ''
                }
              </span>
            </div>

            <div className="flex-1 flex">
              {/* Desktop sidebar */}
              <div className="hidden md:block">
                <CatalogSidebar
                  categories={categories}
                  selectedCategory={filters.category}
                  selectedSubcategory={filters.subcategory}
                  onCategorySelect={handleCategorySelect}
                  isLoading={categoriesLoading}
                  facetCounts={facetData?.categories}
                  subcategoryFacetCounts={facetData?.subcategories}
                />
              </div>

              {/* Mobile sidebar sheet */}
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <CatalogSidebar
                    categories={categories}
                    selectedCategory={filters.category}
                    selectedSubcategory={filters.subcategory}
                    onCategorySelect={handleCategorySelect}
                    isLoading={categoriesLoading}
                    facetCounts={facetData?.categories}
                    subcategoryFacetCounts={facetData?.subcategories}
                  />
                </SheetContent>
              </Sheet>

              <div className="flex-1 flex flex-col p-5">
                {/* Search results banner */}
                {searchResults !== null && (
                  <div className="flex items-center gap-3 mb-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl shrink-0">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {searchMode === 'image-search' ? 'Результаты поиска по фото' : 'Результаты поиска по ссылке'}
                      {' — '}
                      {searchResults.length > 0
                        ? `найдено ${searchResults.length} товаров`
                        : 'ничего не найдено'}
                    </span>
                    <div className="flex-1" />
                    <button
                      onClick={handleClearSearchResults}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Назад к каталогу
                    </button>
                  </div>
                )}

                {/* Collection chips */}
                {searchResults === null && collections && collections.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1 shrink-0">
                    {collections.filter(c => c.is_featured).map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => handleCollectionClick(collection)}
                        className="px-3 py-1.5 bg-gradient-to-r from-white to-orange-50/50 dark:from-gray-800 dark:to-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:border-orange-300 hover:text-orange-700 dark:hover:text-orange-400 transition-all duration-300 whitespace-nowrap shrink-0"
                      >
                        {collection.name}
                      </button>
                    ))}
                  </div>
                )}

                <CatalogGrid
                  products={displayProducts}
                  isLoading={searchResults === null && isLoading}
                  isFetchingNextPage={searchResults === null && isFetchingNextPage}
                  hasNextPage={searchResults === null && (hasNextPage ?? false)}
                  fetchNextPage={fetchNextPage}
                  viewMode={viewMode}
                  isInCart={isInCart}
                  onAddToCart={handleAddToCart}
                  onProductClick={handleProductClick}
                  isInWishlist={isInWishlist}
                  onToggleWishlist={handleToggleWishlist}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ========== SUPPLIERS MODE ========== */
          <>
            {/* Row 1: Tabs + Search + Cart — unified with categories style */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
              {/* Mode tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-inner shrink-0">
                <button
                  onClick={() => setCatalogMode('categories')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all flex items-center gap-1.5"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Категории
                </button>
                <button
                  onClick={() => setCatalogMode('suppliers')}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/5 transition-all flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Поставщики
                </button>
              </div>

              {/* Room tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-inner shrink-0">
                <button
                  onClick={() => setSelectedRoom('orange')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedRoom === 'orange'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/5'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span className={selectedRoom === 'orange' ? 'text-orange-500' : ''}>
                    {ROOM_TYPES.ORANGE.icon}
                  </span>
                  Аккредитованные
                </button>
                <button
                  onClick={() => setSelectedRoom('blue')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedRoom === 'blue'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/5'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span className={selectedRoom === 'blue' ? 'text-blue-500' : ''}>
                    {ROOM_TYPES.BLUE.icon}
                  </span>
                  Мои
                </button>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[140px] max-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm
                    border-0 focus:outline-none focus:ring-2 focus:ring-orange-400/50 dark:focus:ring-orange-500/30
                    placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-100 transition-all"
                />
              </div>

              {/* Category filter */}
              {supplierCategories.length > 0 && (
                <select
                  value={supplierCategory}
                  onChange={(e) => setSupplierCategory(e.target.value)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm
                    border-0 focus:outline-none focus:ring-2 focus:ring-orange-400/50 dark:focus:ring-orange-500/30
                    dark:text-gray-100 cursor-pointer transition-all shrink-0"
                >
                  <option value="all">Все категории</option>
                  {supplierCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}

              {/* View mode */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-inner shrink-0">
                <button
                  onClick={() => setSupplierViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    supplierViewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/5'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title="Сетка"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSupplierViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    supplierViewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/5'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title="Список"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Count */}
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                {filteredSuppliers.length} из {displayedSuppliers.length}
              </span>

              <div className="flex-1" />

              {/* Cart button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
              >
                <ShoppingCart className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Add button (blue room only) */}
              {selectedRoom === 'blue' && (
                <button
                  onClick={() => { setEditingSupplier(null); setShowAddSupplierModal(true) }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Добавить
                </button>
              )}

              {/* Refresh */}
              <button
                onClick={() => refreshSuppliers()}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {(userError || verifiedError) && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
                <p className="text-red-600 dark:text-red-400">
                  {userError || verifiedError}
                </p>
              </div>
            )}

            <SupplierGrid
              suppliers={filteredSuppliers}
              loading={loadingSuppliers}
              onSupplierClick={handleSupplierClick}
              onStartProject={handleStartProject}
              onEditSupplier={(supplier) => {
                setEditingSupplier(supplier)
                setShowAddSupplierModal(true)
              }}
              onDeleteSupplier={async () => {
                await refreshSuppliers()
              }}
              showActions={true}
              roomType={selectedRoom}
              emptyMessage="В этой комнате пока нет поставщиков"
              viewMode={supplierViewMode}
              showSearch={false}
              showFilters={false}
              showPagination={true}
            />
          </>
        )}

        {/* Product Modal (categories mode) */}
        <ProductModal
          product={selectedProduct}
          open={!!selectedProduct}
          onOpenChange={(open) => { if (!open) setSelectedProduct(null) }}
          isInCart={selectedProduct ? isInCart(selectedProduct.id) : false}
          cartQuantity={selectedProduct ? getQuantity(selectedProduct.id) : 0}
          onAddToCart={handleModalAddToCart}
          isInWishlist={selectedProduct ? isInWishlist(selectedProduct.id) : false}
          onToggleWishlist={handleToggleWishlist}
        />

        {/* Supplier Modal (suppliers mode) */}
        <SupplierModal
          isOpen={supplierModal.isOpen}
          supplier={supplierModal.selectedSupplier}
          products={supplierModal.products}
          loading={supplierModal.loading}
          loadingMore={supplierModal.loadingMore}
          hasMore={supplierModal.hasMore}
          totalCount={supplierModal.totalCount}
          onClose={supplierModal.close}
          onLoadMore={supplierModal.loadMore}
          onStartProject={handleStartProject}
          onAddToCart={(product: Product, quantity: number) => { addToCart(productToCatalogProduct(product), quantity); return true }}
          onProductClick={(product: Product) => {
            setSelectedProduct(productToCatalogProduct(product))
          }}
        />

        {/* Wishlist Sheet */}
        <WishlistSheet
          open={isWishlistOpen}
          onOpenChange={setIsWishlistOpen}
          items={wishlistItems}
          onRemove={removeFromWishlist}
          onClear={clearWishlist}
          onAddToCart={handleAddToCart}
        />

        {/* Cart Sheet */}
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetContent className="w-full sm:max-w-lg flex flex-col">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Корзина
                {totalItems > 0 && (
                  <Badge className="bg-orange-500">{totalItems}</Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Корзина пуста</p>
                  <p className="text-sm">Добавьте товары из каталога</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto py-4 space-y-3">
                  {cartItems.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-orange-600 font-semibold">
                          {formatPrice(item.product.price, item.product.currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Итого:</span>
                    <span className="font-bold text-orange-600">
                      {formatPrice(totalAmount, 'RUB')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={clearCart}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Очистить
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25"
                      onClick={handleCreateProject}
                    >
                      Создать проект
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Add/Edit Supplier Modal */}
        {showAddSupplierModal && (
          <AddSupplierModal
            isOpen={showAddSupplierModal}
            onClose={() => {
              setShowAddSupplierModal(false)
              setEditingSupplier(null)
            }}
            onSuccess={() => refreshSuppliers()}
            editingSupplier={editingSupplier}
          />
        )}
      </div>
    </div>
  )
}
