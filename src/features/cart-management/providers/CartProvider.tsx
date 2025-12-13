/**
 * Context Provider для глобального состояния корзины
 * FSD: features/cart-management/providers
 */

'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { Product } from '@/src/entities/product'
import type { CartItem, UseCartResult } from '../model/types'
import { logger } from '@/src/shared/lib'

// Создаем контекст
const CartContext = createContext<UseCartResult | undefined>(undefined)

interface CartProviderProps {
  children: ReactNode
}

/**
 * Provider для управления глобальным состоянием корзины
 */
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  /**
   * Загрузка корзины из localStorage при монтировании
   */
  // Функция загрузки данных из localStorage
  const loadFromLocalStorage = useCallback(() => {
    const savedCart = localStorage.getItem('catalog_cart')
    const savedSupplier = localStorage.getItem('catalog_active_supplier')


    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)

        // Проверяем структуру данных
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          // Убеждаемся, что каждый элемент имеет поле quantity
          const validCart = parsedCart.map(item => ({
            ...item,
            quantity: item.quantity || 1
          }))
          setCart(validCart)
          logger.info(`✅ Корзина загружена из localStorage: ${validCart.length} товаров, общее количество: ${validCart.reduce((sum, item) => sum + item.quantity, 0)}`)
        } else if (parsedCart.length === 0) {
          setCart([])
          logger.info('📭 Корзина пуста')
        }
      } catch (error) {
        logger.error('❌ Ошибка загрузки корзины из localStorage:', error)
        localStorage.removeItem('catalog_cart') // Очищаем поврежденные данные
        setCart([])
      }
    } else {
      setCart([])
      logger.info('📭 Корзина пуста (нет сохраненных данных)')
    }

    if (savedSupplier) {
      setActiveSupplier(savedSupplier)
    } else {
      setActiveSupplier(null)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsInitialized(true)
      return
    }

    // Загружаем данные при инициализации
    loadFromLocalStorage()
    setIsInitialized(true)

    // Слушаем изменения localStorage из других вкладок
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'catalog_cart' || e.key === 'catalog_active_supplier') {
        loadFromLocalStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [loadFromLocalStorage])

  /**
   * Сохранение корзины в localStorage
   */
  useEffect(() => {
    // Не сохраняем, пока не инициализировано (чтобы не перезаписать данные при первой загрузке)
    if (!isInitialized || typeof window === 'undefined') return

    const cartToSave = cart.map(item => ({
      ...item,
      quantity: item.quantity || 1 // Гарантируем наличие quantity
    }))

    const serialized = JSON.stringify(cartToSave)
    localStorage.setItem('catalog_cart', serialized)

    logger.debug(`💾 Корзина сохранена в localStorage: ${cart.length} товаров, общее количество: ${cart.reduce((sum, item) => sum + item.quantity, 0)}`)
  }, [cart, isInitialized])

  /**
   * Сохранение активного поставщика
   */
  useEffect(() => {
    // Не сохраняем, пока не инициализировано
    if (!isInitialized || typeof window === 'undefined') return

    if (activeSupplier) {
      localStorage.setItem('catalog_active_supplier', activeSupplier)
    } else {
      localStorage.removeItem('catalog_active_supplier')
    }
  }, [activeSupplier, isInitialized])

  /**
   * Добавление товара в корзину
   */
  const addToCart = useCallback((product: Product, quantity: number = 1): boolean => {
    const supplierId = product.supplier_id

    // Если корзина пустая или это тот же поставщик
    if (cart.length === 0 || activeSupplier === supplierId) {
      setActiveSupplier(supplierId)

      const existingItem = cart.find(item => item.id === product.id)

      if (existingItem) {
        // Увеличиваем количество
        const newQuantity = existingItem.quantity + quantity
        setCart(prev => prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        ))
        logger.info(`✅ Количество товара увеличено в корзине: ${existingItem.quantity} → ${newQuantity}`)
      } else {
        // Добавляем новый товар
        const newItem: CartItem = { ...product, quantity }
        setCart(prev => [...prev, newItem])
        logger.info(`✅ Товар добавлен в корзину с количеством: ${quantity}`)
      }

      return true
    } else {
      // Другой поставщик
      logger.warn('⚠️ Нельзя добавить товар другого поставщика в корзину')
      return false
    }
  }, [cart, activeSupplier])

  /**
   * Удаление товара из корзины
   */
  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.id !== productId)

      // Если корзина стала пустой, сбрасываем поставщика
      if (newCart.length === 0) {
        setActiveSupplier(null)
      }

      return newCart
    })
    logger.info('✅ Товар удален из корзины')
  }, [])

  /**
   * Изменение количества товара
   */
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(prev => prev.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      ))
    }
  }, [removeFromCart])

  /**
   * Очистка корзины
   */
  const clearCart = useCallback(() => {
    setCart([])
    setActiveSupplier(null)
    logger.info('✅ Корзина очищена')
  }, [])

  /**
   * Расчет общей суммы
   */
  const getTotalAmount = useCallback((): number => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''))
      return sum + (price * item.quantity)
    }, 0)
  }, [cart])

  /**
   * Получение общего количества товаров
   */
  const getTotalItems = useCallback((): number => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const value: UseCartResult = {
    cart,
    items: cart,
    activeSupplier,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

/**
 * Хук для использования контекста корзины
 */
export const useCart = (): UseCartResult => {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
