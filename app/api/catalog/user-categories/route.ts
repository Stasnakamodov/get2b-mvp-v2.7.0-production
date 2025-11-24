import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from 'next/server'

interface ProductHistoryItem {
  category?: string;
  product_name?: string; 
  total_value?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id параметр обязателен' },
        { status: 400 }
      )
    }

    // Анализируем категории из истории товаров пользователя
    const { data: productHistory, error: historyError } = await supabase
      .from('project_product_history')
      .select('category, product_name, total_value')
      .eq('user_id', userId)

    if (historyError) {
      console.error('❌ Ошибка загрузки истории товаров:', historyError)
      return NextResponse.json(
        { error: 'Ошибка загрузки истории товаров' },
        { status: 500 }
      )
    }

    // Группируем по категориям и считаем статистику
    const categoryStats: { [key: string]: { 
      count: number, 
      totalValue: number, 
      products: string[] 
    } } = {}

    productHistory?.forEach((item: ProductHistoryItem) => {
      const category = item.category || 'Прочее'
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalValue: 0,
          products: []
        }
      }
      
      categoryStats[category].count += 1
      categoryStats[category].totalValue += item.total_value || 0
      
      if (item.product_name && !categoryStats[category].products.includes(item.product_name)) {
        categoryStats[category].products.push(item.product_name)
      }
    })

    // Сортируем категории по частоте использования
    const sortedCategories = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        frequency: stats.count,
        totalSpent: stats.totalValue,
        productCount: stats.products.length,
        topProducts: stats.products.slice(0, 3), // Топ 3 товара в категории
        percentage: Math.round((stats.count / (productHistory?.length || 1)) * 100)
      }))
      .sort((a, b) => b.frequency - a.frequency)

    // Определяем основные категории пользователя (>10% от всех заказов)
    const mainCategories = sortedCategories.filter(cat => cat.percentage >= 10)
    const topCategory = sortedCategories[0]?.category
    
    // Простой профиль пользователя
    const userProfile = {
      primaryCategory: topCategory,
      mainCategories: mainCategories.map(cat => cat.category),
      categoryPreferences: sortedCategories.slice(0, 5), // Топ 5 категорий
      totalOrders: productHistory?.length || 0,
      analysisDate: new Date().toISOString()
    }


    return NextResponse.json({
      success: true,
      userProfile,
      categories: sortedCategories,
      insights: {
        message: topCategory 
          ? `Вы часто работаете с категорией "${topCategory}" (${sortedCategories[0]?.percentage}% заказов)`
          : 'Недостаточно данных для анализа категорий',
        recommendation: mainCategories.length > 0
          ? `Рекомендуем поставщиков в категориях: ${mainCategories.map(c => c.category).join(', ')}`
          : 'Создайте больше проектов для персональных рекомендаций'
      }
    })

  } catch (error) {
    console.error('❌ Ошибка анализа категорий пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
} 