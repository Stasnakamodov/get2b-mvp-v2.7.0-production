import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from "@/lib/supabaseClient";
// GET: Получение товаров с фильтром по категории (простая версия)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')
    const categoryKey = searchParams.get('category_key')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')
    

    // Получаем ID категории по ключу если нужно
    let finalCategoryId = categoryId
    if (categoryKey && !categoryId) {
      const { data: category } = await supabase
        .from('catalog_categories')
        .select('id')
        .eq('key', categoryKey)
        .eq('is_active', true)
        .single()
      
      finalCategoryId = category?.id
    }

    // Получаем товары из verified таблицы
    let verifiedQuery = supabase
      .from('catalog_verified_products')
      .select(`
        id,
        name,
        description,
        price,
        currency,
        min_order,
        in_stock,
        image_url,
        item_code,
        created_at,
        category_id,
        catalog_verified_suppliers!inner (
          id,
          name,
          company_name,
          category,
          country,
          city
        )
      `)

    if (finalCategoryId) {
      verifiedQuery = verifiedQuery.eq('category_id', finalCategoryId)
    }

    if (search) {
      verifiedQuery = verifiedQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: verifiedProducts, error: verifiedError } = await verifiedQuery
      .range(offset, offset + limit - 1)

    // Получаем товары из user таблицы
    let userQuery = supabase
      .from('catalog_user_products')
      .select(`
        id,
        name,
        description,
        price,
        currency,
        min_order,
        in_stock,
        image_url,
        item_code,
        created_at,
        category_id,
        catalog_user_suppliers!inner (
          id,
          name,
          company_name,
          category,
          country,
          city,
          user_id
        )
      `)

    if (finalCategoryId) {
      userQuery = userQuery.eq('category_id', finalCategoryId)
    }

    if (search) {
      userQuery = userQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: userProducts, error: userError } = await userQuery
      .range(offset, offset + limit - 1)

    if (verifiedError || userError) {
      logger.error('❌ [API] Ошибка получения товаров:', { verifiedError, userError })
      return NextResponse.json({ error: 'Ошибка получения товаров' }, { status: 500 })
    }

    // Объединяем и форматируем товары
    const allProducts = [
      ...(verifiedProducts || []).map(p => ({
        ...p,
        supplier: p.catalog_verified_suppliers,
        room_type: 'verified' as const,
        room_icon: '🧡',
        room_description: 'Аккредитованный поставщик'
      })),
      ...(userProducts || []).map(p => ({
        ...p,
        supplier: p.catalog_user_suppliers,
        room_type: 'user' as const,
        room_icon: '🔵', 
        room_description: 'Личный поставщик'
      }))
    ]

    const executionTime = Date.now() - startTime
    

    return NextResponse.json({
      success: true,
      products: allProducts,
      pagination: {
        limit,
        offset,
        total: allProducts.length,
        has_more: allProducts.length === limit
      },
      stats: {
        total_products: allProducts.length,
        verified_products: verifiedProducts?.length || 0,
        user_products: userProducts?.length || 0,
        execution_time_ms: executionTime
      }
    })

  } catch (error) {
    logger.error('❌ [API] Критическая ошибка получения товаров:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Ошибка сервера при получении товаров',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}