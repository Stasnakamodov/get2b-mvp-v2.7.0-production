import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET /api/catalog/stats
 * General catalog statistics: products, suppliers, categories
 */
export async function GET() {
  try {
    // Parallel count queries
    const [
      productsResult,
      suppliersResult,
      categoriesResult,
      activeProductsResult,
    ] = await Promise.all([
      supabase
        .from('catalog_verified_products')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('catalog_verified_suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('catalog_categories')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('catalog_verified_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ])

    // Top suppliers by product count
    const { data: topSuppliers } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name, company_name, category, country, projects_count, public_rating')
      .eq('is_active', true)
      .order('projects_count', { ascending: false })
      .limit(10)

    const response = NextResponse.json({
      success: true,
      stats: {
        total_products: productsResult.count || 0,
        active_products: activeProductsResult.count || 0,
        inactive_products: (productsResult.count || 0) - (activeProductsResult.count || 0),
        total_suppliers: suppliersResult.count || 0,
        total_categories: categoriesResult.count || 0,
        top_suppliers: topSuppliers || [],
      }
    })

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response

  } catch (error) {
    console.error('[API] Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
