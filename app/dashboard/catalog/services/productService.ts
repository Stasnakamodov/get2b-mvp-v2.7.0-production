/**
 * Service layer для работы с товарами
 * Содержит бизнес-логику и комплексные операции с продуктами
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/supplierConfig'

export interface Product {
  id: number
  name: string
  description?: string
  price: number
  price_original?: number
  currency: string
  category: string
  subcategory?: string
  supplier_id?: number
  sku?: string
  barcode?: string
  in_stock: boolean
  stock_quantity?: number
  min_order_quantity?: number
  images?: string[]
  specifications?: any
  tags?: string[]
  rating?: number
  reviews_count?: number
  created_at: string
  updated_at: string
  is_verified: boolean
  marketplace_url?: string
  marketplace?: string
}

export interface ProductFormData {
  name: string
  description?: string
  price: number
  price_original?: number
  currency?: string
  category: string
  subcategory?: string
  supplier_id?: number
  sku?: string
  barcode?: string
  in_stock?: boolean
  stock_quantity?: number
  min_order_quantity?: number
  images?: string[]
  specifications?: Record<string, any>
  tags?: string[]
  marketplace_url?: string
  marketplace?: string
}

export interface ProductSearchParams {
  query?: string
  category?: string
  subcategory?: string
  supplier_id?: number
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isVerified?: boolean
  tags?: string[]
  sortBy?: 'name' | 'price' | 'rating' | 'created' | 'stock'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ProductStatistics {
  totalProducts: number
  verifiedProducts: number
  inStockProducts: number
  categories: { name: string; count: number }[]
  priceRange: { min: number; max: number; avg: number }
  topProducts: Product[]
}

export interface CartItem {
  product: Product
  quantity: number
  totalPrice: number
}

class ProductService {
  private supabase = createClientComponentClient()

  /**
   * Validate product data
   */
  validateProduct(data: ProductFormData): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    // Required fields
    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters'
    }

    if (!data.category) {
      errors.category = 'Category is required'
    }

    if (data.price === undefined || data.price < 0) {
      errors.price = 'Price must be a positive number'
    }

    // Optional field validation
    if (data.stock_quantity !== undefined && data.stock_quantity < 0) {
      errors.stock_quantity = 'Stock quantity cannot be negative'
    }

    if (data.min_order_quantity !== undefined && data.min_order_quantity < 1) {
      errors.min_order_quantity = 'Minimum order quantity must be at least 1'
    }

    if (data.marketplace_url && !this.isValidUrl(data.marketplace_url)) {
      errors.marketplace_url = 'Invalid marketplace URL'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  /**
   * Create a new product
   */
  async createProduct(data: ProductFormData): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      // Validate
      const validation = this.validateProduct(data)
      if (!validation.isValid) {
        return {
          success: false,
          error: ERROR_MESSAGES.VALIDATION_ERROR
        }
      }

      // Extract subcategory from specifications if not provided
      let subcategory = data.subcategory
      if (!subcategory && data.specifications?.subcategory) {
        subcategory = data.specifications.subcategory
      }

      // Prepare data
      const productData = {
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        price_original: data.price_original?.toString(),
        currency: data.currency || 'USD',
        category: data.category,
        supplier_id: data.supplier_id,
        sku: data.sku,
        barcode: data.barcode,
        in_stock: data.in_stock !== false,
        stock_quantity: data.stock_quantity,
        min_order_quantity: data.min_order_quantity || 1,
        images: JSON.stringify(data.images || []),
        specifications: JSON.stringify({
          ...data.specifications,
          subcategory
        }),
        tags: JSON.stringify(data.tags || []),
        is_verified: false,
        marketplace_url: data.marketplace_url,
        marketplace: data.marketplace || this.extractMarketplace(data.marketplace_url),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Insert
      const { data: newProduct, error } = await this.supabase
        .from('catalog_verified_products')
        .insert(productData)
        .select()
        .single()

      if (error) {
        console.error('Error creating product:', error)
        return {
          success: false,
          error: error.message
        }
      }

      // Update supplier product count if supplier_id is provided
      if (data.supplier_id) {
        await this.updateSupplierProductCount(data.supplier_id)
      }

      return {
        success: true,
        product: this.formatProduct(newProduct)
      }
    } catch (err) {
      console.error('Error in createProduct:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : ERROR_MESSAGES.SERVER_ERROR
      }
    }
  }

  /**
   * Search products with filters
   */
  async searchProducts(params: ProductSearchParams): Promise<{ products: Product[]; total: number }> {
    try {
      let query = this.supabase
        .from('catalog_verified_products')
        .select('*', { count: 'exact' })

      // Apply filters
      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`)
      }

      if (params.category) {
        query = query.eq('category', params.category)
      }

      if (params.supplier_id) {
        query = query.eq('supplier_id', params.supplier_id)
      }

      if (params.inStock !== undefined) {
        query = query.eq('in_stock', params.inStock)
      }

      if (params.isVerified !== undefined) {
        query = query.eq('is_verified', params.isVerified)
      }

      if (params.minPrice !== undefined) {
        query = query.gte('price', params.minPrice.toString())
      }

      if (params.maxPrice !== undefined) {
        query = query.lte('price', params.maxPrice.toString())
      }

      // Filter by subcategory in specifications
      if (params.subcategory) {
        // This is a limitation - we need to filter on the client side
        // Or use a computed column in the database
      }

      // Apply sorting
      const sortColumn = {
        name: 'name',
        price: 'price',
        rating: 'rating',
        created: 'created_at',
        stock: 'stock_quantity'
      }[params.sortBy || 'name']

      query = query.order(sortColumn, { ascending: params.sortOrder !== 'desc' })

      // Apply pagination
      const page = params.page || 1
      const limit = params.limit || 20
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Error searching products:', error)
        throw error
      }

      // Format products and filter by subcategory if needed
      let products = (data || []).map(p => this.formatProduct(p))

      if (params.subcategory) {
        products = products.filter(p => {
          const specs = this.parseSpecifications(p.specifications)
          return specs.subcategory === params.subcategory
        })
      }

      return {
        products,
        total: count || 0
      }
    } catch (err) {
      console.error('Error in searchProducts:', err)
      return {
        products: [],
        total: 0
      }
    }
  }

  /**
   * Get product statistics
   */
  async getStatistics(): Promise<ProductStatistics> {
    try {
      const { data: products, error } = await this.supabase
        .from('catalog_verified_products')
        .select('*')

      if (error) {
        throw error
      }

      const allProducts = (products || []).map(p => this.formatProduct(p))

      // Calculate category distribution
      const categoryMap = new Map<string, number>()
      allProducts.forEach(p => {
        const count = categoryMap.get(p.category) || 0
        categoryMap.set(p.category, count + 1)
      })

      // Calculate price statistics
      const prices = allProducts.map(p => p.price).filter(p => p > 0)
      const priceRange = {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
        avg: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
      }

      const stats: ProductStatistics = {
        totalProducts: allProducts.length,
        verifiedProducts: allProducts.filter(p => p.is_verified).length,
        inStockProducts: allProducts.filter(p => p.in_stock).length,
        categories: Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })),
        priceRange,
        topProducts: allProducts
          .filter(p => p.is_verified)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)
      }

      return stats
    } catch (err) {
      console.error('Error getting product statistics:', err)
      return {
        totalProducts: 0,
        verifiedProducts: 0,
        inStockProducts: 0,
        categories: [],
        priceRange: { min: 0, max: 0, avg: 0 },
        topProducts: []
      }
    }
  }

  /**
   * Import products from marketplace URL
   */
  async importFromUrl(url: string): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      // Call the import API endpoint
      const response = await fetch('/api/catalog/products/import-from-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      const result = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Import failed'
        }
      }

      return {
        success: true,
        product: result.product
      }
    } catch (err) {
      console.error('Error importing from URL:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Import failed'
      }
    }
  }

  /**
   * Bulk import products
   */
  async bulkImport(products: ProductFormData[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const productData of products) {
      const result = await this.createProduct(productData)
      if (result.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`${productData.name}: ${result.error}`)
      }
    }

    return results
  }

  /**
   * Update product stock
   */
  async updateStock(productId: number, quantity: number, operation: 'set' | 'add' | 'subtract'): Promise<boolean> {
    try {
      // Get current stock
      const { data: product, error: fetchError } = await this.supabase
        .from('catalog_verified_products')
        .select('stock_quantity')
        .eq('id', productId)
        .single()

      if (fetchError || !product) {
        return false
      }

      let newQuantity = quantity
      const currentStock = product.stock_quantity || 0

      if (operation === 'add') {
        newQuantity = currentStock + quantity
      } else if (operation === 'subtract') {
        newQuantity = Math.max(0, currentStock - quantity)
      }

      // Update stock
      const { error: updateError } = await this.supabase
        .from('catalog_verified_products')
        .update({
          stock_quantity: newQuantity,
          in_stock: newQuantity > 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (updateError) {
        console.error('Error updating stock:', updateError)
        return false
      }

      return true
    } catch (err) {
      console.error('Error in updateStock:', err)
      return false
    }
  }

  /**
   * Verify product (mark as verified)
   */
  async verifyProduct(productId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('catalog_verified_products')
        .update({
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) {
        console.error('Error verifying product:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Error in verifyProduct:', err)
      return false
    }
  }

  /**
   * Calculate cart totals
   */
  calculateCartTotals(items: CartItem[]): { subtotal: number; tax: number; total: number; itemCount: number } {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const tax = subtotal * 0.1 // 10% tax rate - should be configurable
    const total = subtotal + tax
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      subtotal,
      tax,
      total,
      itemCount
    }
  }

  /**
   * Check product availability
   */
  async checkAvailability(productId: number, quantity: number): Promise<{ available: boolean; message?: string }> {
    try {
      const { data: product, error } = await this.supabase
        .from('catalog_verified_products')
        .select('in_stock, stock_quantity, min_order_quantity')
        .eq('id', productId)
        .single()

      if (error || !product) {
        return {
          available: false,
          message: 'Product not found'
        }
      }

      if (!product.in_stock) {
        return {
          available: false,
          message: 'Product is out of stock'
        }
      }

      if (product.stock_quantity !== null && product.stock_quantity < quantity) {
        return {
          available: false,
          message: `Only ${product.stock_quantity} items available`
        }
      }

      if (product.min_order_quantity && quantity < product.min_order_quantity) {
        return {
          available: false,
          message: `Minimum order quantity is ${product.min_order_quantity}`
        }
      }

      return {
        available: true
      }
    } catch (err) {
      console.error('Error checking availability:', err)
      return {
        available: false,
        message: 'Error checking availability'
      }
    }
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: number, limit: number = 5): Promise<Product[]> {
    try {
      // Get the product to find related ones
      const { data: product, error: productError } = await this.supabase
        .from('catalog_verified_products')
        .select('category, specifications')
        .eq('id', productId)
        .single()

      if (productError || !product) {
        return []
      }

      // Find products in the same category
      const { data: related, error: relatedError } = await this.supabase
        .from('catalog_verified_products')
        .select('*')
        .eq('category', product.category)
        .neq('id', productId)
        .eq('is_verified', true)
        .limit(limit)

      if (relatedError) {
        console.error('Error loading related products:', relatedError)
        return []
      }

      return (related || []).map(p => this.formatProduct(p))
    } catch (err) {
      console.error('Error in getRelatedProducts:', err)
      return []
    }
  }

  // Helper methods

  private formatProduct(data: any): Product {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: parseFloat(data.price || '0'),
      price_original: data.price_original ? parseFloat(data.price_original) : undefined,
      currency: data.currency || 'USD',
      category: data.category,
      subcategory: this.extractSubcategory(data.specifications),
      supplier_id: data.supplier_id,
      sku: data.sku,
      barcode: data.barcode,
      in_stock: data.in_stock,
      stock_quantity: data.stock_quantity,
      min_order_quantity: data.min_order_quantity,
      images: this.parseImages(data.images),
      specifications: this.parseSpecifications(data.specifications),
      tags: this.parseTags(data.tags),
      rating: data.rating,
      reviews_count: data.reviews_count,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_verified: data.is_verified,
      marketplace_url: data.marketplace_url,
      marketplace: data.marketplace
    }
  }

  private parseImages(images: any): string[] {
    if (!images) return []
    if (typeof images === 'string') {
      try {
        return JSON.parse(images)
      } catch {
        return [images]
      }
    }
    return Array.isArray(images) ? images : []
  }

  private parseSpecifications(specs: any): any {
    if (!specs) return {}
    if (typeof specs === 'string') {
      try {
        return JSON.parse(specs)
      } catch {
        return {}
      }
    }
    return specs
  }

  private parseTags(tags: any): string[] {
    if (!tags) return []
    if (typeof tags === 'string') {
      try {
        return JSON.parse(tags)
      } catch {
        return []
      }
    }
    return Array.isArray(tags) ? tags : []
  }

  private extractSubcategory(specifications: any): string | undefined {
    const specs = this.parseSpecifications(specifications)
    return specs.subcategory || specs.subCategory || specs.sub_category
  }

  private extractMarketplace(url?: string): string | undefined {
    if (!url) return undefined

    const marketplaces = [
      { pattern: /aliexpress/i, name: 'AliExpress' },
      { pattern: /amazon/i, name: 'Amazon' },
      { pattern: /ebay/i, name: 'eBay' },
      { pattern: /alibaba/i, name: 'Alibaba' },
      { pattern: /wildberries/i, name: 'Wildberries' },
      { pattern: /ozon/i, name: 'Ozon' }
    ]

    for (const { pattern, name } of marketplaces) {
      if (pattern.test(url)) {
        return name
      }
    }

    return 'Other'
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private async updateSupplierProductCount(supplierId: number): Promise<void> {
    try {
      const { count, error } = await this.supabase
        .from('catalog_verified_products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)

      if (!error && count !== null) {
        await this.supabase
          .from('suppliers')
          .update({
            total_products: count,
            updated_at: new Date().toISOString()
          })
          .eq('id', supplierId)
      }
    } catch (err) {
      console.error('Error updating supplier product count:', err)
    }
  }
}

// Export singleton instance
export const productService = new ProductService()