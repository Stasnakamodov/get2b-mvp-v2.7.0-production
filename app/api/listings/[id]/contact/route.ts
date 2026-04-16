import { db } from '@/lib/db'
import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { ContactListingInput } from '@/lib/listings/schemas'
import { notifyListingAuthorAboutContact } from '@/lib/listings/notifyAuthor'

type Params = Promise<{ id: string }>

// Семантика chat_rooms.user_id для listing-комнат: supplier_user_id (инициатор контакта).
// Это стабильный ключ для UNIQUE (listing_id, user_id) — защита от race-дублей.
export async function POST(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listingId } = await segmentData.params
    const body = await request.json().catch(() => ({}))
    const parsed = ContactListingInput.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data: listing } = await db
      .from('listings')
      .select('id, title, status, author_id, expires_at')
      .eq('id', listingId)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }
    if (listing.author_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot contact your own listing' },
        { status: 403 }
      )
    }
    if (listing.status !== 'open') {
      return NextResponse.json(
        { error: 'Listing is not open for contact' },
        { status: 409 }
      )
    }
    if (new Date(listing.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Listing expired' }, { status: 409 })
    }

    const { data: supplierProfile } = await db
      .from('supplier_profiles')
      .select('id, user_id, name, company_name')
      .eq('id', parsed.data.supplier_profile_id)
      .single()

    if (!supplierProfile || supplierProfile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Supplier profile not found or not owned by user' },
        { status: 403 }
      )
    }

    // Атомарная дедуп-вставка через CTE + ON CONFLICT (UNIQUE uniq_chat_rooms_listing_supplier).
    // Если конфликт — ins пустой, parts ничего не вставит, fallback SELECT вернёт существующий id.
    const cteResult = await pool.query(
      `WITH ins AS (
         INSERT INTO chat_rooms (name, room_type, user_id, listing_id, is_active)
         VALUES ($1, 'listing', $2, $3, true)
         ON CONFLICT (listing_id, user_id)
           WHERE listing_id IS NOT NULL AND is_active = true
           DO NOTHING
         RETURNING id
       ),
       parts AS (
         INSERT INTO chat_participants (room_id, user_id, role, is_active)
         SELECT ins.id, v.user_id, v.role, true
           FROM ins
           CROSS JOIN (VALUES ($2::uuid, 'supplier'), ($4::uuid, 'author')) AS v(user_id, role)
         RETURNING room_id
       )
       SELECT id, true AS created FROM ins
       UNION ALL
       SELECT cr.id, false AS created
         FROM chat_rooms cr
        WHERE cr.listing_id = $3
          AND cr.user_id = $2
          AND cr.is_active = true
          AND NOT EXISTS (SELECT 1 FROM ins)
        LIMIT 1`,
      [listing.title, user.id, listingId, listing.author_id]
    )

    const row = cteResult.rows[0]
    if (!row) {
      logger.error('[API] listings/contact CTE returned no row', {
        listingId,
        supplierUserId: user.id,
      })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    const roomId: string = row.id
    const created: boolean = row.created === true

    if (created) {
      await pool
        .query(
          'UPDATE listings SET contacts_count = contacts_count + 1 WHERE id = $1',
          [listingId]
        )
        .catch((e) =>
          logger.error('[API] listings contacts_count increment failed:', e)
        )

      notifyListingAuthorAboutContact({
        authorUserId: listing.author_id,
        listingTitle: listing.title,
        supplierCompanyName: supplierProfile.company_name || supplierProfile.name,
        roomId,
      }).catch((e) =>
        logger.error('[API] listings/contact notify failed:', e)
      )
    }

    return NextResponse.json({
      success: true,
      roomId,
      deduplicated: !created,
    })
  } catch (err) {
    logger.error('[API] listings/contact unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
