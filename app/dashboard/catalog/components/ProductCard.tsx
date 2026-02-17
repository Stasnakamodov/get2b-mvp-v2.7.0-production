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
        className={`cursor-pointer transition-all duration-300 border-0 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] ${
          isInCart ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-3 flex gap-4">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
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
            <h3 className="font-semibold text-[13px] text-gray-800 line-clamp-1 mb-1">
              {product.name}
            </h3>

            {product.description && (
              <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                {truncateText(product.description, 80)}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
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
              <p className="font-bold text-lg tracking-tight text-gray-900">
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
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                </motion.button>
              )}
              <Button
                size="sm"
                variant={isInCart ? 'secondary' : 'default'}
                className={isInCart ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-900 text-white hover:bg-gray-800'}
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
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 border-0 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group ${
          isInCart ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-0">
          <div className="relative aspect-square bg-gray-50 rounded-t-xl overflow-hidden">
            {effectiveImageUrl ? (
              <Image
                src={effectiveImageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}

            {/* Badge: only "В наличии" */}
            {product.in_stock && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm text-[10px]">
                  В наличии
                </Badge>
              </div>
            )}

            {/* Wishlist heart — visible on hover, always if wishlisted */}
            {onToggleWishlist && (
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleToggleWishlist}
                className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-all shadow-sm ${
                  isInWishlist ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current text-red-500' : 'text-gray-500'}`} />
              </motion.button>
            )}
          </div>

          <div className="p-3.5">
            <h3 className="font-semibold text-[13px] text-gray-800 line-clamp-2 mb-2 h-10">
              {product.name}
            </h3>

            <div className="mb-2">
              {product.has_variants && product.variants && product.variants.length > 0 ? (
                <p className="font-bold text-lg tracking-tight text-gray-900">
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
                <p className="font-bold text-lg tracking-tight text-gray-900">
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
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3 border-t border-gray-100 pt-2">
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
              className={`w-full text-xs ${isInCart ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              onClick={handleAddToCart}
            >
              {isInCart ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  В корзине
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
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
