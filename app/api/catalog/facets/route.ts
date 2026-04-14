import { db } from "@/lib/db"
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/src/shared/lib/logger'

/**
 * GET /api/catalog/facets
 *
 * Returns faceted counts for filters (cross-filter pattern).
 * Each dimension excludes its own filter for accurate counts.
 *
 * Query params match /api/catalog/products filters.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let category = searchParams.get('category') || null
    const subcategory = searchParams.get('subcategory') || null
    const search = searchParams.get('search') || null
    const inStock = searchParams.get('in_stock') === 'true' ? true : null
    const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : null
    const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : null
    const supplierCountry = searchParams.get('supplier_country') || null
    const supplierId = searchParams.get('supplier_id') || null

    // The facet RPC filters by one narrow (level=1) category name. Parent (level=0)
    // names never match any product row, so passing a parent through would zero
    // every facet. Drop the filter in that case — the sidebar still aggregates
    // children counts from the returned facets and renders the correct parent count.
    if (category) {
      const { data: catRow } = await db
        .from('catalog_categories')
        .select('level')
        .eq('name', category)
        .eq('is_active', true)
        .limit(1)
      const row = Array.isArray(catRow) ? catRow[0] : null
      if (row && row.level === 0) {
        category = null
      }
    }

    const { data, error } = await db.rpc('get_product_facets', {
      p_category: category,
      p_subcategory: subcategory,
      p_search: search,
      p_in_stock: inStock,
      p_min_price: minPrice,
      p_max_price: maxPrice,
      p_supplier_country: supplierCountry,
      p_supplier_id: supplierId,
    })

    if (error) {
      logger.error('[API] Facets error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      facets: data,
    })

    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    logger.error('[API] Facets unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
