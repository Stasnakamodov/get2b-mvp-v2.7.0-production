import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/src/shared/lib/logger'

/**
 * GET /api/catalog/collections/[slug]
 * Resolves collection rules into a product query and returns matching products
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug) {
    return NextResponse.json({ error: 'Collection slug is required' }, { status: 400 })
  }

  try {
    // Get collection
    const { data: collection, error: collectionError } = await supabase
      .from('catalog_collections')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (collectionError || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Build product query from rules
    let query = supabase
      .from('catalog_verified_products')
      .select('*')
      .eq('is_active', true)

    const rules = collection.rules as Record<string, unknown>
    if (rules.in_stock) query = query.eq('in_stock', true)
    if (rules.price_max) query = query.lte('price', rules.price_max as number)
    if (rules.price_min) query = query.gte('price', rules.price_min as number)
    if (rules.category) query = query.eq('category', rules.category as string)
    if (rules.supplier_country) query = query.eq('supplier_country', rules.supplier_country as string)

    query = query
      .order(collection.sort_field || 'created_at', { ascending: collection.sort_order === 'asc' })
      .limit(collection.max_products || 50)

    const { data: products, error: productsError } = await query

    if (productsError) {
      logger.error('[API] Collection products error:', productsError)
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      collection,
      products: products || [],
    })

    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
    return response
  } catch (error) {
    logger.error('[API] Collection detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
