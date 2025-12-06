import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🎯 API ENDPOINT: Получение всех товаров
// GET /api/catalog/products-by-category
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Получаем параметры запроса
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('[API] Fetching products with params:', { limit, offset, searchQuery })

    // Получаем товары напрямую из таблицы
    const { data: rawData, error } = await supabase
      .from('catalog_verified_products')
      .select('*')
      .limit(limit)
      .range(offset, offset + limit - 1)

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

    console.log('[API] Fetched products:', rawData?.length || 0)

    // Парсим результаты
    const products = (rawData || []).map((item: any) => ({
      id: item.id,
      product_name: item.product_name || item.name,
      description: item.description,
      price: item.price,
      currency: item.currency || 'RUB',
      min_order: item.min_order,
      in_stock: item.in_stock !== false, // по умолчанию true
      image_url: item.image_url,
      images: item.images || [],
      item_code: item.item_code,
      item_name: item.item_name,
      category: item.category,
      specifications: item.specifications || {},
      supplier_id: item.supplier_id || 'verified-supplier',
      supplier_name: item.supplier_name || 'Аккредитованный поставщик',
      supplier_company_name: item.supplier_company_name || item.supplier_name || 'Аккредитованный поставщик',
      supplier_country: item.supplier_country || 'Россия',
      supplier_city: item.supplier_city || 'Москва',
      supplier_email: item.supplier_email,
      supplier_phone: item.supplier_phone,
      supplier_website: item.supplier_website,
      supplier_rating: item.supplier_rating || 4.5,
      supplier_reviews: item.supplier_reviews || 0,
      supplier_projects: item.supplier_projects || 0,
      supplier_verification_status: item.supplier_verification_status || 'verified',
      supplier_main_category: item.supplier_main_category || item.category,
      supplier_room_type: item.supplier_room_type || 'verified',
      room_type: item.supplier_room_type || 'verified', // дублируем для совместимости
      room_icon: '🏢',
      room_description: 'Аккредитованный поставщик'
    }))

    // Подсчитываем статистику
    const uniqueSuppliers = new Set(products.map((p: any) => p.supplier_id))
    const verifiedProducts = products.filter((p: any) => p.supplier_room_type === 'verified').length
    const userProducts = products.filter((p: any) => p.supplier_room_type === 'user').length

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