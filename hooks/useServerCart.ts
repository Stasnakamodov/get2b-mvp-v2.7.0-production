'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CatalogProduct, CartItem, ProductVariant } from '@/lib/catalog/types'
import { useCallback } from 'react'

interface ServerCartResponse {
  cart_id: string | null
  items: Array<{
    id: string
    product_id: string
    quantity: number
    variant_id: string | null
    added_at: string
    product: CatalogProduct | null
  }>
}

/**
 * Hook for server-side cart operations (authenticated users only).
 * Uses React Query with optimistic updates for fast UI.
 */
export function useServerCart(enabled = false) {
  const queryClient = useQueryClient()

  const { data: serverCart, isLoading } = useQuery<ServerCartResponse>({
    queryKey: ['server-cart'],
    queryFn: async () => {
      const response = await fetch('/api/catalog/cart')
      if (!response.ok) throw new Error('Failed to fetch cart')
      const json = await response.json()
      return json.cart
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Convert server items to CartItem format
  const items: CartItem[] = (serverCart?.items || [])
    .filter(item => item.product)
    .map(item => ({
      product: item.product!,
      quantity: item.quantity,
      addedAt: new Date(item.added_at),
      _serverId: item.id, // internal: server item ID for updates
    })) as CartItem[]

  const addMutation = useMutation({
    mutationFn: async ({ product_id, quantity, variant_id }: { product_id: string; quantity: number; variant_id?: string }) => {
      const response = await fetch('/api/catalog/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, quantity, variant_id }),
      })
      if (!response.ok) throw new Error('Failed to add to cart')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-cart'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ item_id, quantity }: { item_id: string; quantity: number }) => {
      const response = await fetch('/api/catalog/cart/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id, quantity }),
      })
      if (!response.ok) throw new Error('Failed to update cart item')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-cart'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async ({ product_id }: { product_id: string }) => {
      const response = await fetch('/api/catalog/cart/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id }),
      })
      if (!response.ok) throw new Error('Failed to remove from cart')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-cart'] })
    },
  })

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/catalog/cart', { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to clear cart')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-cart'] })
    },
  })

  const mergeMutation = useMutation({
    mutationFn: async (localItems: Array<{ product_id: string; quantity: number; variant_id?: string }>) => {
      const response = await fetch('/api/catalog/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: localItems }),
      })
      if (!response.ok) throw new Error('Failed to merge cart')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-cart'] })
    },
  })

  const addToCart = useCallback((product: CatalogProduct, quantity: number, variant?: ProductVariant) => {
    addMutation.mutate({ product_id: product.id, quantity, variant_id: variant?.id })
  }, [addMutation])

  const removeFromCart = useCallback((productId: string) => {
    removeMutation.mutate({ product_id: productId })
  }, [removeMutation])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const serverItem = serverCart?.items.find(i => i.product_id === productId)
    if (serverItem) {
      updateMutation.mutate({ item_id: serverItem.id, quantity })
    }
  }, [serverCart, updateMutation])

  const clearCart = useCallback(() => {
    clearMutation.mutate()
  }, [clearMutation])

  const mergeLocalCart = useCallback((localItems: CartItem[]) => {
    const mapped = localItems.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      variant_id: item.variant?.id,
    }))
    mergeMutation.mutate(mapped)
  }, [mergeMutation])

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId)
  }, [items])

  const getQuantity = useCallback((productId: string) => {
    return items.find(item => item.product.id === productId)?.quantity || 0
  }, [items])

  return {
    items,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    mergeLocalCart,
    isInCart,
    getQuantity,
  }
}
