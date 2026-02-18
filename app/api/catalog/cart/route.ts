import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabaseServerClient'
import { logger } from '@/src/shared/lib/logger'

/**
 * GET /api/catalog/cart
 * Fetch the user's cart with product data
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await createAuthenticatedClient(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    const { data, error } = await supabase.rpc('get_cart_with_products', {
      p_user_id: user.id,
    })

    if (error) {
      logger.error('[API] Cart fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cart: data })
  } catch (error) {
    logger.error('[API] Cart unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/catalog/cart
 * Clear the user's entire cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await createAuthenticatedClient(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { user, supabase } = auth

    // Get cart id
    const { data: cart } = await supabase
      .from('catalog_carts')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (cart) {
      // Delete all items
      const { error } = await supabase
        .from('catalog_cart_items')
        .delete()
        .eq('cart_id', cart.id)

      if (error) {
        logger.error('[API] Cart clear error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[API] Cart clear unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
