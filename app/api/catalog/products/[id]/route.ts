import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { logger } from '@/src/shared/lib/logger'

/**
 * GET /api/catalog/products/[id]
 * Get product detail with supplier info and related products
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  try {
    // Get product
    const { data: product, error: productError } = await supabase
      .from('catalog_verified_products')
      .select('*')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get supplier info
    let supplier = null
    if (product.supplier_id) {
      const { data: supplierData } = await supabase
        .from('catalog_verified_suppliers')
        .select('id, name, company_name, country, city, public_rating, reviews_count, projects_count')
        .eq('id', product.supplier_id)
        .single()

      supplier = supplierData
    }

    // Get related products (same category)
    const { data: relatedProducts } = await supabase
      .from('catalog_verified_products')
      .select('id, name, price, currency, images, category')
      .eq('category', product.category)
      .eq('is_active', true)
      .neq('id', id)
      .limit(8)

    return NextResponse.json({
      success: true,
      product: { ...product, supplier },
      relatedProducts: relatedProducts || []
    })

  } catch (error) {
    logger.error('[API] Product detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/catalog/products/[id]
 * Update a specific product
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supplier_type, ...updateData } = await request.json()
    const tableName = supplier_type === 'verified' ? 'catalog_verified_products' : 'catalog_user_products'

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    logger.error('[API] Product update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/catalog/products/[id]
 * Delete a specific product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supplier_type } = await request.json()
    const tableName = supplier_type === 'verified' ? 'catalog_verified_products' : 'catalog_user_products'

    const { data, error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    logger.error('[API] Product delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
