'use client'

import React, { useState, useEffect } from 'react'
import { X, ShoppingCart, Star, Package, Building2, MapPin, Award, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  product_name: string
  description?: string
  price?: string
  currency?: string
  min_order?: string
  in_stock: boolean
  image_url?: string
  images?: string[]
  item_code?: string
  item_name?: string
  supplier_id: string
  supplier_name: string
  supplier_company_name?: string
  supplier_country?: string
  supplier_city?: string
  supplier_rating?: number
  supplier_reviews?: number
  room_type: 'verified' | 'user'
  room_icon: string
  room_description: string
  category?: string
  subcategory?: string
  brand?: string
  rating?: string
  sold_count?: string
  reviews_count?: number
}

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, quantity?: number) => void
  isInCart?: boolean
}

export default function ProductModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isInCart = false
}: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Сброс количества при открытии/смене товара
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
    }
  }, [isOpen, product?.id])

  // Блокируем скролл страницы когда модалка открыта
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!product) return null

  const images = product.images && product.images.length > 0
    ? product.images
    : product.image_url
      ? [product.image_url]
      : []

  const currentImage = images[currentImageIndex] || '/placeholder-product.png'

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
    setImageError(false)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    setImageError(false)
  }

  const formatPrice = (price?: string) => {
    if (!price) return 'Цена по запросу'
    const numPrice = parseFloat(price.toString().replace(/[^0-9.-]+/g, ''))
    if (isNaN(numPrice)) return price
    return `${numPrice.toLocaleString('ru-RU')} ${product.currency || 'RUB'}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col"
            >
              {/* Компактный Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {product.product_name || product.item_name}
                    </h2>
                    {(product.category || product.subcategory) && (
                      <p className="text-xs text-gray-500 truncate">
                        {[product.category, product.subcategory].filter(Boolean).join(' / ')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/80 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  {/* Left Column - Image */}
                  <div className="space-y-3">
                    <div className="relative bg-gray-50 rounded-xl overflow-hidden aspect-square">
                      {!imageError ? (
                        <img
                          src={currentImage}
                          alt={product.product_name}
                          className="w-full h-full object-contain"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-20 h-20 text-gray-300" />
                        </div>
                      )}

                      {/* Navigation Arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/95 hover:bg-white rounded-lg shadow-lg transition-all"
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white/95 hover:bg-white rounded-lg shadow-lg transition-all"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/70 text-white text-xs rounded-full">
                            {currentImageIndex + 1} / {images.length}
                          </div>
                        </>
                      )}

                      {/* Status Badge */}
                      {product.in_stock && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-lg shadow-lg">
                          В наличии
                        </span>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.slice(0, 5).map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentImageIndex(idx)
                              setImageError(false)
                            }}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              idx === currentImageIndex
                                ? 'border-indigo-500 ring-2 ring-indigo-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={img}
                              alt={`${product.product_name} ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.png'
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column - Info */}
                  <div className="space-y-4">
                    {/* Price & CTA */}
                    <div className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.min_order && (
                          <p className="text-sm text-gray-600 mt-1">
                            Минимальный заказ: {product.min_order}
                          </p>
                        )}
                      </div>

                      {/* Количество */}
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Количество:</span>
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            disabled={quantity <= 1}
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center py-2 font-semibold text-gray-900 border-x-2 border-gray-200 focus:outline-none"
                          />
                          <button
                            onClick={() => setQuantity(q => q + 1)}
                            className="px-3 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        {quantity > 1 && product.price && (
                          <span className="text-sm text-gray-500">
                            = {(parseFloat(product.price.toString().replace(/[^0-9.-]+/g, '')) * quantity).toLocaleString('ru-RU')} {product.currency || 'RUB'}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          // Добавляем товар с указанным количеством
                          for (let i = 0; i < quantity; i++) {
                            onAddToCart(product)
                          }
                        }}
                        disabled={isInCart}
                        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                          isInCart
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {isInCart ? 'В корзине' : `Добавить ${quantity > 1 ? `(${quantity} шт.)` : 'в корзину'}`}
                      </button>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Описание</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    )}

                    {/* Stats */}
                    {(product.rating || product.sold_count || product.reviews_count) && (
                      <div className="flex gap-2">
                        {product.rating && (
                          <div className="flex-1 bg-amber-50 rounded-lg p-2.5 text-center">
                            <Star className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
                            <div className="text-sm font-bold text-gray-900">{product.rating}</div>
                            <div className="text-xs text-gray-600">Рейтинг</div>
                          </div>
                        )}
                        {product.sold_count && (
                          <div className="flex-1 bg-green-50 rounded-lg p-2.5 text-center">
                            <Package className="w-4 h-4 text-green-600 mx-auto mb-0.5" />
                            <div className="text-sm font-bold text-gray-900">{product.sold_count}</div>
                            <div className="text-xs text-gray-600">Продано</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Supplier */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Поставщик</h3>
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900">
                              {product.supplier_company_name || product.supplier_name}
                            </div>
                            <div className="text-xs text-gray-500">{product.room_description}</div>
                          </div>
                        </div>

                        {product.supplier_country && (
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {product.supplier_country}
                              {product.supplier_city && `, ${product.supplier_city}`}
                            </span>
                          </div>
                        )}

                        {product.supplier_rating && (
                          <div className="flex items-center gap-2.5">
                            <Award className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-sm font-medium">{product.supplier_rating}</span>
                              </div>
                              {product.supplier_reviews && (
                                <span className="text-xs text-gray-500">
                                  ({product.supplier_reviews} отзывов)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Article */}
                    {product.item_code && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600">Артикул</div>
                        <div className="font-mono text-sm text-gray-900 mt-0.5">{product.item_code}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
