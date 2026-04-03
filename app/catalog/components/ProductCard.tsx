'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, MessageCircle, ShoppingCart, Building2, MapPin, ImageIcon } from "lucide-react"
import type { CatalogProduct } from '@/lib/catalog/types'
import { getCleanImages, formatPrice, formatMinOrder } from '@/lib/catalog/utils'

interface ProductCardProps {
  product: CatalogProduct
  onAddToCart?: (product: CatalogProduct) => void
  onViewDetails?: (product: CatalogProduct) => void
}

const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQCEEBEAAB+AQAB//9k='

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setImageErrors(new Set())
    setLoadedImages(new Set())
    setCurrentImageIndex(0)
  }, [product.id])

  if (!product || !product.id || !product.name) return null

  const allImages = getCleanImages(product)
  const validImages = allImages.filter((_, index) => !imageErrors.has(index))
  const hasValidImages = validImages.length > 0
  const hasMultipleImages = validImages.length > 1

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index))
  }, [])

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev).add(index))
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const newIndex = Math.round(container.scrollLeft / container.clientWidth)
      setCurrentImageIndex(newIndex)
    }
  }, [])

  const isExternalImage = (url: string): boolean => {
    return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')))
  }

  return (
    <div
      className="hover:-translate-y-1 transition-transform duration-200 cursor-pointer h-full"
      onClick={() => onViewDetails?.(product)}
    >
      <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden flex flex-col h-full min-h-[360px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[480px]">
        {/* Image */}
        <div className="relative w-full h-52 sm:h-52 md:h-56 lg:h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
          {hasValidImages ? (
            <>
              {hasMultipleImages && (
                <div className="md:hidden absolute inset-0">
                  <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {validImages.map((imageUrl, idx) => (
                      <div key={idx} className="flex-shrink-0 w-full h-full snap-center relative">
                        <Image
                          src={imageUrl}
                          alt={`${product.name} - ${idx + 1}`}
                          fill
                          sizes="100vw"
                          className={`object-cover transition-all duration-300 ${loadedImages.has(idx) ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                          onLoad={() => handleImageLoad(idx)}
                          onError={() => handleImageError(idx)}
                          loading={idx === 0 ? "eager" : "lazy"}
                          unoptimized={isExternalImage(imageUrl)}
                        />
                        {!loadedImages.has(idx) && (
                          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                  {validImages.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {validImages.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                            idx === currentImageIndex ? 'bg-white w-3 shadow-md' : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className={hasMultipleImages ? 'hidden md:block h-full' : 'h-full'}>
                <Image
                  src={validImages[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={`object-cover transition-all duration-300 ${loadedImages.has(0) ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  onLoad={() => handleImageLoad(0)}
                  onError={() => handleImageError(0)}
                  loading="lazy"
                  unoptimized={isExternalImage(validImages[0])}
                />
                {!loadedImages.has(0) && (
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>

        <CardHeader className="pb-1 sm:pb-3">
          <div className="space-y-1 sm:space-y-2">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 line-clamp-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              {product.name}
            </h3>
            {product.supplier_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{product.supplier_name}</span>
                {product.supplier_country && (
                  <>
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs">{product.supplier_country}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-2 sm:space-y-4 flex-1 flex flex-col">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Цена</span>
              <div className="font-bold text-xl sm:text-2xl text-gray-900 dark:text-gray-100">
                {formatPrice(product.price, product.currency)}
              </div>
            </div>
            {product.min_order && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">MOQ</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {formatMinOrder(product.min_order)}
                </span>
              </div>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="space-y-2 pt-2 mt-auto">
            <Button
              size="lg"
              onClick={(e) => { e.stopPropagation(); onAddToCart?.(product) }}
              className="w-full h-10 sm:h-11 md:h-12 text-xs sm:text-sm font-semibold"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              В корзину
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onViewDetails?.(product) }}
                className="h-9 text-[11px] sm:text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Подробнее
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-9 text-[11px] sm:text-xs"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Связаться
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
