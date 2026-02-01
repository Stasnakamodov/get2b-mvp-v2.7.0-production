'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CatalogProduct, CartItem, CartState } from '@/lib/catalog/types'
import { CART_STORAGE_KEY, MAX_CART_ITEMS } from '@/lib/catalog/constants'
import { calculateCartTotal, calculateCartItemsCount } from '@/lib/catalog/utils'

/**
 * Хук для управления корзиной товаров
 *
 * Сохраняет данные в localStorage для persistence
 *
 * @example
 * const { items, addToCart, removeFromCart, totalAmount } = useProductCart()
 *
 * // Добавить товар
 * addToCart(product, 1)
 *
 * // Удалить товар
 * removeFromCart(product.id)
 *
 * // Очистить корзину
 * clearCart()
 */
export function useProductCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Восстанавливаем даты
        const restoredItems = parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        setItems(restoredItems)
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e)
    }
    setIsLoaded(true)
  }, [])

  // Сохранение в localStorage при изменении
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e)
      }
    }
  }, [items, isLoaded])

  // Добавление товара в корзину
  const addToCart = useCallback((product: CatalogProduct, quantity: number = 1) => {
    setItems(prev => {
      // Проверяем лимит
      if (prev.length >= MAX_CART_ITEMS) {
        console.warn('Cart is full')
        return prev
      }

      // Ищем существующий товар
      const existingIndex = prev.findIndex(item => item.product.id === product.id)

      if (existingIndex >= 0) {
        // Обновляем количество
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        }
        return updated
      }

      // Добавляем новый товар
      return [...prev, {
        product,
        quantity,
        addedAt: new Date()
      }]
    })
  }, [])

  // Удаление товара из корзины
  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId))
  }, [])

  // Обновление количества
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems(prev => prev.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ))
  }, [removeFromCart])

  // Очистка корзины
  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Проверка наличия товара
  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId)
  }, [items])

  // Получение количества товара
  const getQuantity = useCallback((productId: string) => {
    const item = items.find(item => item.product.id === productId)
    return item?.quantity || 0
  }, [items])

  // Подсчёт итогов
  const totalItems = calculateCartItemsCount(items)
  const totalAmount = calculateCartTotal(items)

  // Состояние корзины для передачи в конструктор
  const cartState: CartState = {
    items,
    totalItems,
    totalAmount
  }

  return {
    items,
    totalItems,
    totalAmount,
    isLoaded,
    cartState,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getQuantity
  }
}

export default useProductCart
