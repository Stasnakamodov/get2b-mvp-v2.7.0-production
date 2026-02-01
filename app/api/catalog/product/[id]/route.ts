import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

/**
 * GET /api/catalog/product/[id]
 * Получение детальной информации о товаре
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
    // Получаем товар
    const { data: product, error: productError } = await supabase
      .from('catalog_verified_products')
      .select('*')
      .eq('id', id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Получаем информацию о поставщике
    let supplier = null
    if (product.supplier_id) {
      const { data: supplierData } = await supabase
        .from('catalog_verified_suppliers')
        .select('id, name, company_name, country, city, public_rating, reviews_count, projects_count')
        .eq('id', product.supplier_id)
        .single()

      supplier = supplierData
    }

    // Получаем похожие товары (той же категории)
    const { data: relatedProducts } = await supabase
      .from('catalog_verified_products')
      .select('id, name, price, currency, images, category')
      .eq('category', product.category)
      .eq('is_active', true)
      .neq('id', id)
      .limit(8)

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        supplier
      },
      relatedProducts: relatedProducts || []
    })

  } catch (error: any) {
    console.error('[API] Product detail error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
