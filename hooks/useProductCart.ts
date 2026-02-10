'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CatalogProduct, CartItem, CartState } from '@/lib/catalog/types'
import { CART_STORAGE_KEY, MAX_CART_ITEMS } from '@/lib/catalog/constants'
import { calculateCartTotal, calculateCartItemsCount } from '@/lib/catalog/utils'

// Debounce timeout для предотвращения множественных быстрых добавлений
const ADD_TO_CART_DEBOUNCE_MS = 300

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

  // Ref для отслеживания товаров в процессе добавления (debounce)
  const addingProductsRef = useRef<Set<string>>(new Set())

  // Загрузка из localStorage при монтировании + миграция старого ключа
  useEffect(() => {
    try {
      // Migrate from old key if new key is empty
      const OLD_CART_KEY = 'catalog_cart'
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (!stored) {
        const oldStored = localStorage.getItem(OLD_CART_KEY)
        if (oldStored) {
          try {
            const oldParsed = JSON.parse(oldStored)
            // Old format: array of products with id, name, price, quantity directly
            const migrated = oldParsed.map((item: any) => ({
              product: {
                id: item.id,
                name: item.name,
                price: typeof item.price === 'string'
                  ? parseFloat(item.price.replace(/[^0-9.-]+/g, ''))
                  : item.price,
                currency: 'RUB',
                category: item.category || '',
                in_stock: true,
                images: item.images || [],
                supplier_id: item.supplier_id || '',
                supplier_name: item.supplier_name || '',
                created_at: new Date().toISOString(),
              },
              quantity: item.quantity || 1,
              addedAt: new Date(),
            }))
            setItems(migrated)
            localStorage.removeItem(OLD_CART_KEY)
          } catch {
            // Old data corrupt, ignore
          }
        }
      } else {
        const parsed = JSON.parse(stored)
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

  // Добавление товара в корзину с debounce
  const addToCart = useCallback((product: CatalogProduct, quantity: number = 1) => {
    // Проверяем debounce - не добавляем если товар уже в процессе добавления
    if (addingProductsRef.current.has(product.id)) {
      return
    }

    // Блокируем повторное добавление
    addingProductsRef.current.add(product.id)

    // Снимаем блокировку через debounce timeout
    setTimeout(() => {
      addingProductsRef.current.delete(product.id)
    }, ADD_TO_CART_DEBOUNCE_MS)

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
