'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ProductDetail } from '../components/ProductDetail'
import { ProductCard } from '../components/ProductCard'
import { useProductCart } from '@/hooks/useProductCart'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Loader2, ShoppingCart, ArrowLeft, Trash2, Plus, Minus, ArrowRight, X } from 'lucide-react'
import type { CatalogProduct, CatalogSupplier } from '@/lib/catalog/types'
import { formatPrice } from '@/lib/catalog/utils'

interface ProductWithSupplier extends CatalogProduct {
  supplier?: CatalogSupplier | null
}

interface ProductPageData {
  product: ProductWithSupplier
  relatedProducts: CatalogProduct[]
}

/**
 * Страница детального просмотра товара
 *
 * URL: /dashboard/catalog-new/[productId]
 */
export default function ProductPage() {
  const router = useRouter()
  const params = useParams()

  // Безопасное извлечение productId
  const productId = typeof params?.productId === 'string' ? params.productId : null

  const [data, setData] = useState<ProductPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Проверка валидности productId
  const isValidProductId = productId && /^[a-f0-9-]{36}$/i.test(productId)

  // Корзина
  const {
    items: cartItems,
    totalItems,
    totalAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getQuantity
  } = useProductCart()

  // Загрузка данных товара
  useEffect(() => {
    async function loadProduct() {
      if (!isValidProductId) {
        setError('Некорректный ID товара')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/catalog/product/${productId}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to load product')
        }

        setData({
          product: result.product,
          relatedProducts: result.relatedProducts || []
        })
      } catch (err: unknown) {
        console.error('Failed to load product:', err)
        const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки товара'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId, isValidProductId])

  // Добавление в корзину
  const handleAddToCart = useCallback((quantity: number) => {
    if (data?.product) {
      addToCart(data.product, quantity)
    }
  }, [data, addToCart])

  // Навигация
  const handleBack = useCallback(() => {
    router.push('/dashboard/catalog-new')
  }, [router])

  const handleRelatedProductClick = useCallback((product: CatalogProduct) => {
    router.push(`/dashboard/catalog-new/${product.id}`)
  }, [router])

  const handleRelatedAddToCart = useCallback((product: CatalogProduct) => {
    addToCart(product, 1)
  }, [addToCart])

  // Переход в конструктор
  // Корзина уже синхронизируется с localStorage через useProductCart
  const handleCreateProject = useCallback(() => {
    router.push('/dashboard/project-constructor?fromCatalog=true')
  }, [router])

  // Загрузка
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-500">Загрузка товара...</p>
        </div>
      </div>
    )
  }

  // Ошибка
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Товар не найден'}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться в каталог
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Каталог
          </Button>

          <Button
            variant="outline"
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-orange-500">
                {totalItems}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Product Detail */}
      <ProductDetail
        product={data.product}
        isInCart={isInCart(data.product.id)}
        cartQuantity={getQuantity(data.product.id)}
        onAddToCart={handleAddToCart}
        onBack={handleBack}
      />

      {/* Related Products */}
      {data.relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-4">Похожие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.relatedProducts.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isInCart={isInCart(product.id)}
                onAddToCart={() => handleRelatedAddToCart(product)}
                onProductClick={handleRelatedProductClick}
                viewMode="grid"
              />
            ))}
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Корзина
              {totalItems > 0 && (
                <Badge className="bg-orange-500">{totalItems}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Корзина пуста</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto py-4 space-y-3">
                {cartItems.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-orange-600 font-semibold">
                        {formatPrice(item.product.price, item.product.currency)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium">Итого:</span>
                  <span className="font-bold text-orange-600">
                    {formatPrice(totalAmount, 'RUB')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearCart}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Очистить
                  </Button>
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    onClick={handleCreateProject}
                  >
                    Создать проект
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
