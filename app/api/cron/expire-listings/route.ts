import { pool } from '@/lib/db/pool'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret) {
      logger.error('[cron/expire-listings] CRON_SECRET not set')
      // 503: сервис не настроен. Cron'у и оператору виден конкретный класс проблемы.
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 503 }
      )
    }
    const auth = request.headers.get('authorization') ?? ''
    const expected = `Bearer ${secret}`
    const aBuf = Buffer.from(auth)
    const eBuf = Buffer.from(expected)
    const ok =
      aBuf.length === eBuf.length && timingSafeEqual(aBuf, eBuf)
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await pool.query(
      `UPDATE listings
          SET status = 'expired'
        WHERE status = 'open'
          AND expires_at < now()
        RETURNING id`
    )

    return NextResponse.json({
      success: true,
      updated: result.rowCount ?? 0,
      ids: result.rows.map((r) => r.id),
    })
  } catch (err) {
    logger.error('[cron/expire-listings] unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
