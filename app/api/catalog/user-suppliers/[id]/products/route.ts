import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supplierId = id


    // Получаем товары поставщика
    const { data: products, error: productsError } = await supabase
      .from('catalog_user_products')
      .select('*')
      .eq('supplier_id', supplierId)

    if (productsError) {
      console.error('❌ Ошибка получения товаров:', productsError)
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
    console.error('❌ Ошибка API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 