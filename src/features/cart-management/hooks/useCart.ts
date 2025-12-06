/**
 * Хук для управления корзиной покупок
 * FSD: features/cart-management/hooks
 *
 * Извлечено из features/supplier-management/hooks/useProducts.ts
 * для соблюдения принципа единственной ответственности
 */

import { useState, useEffect, useCallback } from 'react'
import type { Product } from '@/src/entities/product'
import type { CartItem, UseCartResult } from '../model/types'
import { logger } from '@/src/shared/lib'

/**
 * Хук для работы с корзиной
 *
 * Функциональность:
 * - Добавление/удаление товаров
 * - Изменение количества
 * - Синхронизация с localStorage
 * - Контроль поставщика (товары только от одного поставщика)
 * - Расчет общей суммы и количества товаров
 */
export const useCart = (): UseCartResult => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null)

  /**
   * Загрузка корзины из localStorage при монтировании
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

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
      }
    }

    if (savedSupplier) {
      setActiveSupplier(savedSupplier)
    }
  }, [])

  /**
   * Сохранение корзины в localStorage
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const cartToSave = cart.map(item => ({
      ...item,
      quantity: item.quantity || 1 // Гарантируем наличие quantity
    }))

    const serialized = JSON.stringify(cartToSave)
    localStorage.setItem('catalog_cart', serialized)

    logger.debug(`💾 Корзина сохранена в localStorage: ${cart.length} товаров, общее количество: ${cart.reduce((sum, item) => sum + item.quantity, 0)}`)
  }, [cart])

  /**
   * Сохранение активного поставщика
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (activeSupplier) {
      localStorage.setItem('catalog_active_supplier', activeSupplier)
    } else {
      localStorage.removeItem('catalog_active_supplier')
    }
  }, [activeSupplier])

  /**
   * Добавление товара в корзину
   *
   * @param product - Товар для добавления
   * @param quantity - Количество (по умолчанию 1)
   * @returns true если товар добавлен, false если нельзя добавить (другой поставщик)
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
   *
   * @param productId - ID товара для удаления
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
   *
   * @param productId - ID товара
   * @param quantity - Новое количество (если <= 0, товар удаляется)
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
   *
   * @returns Общая сумма всех товаров в корзине
   */
  const getTotalAmount = useCallback((): number => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''))
      return sum + (price * item.quantity)
    }, 0)
  }, [cart])

  /**
   * Получение общего количества товаров
   *
   * @returns Общее количество товаров (с учетом quantity)
   */
  const getTotalItems = useCallback((): number => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  return {
    cart,
    items: cart, // Alias для совместимости с CartState
    activeSupplier,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalAmount,
    getTotalItems
  }
}
