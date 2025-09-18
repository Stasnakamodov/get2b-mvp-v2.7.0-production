import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    console.log("📊 [API] Получение статистики по категориям");

    // Получаем статистику по товарам в verified (оранжевая комната)
    const { data: verifiedStats, error: verifiedError } = await supabase
      .from('catalog_verified_products')
      .select('category')
      .eq('is_active', true);

    // Получаем статистику по товарам в user (синяя комната) 
    const { data: userStats, error: userError } = await supabase
      .from('catalog_user_products')
      .select('category')
      .eq('is_active', true);

    if (verifiedError && userError) {
      console.error("❌ [API] Ошибка получения статистики:", { verifiedError, userError });
      return NextResponse.json({ error: "Ошибка получения данных" }, { status: 500 });
    }

    // Подсчитываем товары по категориям
    const categoryCounts: { [key: string]: { verified: number, user: number, total: number } } = {};
    
    // Счетчики для verified products
    if (verifiedStats) {
      verifiedStats.forEach((product: { category: string }) => {
        if (product.category) {
          if (!categoryCounts[product.category]) {
            categoryCounts[product.category] = { verified: 0, user: 0, total: 0 };
          }
          categoryCounts[product.category].verified++;
          categoryCounts[product.category].total++;
        }
      });
    }

    // Счетчики для user products
    if (userStats) {
      userStats.forEach((product: { category: string }) => {
        if (product.category) {
          if (!categoryCounts[product.category]) {
            categoryCounts[product.category] = { verified: 0, user: 0, total: 0 };
          }
          categoryCounts[product.category].user++;
          categoryCounts[product.category].total++;
        }
      });
    }

    // Добавляем базовые категории с нулевыми счетчиками если их нет
    const baseCategories = [
      'Автотовары', 'Электроника', 'Дом и быт', 
      'Здоровье и медицина', 'Продукты питания', 'Промышленность', 
      'Строительство', 'Текстиль и одежда'
    ];

    baseCategories.forEach(category => {
      if (!categoryCounts[category]) {
        categoryCounts[category] = { verified: 0, user: 0, total: 0 };
      }
    });

    console.log(`✅ [API] Статистика по категориям:`, Object.keys(categoryCounts).length);

    return NextResponse.json({
      success: true,
      categoryStats: categoryCounts
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка получения статистики:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}