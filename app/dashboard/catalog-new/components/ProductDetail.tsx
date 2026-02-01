'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  Plus
} from 'lucide-react'
import type { CatalogProduct, CatalogSupplier } from '@/lib/catalog/types'
import { formatPrice, formatMinOrder, getProductImage } from '@/lib/catalog/utils'

interface ProductDetailProps {
  product: CatalogProduct & { supplier?: CatalogSupplier | null }
  isInCart: boolean
  cartQuantity: number
  onAddToCart: (quantity: number) => void
  onBack: () => void
}

/**
 * Детальная карточка товара
 */
export function ProductDetail({
  product,
  isInCart,
  cartQuantity,
  onAddToCart,
  onBack
}: ProductDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const images = product.images || []
  const hasImages = images.length > 0

  // Навигация по изображениям
  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)
  }

  // Изменение количества
  const incrementQuantity = () => setQuantity(prev => prev + 1)
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1))

  // Добавление в корзину
  const handleAddToCart = () => {
    onAddToCart(quantity)
  }

  // Парсинг спецификаций
  const specifications = product.specifications || {}
  const specEntries = Object.entries(specifications).filter(([_, value]) => value)

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Кнопка назад */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={onBack}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Назад в каталог
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Левая колонка - Изображения */}
        <div>
          {/* Главное изображение */}
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            {hasImages ? (
              <>
                <Image
                  src={images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />

                {/* Навигация */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Счётчик */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-24 h-24 text-gray-300" />
              </div>
            )}

            {/* Бейджи */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.in_stock && (
                <Badge className="bg-green-500">В наличии</Badge>
              )}
              {product.is_featured && (
                <Badge className="bg-orange-500">Топ</Badge>
              )}
            </div>
          </div>

          {/* Миниатюры */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
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
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка - Информация */}
        <div>
          {/* Категория */}
          <Badge variant="secondary" className="mb-2">
            {product.category}
          </Badge>

          {/* Название */}
          <h1 className="text-2xl lg:text-3xl font-bold mb-4">
            {product.name}
          </h1>

          {/* Описание */}
          {product.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {product.description}
            </p>
          )}

          {/* Цена */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-4 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">
                {product.price?.toLocaleString('ru-RU') || '—'}
              </span>
              <span className="text-2xl">
                {product.currency || 'RUB'}
              </span>
            </div>
            {product.min_order && (
              <p className="text-orange-100 mt-1">
                Минимальный заказ: {formatMinOrder(product.min_order)}
              </p>
            )}
          </div>

          {/* Количество и кнопка */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={incrementQuantity}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className={`flex-1 ${isInCart ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
              onClick={handleAddToCart}
            >
              {isInCart ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  В корзине ({cartQuantity})
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Добавить в проект
                </>
              )}
            </Button>
          </div>

          {/* Поставщик */}
          {product.supplier && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.supplier.name}</h3>
                    {product.supplier.company_name && (
                      <p className="text-sm text-gray-500">{product.supplier.company_name}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {product.supplier.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {product.supplier.country}
                          {product.supplier.city && `, ${product.supplier.city}`}
                        </span>
                      )}
                      {product.supplier.public_rating && product.supplier.public_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {product.supplier.public_rating.toFixed(1)}
                        </span>
                      )}
                      {product.supplier.projects_count && product.supplier.projects_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {product.supplier.projects_count} проектов
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Характеристики */}
          {specEntries.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Характеристики</h3>
                <div className="space-y-2">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b last:border-0">
                      <span className="text-gray-500">{key}</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>

                {/* SKU */}
                {product.sku && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-gray-500">Артикул: </span>
                    <span className="font-mono">{product.sku}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
