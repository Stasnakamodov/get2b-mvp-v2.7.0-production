import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabaseServerClient'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/src/shared/lib/logger'

async function getOrCreateCart(supabase: SupabaseClient, userId: string) {
  // Try to get existing cart
  const { data: existing } = await supabase
    .from('catalog_carts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) return existing.id

  // Create new cart
  const { data: created, error } = await supabase
    .from('catalog_carts')
    .insert({ user_id: userId })
    .select('id')
    .single()

  if (error) throw error
  return created.id
}

/**
 * POST /api/catalog/cart/items
 * Add item to cart
 * Body: { product_id, quantity?, variant_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await createAuthenticatedClient(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const { product_id, quantity = 1, variant_id = null } = await request.json()
    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const cartId = await getOrCreateCart(supabase, user.id)

    // Upsert: if item exists, increment quantity
    const { data: existing } = await supabase
      .from('catalog_cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', product_id)
      .is('variant_id', variant_id)
      .single()

    if (existing) {
      const { data, error } = await supabase
        .from('catalog_cart_items')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        logger.error('[API] Cart item update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, item: data })
    }

    const { data, error } = await supabase
      .from('catalog_cart_items')
      .insert({ cart_id: cartId, product_id, quantity, variant_id })
      .select()
      .single()

    if (error) {
      logger.error('[API] Cart item add error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update cart timestamp
    await supabase
      .from('catalog_carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cartId)

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    logger.error('[API] Cart item add unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/catalog/cart/items
 * Update item quantity
 * Body: { item_id, quantity }
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await createAuthenticatedClient(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { supabase } = auth

    const { item_id, quantity } = await request.json()
    if (!item_id || quantity === undefined) {
      return NextResponse.json({ error: 'item_id and quantity are required' }, { status: 400 })
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      const { error } = await supabase
        .from('catalog_cart_items')
        .delete()
        .eq('id', item_id)

      if (error) {
        logger.error('[API] Cart item remove error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, removed: true })
    }

    const { data, error } = await supabase
      .from('catalog_cart_items')
      .update({ quantity })
      .eq('id', item_id)
      .select()
      .single()

    if (error) {
      logger.error('[API] Cart item update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    logger.error('[API] Cart item update unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/catalog/cart/items
 * Remove item from cart
 * Body: { item_id } or { product_id }
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await createAuthenticatedClient(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const { item_id, product_id } = await request.json()

    if (item_id) {
      const { error } = await supabase
        .from('catalog_cart_items')
        .delete()
        .eq('id', item_id)

      if (error) {
        logger.error('[API] Cart item remove error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else if (product_id) {
      // Get user's cart
      const { data: cart } = await supabase
        .from('catalog_carts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (cart) {
        const { error } = await supabase
          .from('catalog_cart_items')
          .delete()
          .eq('cart_id', cart.id)
          .eq('product_id', product_id)

        if (error) {
          logger.error('[API] Cart item remove by product error:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }
    } else {
      return NextResponse.json({ error: 'item_id or product_id is required' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[API] Cart item remove unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
