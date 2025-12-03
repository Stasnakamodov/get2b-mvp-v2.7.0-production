/**
 * Типы для фичи управления корзиной
 * FSD: features/cart-management/model
 */

import type { Product } from '@/src/entities/product'

/**
 * Товар в корзине с количеством
 */
export interface CartItem extends Product {
  quantity: number
}

/**
 * Состояние корзины
 */
export interface CartState {
  items: CartItem[]
  activeSupplier: string | null
}

/**
 * Методы управления корзиной
 */
export interface CartActions {
  addToCart: (product: Product, quantity?: number) => boolean
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalAmount: () => number
  getTotalItems: () => number
}

/**
 * Результат хука useCart
 */
export interface UseCartResult extends CartState, CartActions {
  cart: CartItem[]
}
