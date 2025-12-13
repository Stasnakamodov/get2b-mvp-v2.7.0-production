import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🎯 API ENDPOINT: Получение всех товаров
// GET /api/catalog/products-by-category
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Получаем параметры запроса
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search') || null
    const limit = parseInt(searchParams.get('limit') || '2000')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[API] Fetching ALL products with RPC, params:', { limit, offset, searchQuery })

    // 🔥 FIX: Используем RPC функцию вместо прямого запроса
    // Это обходит лимит Supabase REST API в 1000 строк
    const { data: rawData, error } = await supabase.rpc('get_products_by_category', {
      category_name: null, // null = все категории
      user_id_param: null,
      search_query: searchQuery,
      limit_param: limit,
      offset_param: offset
    })

    if (error) {
      console.error('[API] Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Failed to fetch products',
        products: [],
        summary: {
          total_products: 0,
          suppliers_count: 0,
          verified_products: 0,
          user_products: 0,
          execution_time_ms: Date.now() - startTime
        }
      }, { status: 500 })
    }

    // RPC возвращает JSONB array напрямую
    let products = []
    if (Array.isArray(rawData)) {
      products = rawData
    } else if (rawData && typeof rawData === 'string') {
      products = JSON.parse(rawData)
    } else {
      products = []
    }

    console.log('[API] Fetched products via RPC:', products.length)

    // Подсчитываем статистику
    const uniqueSuppliers = new Set(products.map((p: any) => p.supplier_id))
    const verifiedProducts = products.filter((p: any) => p.room_type === 'verified').length
    const userProducts = products.filter((p: any) => p.room_type === 'user').length

    const response = NextResponse.json({
      success: true,
      products: products,
      pagination: {
        offset: offset,
        limit: limit,
        total: products.length,
        has_more: products.length === limit
      },
      summary: {
        total_products: products.length,
        suppliers_count: uniqueSuppliers.size,
        verified_products: verifiedProducts,
        user_products: userProducts,
        execution_time_ms: Date.now() - startTime
      }
    })

    // Добавляем заголовки кэширования
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')

    return response

  } catch (error: any) {
    console.error('[API] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || null,
      products: [],
      summary: {
        total_products: 0,
        suppliers_count: 0,
        verified_products: 0,
        user_products: 0,
        execution_time_ms: Date.now() - startTime
      }
    }, { status: 500 })
  }
}