'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CatalogProduct, CartItem, CartState, ProductVariant } from '@/lib/catalog/types'
import { CART_STORAGE_KEY, MAX_CART_ITEMS } from '@/lib/catalog/constants'
import { calculateCartTotal, calculateCartItemsCount } from '@/lib/catalog/utils'
import { supabase } from '@/lib/supabaseClient'
import { useServerCart } from './useServerCart'
import { useToast } from '@/components/ui/use-toast'

const ADD_TO_CART_DEBOUNCE_MS = 300

/**
 * Dual-mode cart hook:
 * - If user is authenticated → delegates to useServerCart (server-side persistence)
 * - If anonymous → uses localStorage (existing behavior)
 * - On login transition → auto-merges localStorage into server cart, then clears local
 *
 * Public API stays identical — no changes needed in consuming components.
 */
export function useProductCart() {
  const [localItems, setLocalItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const addingProductsRef = useRef<Set<string>>(new Set())
  const hasMergedRef = useRef(false)
  const { toast } = useToast()

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAuthenticated = !!userId
  const serverCart = useServerCart(isAuthenticated)

  // Load from localStorage
  useEffect(() => {
    try {
      const OLD_CART_KEY = 'catalog_cart'
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (!stored) {
        const oldStored = localStorage.getItem(OLD_CART_KEY)
        if (oldStored) {
          try {
            const oldParsed = JSON.parse(oldStored)
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
            setLocalItems(migrated)
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
        setLocalItems(restoredItems)
      }
    } catch {
      // localStorage read failed
    }
    setIsLoaded(true)
  }, [])

  // Save localStorage items
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localItems))
      } catch {
        // localStorage write failed
      }
    }
  }, [localItems, isLoaded])

  // Auto-merge localStorage → server on login
  useEffect(() => {
    if (isAuthenticated && isLoaded && localItems.length > 0 && !hasMergedRef.current) {
      hasMergedRef.current = true
      serverCart.mergeLocalCart(localItems)
      // Clear local cart after merge
      setLocalItems([])
      try { localStorage.removeItem(CART_STORAGE_KEY) } catch {}
    }
  }, [isAuthenticated, isLoaded, localItems, serverCart])

  // Reset merge flag on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasMergedRef.current = false
    }
  }, [isAuthenticated])

  // ---- Unified API ----

  const items = isAuthenticated ? serverCart.items : localItems

  const addToCart = useCallback((product: CatalogProduct, quantity: number = 1, variant?: ProductVariant) => {
    if (isAuthenticated) {
      serverCart.addToCart(product, quantity, variant)
      toast({
        title: 'Добавлено в корзину',
        description: product.name,
      })
      return
    }

    // Local mode with debounce
    if (addingProductsRef.current.has(product.id)) return
    addingProductsRef.current.add(product.id)
    setTimeout(() => { addingProductsRef.current.delete(product.id) }, ADD_TO_CART_DEBOUNCE_MS)

    setLocalItems(prev => {
      if (prev.length >= MAX_CART_ITEMS) {
        toast({ title: 'Корзина полна', description: `Максимум ${MAX_CART_ITEMS} товаров`, variant: 'destructive' })
        return prev
      }
      const existingIndex = prev.findIndex(item => item.product.id === product.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + quantity }
        return updated
      }
      return [...prev, { product, quantity, addedAt: new Date(), variant }]
    })
    toast({
      title: 'Добавлено в корзину',
      description: product.name,
    })
  }, [isAuthenticated, serverCart, toast])

  const removeFromCart = useCallback((productId: string) => {
    if (isAuthenticated) {
      serverCart.removeFromCart(productId)
      return
    }
    setLocalItems(prev => prev.filter(item => item.product.id !== productId))
  }, [isAuthenticated, serverCart])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    if (isAuthenticated) {
      serverCart.updateQuantity(productId, quantity)
      return
    }
    setLocalItems(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ))
  }, [isAuthenticated, serverCart, removeFromCart])

  const clearCart = useCallback(() => {
    if (isAuthenticated) {
      serverCart.clearCart()
      return
    }
    setLocalItems([])
  }, [isAuthenticated, serverCart])

  const isInCart = useCallback((productId: string) => {
    if (isAuthenticated) return serverCart.isInCart(productId)
    return localItems.some(item => item.product.id === productId)
  }, [isAuthenticated, serverCart, localItems])

  const getQuantity = useCallback((productId: string) => {
    if (isAuthenticated) return serverCart.getQuantity(productId)
    const item = localItems.find(item => item.product.id === productId)
    return item?.quantity || 0
  }, [isAuthenticated, serverCart, localItems])

  const totalItems = calculateCartItemsCount(items)
  const totalAmount = calculateCartTotal(items)

  const cartState: CartState = { items, totalItems, totalAmount }

  return {
    items,
    totalItems,
    totalAmount,
    isLoaded: isAuthenticated ? !serverCart.isLoading : isLoaded,
    cartState,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getQuantity,
  }
}

export default useProductCart
