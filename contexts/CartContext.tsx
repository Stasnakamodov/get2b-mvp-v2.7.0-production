'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Debounce timeout для предотвращения множественных быстрых добавлений
const ADD_TO_CART_DEBOUNCE_MS = 300

/**
 * CartContext - централизованное управление состоянием корзины
 * Решает проблемы:
 * - Race conditions из-за множества useEffect
 * - Дублирование логики корзины
 * - Отсутствие персистентности
 * - Сложность тестирования
 */

// Типы данных
export interface CartItem {
  id: string
  name: string
  product_name?: string
  price: number
  quantity: number
  total_price: number
  currency: string
  images?: string[]
  supplier_id?: string
  supplier_name?: string
  supplier_company_name?: string
  room_type?: 'verified' | 'user'
  description?: string
  specifications?: Record<string, any>
}

export interface CartContextType {
  // Состояние
  cart: CartItem[]
  totalItems: number
  totalPrice: number
  activeSupplier: string | null
  isCartOpen: boolean

  // Методы
  addToCart: (product: any, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getProductQuantity: (productId: string) => number
  isProductInCart: (productId: string) => boolean
  setCartOpen: (isOpen: boolean) => void
  createProjectFromCart: () => Promise<void>

  // Вспомогательные
  canAddProduct: (product: any) => boolean
  getCartSummary: () => { items: number; price: number; currency: string }
}

// Создаем контекст
const CartContext = createContext<CartContextType | undefined>(undefined)

// Ключ для localStorage
const CART_STORAGE_KEY = 'catalog_cart'
const SUPPLIER_STORAGE_KEY = 'active_supplier'

/**
 * CartProvider - провайдер контекста корзины
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // Основное состояние
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Ref для отслеживания товаров в процессе добавления (debounce)
  const addingProductsRef = useRef<Set<string>>(new Set())

  // Загрузка корзины из localStorage при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY)
        const savedSupplier = localStorage.getItem(SUPPLIER_STORAGE_KEY)

        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          setCart(parsedCart)
        }

        if (savedSupplier) {
          setActiveSupplier(savedSupplier)
        }
      } catch (error) {
        console.error('Ошибка загрузки корзины из localStorage:', error)
      }
    }
  }, [])

  // Сохранение корзины в localStorage при изменении
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (cart.length > 0) {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
        } else {
          localStorage.removeItem(CART_STORAGE_KEY)
        }
      } catch (error) {
        console.error('Ошибка сохранения корзины в localStorage:', error)
      }
    }
  }, [cart])

  // Сохранение активного поставщика
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (activeSupplier) {
          localStorage.setItem(SUPPLIER_STORAGE_KEY, activeSupplier)
        } else {
          localStorage.removeItem(SUPPLIER_STORAGE_KEY)
        }
      } catch (error) {
        console.error('Ошибка сохранения поставщика в localStorage:', error)
      }
    }
  }, [activeSupplier])

  // Вычисляемые значения с мемоизацией
  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total_price, 0)
  }, [cart])

  /**
   * Проверка возможности добавления товара
   */
  const canAddProduct = useCallback((product: any): boolean => {
    if (!product) return false

    // Если корзина пуста - можно добавить любой товар
    if (cart.length === 0) return true

    // Проверяем поставщика
    const productSupplier = product.supplier_name || product.supplier_company_name

    // Если есть активный поставщик, проверяем соответствие
    if (activeSupplier && productSupplier !== activeSupplier) {
      return false
    }

    return true
  }, [cart, activeSupplier])

  /**
   * Добавление товара в корзину с debounce защитой
   */
  const addToCart = useCallback((product: any, quantity: number = 1) => {
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

    // Используем функциональное обновление для избежания race conditions
    setCart(prevCart => {
      // Проверка поставщика внутри функционального обновления
      const productSupplier = product.supplier_name || product.supplier_company_name
      const currentActiveSupplier = prevCart.length > 0
        ? prevCart[0].supplier_name || prevCart[0].supplier_company_name
        : null

      // Если корзина не пуста и поставщик другой - отклоняем
      if (prevCart.length > 0 && currentActiveSupplier && productSupplier !== currentActiveSupplier) {
        // Показываем алерт асинхронно чтобы не блокировать setState
        setTimeout(() => {
          alert(`Можно добавлять товары только от поставщика "${currentActiveSupplier}"`)
        }, 0)
        return prevCart
      }

      const existingItem = prevCart.find(item => item.id === product.id)

      if (existingItem) {
        // Обновляем количество существующего товара
        return prevCart.map(item =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total_price: (item.quantity + quantity) * item.price
              }
            : item
        )
      } else {
        // Добавляем новый товар
        const newItem: CartItem = {
          id: product.id,
          name: product.name || product.product_name || 'Без названия',
          product_name: product.product_name,
          price: parseFloat(product.price) || 0,
          quantity,
          total_price: (parseFloat(product.price) || 0) * quantity,
          currency: product.currency || 'USD',
          images: product.images || [],
          supplier_id: product.supplier_id,
          supplier_name: product.supplier_name,
          supplier_company_name: product.supplier_company_name,
          room_type: product.room_type || 'verified',
          description: product.description,
          specifications: product.specifications
        }

        // Устанавливаем активного поставщика при добавлении первого товара
        if (prevCart.length === 0) {
          const supplier = product.supplier_name || product.supplier_company_name
          if (supplier) {
            setActiveSupplier(supplier)
          }
        }

        return [...prevCart, newItem]
      }
    })
  }, []) // Убрали зависимости - используем functional updates

  /**
   * Удаление товара из корзины
   */
  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== productId)

      // Очищаем активного поставщика если корзина пуста
      if (newCart.length === 0) {
        setActiveSupplier(null)
      }

      return newCart
    })
  }, [])

  /**
   * Обновление количества товара
   */
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? {
              ...item,
              quantity,
              total_price: item.price * quantity
            }
          : item
      )
    )
  }, [removeFromCart])

  /**
   * Очистка корзины
   */
  const clearCart = useCallback(() => {
    setCart([])
    setActiveSupplier(null)
  }, [])

  /**
   * Получение количества конкретного товара
   */
  const getProductQuantity = useCallback((productId: string): number => {
    const item = cart.find(item => item.id === productId)
    return item?.quantity || 0
  }, [cart])

  /**
   * Проверка наличия товара в корзине
   */
  const isProductInCart = useCallback((productId: string): boolean => {
    return cart.some(item => item.id === productId)
  }, [cart])

  /**
   * Управление видимостью корзины
   */
  const setCartOpen = useCallback((isOpen: boolean) => {
    setIsCartOpen(isOpen)
  }, [])

  /**
   * Получение сводки по корзине
   */
  const getCartSummary = useCallback(() => {
    const currency = cart[0]?.currency || 'USD'
    return {
      items: totalItems,
      price: totalPrice,
      currency
    }
  }, [cart, totalItems, totalPrice])

  /**
   * Создание проекта из корзины
   */
  const createProjectFromCart = useCallback(async () => {
    if (cart.length === 0) {
      alert('Корзина пуста')
      return
    }

    try {
      // Сохраняем данные корзины для передачи на страницу создания проекта
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('project_cart', JSON.stringify(cart))
        sessionStorage.setItem('project_supplier', activeSupplier || '')
      }

      // Переходим на страницу создания проекта
      router.push('/dashboard/project-constructor')
    } catch (error) {
      console.error('Ошибка при создании проекта:', error)
      alert('Не удалось создать проект. Попробуйте еще раз.')
    }
  }, [cart, activeSupplier, router])

  // Значение контекста
  const contextValue: CartContextType = {
    // Состояние
    cart,
    totalItems,
    totalPrice,
    activeSupplier,
    isCartOpen,

    // Методы
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getProductQuantity,
    isProductInCart,
    setCartOpen,
    createProjectFromCart,

    // Вспомогательные
    canAddProduct,
    getCartSummary
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

/**
 * Хук для использования контекста корзины
 */
export function useCart() {
  const context = useContext(CartContext)

  if (context === undefined) {
    throw new Error('useCart должен использоваться внутри CartProvider')
  }

  return context
}

/**
 * HOC для компонентов, требующих контекст корзины
 */
export function withCart<P extends object>(
  Component: React.ComponentType<P & { cart: CartContextType }>
) {
  return function CartComponent(props: P) {
    const cart = useCart()
    return <Component {...props} cart={cart} />
  }
}

export default CartContext