import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || null
    const urgent = searchParams.get('urgent')
    const excludeOwn = searchParams.get('exclude_own') === 'true'

    const where: string[] = [
      "status = 'open'",
      'expires_at > now()',
    ]
    const params: any[] = []

    if (excludeOwn) {
      params.push(user.id)
      where.push(`author_id <> $${params.length}`)
    }
    if (urgent === 'true' || urgent === 'false') {
      params.push(urgent === 'true')
      where.push(`is_urgent = $${params.length}`)
    }
    if (search) {
      const sanitized = search.replace(/[%_\\'"();]/g, ' ').slice(0, 100)
      params.push(`%${sanitized}%`)
      where.push(
        `(title ILIKE $${params.length} OR description ILIKE $${params.length})`
      )
    }

    const sql = `
      SELECT category_id, COUNT(*)::int AS count
        FROM listings
       WHERE ${where.join(' AND ')}
       GROUP BY category_id
    `

    const result = await pool.query(sql, params)

    const categories: Record<string, number> = {}
    let uncategorized = 0
    let total = 0
    for (const row of result.rows) {
      total += row.count
      if (row.category_id) {
        categories[row.category_id] = row.count
      } else {
        uncategorized = row.count
      }
    }

    return NextResponse.json({
      success: true,
      facets: {
        total,
        categories,
        uncategorized,
      },
    })
  } catch (err) {
    logger.error('[API] listings facets unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
