'use client'

import { memo, useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
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
        className={`cursor-pointer transition-all duration-300 border-0 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-none dark:border dark:border-gray-800 dark:hover:border-gray-700 ${
          isInCart ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/30' : ''
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-3 flex gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0">
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
            <h3 className="font-semibold text-[13px] text-gray-800 dark:text-gray-200 line-clamp-1 mb-1">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                {truncateText(product.description, 80)}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {product.category}
              </Badge>

              {product.supplier_country && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {product.supplier_country}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end justify-between">
            <div className="text-right">
              <p className="font-extrabold text-xl tracking-tight text-orange-600 dark:text-orange-400">
                {formatPrice(product.price, product.currency)}
              </p>
              {product.min_order && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatMinOrder(product.min_order)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {onToggleWishlist && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                </motion.button>
              )}
              <Button
                size="sm"
                variant={isInCart ? 'secondary' : 'default'}
                className={isInCart ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20'}
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
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 border-0 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-none dark:border dark:border-gray-800 dark:hover:border-gray-700 group ${
          isInCart ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-950/30' : ''
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] bg-gray-50 dark:bg-gray-800 rounded-t-xl overflow-hidden">
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

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Left stack: In stock + Featured + Variants */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.in_stock && (
                <Badge className="bg-green-500/90 backdrop-blur-sm shadow-sm">
                  В наличии
                </Badge>
              )}
              {product.is_featured && (
                <Badge className="bg-orange-500/90 backdrop-blur-sm shadow-sm">
                  Топ
                </Badge>
              )}
              {product.has_variants && (
                <Badge className="bg-blue-500/90 backdrop-blur-sm shadow-sm">
                  Варианты
                </Badge>
              )}
            </div>

            {/* Wishlist heart */}
            {onToggleWishlist && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleToggleWishlist}
                className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-colors shadow-sm ${
                  isInWishlist ? 'animate-pulse' : ''
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current text-red-500' : 'text-gray-500'}`} />
              </motion.button>
            )}
          </div>

          <div className="p-3.5">
            <h3 className="font-semibold text-[13px] text-gray-800 dark:text-gray-200 line-clamp-2 mb-2 h-10">
              {product.name}
            </h3>

            <Badge variant="secondary" className="text-xs mb-2">
              {product.category}
            </Badge>

            <div className="mb-2">
              {product.has_variants && product.variants && product.variants.length > 0 ? (
                <p className="font-extrabold text-xl tracking-tight text-orange-600 dark:text-orange-400">
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
                <p className="font-extrabold text-xl tracking-tight text-orange-600 dark:text-orange-400">
                  {formatPrice(product.price, product.currency)}
                </p>
              )}
              {product.min_order && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatMinOrder(product.min_order)}
                </p>
              )}
            </div>

            {product.supplier_name && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
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
              className={`w-full ${isInCart ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20'}`}
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
    </motion.div>
  )
})

export default ProductCard
