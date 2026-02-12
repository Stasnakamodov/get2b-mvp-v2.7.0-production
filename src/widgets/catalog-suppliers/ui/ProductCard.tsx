/**
 * Premium Product Card Component
 * Design Philosophy: Image-first, Minimal text, Clean hover states
 */

import React from 'react'
import { ShoppingCart, Image as ImageIcon } from 'lucide-react'
import type { Product } from '@/src/entities/product'
import { formatPrice } from '@/src/shared/config'

interface ProductCardProps {
  product: Product
  onClick?: (product: Product) => void
  onAddToCart?: (product: Product) => void
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
  const handleCardClick = () => {
    if (onClick) {
      onClick(product)
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

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
      <div className="group relative bg-white rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        {/* Image */}
        <div
          className="aspect-square bg-gray-50 overflow-hidden cursor-pointer"
          onClick={handleCardClick}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.onerror = null
                target.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3">
          <h4
            className="font-medium text-sm text-gray-900 line-clamp-1 cursor-pointer hover:text-gray-700"
            onClick={handleCardClick}
          >
            {productName}
          </h4>

          <div className="flex items-center justify-between mt-2 mb-3">
            <span className="text-lg font-bold text-gray-900">{price}</span>
            {product.in_stock && (
              <span className="text-xs text-violet-600 font-medium">В наличии</span>
            )}
          </div>

          {/* Cart button - always visible */}
          {showActions && onAddToCart && (
            <button
              onClick={handleAddToCart}
              className="w-full py-2 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              В корзину
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="group bg-white rounded-lg cursor-pointer transition-shadow duration-200 hover:shadow-md overflow-hidden"
      onClick={handleCardClick}
    >
      <div className="flex">
        {/* Image */}
        <div className="w-40 h-40 flex-shrink-0 bg-gray-50 overflow-hidden">
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
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info - Clean typography */}
        <div className="flex-1 p-4">
          {/* Title and price */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 flex-1">{productName}</h3>
            <div className="text-xl font-bold ml-4">{price}</div>
          </div>

          {/* Supplier */}
          {supplierName && (
            <p className="text-xs text-gray-500 mb-2">{supplierName}</p>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Meta info - minimal */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {product.item_code && (
              <span>Арт. {product.item_code}</span>
            )}

            {product.in_stock ? (
              <span className="text-violet-700 font-medium">В наличии</span>
            ) : (
              <span className="text-gray-500">Под заказ</span>
            )}
          </div>

          {/* Actions - clean buttons */}
          {showActions && (
            <div className="flex gap-2 mt-3">
              {onAddToCart && (
                <button
                  onClick={handleAddToCart}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>В корзину</span>
                </button>
              )}

              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Изменить
                </button>
              )}

              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-red-600 text-sm hover:bg-red-50 rounded-lg transition-colors"
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