/**
 * Premium Product Card Component
 * Design Philosophy: Image-first, Minimal text, Clean hover states
 */

import React, { useState, useCallback } from 'react'
import { ShoppingCart, Check, Image as ImageIcon, Minus, Plus } from 'lucide-react'
import type { Product } from '@/src/entities/product'
import { formatPrice } from '@/src/shared/config'

interface ProductCardProps {
  product: Product
  onClick?: (product: Product) => void
  onAddToCart?: (product: Product, quantity: number) => void
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  showActions?: boolean
  isCompact?: boolean
  supplierName?: string
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  onAddToCart,
  onEdit,
  onDelete,
  showActions = false,
  isCompact = false,
  supplierName
}) => {
  const [addedToCart, setAddedToCart] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const handleCardClick = () => {
    if (onClick) {
      onClick(product)
    }
  }

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(product, quantity)
      setAddedToCart(true)
      setQuantity(1)
      setTimeout(() => setAddedToCart(false), 2000)
    }
  }, [onAddToCart, product, quantity])

  const handleQuantityMinus = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setQuantity(prev => Math.max(1, prev - 1))
  }, [])

  const handleQuantityPlus = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setQuantity(prev => prev + 1)
  }, [])

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(product)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm('Вы уверены, что хотите удалить этот товар?')) {
      onDelete(product)
    }
  }

  // Get image and basic data
  const imageUrl = product.images?.[0] || product.image_url || null
  const productName = product.product_name || product.name || 'Без названия'
  const price = formatPrice(product.price, product.currency)

  if (isCompact) {
    return (
      <div className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        {/* Image */}
        <div
          className="bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-pointer"
          style={{ height: '130px', maxHeight: '130px' }}
          onClick={handleCardClick}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              style={{ height: '130px', maxHeight: '130px' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full flex items-center justify-center" style={{ height: '130px' }}>
              <ImageIcon className="w-10 h-10 text-gray-300" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h4
            className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
            onClick={handleCardClick}
          >
            {productName}
          </h4>

          <div className="flex items-center justify-between mt-1.5 mb-2">
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">{price}</span>
            {product.in_stock && (
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">В наличии</span>
            )}
          </div>

          {/* Quantity + Cart button */}
          {showActions && onAddToCart && (
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg shrink-0">
                <button
                  onClick={handleQuantityMinus}
                  disabled={quantity <= 1 || addedToCart}
                  className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{quantity}</span>
                <button
                  onClick={handleQuantityPlus}
                  disabled={addedToCart}
                  className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addedToCart}
                className={`flex-1 py-2 px-3 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  addedToCart
                    ? 'bg-green-500 cursor-default'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-lg'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    Добавлено!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    В корзину
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-lg cursor-pointer transition-shadow duration-200 hover:shadow-md overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="flex">
        {/* Image */}
        <div className="w-40 h-40 flex-shrink-0 bg-gray-50 dark:bg-gray-700 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-500" />
            </div>
          )}
        </div>

        {/* Info - Clean typography */}
        <div className="flex-1 p-4">
          {/* Title and price */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">{productName}</h3>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-4">{price}</div>
          </div>

          {/* Supplier */}
          {supplierName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{supplierName}</p>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Meta info - minimal */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            {product.item_code && (
              <span>Арт. {product.item_code}</span>
            )}

            {product.in_stock ? (
              <span className="text-orange-700 dark:text-orange-400 font-medium">В наличии</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Под заказ</span>
            )}
          </div>

          {/* Actions - clean buttons */}
          {showActions && (
            <div className="flex gap-2 mt-3">
              {onAddToCart && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg shrink-0">
                    <button
                      onClick={handleQuantityMinus}
                      disabled={quantity <= 1 || addedToCart}
                      className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-medium text-gray-900 dark:text-gray-100">{quantity}</span>
                    <button
                      onClick={handleQuantityPlus}
                      disabled={addedToCart}
                      className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={`flex items-center gap-1 px-3 py-1.5 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md ${
                      addedToCart
                        ? 'bg-green-500 cursor-default'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Добавлено!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>В корзину</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Изменить
                </button>
              )}

              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  Удалить
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}