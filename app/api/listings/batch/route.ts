import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import {
  BatchListingItem,
  BatchListingMeta,
  type BatchInvalidItem,
  type BatchListingItemType,
} from '@/lib/listings/schemas'

const BATCH_MAX_ITEMS = 30

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { items: rawItems, ...rawMeta } = body as Record<string, unknown>

    const metaResult = BatchListingMeta.safeParse(rawMeta)
    const topLevelErrors = metaResult.success ? null : metaResult.error.flatten().fieldErrors

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        {
          error: 'items must be a non-empty array',
          topLevelErrors,
        },
        { status: 422 }
      )
    }
    if (rawItems.length > BATCH_MAX_ITEMS) {
      return NextResponse.json(
        { error: `Too many items (max ${BATCH_MAX_ITEMS})`, topLevelErrors },
        { status: 422 }
      )
    }

    const invalidItems: BatchInvalidItem[] = []
    const validItems: BatchListingItemType[] = []
    for (let i = 0; i < rawItems.length; i++) {
      const parsed = BatchListingItem.safeParse(rawItems[i])
      if (parsed.success) {
        validItems.push(parsed.data)
      } else {
        invalidItems.push({
          index: i,
          errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        })
      }
    }

    if (!metaResult.success || invalidItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          invalidItems,
          topLevelErrors,
        },
        { status: 422 }
      )
    }

    const meta = metaResult.data

    const profileRes = await pool.query(
      'SELECT id, user_id FROM client_profiles WHERE id = $1',
      [meta.author_client_profile_id]
    )
    const profile = profileRes.rows[0]
    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Client profile not found or not owned by user' },
        { status: 403 }
      )
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const inserted: unknown[] = []
      for (const item of validItems) {
        const { rows } = await client.query(
          `INSERT INTO listings
            (author_id, author_client_profile_id, title, description, quantity, unit,
             category_id, deadline_date, is_urgent, status, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', $10)
           RETURNING *`,
          [
            user.id,
            meta.author_client_profile_id,
            item.title,
            item.description,
            item.quantity,
            item.unit,
            item.category_id ?? null,
            meta.deadline_date ?? null,
            meta.is_urgent ?? false,
            meta.expires_at,
          ]
        )
        inserted.push(rows[0])
      }

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        count: inserted.length,
        listings: inserted,
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    logger.error('[API] listings/batch POST error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
