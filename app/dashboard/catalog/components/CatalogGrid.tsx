'use client'

import { useRef, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
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
      <div className="flex-1 overflow-auto p-2">
        {viewMode === 'list' ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <ProductCardSkeleton key={i} viewMode="list" />
            ))}
          </div>
        ) : (
          <div className={`grid gap-5 ${GRID_CLASSES[viewMode] || GRID_CLASSES['grid-4']}`}>
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
      <div className={`p-2 ${
        viewMode === 'list'
          ? 'flex flex-col gap-3'
          : `grid gap-5 ${gridClass}`
      }`}>
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: Math.min(index * 0.03, 0.3),
              ease: 'easeOut',
            }}
          >
            <ProductCard
              product={product}
              isInCart={isInCart(product.id)}
              onAddToCart={onAddToCart}
              onProductClick={onProductClick}
              viewMode={viewMode === 'list' ? 'list' : 'grid'}
              isInWishlist={isInWishlist?.(product.id)}
              onToggleWishlist={onToggleWishlist}
            />
          </motion.div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="py-6 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-orange-500 inline mr-2" />
          <span className="text-sm text-gray-400">Загрузка товаров...</span>
        </div>
      )}
    </div>
  )
})

export default CatalogGrid
