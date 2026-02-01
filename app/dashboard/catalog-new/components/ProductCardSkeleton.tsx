'use client'

import { Card, CardContent } from '@/components/ui/card'

interface ProductCardSkeletonProps {
  viewMode?: 'grid' | 'list'
}

/**
 * Skeleton-заглушка для карточки товара
 * Показывается во время загрузки данных
 */
export function ProductCardSkeleton({ viewMode = 'grid' }: ProductCardSkeletonProps) {
  // Список (горизонтальный)
  if (viewMode === 'list') {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-3 flex gap-4">
          {/* Изображение */}
          <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

          {/* Информация */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-20" />
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            </div>
          </div>

          {/* Цена и кнопка */}
          <div className="flex flex-col items-end justify-between">
            <div className="space-y-1">
              <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Сетка (вертикальный)
  return (
    <Card className="animate-pulse">
      <CardContent className="p-0">
        {/* Изображение */}
        <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-t-lg" />

        {/* Контент */}
        <div className="p-3 space-y-3">
          {/* Название */}
          <div className="space-y-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
          </div>

          {/* Категория */}
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-24" />

          {/* Цена */}
          <div className="space-y-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-28" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-20" />
          </div>

          {/* Поставщик */}
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32" />

          {/* Кнопка */}
          <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Сетка skeleton-карточек
 */
export function ProductGridSkeleton({
  count = 8,
  viewMode = 'grid'
}: {
  count?: number
  viewMode?: 'grid' | 'list'
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </>
  )
}

export default ProductCardSkeleton
