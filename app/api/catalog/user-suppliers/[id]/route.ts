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

    console.log('🔍 Получаем данные поставщика:', supplierId)

    // Получаем данные поставщика
    const { data: supplier, error: supplierError } = await supabase
      .from('catalog_user_suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (supplierError) {
      console.error('❌ Ошибка получения поставщика:', supplierError)
      return NextResponse.json(
        { error: 'Поставщик не найден' },
        { status: 404 }
      )
    }

    // Получаем товары поставщика
    const { data: products, error: productsError } = await supabase
      .from('catalog_user_products')
      .select('*')
      .eq('supplier_id', supplierId)

    if (productsError) {
      console.error('❌ Ошибка получения товаров:', productsError)
    }

    // Формируем полные данные поставщика
    const fullSupplier = {
      ...supplier,
      catalog_user_products: products || []
    }

    console.log('✅ Данные поставщика получены:', fullSupplier.name)

    return NextResponse.json({
      supplier: fullSupplier,
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