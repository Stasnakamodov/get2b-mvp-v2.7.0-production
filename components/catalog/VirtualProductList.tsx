'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useInfiniteProducts, flattenProducts } from '@/hooks/useInfiniteProducts'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Package, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  name: string
  description?: string
  category: string
  price?: number
  currency?: string
  images?: string[] | any
  supplier_id: string
  sku?: string
  min_order?: string
  in_stock?: boolean
}

interface VirtualProductListProps {
  supplierType?: 'verified' | 'user'
  category?: string
  search?: string
  supplierId?: string
  onProductSelect?: (product: Product) => void
  selectedProductIds?: string[]
  height?: number | string
  itemHeight?: number
  columns?: number
}

/**
 * Виртуализированный список товаров с infinite scroll
 *
 * Оптимизирован для работы с 10000+ товаров:
 * - Рендерит только видимые элементы (виртуализация)
 * - Автоматически подгружает данные при скролле (infinite scroll)
 * - Поддерживает фильтрацию и поиск
 */
export function VirtualProductList({
  supplierType = 'verified',
  category,
  search,
  supplierId,
  onProductSelect,
  selectedProductIds = [],
  height = 600,
  itemHeight = 180,
  columns = 1
}: VirtualProductListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error
  } = useInfiniteProducts({
    supplierType,
    category,
    search,
    supplierId,
    limit: 50
  })

  const allProducts = flattenProducts(data)
  const rowCount = Math.ceil(allProducts.length / columns)

  // Виртуализатор для строк
  const virtualizer = useVirtualizer({
    count: hasNextPage ? rowCount + 1 : rowCount, // +1 для loader
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5 // Предзагрузка 5 элементов сверху и снизу
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Загрузка следующей страницы при приближении к концу
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]

    if (!lastItem) return

    // Если последний видимый элемент близок к концу списка
    if (
      lastItem.index >= rowCount - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    virtualItems,
    rowCount
  ])

  // Обработчик выбора товара
  const handleProductClick = useCallback((product: Product) => {
    onProductSelect?.(product)
  }, [onProductSelect])

  // Получить товары для строки
  const getRowProducts = (rowIndex: number): Product[] => {
    const start = rowIndex * columns
    return allProducts.slice(start, start + columns)
  }

  // Рендер изображения товара
  const renderProductImage = (product: Product) => {
    let imageUrl: string | null = null

    if (product.images) {
      if (Array.isArray(product.images) && product.images.length > 0) {
        imageUrl = typeof product.images[0] === 'string'
          ? product.images[0]
          : product.images[0]?.url
      } else if (typeof product.images === 'string') {
        imageUrl = product.images
      }
    }

    if (imageUrl) {
      return (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="80px"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )
    }

    return (
      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" style={{ height }}>
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-500">Загрузка товаров...</span>
      </div>
    )
  }

  // Ошибка
  if (isError) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500" style={{ height }}>
        <span>Ошибка загрузки: {(error as Error)?.message}</span>
      </div>
    )
  }

  // Пустой результат
  if (allProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500" style={{ height }}>
        <Package className="w-12 h-12 mb-2" />
        <span>Товары не найдены</span>
        {search && <span className="text-sm">Попробуйте изменить поисковый запрос</span>}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Счётчик */}
      <div className="mb-2 text-sm text-gray-500">
        Загружено: {allProducts.length} товаров
        {hasNextPage && ' (скролльте для загрузки ещё)'}
      </div>

      {/* Виртуализированный список */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height, contain: 'strict' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualItems.map((virtualRow) => {
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
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {isLoaderRow ? (
                  // Loader row
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    <span className="ml-2 text-gray-500">Загрузка...</span>
                  </div>
                ) : (
                  // Product row
                  <div className={`grid gap-3 h-full p-1 ${
                    columns === 1 ? 'grid-cols-1' :
                    columns === 2 ? 'grid-cols-2' :
                    columns === 3 ? 'grid-cols-3' : 'grid-cols-4'
                  }`}>
                    {rowProducts.map((product) => (
                      <Card
                        key={product.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedProductIds.includes(product.id)
                            ? 'ring-2 ring-orange-500 bg-orange-50'
                            : ''
                        }`}
                        onClick={() => handleProductClick(product)}
                      >
                        <CardContent className="p-3 flex gap-3">
                          {renderProductImage(product)}

                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 mb-1">
                              {product.name}
                            </h4>

                            {product.category && (
                              <Badge variant="secondary" className="text-xs mb-1">
                                {product.category}
                              </Badge>
                            )}

                            {product.price && (
                              <p className="text-sm font-semibold text-orange-600">
                                {product.price.toLocaleString()} {product.currency || 'RUB'}
                              </p>
                            )}

                            {product.min_order && (
                              <p className="text-xs text-gray-500">
                                Мин. заказ: {product.min_order}
                              </p>
                            )}

                            {product.in_stock === false && (
                              <Badge variant="destructive" className="text-xs">
                                Нет в наличии
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Индикатор загрузки внизу */}
      {isFetchingNextPage && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 p-2 text-center">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
          Загрузка следующей страницы...
        </div>
      )}
    </div>
  )
}

export default VirtualProductList
