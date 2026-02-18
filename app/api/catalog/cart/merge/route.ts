import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabaseServerClient'
import { logger } from '@/src/shared/lib/logger'

/**
 * POST /api/catalog/cart/merge
 * Merge localStorage cart items into server cart on login.
 * Body: { items: [{ product_id, quantity, variant_id? }] }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await createAuthenticatedClient(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const { items } = await request.json()
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: true, merged: 0 })
    }

    // Get or create cart
    let { data: cart } = await supabase
      .from('catalog_carts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!cart) {
      const { data: created, error } = await supabase
        .from('catalog_carts')
        .insert({ user_id: user.id })
        .select('id')
        .single()

      if (error) {
        logger.error('[API] Cart create error during merge:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      cart = created
    }

    let merged = 0
    for (const item of items) {
      if (!item.product_id || !item.quantity) continue

      // Check if item exists in server cart
      const { data: existing } = await supabase
        .from('catalog_cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', item.product_id)
        .single()

      if (existing) {
        // Take the larger quantity (don't lose local edits)
        const newQty = Math.max(existing.quantity, item.quantity)
        if (newQty !== existing.quantity) {
          await supabase
            .from('catalog_cart_items')
            .update({ quantity: newQty })
            .eq('id', existing.id)
        }
      } else {
        await supabase
          .from('catalog_cart_items')
          .insert({
            cart_id: cart.id,
            product_id: item.product_id,
            quantity: item.quantity,
            variant_id: item.variant_id || null,
          })
      }
      merged++
    }

    // Update cart timestamp
    await supabase
      .from('catalog_carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cart.id)

    return NextResponse.json({ success: true, merged })
  } catch (error) {
    logger.error('[API] Cart merge unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
