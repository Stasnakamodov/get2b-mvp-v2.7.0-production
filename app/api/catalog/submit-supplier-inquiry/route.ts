import { logger } from '@/src/shared/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { z } from 'zod'
import { getOptionalAuthUser } from '@/lib/api/getOptionalAuthUser'

// BUG-14: Zod schema for input validation with length limit
const InquirySchema = z.object({
  query: z.string().min(1, 'Описание товара обязательно').max(5000, 'Описание слишком длинное').transform(s => s.trim()),
})

/**
 * POST /api/catalog/submit-supplier-inquiry
 * Сохраняет заявку на поиск поставщика в таблицу supplier_inquiries
 *
 * BUG-13: Rate limiting is handled by middleware.ts (100 req/min)
 * BUG-15: RLS WITH CHECK(true) is acceptable for MVP — any user can insert
 */
export async function POST(request: NextRequest) {
  try {
    // BUG-12: Use Bearer token auth instead of supabase.auth.getSession()
    const user = await getOptionalAuthUser(request)

    const body = await request.json()

    // BUG-14: Validate with Zod schema
    const parsed = InquirySchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Некорректные данные'
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('supplier_inquiries')
      .insert({
        query: parsed.data.query,
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        status: 'new',
      })

    if (error) {
      logger.error('[SUPPLIER INQUIRY] Insert error:', error)
      return NextResponse.json(
        { error: 'Не удалось сохранить заявку' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[SUPPLIER INQUIRY] Error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
