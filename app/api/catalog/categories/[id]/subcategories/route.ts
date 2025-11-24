import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/catalog/categories/[id]/subcategories
 * Загружает подкатегории для конкретной категории с подсчётом товаров
 * Оптимизированный endpoint для ленивой загрузки
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categoryId = id

    // Загружаем подкатегории для конкретной категории
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('catalog_subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .order('name')

    if (subcategoriesError) {
      console.error('Ошибка загрузки подкатегорий:', subcategoriesError)
      return NextResponse.json(
        { success: false, error: subcategoriesError.message },
        { status: 500 }
      )
    }

    // Для каждой подкатегории считаем количество товаров
    const subcategoriesWithCounts = await Promise.all(
      (subcategories || []).map(async (sub) => {
        const { count } = await supabase
          .from('catalog_verified_products')
          .select('*', { count: 'exact', head: true })
          .eq('subcategory_id', sub.id)

        return {
          ...sub,
          products_count: count || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      subcategories: subcategoriesWithCounts,
      total: subcategoriesWithCounts.length
    })

  } catch (error) {
    console.error('Ошибка в API подкатегорий:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
