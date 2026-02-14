'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CatalogProduct, WishlistItem } from '@/lib/catalog/types'
import { WISHLIST_STORAGE_KEY, MAX_WISHLIST_ITEMS } from '@/lib/catalog/constants'

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const restored = parsed.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }))
        setItems(restored)
      }
    } catch {
      // ignore
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
      } catch {
        // ignore
      }
    }
  }, [items, isLoaded])

  const toggleWishlist = useCallback((product: CatalogProduct) => {
    setItems(prev => {
      const exists = prev.some(item => item.product.id === product.id)
      if (exists) {
        return prev.filter(item => item.product.id !== product.id)
      }
      if (prev.length >= MAX_WISHLIST_ITEMS) return prev
      return [...prev, { product, addedAt: new Date() }]
    })
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId))
  }, [])

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId)
  }, [items])

  const clearWishlist = useCallback(() => {
    setItems([])
  }, [])

  return {
    items,
    count: items.length,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
  }
}
