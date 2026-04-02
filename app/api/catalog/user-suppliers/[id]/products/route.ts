import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/src/shared/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supplierId = id


    // Получаем товары поставщика
    const { data: products, error: productsError } = await db
      .from('catalog_user_products')
      .select('*')
      .eq('supplier_id', supplierId)

    if (productsError) {
      logger.error('[API] Ошибка получения товаров:', productsError)
      return NextResponse.json(
        { error: 'Ошибка получения товаров' },
        { status: 500 }
      )
    }


    return NextResponse.json({
      products: products || [],
      success: true
    })

  } catch (error) {
    logger.error('[API] Ошибка API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 