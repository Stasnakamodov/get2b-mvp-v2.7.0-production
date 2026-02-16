'use client'

import { memo, useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Check, ImageIcon, MapPin, Heart } from 'lucide-react'
import type { CatalogProduct } from '@/lib/catalog/types'
import { formatPrice, formatMinOrder, getProductImage, truncateText } from '@/lib/catalog/utils'

interface ProductCardProps {
  product: CatalogProduct
  isInCart?: boolean
  onAddToCart?: (product: CatalogProduct) => void
  onProductClick?: (product: CatalogProduct) => void
  viewMode?: 'grid' | 'list'
  isInWishlist?: boolean
  onToggleWishlist?: (product: CatalogProduct) => void
}

export const ProductCard = memo(function ProductCard({
  product,
  isInCart = false,
  onAddToCart,
  onProductClick,
  viewMode = 'grid',
  isInWishlist = false,
  onToggleWishlist,
}: ProductCardProps) {
  const imageUrl = getProductImage(product)
  const [imageError, setImageError] = useState(false)

  useEffect(() => { setImageError(false) }, [product.id])

  const effectiveImageUrl = imageError ? null : imageUrl

  const handleClick = () => {
    onProductClick?.(product)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAddToCart?.(product)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleWishlist?.(product)
  }

  // List view
  if (viewMode === 'list') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md hover:border-orange-400 ${
          isInCart ? 'ring-2 ring-orange-500 bg-orange-50' : ''
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-3 flex gap-4">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {effectiveImageUrl ? (
              <Image
                src={effectiveImageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="96px"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

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

            <div className="flex items-center gap-1.5">
              {onToggleWishlist && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                </Button>
              )}
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
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg hover:border-orange-400 hover:-translate-y-1 ${
        isInCart ? 'ring-2 ring-orange-500 bg-orange-50' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] bg-gray-100 rounded-t-lg overflow-hidden">
          {effectiveImageUrl ? (
            <Image
              src={effectiveImageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {/* Left stack: In stock + Featured + Variants */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.in_stock && (
              <Badge className="bg-green-500">
                В наличии
              </Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-orange-500">
                Топ
              </Badge>
            )}
            {product.has_variants && (
              <Badge className="bg-blue-500">
                Варианты
              </Badge>
            )}
          </div>

          {/* Wishlist heart */}
          {onToggleWishlist && (
            <button
              onClick={handleToggleWishlist}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
            >
              <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current text-red-500' : 'text-gray-500'}`} />
            </button>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-2 h-10">
            {product.name}
          </h3>

          <Badge variant="secondary" className="text-xs mb-2">
            {product.category}
          </Badge>

          <div className="mb-2">
            {product.has_variants && product.variants && product.variants.length > 0 ? (
              <p className="font-bold text-lg text-orange-600">
                {(() => {
                  const prices = product.variants
                    .map(v => v.price)
                    .filter((p): p is number => p != null)
                  if (prices.length === 0) return formatPrice(product.price, product.currency)
                  const min = Math.min(...prices)
                  const max = Math.max(...prices)
                  return min === max
                    ? formatPrice(min, product.currency)
                    : `${formatPrice(min, product.currency)} — ${formatPrice(max, product.currency)}`
                })()}
              </p>
            ) : (
              <p className="font-bold text-lg text-orange-600">
                {formatPrice(product.price, product.currency)}
              </p>
            )}
            {product.min_order && (
              <p className="text-xs text-gray-500">
                {formatMinOrder(product.min_order)}
              </p>
            )}
          </div>

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
