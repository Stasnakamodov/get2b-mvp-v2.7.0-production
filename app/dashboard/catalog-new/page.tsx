'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CatalogHeader } from './components/CatalogHeader'
import { CatalogSidebar } from './components/CatalogSidebar'
import { CatalogGrid } from './components/CatalogGrid'
import { useInfiniteProducts, flattenProducts } from '@/hooks/useInfiniteProducts'
import { useProductCart } from '@/hooks/useProductCart'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, X } from 'lucide-react'
import type { CatalogProduct, CatalogFilters, CatalogSort, CatalogViewMode } from '@/lib/catalog/types'
import { formatPrice, parseFiltersFromUrl, buildCatalogUrl } from '@/lib/catalog/utils'

/**
 * Главная страница каталога TechnoModern
 *
 * URL: /dashboard/catalog-new
 *
 * Функции:
 * - Виртуализированный список товаров (10,000+)
 * - Infinite scroll с cursor-based пагинацией
 * - Фильтрация по категориям, цене, наличию
 * - Поиск с debounce
 * - Корзина товаров
 * - Интеграция с конструктором проектов
 */
export default function CatalogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Инициализация фильтров из URL
  const initialFilters = useMemo(() => {
    if (!searchParams) return {}
    return parseFiltersFromUrl(searchParams)
  }, [searchParams])

  // Состояние фильтров
  const [filters, setFilters] = useState<CatalogFilters>(initialFilters)
  const [sort, setSort] = useState<CatalogSort>({ field: 'created_at', order: 'desc' })
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid-4')
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Синхронизация URL при изменении фильтров
  useEffect(() => {
    const newUrl = buildCatalogUrl('/dashboard/catalog-new', filters)
    // Используем replace чтобы не засорять историю
    router.replace(newUrl, { scroll: false })
  }, [filters, router])

  // Корзина
  const {
    items: cartItems,
    totalItems,
    totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
  } = useProductCart()

  // Загрузка товаров
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteProducts({
    supplierType: 'verified',
    category: filters.category,
    search: filters.search,
    limit: 50
  })

  const products = useMemo(() => flattenProducts(data), [data])

  // Обработчики
  const handleFiltersChange = useCallback((newFilters: CatalogFilters) => {
    setFilters(newFilters)
  }, [])

  const handleSortChange = useCallback((newSort: CatalogSort) => {
    setSort(newSort)
  }, [])

  const handleViewModeChange = useCallback((mode: CatalogViewMode) => {
    setViewMode(mode)
  }, [])

  const handleAddToCart = useCallback((product: CatalogProduct) => {
    addToCart(product, 1)
  }, [addToCart])

  const handleProductClick = useCallback((product: CatalogProduct) => {
    // Переход на детальную страницу товара
    router.push(`/dashboard/catalog-new/${product.id}`)
  }, [router])

  const handleCategorySelect = useCallback((category: string | undefined) => {
    setFilters(prev => ({ ...prev, category }))
  }, [])

  // Переход в конструктор с товарами
  // Корзина уже синхронизируется с localStorage через useProductCart
  const handleCreateProject = useCallback(() => {
    router.push('/dashboard/project-constructor?fromCatalog=true')
  }, [router])

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <CatalogSidebar
          selectedCategory={filters.category}
          onCategorySelect={handleCategorySelect}
        />

        {/* Product Grid */}
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
              {/* Cart Items */}
              <div className="flex-1 overflow-auto py-4 space-y-3">
                {cartItems.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-orange-600 font-semibold">
                        {formatPrice(item.product.price, item.product.currency)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
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
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
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

              {/* Cart Footer */}
              <div className="border-t pt-4 space-y-4">
                {/* Total */}
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium">Итого:</span>
                  <span className="font-bold text-orange-600">
                    {formatPrice(totalAmount, 'RUB')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={clearCart}
                  >
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
    </div>
  )
}
