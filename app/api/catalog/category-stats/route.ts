import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

/**
 * GET /api/catalog/category-stats
 *
 * Optimized: parallel count queries per known category (head:true = no row data)
 * instead of fetching all 5000+ product rows.
 */

const BASE_CATEGORIES = [
  'Автотовары', 'Электроника', 'Дом и быт',
  'Здоровье и красота', 'Продукты питания', 'Промышленность',
  'Строительство', 'Текстиль и одежда'
]

export async function GET(request: NextRequest) {
  try {
    // Parallel count queries — 8 lightweight HEAD requests instead of loading all rows
    const countPromises = BASE_CATEGORIES.map(async (category) => {
      const { count, error } = await supabase
        .from('catalog_verified_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('category', category)

      return { category, count: error ? 0 : (count || 0) }
    })

    const results = await Promise.all(countPromises)

    const categoryCounts: Record<string, { verified: number; user: number; total: number }> = {}
    for (const { category, count } of results) {
      categoryCounts[category] = { verified: count, user: 0, total: count }
    }

    const response = NextResponse.json({
      success: true,
      categoryStats: categoryCounts
    })

    // Cache for 60s, serve stale for 5 min while revalidating
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return response
  } catch (error) {
    console.error("[API] category-stats error:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}