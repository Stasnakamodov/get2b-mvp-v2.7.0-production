import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string }>

export async function POST(
  request: NextRequest,
  segmentData: { params: Params }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await segmentData.params

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
    if (existing.status === 'closed') {
      return NextResponse.json({ success: true, listing: existing })
    }

    const { data: updated, error } = await db
      .from('listings')
      .update({ status: 'closed' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('[API] listings close error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, listing: updated })
  } catch (err) {
    logger.error('[API] listings close unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
