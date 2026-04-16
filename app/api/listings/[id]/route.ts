import { db } from '@/lib/db'
import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { UpdateListingInput } from '@/lib/listings/schemas'

type Params = Promise<{ id: string }>

export async function GET(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await segmentData.params

    const { data: listing, error } = await db
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // H3: draft/closed/expired листинги видны только автору. 404 скрывает
    // существование объявления от посторонних при угадывании UUID.
    if (listing.status !== 'open' && listing.author_id !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let authorProfile: any = null
    if (listing.author_client_profile_id) {
      const { data } = await db
        .from('client_profiles')
        .select('id, name, legal_name, inn')
        .eq('id', listing.author_client_profile_id)
        .single()
      authorProfile = data || null
    }

    let category: any = null
    if (listing.category_id) {
      const { data } = await db
        .from('catalog_categories')
        .select('id, name, slug, parent_id, level')
        .eq('id', listing.category_id)
        .single()
      category = data || null
    }

    // Инкрементим views только для открытых объявлений и только для не-автора.
    // Для закрытых/истёкших views_count теряет смысл (ограничение из H3-фикса).
    if (listing.status === 'open' && listing.author_id !== user.id) {
      pool
        .query(
          'UPDATE listings SET views_count = views_count + 1 WHERE id = $1',
          [id]
        )
        .catch((e) =>
          logger.error('[API] listings views_count increment failed:', e)
        )
    }

    return NextResponse.json({
      success: true,
      listing,
      author_profile: authorProfile,
      category,
      is_owner: listing.author_id === user.id,
    })
  } catch (err) {
    logger.error('[API] listings GET[id] unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await segmentData.params
    const body = await request.json()
    const parsed = UpdateListingInput.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data: existing } = await db
      .from('listings')
      .select('id, author_id, status')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (existing.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (existing.status !== 'open' && existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Listing cannot be edited in current status' },
        { status: 409 }
      )
    }

    const updates: Record<string, any> = {}
    for (const k of Object.keys(parsed.data)) {
      const v = (parsed.data as any)[k]
      if (v !== undefined) updates[k] = v
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await db
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('[API] listings PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, listing: updated })
  } catch (err) {
    logger.error('[API] listings PATCH unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
