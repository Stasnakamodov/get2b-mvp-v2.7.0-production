'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Grid3X3, Users, ShoppingCart, Plus, RefreshCw, SlidersHorizontal } from 'lucide-react'
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

// New catalog components for categories mode
import { CatalogHeader } from '@/app/dashboard/catalog-new/components/CatalogHeader'
import { CatalogSidebar } from '@/app/dashboard/catalog-new/components/CatalogSidebar'
import { CatalogGrid } from '@/app/dashboard/catalog-new/components/CatalogGrid'
import { ProductModal } from '@/app/dashboard/catalog-new/components/ProductModal'
import { useInfiniteProducts, flattenProducts } from '@/hooks/useInfiniteProducts'
import { useProductCart } from '@/hooks/useProductCart'
import { useCatalogCategories } from '@/hooks/useCatalogCategories'
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
import type { CatalogProduct, CatalogFilters, CatalogSort, CatalogViewMode } from '@/lib/catalog/types'
import { formatPrice } from '@/lib/catalog/utils'

import { useMemo, useEffect } from 'react'

/**
 * Unified catalog page:
 * - "Categories" mode: uses catalog-new (virtualized, cursor pagination)
 * - "Suppliers" mode: keeps existing SupplierGrid (not slow)
 */
export default function CatalogPage() {
  const router = useRouter()
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('categories')
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('orange')

  // ========== Supplier mode state ==========
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

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

  const handleSupplierClick = (supplier: Supplier) => {
    supplierModal.open(supplier)
  }

  const handleStartProject = async (supplier: Supplier) => {
    try {
      if (supplierModal.onStartProject) {
        await supplierModal.onStartProject(supplier)
        router.push('/dashboard/project-constructor')
      }
    } catch (error) {
      logger.error('Error creating project', error)
    }
  }

  // ========== Categories mode state (catalog-new) ==========
  const [filters, setFilters] = useState<CatalogFilters>({})
  const [sort, setSort] = useState<CatalogSort>({ field: 'created_at', order: 'desc' })
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid-4')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)

  const isMobile = useIsMobile()
  const { categories, isLoading: categoriesLoading } = useCatalogCategories()

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
    sortField: sort.field === 'popularity' ? 'created_at' : sort.field,
    sortOrder: sort.order,
    limit: 50,
    enabled: catalogMode === 'categories',
  })

  const products = useMemo(() => flattenProducts(data), [data])

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
  const handleCreateProject = useCallback(() => {
    router.push('/dashboard/project-constructor?fromCatalog=true')
  }, [router])

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* Content */}
        {catalogMode === 'categories' ? (
          /* ========== CATEGORIES MODE — compact header ========== */
          <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Row 1: Tabs + Search + Cart */}
            <div className="bg-white border-b px-4 py-2 flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setCatalogMode('categories')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    catalogMode === 'categories'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Категории
                </button>
                <button
                  onClick={() => setCatalogMode('suppliers')}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 transition-all flex items-center gap-1.5"
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
                totalProducts={products.length}
                cartItemsCount={totalItems}
                onCartClick={() => setIsCartOpen(true)}
              />
            </div>

            {/* Row 2: Breadcrumbs + mobile filter + count */}
            <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 border-b">
              <button
                className="md:hidden flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors shrink-0"
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
                      <BreadcrumbPage className="font-medium text-gray-900">Каталог</BreadcrumbPage>
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
                          <BreadcrumbPage className="font-medium text-gray-900">{filters.category}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </>
                  )}
                  {filters.subcategory && selectedSubcategoryName && (
                    <>
                      <BreadcrumbSeparator className="text-gray-400">/</BreadcrumbSeparator>
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium text-gray-900">{selectedSubcategoryName}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>

              <span className="text-xs text-gray-400 shrink-0">
                {products.length > 0 && `${products.length.toLocaleString('ru-RU')} товаров`}
              </span>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Desktop sidebar */}
              <div className="hidden md:block">
                <CatalogSidebar
                  categories={categories}
                  selectedCategory={filters.category}
                  selectedSubcategory={filters.subcategory}
                  onCategorySelect={handleCategorySelect}
                  isLoading={categoriesLoading}
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
                  />
                </SheetContent>
              </Sheet>

              <div className="flex-1 flex flex-col overflow-hidden p-4">
                <CatalogGrid
                  products={products}
                  isLoading={isLoading}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage ?? false}
                  fetchNextPage={fetchNextPage}
                  viewMode={viewMode}
                  isInCart={isInCart}
                  onAddToCart={handleAddToCart}
                  onProductClick={handleProductClick}
                />
              </div>
            </div>
          </div>
        ) : (
          /* ========== SUPPLIERS MODE (existing) ========== */
          <>
            {/* Supplier mode header */}
            <div className="bg-white border-b px-4 py-2 flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setCatalogMode('categories')}
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-900 transition-all flex items-center gap-1.5"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  Категории
                </button>
                <button
                  onClick={() => setCatalogMode('suppliers')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    catalogMode === 'suppliers'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Поставщики
                </button>
              </div>

              <div className="w-px h-6 bg-gray-200" />

              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setSelectedRoom('orange')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedRoom === 'orange'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className={selectedRoom === 'orange' ? 'text-orange-500' : ''}>
                    {ROOM_TYPES.ORANGE.icon}
                  </span>
                  Аккредитованные
                </button>
                <button
                  onClick={() => setSelectedRoom('blue')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedRoom === 'blue'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span className={selectedRoom === 'blue' ? 'text-blue-500' : ''}>
                    {ROOM_TYPES.BLUE.icon}
                  </span>
                  Мои
                </button>
              </div>

              <div className="flex-1" />

              {selectedRoom === 'blue' && (
                <button
                  onClick={() => { setEditingSupplier(null); setShowAddSupplierModal(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Добавить
                </button>
              )}

              <button
                onClick={() => refreshSuppliers()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {(userError || verifiedError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">
                  {userError || verifiedError}
                </p>
              </div>
            )}

            <SupplierGrid
              suppliers={displayedSuppliers}
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
              title={`Поставщики (${displayedSuppliers.length})`}
              emptyMessage="В этой комнате пока нет поставщиков"
              showSearch={true}
              showFilters={true}
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
        />

        {/* Supplier Modal (suppliers mode) */}
        <SupplierModal
          isOpen={supplierModal.isOpen}
          supplier={supplierModal.selectedSupplier}
          products={supplierModal.products}
          loading={supplierModal.loading}
          onClose={supplierModal.close}
          onStartProject={handleStartProject}
          onAddToCart={(product: any) => { addToCart(product, 1); return true }}
          onProductClick={(product: Product) => {
            // For supplier modal product clicks, open the product modal
            setSelectedProduct(product as any)
          }}
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
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
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
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
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
