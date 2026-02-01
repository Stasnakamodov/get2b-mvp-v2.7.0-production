'use client'

import { useRef, useEffect, useCallback, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, Package } from 'lucide-react'
import { ProductCard } from './ProductCard'
import type { CatalogProduct, CatalogViewMode } from '@/lib/catalog/types'
import { CARD_HEIGHTS } from '@/lib/catalog/constants'

interface CatalogGridProps {
  products: CatalogProduct[]
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
  viewMode: CatalogViewMode
  isInCart: (productId: string) => boolean
  onAddToCart: (product: CatalogProduct) => void
  onProductClick: (product: CatalogProduct) => void
}

/**
 * Виртуализированная сетка товаров
 *
 * Поддерживает:
 * - Виртуализацию (рендер только видимых элементов)
 * - Infinite scroll (автозагрузка при скролле)
 * - Разные режимы отображения (grid-4, grid-3, grid-2, list)
 */
export const CatalogGrid = memo(function CatalogGrid({
  products,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  viewMode,
  isInCart,
  onAddToCart,
  onProductClick
}: CatalogGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Количество колонок в зависимости от режима
  const getColumns = () => {
    switch (viewMode) {
      case 'grid-4': return 4
      case 'grid-3': return 3
      case 'grid-2': return 2
      case 'list': return 1
      default: return 4
    }
  }

  const columns = getColumns()
  const rowCount = Math.ceil(products.length / columns)
  const itemHeight = CARD_HEIGHTS[viewMode] || 320

  // Виртуализатор
  const virtualizer = useVirtualizer({
    count: hasNextPage ? rowCount + 1 : rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 3
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Автозагрузка при приближении к концу
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]

    if (!lastItem) return

    if (
      lastItem.index >= rowCount - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, isFetchingNextPage, virtualItems, rowCount])

  // Получить товары для строки
  const getRowProducts = useCallback((rowIndex: number): CatalogProduct[] => {
    const start = rowIndex * columns
    return products.slice(start, start + columns)
  }, [products, columns])

  // Начальная загрузка
  if (isLoading && products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Загрузка каталога...</p>
        </div>
      </div>
    )
  }

  // Пустой результат
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Товары не найдены
          </h3>
          <p className="text-gray-500">
            Попробуйте изменить параметры поиска или фильтры
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualItems.map(virtualRow => {
          const isLoaderRow = virtualRow.index >= rowCount
          const rowProducts = isLoaderRow ? [] : getRowProducts(virtualRow.index)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                padding: '8px'
              }}
            >
              {isLoaderRow ? (
                // Строка загрузки
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                  <span className="text-gray-500">Загрузка...</span>
                </div>
              ) : (
                // Строка товаров
                <div className={`h-full ${
                  viewMode === 'list'
                    ? 'flex flex-col gap-3'
                    : `grid gap-4 ${
                        viewMode === 'grid-4' ? 'grid-cols-4' :
                        viewMode === 'grid-3' ? 'grid-cols-3' :
                        'grid-cols-2'
                      }`
                }`}>
                  {rowProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isInCart={isInCart(product.id)}
                      onAddToCart={onAddToCart}
                      onProductClick={onProductClick}
                      viewMode={viewMode === 'list' ? 'list' : 'grid'}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Индикатор загрузки внизу */}
      {isFetchingNextPage && (
        <div className="p-4 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500 inline mr-2" />
          <span className="text-gray-500">Загрузка товаров...</span>
        </div>
      )}
    </div>
  )
})

export default CatalogGrid
