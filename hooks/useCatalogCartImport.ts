'use client'
import { db } from "@/lib/db/client"

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { CartItem, CatalogProduct } from '@/lib/catalog/types'
import { CART_STORAGE_KEY } from '@/lib/catalog/constants'

interface CatalogCartImportResult {
  cartItems: CartItem[]
  hasImportedFromCatalog: boolean
  isLoaded: boolean
  step2Data: {
    supplier: string
    currency: string
    items: Array<{
      name: string
      code: string
      quantity: number
      price: number
      unit: string
      total: number
      supplier_name?: string
      supplier_id?: string
      image_url?: string
      catalog_product_id?: string
      catalog_product_source?: string
      category?: string
      subcategory?: string
      currency?: string
    }>
  } | null
  clearCatalogCart: () => void
  totalAmount: number
  totalItems: number
}

/**
 * Hook for importing cart items into the project constructor.
 * Reads from server cart when authenticated, localStorage otherwise.
 */
export function useCatalogCartImport(): CatalogCartImportResult {
  const searchParams = useSearchParams()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasImportedFromCatalog, setHasImportedFromCatalog] = useState(false)

  const fromCatalog = searchParams?.get('fromCatalog') === 'true'

  useEffect(() => {
    if (!fromCatalog) {
      setIsLoaded(true)
      return
    }

    async function loadCart() {
      // Try server cart first if authenticated
      try {
        const { data: { user } } = await db.auth.getUser()
        if (user) {
          const response = await fetch('/api/catalog/cart')
          if (response.ok) {
            const json = await response.json()
            const serverItems = json.cart?.items || []
            if (serverItems.length > 0) {
              const items: CartItem[] = serverItems
                .filter((item: any) => item.product)
                .map((item: any) => ({
                  product: item.product as CatalogProduct,
                  quantity: item.quantity,
                  addedAt: new Date(item.added_at),
                }))
              setCartItems(items)
              setHasImportedFromCatalog(items.length > 0)
              setIsLoaded(true)
              return
            }
          }
        }
      } catch {
        // Fall through to localStorage
      }

      // Fallback: localStorage
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          const items: CartItem[] = parsed.map((item: { product: CatalogProduct; quantity: number; addedAt: string }) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }))
          setCartItems(items)
          setHasImportedFromCatalog(items.length > 0)
        }
      } catch {
        // localStorage read failed
      }
      setIsLoaded(true)
    }

    loadCart()
  }, [fromCatalog])

  const step2Data = cartItems.length > 0 ? {
    supplier: cartItems[0]?.product.supplier_name || 'Каталог Get2B',
    currency: cartItems[0]?.product.currency || 'RUB',
    items: cartItems.map(item => {
      const variantSuffix = item.variant
        ? ` (${Object.values(item.variant.attributes).join(', ')})`
        : ''
      const itemPrice = (item.variant?.price ?? item.product.price) || 0
      const firstImage = item.product.images?.[0]
      const imageUrl = firstImage
        ? (typeof firstImage === 'string' ? firstImage : 'url' in firstImage ? firstImage.url : '')
        : ''
      return {
        name: item.product.name + variantSuffix,
        code: item.product.sku || '',
        quantity: item.quantity,
        price: itemPrice,
        unit: 'шт',
        total: itemPrice * item.quantity,
        supplier_name: item.product.supplier_name,
        supplier_id: item.product.supplier_id,
        image_url: imageUrl,
        catalog_product_id: item.product.id,
        catalog_product_source: 'verified' as const,
        category: item.product.category,
        subcategory: item.product.subcategory,
        currency: item.product.currency || 'RUB',
      }
    })
  } : null

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + ((item.variant?.price ?? item.product.price) || 0) * item.quantity
  }, 0)

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const clearCatalogCart = useCallback(() => {
    setHasImportedFromCatalog(false)
    setCartItems([])
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch {
      // localStorage may not be available
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
