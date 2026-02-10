import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { z } from 'zod'

/**
 * API для пагинированной загрузки товаров
 * Поддерживает cursor-based пагинацию для работы с 10000+ товаров
 *
 * GET /api/catalog/products-paginated
 *
 * Query params:
 * - cursor: string (опционально) - курсор для следующей страницы
 * - limit: number (по умолчанию 50) - количество товаров на странице
 * - supplier_type: 'verified' | 'user' - тип поставщика
 * - category: string (опционально) - фильтр по категории
 * - search: string (опционально) - поиск по названию
 * - supplier_id: string (опционально) - фильтр по поставщику
 * - sort_field: string (опционально) - поле сортировки
 * - sort_order: 'asc' | 'desc' (опционально) - направление сортировки
 */

// Zod схема для валидации cursor
const CursorDataSchema = z.object({
  lastId: z.string().uuid(),
  lastCreatedAt: z.string().datetime()
})

type CursorData = z.infer<typeof CursorDataSchema>

// Разрешённые поля для сортировки
const ALLOWED_SORT_FIELDS = ['created_at', 'price', 'name'] as const
type SortField = typeof ALLOWED_SORT_FIELDS[number]

/**
 * Санитизация поискового запроса для защиты от SQL injection
 */
function sanitizeSearch(search: string): string {
  return search
    .replace(/[%_\\'"();]/g, ' ')
    .trim()
    .slice(0, 100)
}

function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

function decodeCursor(cursor: string): CursorData | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
    const result = CursorDataSchema.safeParse(decoded)
    if (!result.success) {
      console.warn('[API] Invalid cursor format:', result.error)
      return null
    }
    return result.data
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100
    const supplierType = searchParams.get('supplier_type') || 'verified'
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const search = searchParams.get('search')
    const supplierId = searchParams.get('supplier_id')
    const inStock = searchParams.get('in_stock')

    // Параметры сортировки с валидацией
    const sortFieldParam = searchParams.get('sort_field')
    const sortOrderParam = searchParams.get('sort_order')
    const sortField: SortField = ALLOWED_SORT_FIELDS.includes(sortFieldParam as SortField)
      ? (sortFieldParam as SortField)
      : 'created_at'
    const sortOrder: 'asc' | 'desc' = sortOrderParam === 'asc' ? 'asc' : 'desc'

    // Определяем таблицу
    const tableName = supplierType === 'verified'
      ? 'catalog_verified_products'
      : 'catalog_user_products'

    // Базовый запрос с настраиваемой сортировкой
    let query = supabase
      .from(tableName)
      .select('*')
      .eq('is_active', true)
      .order(sortField, { ascending: sortOrder === 'asc' })
      .order('id', { ascending: false })
      .limit(limit + 1) // +1 для проверки наличия следующей страницы

    // Применяем cursor (keyset pagination)
    if (cursor) {
      const cursorData = decodeCursor(cursor)
      if (cursorData) {
        // Используем комбинированный фильтр для keyset pagination
        query = query.or(
          `created_at.lt.${cursorData.lastCreatedAt},` +
          `and(created_at.eq.${cursorData.lastCreatedAt},id.lt.${cursorData.lastId})`
        )
      }
    }

    // Фильтры
    if (category) {
      query = query.eq('category', category)
    }

    if (subcategory) {
      query = query.eq('subcategory_id', subcategory)
    }

    if (inStock === 'true') {
      query = query.eq('in_stock', true)
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    }

    if (search && search.trim()) {
      const sanitized = sanitizeSearch(search)
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('[API] Products paginated error:', error)
      return NextResponse.json({
        error: error.message,
        products: [],
        nextCursor: null,
        hasMore: false
      }, { status: 500 })
    }

    // Проверяем есть ли следующая страница
    const hasMore = data && data.length > limit
    const products = hasMore ? data.slice(0, limit) : (data || [])

    // Генерируем cursor для следующей страницы
    let nextCursor: string | null = null
    if (hasMore && products.length > 0) {
      const lastProduct = products[products.length - 1]
      nextCursor = encodeCursor({
        lastId: lastProduct.id,
        lastCreatedAt: lastProduct.created_at
      })
    }

    const response = NextResponse.json({
      success: true,
      products,
      nextCursor,
      hasMore,
      meta: {
        count: products.length,
        limit,
        supplierType,
        sortField,
        sortOrder,
        executionTime: Date.now() - startTime
      }
    })

    // Кэширование
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')

    return response

  } catch (error: any) {
    console.error('[API] Products paginated unexpected error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      products: [],
      nextCursor: null,
      hasMore: false
    }, { status: 500 })
  }
}
