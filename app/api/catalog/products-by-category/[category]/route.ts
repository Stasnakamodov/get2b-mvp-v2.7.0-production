import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🎯 API ENDPOINT: Получение товаров по категории (Category-First подход)
// GET /api/catalog/products-by-category/{category}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const startTime = Date.now()
  
  try {
    const resolvedParams = await params
    const category = decodeURIComponent(resolvedParams.category)

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search') || null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id') || null
    const sortBy = searchParams.get('sort') || 'default'

    // Получаем текущего пользователя для фильтрации RLS
    const authHeader = request.headers.get('authorization')
    let currentUserId = null
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        currentUserId = user?.id || null
      } catch (error) {
      }
    }

    // Определяем категорию для запроса (null для "all")
    const categoryFilter = category === 'all' ? null : category

    // Функция get_products_by_category сама определит, подкатегория это или корневая категория
    // Вызываем функцию get_products_by_category
    const { data: rawData, error } = await supabase.rpc('get_products_by_category', {
      category_name: categoryFilter,
      user_id_param: currentUserId,
      search_query: searchQuery,
      limit_param: limit,
      offset_param: offset
    })


    // Функция возвращает JSONB array напрямую через Supabase JS client
    let products = []

    if (Array.isArray(rawData)) {
      // Supabase JS client возвращает массив напрямую
      products = rawData
    } else if (rawData && typeof rawData === 'string') {
      // Если это строка, парсим JSON
      products = JSON.parse(rawData)
    } else if (rawData === null || rawData === undefined) {
      // Если null/undefined, пустой массив
      products = []
    } else {
      // Неожиданный формат
      console.error('❌ [API] Неожиданный формат данных:', typeof rawData, rawData)
      products = []
    }


    if (error) {
      console.error('❌ [API] Ошибка получения товаров категории:', error)
      return NextResponse.json({
        success: false,
        error: 'Ошибка получения товаров категории',
        details: error.message
      }, { status: 500 })
    }

    // Сортируем товары согласно параметру sort
    const sortedProducts = sortProducts(products || [], sortBy)

    // Группируем товары по поставщикам для статистики
    const supplierStats = groupProductsBySupplier(sortedProducts)

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      category: category,
      products: sortedProducts,
      suppliers: supplierStats,
      pagination: {
        limit,
        offset,
        total: sortedProducts.length,
        has_more: sortedProducts.length === limit
      },
      summary: {
        total_products: sortedProducts.length,
        suppliers_count: supplierStats.length,
        verified_products: sortedProducts.filter(p => p.room_type === 'verified').length,
        user_products: sortedProducts.filter(p => p.room_type === 'user').length,
        execution_time_ms: executionTime
      }
    })

  } catch (error) {
    console.error('❌ [API] Критическая ошибка получения товаров категории:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Внутренняя ошибка сервера при получении товаров',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 })
  }
}

// 🔄 Функция сортировки товаров
function sortProducts(products: any[], sortBy: string) {
  const sorted = [...products]
  
  switch (sortBy) {
    case 'name_asc':
      return sorted.sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''))
    
    case 'name_desc':
      return sorted.sort((a, b) => (b.product_name || '').localeCompare(a.product_name || ''))
    
    case 'price_asc':
      return sorted.sort((a, b) => {
        const priceA = parseFloat(a.price) || 0
        const priceB = parseFloat(b.price) || 0
        return priceA - priceB
      })
    
    case 'price_desc':
      return sorted.sort((a, b) => {
        const priceA = parseFloat(a.price) || 0
        const priceB = parseFloat(b.price) || 0
        return priceB - priceA
      })
    
    case 'supplier_rating':
      return sorted.sort((a, b) => {
        const ratingA = a.supplier_rating || 0
        const ratingB = b.supplier_rating || 0
        return ratingB - ratingA
      })
    
    case 'supplier_projects':
      return sorted.sort((a, b) => {
        const projectsA = a.supplier_projects || 0
        const projectsB = b.supplier_projects || 0
        return projectsB - projectsA
      })
    
    case 'room_type':
      return sorted.sort((a, b) => {
        // Сначала verified (аккредитованные), потом user (личные)
        if (a.room_type === 'verified' && b.room_type === 'user') return -1
        if (a.room_type === 'user' && b.room_type === 'verified') return 1
        return 0
      })
    
    case 'default':
    default:
      // Сортировка по умолчанию: сначала verified, потом по рейтингу, потом по проектам
      return sorted.sort((a, b) => {
        // 1. Приоритет типа комнаты
        if (a.room_type === 'verified' && b.room_type === 'user') return -1
        if (a.room_type === 'user' && b.room_type === 'verified') return 1
        
        // 2. По рейтингу поставщика
        const ratingA = a.supplier_rating || 0
        const ratingB = b.supplier_rating || 0
        if (ratingA !== ratingB) return ratingB - ratingA
        
        // 3. По количеству проектов поставщика
        const projectsA = a.supplier_projects || 0
        const projectsB = b.supplier_projects || 0
        return projectsB - projectsA
      })
  }
}

// 📊 Функция группировки товаров по поставщикам
function groupProductsBySupplier(products: any[]) {
  const supplierMap = new Map()
  
  products.forEach(product => {
    const supplierId = product.supplier_id
    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, {
        supplier_id: supplierId,
        supplier_name: product.supplier_name,
        supplier_company_name: product.supplier_company_name,
        supplier_category: product.supplier_category,
        supplier_country: product.supplier_country,
        supplier_city: product.supplier_city,
        supplier_email: product.supplier_email,
        supplier_phone: product.supplier_phone,
        supplier_website: product.supplier_website,
        supplier_rating: product.supplier_rating,
        supplier_reviews: product.supplier_reviews,
        supplier_projects: product.supplier_projects,
        room_type: product.room_type,
        room_icon: product.room_icon,
        room_description: product.room_description,
        products_count: 0,
        products: []
      })
    }
    
    const supplier = supplierMap.get(supplierId)
    supplier.products_count++
    supplier.products.push({
      id: product.id,
      product_name: product.product_name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      min_order: product.min_order,
      in_stock: product.in_stock,
      item_code: product.item_code,
      image_url: product.image_url,
      item_name: product.item_name
    })
  })
  
  return Array.from(supplierMap.values()).sort((a, b) => {
    // Сначала verified поставщики, потом по количеству товаров
    if (a.room_type === 'verified' && b.room_type === 'user') return -1
    if (a.room_type === 'user' && b.room_type === 'verified') return 1
    return b.products_count - a.products_count
  })
}