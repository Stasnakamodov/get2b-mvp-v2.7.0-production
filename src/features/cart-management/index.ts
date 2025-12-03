/**
 * FSD: features/cart-management - Управление корзиной покупок
 *
 * Извлечено из features/supplier-management для соблюдения
 * принципа единственной ответственности (SRP)
 */

// Экспорт хука
export { useCart } from './hooks/useCart'

// Экспорт типов
export type {
  CartItem,
  CartState,
  CartActions,
  UseCartResult
} from './model/types'
