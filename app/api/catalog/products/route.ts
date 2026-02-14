import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { z } from "zod"

/**
 * Unified products API
 *
 * GET /api/catalog/products
 *
 * Query params:
 * - cursor: string (optional) — cursor for next page (base64-encoded)
 * - limit: number (default 50, max 100)
 * - supplier_type: 'verified' | 'user' (default 'verified')
 * - category: string (optional) — filter by category name
 * - subcategory: string (optional) — filter by subcategory_id
 * - search: string (optional) — text search in name/description
 * - supplier_id: string (optional) — filter by supplier
 * - in_stock: 'true' (optional) — only in-stock products
 * - sort: 'created_at' | 'price' | 'name' (default 'created_at')
 * - order: 'asc' | 'desc' (default 'desc')
 * - min_price: number (optional)
 * - max_price: number (optional)
 *
 * Returns: { success, products, nextCursor, hasMore, meta }
 */

// Cursor validation
const CursorDataSchema = z.object({
  lastId: z.string().uuid(),
  lastCreatedAt: z.string().datetime()
})

type CursorData = z.infer<typeof CursorDataSchema>

const ALLOWED_SORT_FIELDS = ['created_at', 'price', 'name'] as const
type SortField = typeof ALLOWED_SORT_FIELDS[number]

function sanitizeSearch(search: string): string {
  return search
    .replace(/[%_\\'"();]/g, ' ')
    .trim()
    .slice(0, 100)
}

function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
    const result = CursorDataSchema.safeParse(decoded)
    if (!result.success) return null
    return result.data
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const supplierType = searchParams.get('supplier_type') || 'verified'
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const search = searchParams.get('search')
    const supplierId = searchParams.get('supplier_id')
    const inStock = searchParams.get('in_stock')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const supplierCountry = searchParams.get('supplier_country')

    // Sort params
    const sortParam = searchParams.get('sort') || searchParams.get('sort_field')
    const orderParam = searchParams.get('order') || searchParams.get('sort_order')
    const sortField: SortField = ALLOWED_SORT_FIELDS.includes(sortParam as SortField)
      ? (sortParam as SortField)
      : 'created_at'
    const sortOrder: 'asc' | 'desc' = orderParam === 'asc' ? 'asc' : 'desc'

    // Auth for user products
    let userId: string | null = null
    if (supplierType === 'user') {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        userId = user.id
      } else {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        userId = user.id
      }
    }

    const tableName = supplierType === 'verified'
      ? 'catalog_verified_products'
      : 'catalog_user_products'

    let query = supabase
      .from(tableName)
      .select('*')
      .eq('is_active', true)
      .order(sortField, { ascending: sortOrder === 'asc' })
      .order('id', { ascending: false })
      .limit(limit + 1) // +1 to detect hasMore

    // Cursor-based keyset pagination
    if (cursor) {
      const cursorData = decodeCursor(cursor)
      if (cursorData) {
        query = query.or(
          `created_at.lt.${cursorData.lastCreatedAt},` +
          `and(created_at.eq.${cursorData.lastCreatedAt},id.lt.${cursorData.lastId})`
        )
      }
    }

    // Filters
    if (category) query = query.eq('category', category)
    if (subcategory) query = query.eq('subcategory_id', subcategory)
    if (inStock === 'true') query = query.eq('in_stock', true)
    if (supplierId) query = query.eq('supplier_id', supplierId)
    if (supplierType === 'user' && userId) query = query.eq('user_id', userId)

    if (minPrice) query = query.gte('price', parseFloat(minPrice))
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice))
    if (supplierCountry) query = query.eq('supplier_country', supplierCountry)

    if (search && search.trim()) {
      const sanitized = sanitizeSearch(search)
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      logger.error(`[API] Products error:`, error)
      return NextResponse.json({
        error: error.message, products: [], nextCursor: null, hasMore: false
      }, { status: 500 })
    }

    const hasMore = data && data.length > limit
    const products = hasMore ? data.slice(0, limit) : (data || [])

    let nextCursor: string | null = null
    if (hasMore && products.length > 0) {
      const last = products[products.length - 1]
      nextCursor = encodeCursor({ lastId: last.id, lastCreatedAt: last.created_at })
    }

    const response = NextResponse.json({
      success: true,
      products,
      nextCursor,
      hasMore,
      meta: {
        count: products.length,
        limit,
        supplierType,
        sortField,
        sortOrder,
        executionTime: Date.now() - startTime
      }
    })

    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response

  } catch (error) {
    logger.error("[API] Products unexpected error:", error)
    return NextResponse.json({
      error: 'Internal server error', products: [], nextCursor: null, hasMore: false
    }, { status: 500 })
  }
}

// POST: Create product
export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

    const requiredFields = ["name", "supplier_id"]
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json({ error: `Поле ${field} обязательно` }, { status: 400 })
      }
    }

    const supplier_type = productData.supplier_type || "user"
    const tableName = supplier_type === "verified" ? "catalog_verified_products" : "catalog_user_products"
    const { supplier_type: _, ...cleanProductData } = productData

    if (supplier_type === "user" && !cleanProductData.user_id) {
      const { data: supplier } = await supabase
        .from("catalog_user_suppliers")
        .select("user_id")
        .eq("id", cleanProductData.supplier_id)
        .single()
      if (supplier) cleanProductData.user_id = supplier.user_id
    }

    if (!cleanProductData.category) {
      const { data: supplier } = await supabase
        .from(supplier_type === "verified" ? "catalog_verified_suppliers" : "catalog_user_suppliers")
        .select("category")
        .eq("id", cleanProductData.supplier_id)
        .single()
      cleanProductData.category = supplier?.category || "Без категории"
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert([cleanProductData])
      .select()
      .single()

    if (error) {
      logger.error(`[API] Create product error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    logger.error("[API] Create product unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH: Update product
export async function PATCH(request: NextRequest) {
  try {
    const { id, supplier_type, ...updateData } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Поле id обязательно" }, { status: 400 })
    }

    const tableName = supplier_type === "verified" ? "catalog_verified_products" : "catalog_user_products"
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logger.error(`[API] Update product error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    logger.error("[API] Update product unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { id, supplier_type } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Поле id обязательно" }, { status: 400 })
    }

    const tableName = supplier_type === "verified" ? "catalog_verified_products" : "catalog_user_products"
    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logger.error(`[API] Delete product error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    logger.error("[API] Delete product unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
