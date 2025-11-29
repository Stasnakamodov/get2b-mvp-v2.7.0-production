'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Package, Plus } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

/**
 * CartModalWithContext - модальное окно корзины, использующее CartContext
 * Упрощенная версия без пропсов - все данные берутся из контекста
 */
export const CartModalWithContext = memo(function CartModalWithContext() {
  const {
    cart,
    isCartOpen,
    activeSupplier,
    totalItems,
    totalPrice,
    updateQuantity,
    removeFromCart,
    setCartOpen,
    createProjectFromCart
  } = useCart()

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Корзина ({totalItems})
              </h2>
              {activeSupplier && (
                <p className="text-sm text-gray-600 mt-1">
                  🔒 Поставщик: <span className="font-medium">{activeSupplier}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto min-h-[200px] max-h-[calc(90vh-280px)]">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">Корзина пуста</div>
              <div className="text-sm text-gray-400">Добавьте товары для создания проекта</div>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative">
                    {item.images && item.images[0] ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.supplier_name}</div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">${item.price}</span>
                      <span className="text-gray-400">×</span>
                      <span className="text-gray-600">{item.quantity}</span>
                      <span className="text-gray-400">=</span>
                      <span className="font-semibold text-green-600">
                        ${item.total_price.toFixed(2)} {item.currency}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t bg-gray-50 flex-shrink-0">
            {/* Информация о поставщике для шагов 4 и 5 */}
            {activeSupplier && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  💡 Данные поставщика для проекта:
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>📋 Шаг 2: Товары от "{activeSupplier}"</div>
                  <div>💳 Шаг 4: Способ оплаты поставщика будет предложен автоматически</div>
                  <div>🏦 Шаг 5: Реквизиты поставщика будут заполнены из истории</div>
                </div>
              </div>
            )}

            {/* Подсчет суммы с детализацией */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Количество товаров:</span>
                <span className="font-medium">{totalItems} шт.</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Сумма товаров:</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Итого:</span>
                  <span className="font-bold text-lg text-green-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={createProjectFromCart}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Перейти к созданию проекта
            </button>
          </div>
        )}
      </div>
    </div>
  )
})