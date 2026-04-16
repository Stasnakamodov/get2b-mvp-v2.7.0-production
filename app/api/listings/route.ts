import { db } from '@/lib/db'
import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'
import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  CreateListingInput,
  ListListingsQuery,
} from '@/lib/listings/schemas'
import {
  buildCursorFilter,
  decodeCursor,
  encodeCursor,
} from '@/lib/listings/cursor'

// Whitelist-санитайзер: пропускает только буквы, цифры, пробелы и дефис.
// Закрывает injection в PostgREST-парсер `.or()`: точки/запятые из `status.eq.x`,
// `%`/`_` LIKE-wildcards, кавычки, скобки — всё удаляется.
function sanitizeSearch(search: string): string {
  return search.replace(/[^a-zA-Zа-яА-ЯёЁ0-9\s\-]/g, '').trim().slice(0, 100)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parsed = ListListingsQuery.safeParse(
      Object.fromEntries(searchParams.entries())
    )
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const q = parsed.data

    let query = db.from('listings').select('*')
    let countQuery = db
      .from('listings')
      .select('*', { count: 'exact', head: true })

    if (q.mine) {
      query = query.eq('author_id', user.id)
      countQuery = countQuery.eq('author_id', user.id)
    } else {
      query = query.eq('status', 'open').gt('expires_at', new Date().toISOString())
      countQuery = countQuery
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString())
      if (q.exclude_own) {
        query = query.neq('author_id', user.id)
        countQuery = countQuery.neq('author_id', user.id)
      }
    }

    if (q.category_id) {
      // Если выбрана parent-категория — резолвим дочерние на сервере и фильтруем по IN.
      // Решает H4 (ломалась пагинация и totalCount при выборе parent категории с детьми).
      const { rows: catRows } = await pool.query(
        'SELECT id FROM catalog_categories WHERE id = $1 OR parent_id = $1',
        [q.category_id]
      )
      const categoryIds = catRows.map((r: { id: string }) => r.id)
      if (categoryIds.length === 0) {
        // Категория не найдена — отдаём пустую выборку через eq.
        query = query.eq('category_id', q.category_id)
        countQuery = countQuery.eq('category_id', q.category_id)
      } else {
        query = query.in('category_id', categoryIds)
        countQuery = countQuery.in('category_id', categoryIds)
      }
    }

    if (typeof q.urgent === 'boolean') {
      query = query.eq('is_urgent', q.urgent)
      countQuery = countQuery.eq('is_urgent', q.urgent)
    }

    if (q.search) {
      const s = sanitizeSearch(q.search)
      if (s) {
        const filter = `title.ilike.%${s}%,description.ilike.%${s}%`
        query = query.or(filter)
        countQuery = countQuery.or(filter)
      }
    }

    // Cursor-пагинация поддерживается только для sort='newest'. Для 'urgent'/'deadline'
    // отдаём один большой батч (100) без пагинации — keyset-курсор требует
    // многоколоночного состояния (is_urgent,created_at,id) / (deadline_date NULLS LAST,id).
    // TODO v1.1: ввести keyset когда urgent/deadline-объявлений станет >100.
    const isSinglePage = q.sort === 'urgent' || q.sort === 'deadline'
    const SINGLE_PAGE_LIMIT = 100
    const effectiveLimit = isSinglePage ? SINGLE_PAGE_LIMIT : q.limit

    if (q.sort === 'newest') {
      query = query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (q.cursor) {
        const cd = decodeCursor(q.cursor)
        if (cd) query = query.or(buildCursorFilter(cd))
      }
    } else if (q.sort === 'urgent') {
      query = query
        .order('is_urgent', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
    } else if (q.sort === 'deadline') {
      query = query
        .order('deadline_date', { ascending: true })
        .order('id', { ascending: false })
    }

    query = query.limit(effectiveLimit + 1)

    const [dataResult, countResult] = await Promise.all([query, countQuery])
    if (dataResult.error) {
      logger.error('[API] listings GET error:', dataResult.error)
      return NextResponse.json(
        { error: dataResult.error.message },
        { status: 500 }
      )
    }

    const rows: any[] = dataResult.data || []
    const overflow = rows.length > effectiveLimit
    const listings = overflow ? rows.slice(0, effectiveLimit) : rows
    const hasMore = !isSinglePage && overflow

    let nextCursor: string | null = null
    if (hasMore && q.sort === 'newest' && listings.length > 0) {
      const last = listings[listings.length - 1]
      nextCursor = encodeCursor({
        lastId: last.id,
        lastCreatedAt: last.created_at,
      })
    }

    return NextResponse.json({
      success: true,
      listings,
      nextCursor,
      hasMore,
      totalCount: countResult.count ?? 0,
    })
  } catch (err) {
    logger.error('[API] listings GET unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CreateListingInput.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    const { data: profile } = await db
      .from('client_profiles')
      .select('id, user_id')
      .eq('id', data.author_client_profile_id)
      .single()

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Client profile not found or not owned by user' },
        { status: 403 }
      )
    }

    const { data: inserted, error } = await db
      .from('listings')
      .insert({
        author_id: user.id,
        author_client_profile_id: data.author_client_profile_id,
        title: data.title,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        category_id: data.category_id ?? null,
        deadline_date: data.deadline_date ?? null,
        is_urgent: data.is_urgent ?? false,
        status: 'open',
        expires_at: data.expires_at,
      })
      .select()
      .single()

    if (error) {
      logger.error('[API] listings POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, listing: inserted })
  } catch (err) {
    logger.error('[API] listings POST unexpected:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
