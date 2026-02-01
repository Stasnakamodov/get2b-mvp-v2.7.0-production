import {
  formatPrice,
  getProductImage,
  formatMinOrder,
  truncateText,
  buildCatalogUrl,
  parseFiltersFromUrl,
  calculateCartTotal,
  calculateCartItemsCount,
  isProductInCart,
  getProductQuantityInCart,
  getGridClass
} from '@/lib/catalog/utils'
import type { CatalogProduct, CartItem, CatalogFilters } from '@/lib/catalog/types'

describe('formatPrice', () => {
  it('formats price with RUB currency', () => {
    expect(formatPrice(1000, 'RUB')).toContain('1')
    expect(formatPrice(1000, 'RUB')).toContain('₽')
  })

  it('formats price with USD currency', () => {
    expect(formatPrice(100, 'USD')).toContain('$')
  })

  it('returns placeholder for undefined price', () => {
    expect(formatPrice(undefined, 'RUB')).toBe('Цена по запросу')
  })

  it('returns placeholder for null price', () => {
    expect(formatPrice(null as unknown as number, 'RUB')).toBe('Цена по запросу')
  })
})

describe('getProductImage', () => {
  it('returns first image URL from array', () => {
    const product: Partial<CatalogProduct> = {
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
    }
    expect(getProductImage(product as CatalogProduct)).toBe('https://example.com/image1.jpg')
  })

  it('returns null for empty images array', () => {
    const product: Partial<CatalogProduct> = { images: [] }
    expect(getProductImage(product as CatalogProduct)).toBeNull()
  })

  it('returns null for undefined images', () => {
    const product: Partial<CatalogProduct> = {}
    expect(getProductImage(product as CatalogProduct)).toBeNull()
  })

  it('returns null for non-http URLs', () => {
    const product: Partial<CatalogProduct> = { images: ['not-a-url'] }
    expect(getProductImage(product as CatalogProduct)).toBeNull()
  })
})

describe('formatMinOrder', () => {
  it('formats number min order', () => {
    expect(formatMinOrder(100)).toBe('от 100 шт')
  })

  it('formats string min order', () => {
    expect(formatMinOrder('50')).toBe('от 50 шт')
  })

  it('returns empty string for undefined', () => {
    expect(formatMinOrder(undefined)).toBe('')
  })

  it('does not double-format already formatted string', () => {
    expect(formatMinOrder('от 10 шт')).toBe('от 10 шт')
  })
})

describe('truncateText', () => {
  it('truncates long text', () => {
    const longText = 'This is a very long text that should be truncated'
    expect(truncateText(longText, 20)).toBe('This is a very long...')
  })

  it('does not truncate short text', () => {
    const shortText = 'Short'
    expect(truncateText(shortText, 20)).toBe('Short')
  })

  it('handles empty string', () => {
    expect(truncateText('', 10)).toBe('')
  })
})

describe('buildCatalogUrl', () => {
  it('builds URL with search filter', () => {
    const filters: CatalogFilters = { search: 'test' }
    const url = buildCatalogUrl('/catalog', filters)
    expect(url).toBe('/catalog?q=test')
  })

  it('builds URL with multiple filters', () => {
    const filters: CatalogFilters = {
      search: 'test',
      category: 'Электроника',
      minPrice: 100,
      maxPrice: 1000
    }
    const url = buildCatalogUrl('/catalog', filters)
    expect(url).toContain('q=test')
    expect(url).toContain('category=%D0%AD%D0%BB%D0%B5%D0%BA%D1%82%D1%80%D0%BE%D0%BD%D0%B8%D0%BA%D0%B0')
    expect(url).toContain('minPrice=100')
    expect(url).toContain('maxPrice=1000')
  })

  it('returns base URL for empty filters', () => {
    const url = buildCatalogUrl('/catalog', {})
    expect(url).toBe('/catalog')
  })
})

describe('parseFiltersFromUrl', () => {
  it('parses search from URL', () => {
    const params = new URLSearchParams('q=test')
    const filters = parseFiltersFromUrl(params)
    expect(filters.search).toBe('test')
  })

  it('parses category from URL', () => {
    const params = new URLSearchParams('category=Electronics')
    const filters = parseFiltersFromUrl(params)
    expect(filters.category).toBe('Electronics')
  })

  it('parses price filters from URL', () => {
    const params = new URLSearchParams('minPrice=100&maxPrice=500')
    const filters = parseFiltersFromUrl(params)
    expect(filters.minPrice).toBe(100)
    expect(filters.maxPrice).toBe(500)
  })

  it('parses inStock filter from URL', () => {
    const params = new URLSearchParams('inStock=true')
    const filters = parseFiltersFromUrl(params)
    expect(filters.inStock).toBe(true)
  })
})

describe('calculateCartTotal', () => {
  it('calculates total for cart items', () => {
    const items: CartItem[] = [
      {
        product: { id: '1', price: 100 } as CatalogProduct,
        quantity: 2,
        addedAt: new Date()
      },
      {
        product: { id: '2', price: 50 } as CatalogProduct,
        quantity: 3,
        addedAt: new Date()
      }
    ]
    expect(calculateCartTotal(items)).toBe(350) // 100*2 + 50*3
  })

  it('returns 0 for empty cart', () => {
    expect(calculateCartTotal([])).toBe(0)
  })

  it('handles products without price', () => {
    const items: CartItem[] = [
      {
        product: { id: '1' } as CatalogProduct,
        quantity: 2,
        addedAt: new Date()
      }
    ]
    expect(calculateCartTotal(items)).toBe(0)
  })
})

describe('calculateCartItemsCount', () => {
  it('calculates total items count', () => {
    const items: CartItem[] = [
      { product: { id: '1' } as CatalogProduct, quantity: 2, addedAt: new Date() },
      { product: { id: '2' } as CatalogProduct, quantity: 3, addedAt: new Date() }
    ]
    expect(calculateCartItemsCount(items)).toBe(5)
  })

  it('returns 0 for empty cart', () => {
    expect(calculateCartItemsCount([])).toBe(0)
  })
})

describe('isProductInCart', () => {
  const items: CartItem[] = [
    { product: { id: '1' } as CatalogProduct, quantity: 1, addedAt: new Date() },
    { product: { id: '2' } as CatalogProduct, quantity: 1, addedAt: new Date() }
  ]

  it('returns true for product in cart', () => {
    expect(isProductInCart(items, '1')).toBe(true)
  })

  it('returns false for product not in cart', () => {
    expect(isProductInCart(items, '3')).toBe(false)
  })
})

describe('getProductQuantityInCart', () => {
  const items: CartItem[] = [
    { product: { id: '1' } as CatalogProduct, quantity: 5, addedAt: new Date() }
  ]

  it('returns quantity for product in cart', () => {
    expect(getProductQuantityInCart(items, '1')).toBe(5)
  })

  it('returns 0 for product not in cart', () => {
    expect(getProductQuantityInCart(items, '2')).toBe(0)
  })
})

describe('getGridClass', () => {
  it('returns correct class for grid-4', () => {
    expect(getGridClass('grid-4')).toContain('lg:grid-cols-4')
  })

  it('returns correct class for grid-3', () => {
    expect(getGridClass('grid-3')).toContain('md:grid-cols-3')
  })

  it('returns correct class for list', () => {
    expect(getGridClass('list')).toContain('flex-col')
  })

  it('returns default for unknown mode', () => {
    expect(getGridClass('unknown')).toContain('lg:grid-cols-4')
  })
})
