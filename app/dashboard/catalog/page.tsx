'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Grid3X3, Users, ShoppingCart, Plus, RefreshCw } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null)

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
  }, [])
  const handleCreateProject = useCallback(() => {
    router.push('/dashboard/project-constructor?fromCatalog=true')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg animate-gradient-shift">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Каталог товаров
                </h1>
                <p className="text-sm text-gray-500">
                  {catalogMode === 'suppliers' ? 'Просмотр поставщиков' : 'Все категории товаров'}
                </p>
              </div>
            </div>

            {/* Cart button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                totalItems > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Корзина</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mode switcher */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setCatalogMode('categories')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    catalogMode === 'categories'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className={`w-4 h-4 ${catalogMode === 'categories' ? 'text-indigo-600' : ''}`} />
                  Категории
                </button>

                <button
                  onClick={() => setCatalogMode('suppliers')}
                  className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    catalogMode === 'suppliers'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className={`w-4 h-4 ${catalogMode === 'suppliers' ? 'text-indigo-600' : ''}`} />
                  Поставщики
                </button>
              </div>

              {/* Room switcher (suppliers only) */}
              {catalogMode === 'suppliers' && (
                <>
                  <div className="w-px bg-gray-300 mx-1"></div>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setSelectedRoom('orange')}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedRoom === 'orange'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className={selectedRoom === 'orange' ? 'text-orange-500' : ''}>
                        {ROOM_TYPES.ORANGE.icon}
                      </span>
                      Аккредитованные
                    </button>

                    <button
                      onClick={() => setSelectedRoom('blue')}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        selectedRoom === 'blue'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className={selectedRoom === 'blue' ? 'text-blue-500' : ''}>
                        {ROOM_TYPES.BLUE.icon}
                      </span>
                      Мои поставщики
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {catalogMode === 'suppliers' && selectedRoom === 'blue' && (
                <button
                  onClick={() => {
                    setEditingSupplier(null)
                    setShowAddSupplierModal(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Добавить поставщика</span>
                </button>
              )}

              {catalogMode === 'suppliers' && (
                <button
                  onClick={() => refreshSuppliers()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="font-medium">Обновить</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {catalogMode === 'categories' ? (
          /* ========== CATEGORIES MODE (catalog-new) ========== */
          <div className="h-[calc(100vh-200px)] flex flex-col">
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

            <div className="flex-1 flex overflow-hidden">
              <CatalogSidebar
                categories={categories}
                selectedCategory={filters.category}
                selectedSubcategory={filters.subcategory}
                onCategorySelect={handleCategorySelect}
                isLoading={categoriesLoading}
              />

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
