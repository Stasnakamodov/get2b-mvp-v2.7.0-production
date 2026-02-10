'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Package,
  Building,
  ImageIcon,
  Minus,
  Plus,
} from 'lucide-react'
import type { CatalogProduct } from '@/lib/catalog/types'
import { formatPrice, formatMinOrder } from '@/lib/catalog/utils'

interface ProductModalProps {
  product: CatalogProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isInCart: boolean
  cartQuantity: number
  onAddToCart: (product: CatalogProduct, quantity: number) => void
}

/**
 * Modal for viewing product details (replaces page navigation for faster UX)
 */
export function ProductModal({
  product,
  open,
  onOpenChange,
  isInCart,
  cartQuantity,
  onAddToCart,
}: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const images = product.images || []
  const hasImages = images.length > 0

  const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)

  const handleAddToCart = () => {
    onAddToCart(product, quantity)
    setQuantity(1)
  }

  const specifications = product.specifications || {}
  const specEntries = Object.entries(specifications).filter(([_, value]) => value)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold pr-8">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Images */}
            <div>
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                {hasImages ? (
                  <>
                    <Image
                      src={images[currentImageIndex]}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-20 h-20 text-gray-300" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {product.in_stock && (
                    <Badge className="bg-green-500 text-xs">В наличии</Badge>
                  )}
                  {product.is_featured && (
                    <Badge className="bg-orange-500 text-xs">Топ</Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        currentImageIndex === index
                          ? 'border-orange-500'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              {/* Category */}
              <Badge variant="secondary" className="self-start mb-3">
                {product.category}
              </Badge>

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-4">
                  {product.description}
                </p>
              )}

              {/* Price */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {product.price?.toLocaleString('ru-RU') || '—'}
                  </span>
                  <span className="text-xl">
                    {product.currency || 'RUB'}
                  </span>
                </div>
                {product.min_order && (
                  <p className="text-orange-100 text-sm mt-1">
                    Мин. заказ: {formatMinOrder(product.min_order)}
                  </p>
                )}
              </div>

              {/* Quantity + Add to cart */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-10 text-center font-medium text-sm">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setQuantity(prev => prev + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  className={`flex-1 ${isInCart ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                  onClick={handleAddToCart}
                >
                  {isInCart ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      В корзине ({cartQuantity})
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Добавить в проект
                    </>
                  )}
                </Button>
              </div>

              {/* Supplier info */}
              {(product.supplier_name || product.supplier_country) && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    {product.supplier_name && (
                      <p className="font-medium text-sm">{product.supplier_name}</p>
                    )}
                    {product.supplier_country && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {product.supplier_country}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {specEntries.length > 0 && (
                <div className="border rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2">Характеристики</h4>
                  <div className="space-y-1">
                    {specEntries.slice(0, 6).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm py-1 border-b last:border-0">
                        <span className="text-gray-500">{key}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                    {specEntries.length > 6 && (
                      <p className="text-xs text-gray-400 pt-1">
                        + ещё {specEntries.length - 6} характеристик
                      </p>
                    )}
                  </div>
                  {product.sku && (
                    <div className="mt-2 pt-2 border-t text-sm">
                      <span className="text-gray-500">Артикул: </span>
                      <span className="font-mono text-xs">{product.sku}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductModal
