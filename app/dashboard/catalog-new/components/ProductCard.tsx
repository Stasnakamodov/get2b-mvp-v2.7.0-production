'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Check, ImageIcon, MapPin } from 'lucide-react'
import type { CatalogProduct } from '@/lib/catalog/types'
import { formatPrice, formatMinOrder, getProductImage, truncateText } from '@/lib/catalog/utils'

interface ProductCardProps {
  product: CatalogProduct
  isInCart?: boolean
  onAddToCart?: (product: CatalogProduct) => void
  onProductClick?: (product: CatalogProduct) => void
  viewMode?: 'grid' | 'list'
}

/**
 * Карточка товара для каталога
 *
 * Поддерживает два режима отображения:
 * - grid: компактная карточка для сетки
 * - list: горизонтальная карточка для списка
 */
export const ProductCard = memo(function ProductCard({
  product,
  isInCart = false,
  onAddToCart,
  onProductClick,
  viewMode = 'grid'
}: ProductCardProps) {
  const imageUrl = getProductImage(product)
  const [imageFailed, setImageFailed] = useState(0) // 0=ok, 1=try fallback, 2=give up

  // Фоллбэк: оригинал → picsum placeholder → иконка
  const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(product.id || product.name)}/600/600`
  const effectiveImageUrl = imageFailed === 0 ? imageUrl : imageFailed === 1 ? fallbackUrl : null

  const handleClick = () => {
    onProductClick?.(product)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart?.(product)
  }

  // Список (горизонтальный)
  if (viewMode === 'list') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md hover:border-orange-400 ${
          isInCart ? 'ring-2 ring-orange-500 bg-orange-50' : ''
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-3 flex gap-4">
          {/* Изображение */}
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {effectiveImageUrl ? (
              <Image
                src={effectiveImageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="96px"
                onError={() => setImageFailed(prev => prev + 1)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-1 mb-1">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                {truncateText(product.description, 80)}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>

              {product.supplier_country && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {product.supplier_country}
                </span>
              )}
            </div>
          </div>

          {/* Цена и кнопка */}
          <div className="flex flex-col items-end justify-between">
            <div className="text-right">
              <p className="font-bold text-orange-600">
                {formatPrice(product.price, product.currency)}
              </p>
              {product.min_order && (
                <p className="text-xs text-gray-500">
                  {formatMinOrder(product.min_order)}
                </p>
              )}
            </div>

            <Button
              size="sm"
              variant={isInCart ? 'secondary' : 'default'}
              className={isInCart ? '' : 'bg-orange-500 hover:bg-orange-600'}
              onClick={handleAddToCart}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  В корзине
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Добавить
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Сетка (вертикальный)
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg hover:border-orange-400 hover:-translate-y-1 ${
        isInCart ? 'ring-2 ring-orange-500 bg-orange-50' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        {/* Изображение */}
        <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
          {effectiveImageUrl ? (
            <Image
              src={effectiveImageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onError={() => setImageFailed(prev => prev + 1)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Бейдж "В наличии" */}
          {product.in_stock && (
            <Badge className="absolute top-2 left-2 bg-green-500">
              В наличии
            </Badge>
          )}

          {/* Бейдж "Топ" */}
          {product.is_featured && (
            <Badge className="absolute top-2 right-2 bg-orange-500">
              Топ
            </Badge>
          )}
        </div>

        {/* Контент */}
        <div className="p-3">
          {/* Название */}
          <h3 className="font-medium text-sm line-clamp-2 mb-2 h-10">
            {product.name}
          </h3>

          {/* Категория */}
          <Badge variant="secondary" className="text-xs mb-2">
            {product.category}
          </Badge>

          {/* Цена */}
          <div className="mb-2">
            <p className="font-bold text-lg text-orange-600">
              {formatPrice(product.price, product.currency)}
            </p>
            {product.min_order && (
              <p className="text-xs text-gray-500">
                {formatMinOrder(product.min_order)}
              </p>
            )}
          </div>

          {/* Поставщик */}
          {product.supplier_name && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <span className="truncate">{product.supplier_name}</span>
              {product.supplier_country && (
                <>
                  <span>·</span>
                  <span>{product.supplier_country}</span>
                </>
              )}
            </div>
          )}

          {/* Кнопка */}
          <Button
            size="sm"
            variant={isInCart ? 'secondary' : 'default'}
            className={`w-full ${isInCart ? '' : 'bg-orange-500 hover:bg-orange-600'}`}
            onClick={handleAddToCart}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                В корзине
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                В проект
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

export default ProductCard
