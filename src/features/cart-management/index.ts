/**
 * FSD: features/cart-management - Управление корзиной покупок
 *
 * Извлечено из features/supplier-management для соблюдения
 * принципа единственной ответственности (SRP)
 */

// Экспорт Provider и хука
export { CartProvider, useCart } from './providers/CartProvider'

// Экспорт типов
export type {
  CartItem,
  CartState,
  CartActions,
  UseCartResult
} from './model/types'
