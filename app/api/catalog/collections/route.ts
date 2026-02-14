import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/src/shared/lib/logger'

/**
 * GET /api/catalog/collections
 * Returns featured collections with preview products
 */
export async function GET(request: NextRequest) {
  try {
    const { data: collections, error } = await supabase
      .from('catalog_collections')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      logger.error('[API] Collections list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch preview products for each featured collection
    const collectionsWithPreviews = await Promise.all(
      (collections || []).map(async (collection) => {
        if (!collection.is_featured) {
          return { ...collection, preview_products: [] }
        }

        let query = supabase
          .from('catalog_verified_products')
          .select('id, name, price, currency, images, category')
          .eq('is_active', true)

        // Apply rules
        const rules = collection.rules as Record<string, unknown>
        if (rules.in_stock) query = query.eq('in_stock', true)
        if (rules.price_max) query = query.lte('price', rules.price_max as number)
        if (rules.price_min) query = query.gte('price', rules.price_min as number)
        if (rules.category) query = query.eq('category', rules.category as string)
        if (rules.supplier_country) query = query.eq('supplier_country', rules.supplier_country as string)

        query = query
          .order(collection.sort_field || 'created_at', { ascending: collection.sort_order === 'asc' })
          .limit(4) // preview count

        const { data: products } = await query
        return { ...collection, preview_products: products || [] }
      })
    )

    const response = NextResponse.json({
      success: true,
      collections: collectionsWithPreviews,
    })

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return response
  } catch (error) {
    logger.error('[API] Collections unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
