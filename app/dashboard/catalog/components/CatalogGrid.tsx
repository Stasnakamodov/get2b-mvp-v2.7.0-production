'use client'

import { useRef, useEffect, memo } from 'react'
import { Loader2, Package } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from './ProductCardSkeleton'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { CatalogProduct, CatalogViewMode } from '@/lib/catalog/types'

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
  isInWishlist?: (productId: string) => boolean
  onToggleWishlist?: (product: CatalogProduct) => void
}

const GRID_CLASSES: Record<string, string> = {
  'grid-2': 'grid-cols-2',
  'grid-3': 'grid-cols-2 md:grid-cols-3',
  'grid-4': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
}

/**
 * Product grid with CSS grid layout and IntersectionObserver for infinite scroll
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
  onProductClick,
  isInWishlist,
  onToggleWishlist,
}: CatalogGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const breakpoint = useBreakpoint()

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Skeleton loading
  if (isLoading && products.length === 0) {
    const skeletonCount = viewMode === 'list' ? 6 : 8
    return (
      <div className="flex-1 overflow-auto p-1">
        {viewMode === 'list' ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <ProductCardSkeleton key={i} viewMode="list" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 ${GRID_CLASSES[viewMode] || GRID_CLASSES['grid-4']}`}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <ProductCardSkeleton key={i} viewMode="grid" />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Empty state
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

  const gridClass = GRID_CLASSES[viewMode] || GRID_CLASSES['grid-4']

  return (
    <div className="flex-1 overflow-auto">
      <div className={`p-1 ${
        viewMode === 'list'
          ? 'flex flex-col gap-3'
          : `grid gap-4 ${gridClass}`
      }`}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            isInCart={isInCart(product.id)}
            onAddToCart={onAddToCart}
            onProductClick={onProductClick}
            viewMode={viewMode === 'list' ? 'list' : 'grid'}
            isInWishlist={isInWishlist?.(product.id)}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

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
