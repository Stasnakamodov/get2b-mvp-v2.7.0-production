'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { CartItem, CatalogProduct } from '@/lib/catalog/types'
import { CART_STORAGE_KEY } from '@/lib/catalog/constants'

interface CatalogCartImportResult {
  /** Товары из корзины каталога */
  cartItems: CartItem[]
  /** Был ли импорт из каталога */
  hasImportedFromCatalog: boolean
  /** Загрузка завершена */
  isLoaded: boolean
  /** Данные для шага 2 конструктора */
  step2Data: {
    supplier: string
    currency: string
    items: Array<{
      item_name: string
      quantity: number
      price: number
      unit: string
      total: number
      supplier_name?: string
      supplier_id?: string
      product_id?: string
      category?: string
      images?: string[]
    }>
  } | null
  /** Очистить данные корзины после использования */
  clearCatalogCart: () => void
  /** Общая сумма */
  totalAmount: number
  /** Количество товаров */
  totalItems: number
}

/**
 * Хук для импорта товаров из корзины каталога в конструктор проектов
 *
 * Использование:
 * 1. Пользователь добавляет товары в корзину каталога
 * 2. Нажимает "Создать проект"
 * 3. Переходит в конструктор с ?fromCatalog=true
 * 4. Хук читает данные из localStorage и преобразует в формат шага 2
 *
 * @example
 * const { step2Data, hasImportedFromCatalog, clearCatalogCart } = useCatalogCartImport()
 *
 * useEffect(() => {
 *   if (hasImportedFromCatalog && step2Data) {
 *     setManualData(prev => ({ ...prev, 2: step2Data }))
 *     clearCatalogCart()
 *   }
 * }, [hasImportedFromCatalog, step2Data])
 */
export function useCatalogCartImport(): CatalogCartImportResult {
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasImportedFromCatalog, setHasImportedFromCatalog] = useState(false)

  // Проверяем URL параметр
  const fromCatalog = searchParams?.get('fromCatalog') === 'true'

  // Загружаем данные из localStorage при монтировании
  useEffect(() => {
    if (!fromCatalog) {
      setIsLoaded(true)
      return
    }

    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Восстанавливаем даты с типизацией
        const items: CartItem[] = parsed.map((item: { product: CatalogProduct; quantity: number; addedAt: string }) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }))
        setCartItems(items)
        setHasImportedFromCatalog(items.length > 0)
        // items loaded from catalog cart
      }
    } catch (e) {
      // localStorage read failed, ignore
    }

    setIsLoaded(true)
  }, [fromCatalog])

  // Преобразование в формат шага 2
  const step2Data = cartItems.length > 0 ? {
    supplier: cartItems[0]?.product.supplier_name || 'Каталог Get2B',
    currency: cartItems[0]?.product.currency || 'RUB',
    items: cartItems.map(item => ({
      item_name: item.product.name,
      quantity: item.quantity,
      price: item.product.price || 0,
      unit: 'шт',
      total: (item.product.price || 0) * item.quantity,
      supplier_name: item.product.supplier_name,
      supplier_id: item.product.supplier_id,
      product_id: item.product.id,
      category: item.product.category,
      images: item.product.images?.map(img =>
        typeof img === 'string' ? img : 'url' in img ? img.url : ''
      ).filter(Boolean)
    }))
  } : null

  // Подсчёт итогов
  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + (item.product.price || 0) * item.quantity
  }, 0)

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Очистка корзины (только флаг импорта, корзина остаётся для повторного использования)
  const clearCatalogCart = useCallback(() => {
    try {
      setHasImportedFromCatalog(false)
    } catch {
    }
  }, [])

  return {
    cartItems,
    hasImportedFromCatalog,
    isLoaded,
    step2Data,
    clearCatalogCart,
    totalAmount,
    totalItems
  }
}

export default useCatalogCartImport
