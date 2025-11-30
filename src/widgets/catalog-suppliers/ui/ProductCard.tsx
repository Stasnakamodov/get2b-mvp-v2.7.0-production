/**
 * Компонент карточки товара
 * Часть FSD архитектуры - widgets/catalog-suppliers
 */

import React from 'react'
import { ShoppingCart, Package, Info, Image as ImageIcon } from 'lucide-react'
import type { Product } from '@/src/entities/supplier'
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

  // Получаем первое изображение или используем заглушку
  const imageUrl = product.images?.[0] || product.image_url || null
  const productName = product.product_name || product.name || 'Без названия'
  const price = formatPrice(product.price, product.currency)

  if (isCompact) {
    return (
      <div
        className="group relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md bg-white"
        onClick={handleCardClick}
      >
        {/* Изображение */}
        <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE5NC40NzcgMTUwIDE5MCAxNTQuNDc3IDE5MCAxNjBWMjQwQzE5MCAyNDUuNTIzIDE5NC40NzcgMjUwIDIwMCAyNTBIMjgwQzI4NS41MjMgMjUwIDI5MCAyNDUuNTIzIDI5MCAyNDBWMTYwQzI5MCAxNTQuNDc3IDI4NS41MjMgMTUwIDI4MCAxNTBIMjAwWiIgc3Ryb2tlPSIjOUIxQzJDIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjE1IDE3NUMyMTUgMTc3Ljc2MSAyMTIuNzYxIDE4MCAyMTAgMTgwQzIwNy4yMzkgMTgwIDIwNSAxNzcuNzYxIDIwNSAxNzVDMjA1IDE3Mi4yMzkgMjA3LjIzOSAxNzAgMjEwIDE3MEMyMTIuNzYxIDE3MCAyMTUgMTcyLjIzOSAyMTUgMTc1WiIgZmlsbD0iIzlCMUMyQyIvPgo8cGF0aCBkPSJNMTkwIDI1MEwyMzAgMjEwTDI5MCAyNTAiIHN0cm9rZT0iIzlCMUMyQyIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Название */}
        <h4 className="font-medium text-sm mb-2 line-clamp-2">{productName}</h4>

        {/* Цена */}
        <div className="text-lg font-semibold text-blue-600 mb-2">{price}</div>

        {/* Информация о наличии */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {product.in_stock ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>В наличии</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Под заказ</span>
            </>
          )}
          {product.min_order && (
            <span className="ml-auto">Мин: {product.min_order}</span>
          )}
        </div>

        {/* Кнопка в корзину */}
        {showActions && onAddToCart && (
          <button
            onClick={handleAddToCart}
            className="absolute top-2 right-2 p-2 bg-white shadow-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50"
            title="Добавить в корзину"
          >
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      className="border rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg bg-white"
      onClick={handleCardClick}
    >
      <div className="flex gap-6">
        {/* Изображение */}
        <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE5NC40NzcgMTUwIDE5MCAxNTQuNDc3IDE5MCAxNjBWMjQwQzE5MCAyNDUuNTIzIDE5NC40NzcgMjUwIDIwMCAyNTBIMjgwQzI4NS41MjMgMjUwIDI5MCAyNDUuNTIzIDI5MCAyNDBWMTYwQzI5MCAxNTQuNDc3IDI4NS41MjMgMTUwIDI4MCAxNTBIMjAwWiIgc3Ryb2tlPSIjOUIxQzJDIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjE1IDE3NUMyMTUgMTc3Ljc2MSAyMTIuNzYxIDE4MCAyMTAgMTgwQzIwNy4yMzkgMTgwIDIwNSAxNzcuNzYxIDIwNSAxNzVDMjA1IDE3Mi4yMzkgMjA3LjIzOSAxNzAgMjEwIDE3MEMyMTIuNzYxIDE3MCAyMTUgMTcyLjIzOSAyMTUgMTc1WiIgZmlsbD0iIzlCMUMyQyIvPgo8cGF0aCBkPSJNMTkwIDI1MEwyMzAgMjEwTDI5MCAyNTAiIHN0cm9rZT0iIzlCMUMyQyIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="flex-1">
          {/* Заголовок и цена */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold">{productName}</h3>
            <div className="text-xl font-bold text-blue-600">{price}</div>
          </div>

          {/* Поставщик */}
          {supplierName && (
            <p className="text-sm text-gray-600 mb-2">Поставщик: {supplierName}</p>
          )}

          {/* Описание */}
          {product.description && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Метаинформация */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            {product.item_code && (
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                <span>Артикул: {product.item_code}</span>
              </div>
            )}

            {product.min_order && (
              <div className="flex items-center gap-1">
                <Info className="w-4 h-4" />
                <span>Мин. заказ: {product.min_order}</span>
              </div>
            )}

            {/* Наличие */}
            <div className="flex items-center gap-1">
              {product.in_stock ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">В наличии</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-medium">Под заказ</span>
                </>
              )}
            </div>
          </div>

          {/* Спецификации */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Характеристики:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specifications).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="text-gray-600">{key}:</span>
                    <span className="ml-2 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Действия */}
          {showActions && (
            <div className="flex gap-2">
              {onAddToCart && (
                <button
                  onClick={handleAddToCart}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>В корзину</span>
                </button>
              )}

              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  ✏️ Редактировать
                </button>
              )}

              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                >
                  🗑️ Удалить
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}