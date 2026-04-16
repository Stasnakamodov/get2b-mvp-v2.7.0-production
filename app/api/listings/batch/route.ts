import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { BatchCreateListingInput } from '@/lib/listings/schemas'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = BatchCreateListingInput.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    const profileRes = await pool.query(
      'SELECT id, user_id FROM client_profiles WHERE id = $1',
      [data.author_client_profile_id]
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
      for (const item of data.items) {
        const { rows } = await client.query(
          `INSERT INTO listings
            (author_id, author_client_profile_id, title, description, quantity, unit,
             category_id, deadline_date, is_urgent, status, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open', $10)
           RETURNING *`,
          [
            user.id,
            data.author_client_profile_id,
            item.title,
            item.description,
            item.quantity,
            item.unit,
            item.category_id ?? null,
            data.deadline_date ?? null,
            data.is_urgent ?? false,
            data.expires_at,
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
