'use client'

import { useState, useEffect } from 'react'
import { X, ShoppingCart, Building2, Package, ChevronLeft, ChevronRight, Check, MapPin } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CatalogProduct } from '@/lib/catalog/types'
import { getCleanImages, formatPrice, formatMinOrder } from '@/lib/catalog/utils'

interface ProductModalProps {
  product: CatalogProduct | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: CatalogProduct) => void
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [product?.id])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  const images = getCleanImages(product)
  const hasMultipleImages = images.length > 1

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)

  const handleAddToCart = () => {
    onAddToCart(product)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 lg:p-6">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 rounded-full p-2 shadow-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image Gallery */}
              <div className="relative bg-gray-50 dark:bg-gray-800">
                <div className="relative aspect-square">
                  {images.length > 0 ? (
                    <img
                      src={images[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-20 w-20 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-700/90 hover:bg-white dark:hover:bg-gray-700 rounded-full p-2 shadow-md transition-all hover:scale-110"
                      >
                        <ChevronLeft className="h-5 w-5 dark:text-gray-200" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-700/90 hover:bg-white dark:hover:bg-gray-700 rounded-full p-2 shadow-md transition-all hover:scale-110"
                      >
                        <ChevronRight className="h-5 w-5 dark:text-gray-200" />
                      </button>
                    </>
                  )}
                  {hasMultipleImages && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}
                </div>
                {hasMultipleImages && (
                  <div className="flex gap-2 overflow-x-auto px-4 pb-4 scrollbar-hide">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? 'border-gray-900 dark:border-gray-200 shadow-md'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6 lg:p-10 flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="text-xs font-normal">
                    {product.category}
                  </Badge>
                  {product.subcategory && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {product.subcategory}
                    </Badge>
                  )}
                  {product.in_stock && (
                    <Badge className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      В наличии
                    </Badge>
                  )}
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                  {product.name}
                </h2>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 mb-5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Цена</p>
                  <p className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(product.price, product.currency)}
                  </p>
                  {product.min_order && (
                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <Package className="h-4 w-4" />
                      <span>Мин. заказ: <strong>{formatMinOrder(product.min_order)}</strong></span>
                    </div>
                  )}
                </div>

                {product.supplier_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>Поставщик:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">{product.supplier_name}</span>
                    {product.supplier_country && (
                      <>
                        <MapPin className="h-3 w-3 ml-2" />
                        <span>{product.supplier_country}</span>
                      </>
                    )}
                  </div>
                )}

                {product.description && (
                  <div className="flex-1 mb-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Описание</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Характеристики</p>
                    <div className="space-y-1">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">{key}</span>
                          <span className="text-gray-900 dark:text-gray-200 font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {product.sku && (
                  <p className="text-xs text-gray-400 mb-4">Артикул: {product.sku}</p>
                )}

                <div className="flex gap-3 mt-auto pt-4">
                  <Button variant="outline" onClick={onClose} className="flex-1 h-12">
                    Закрыть
                  </Button>
                  <Button onClick={handleAddToCart} className="flex-1 h-12 font-medium">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    В корзину
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
