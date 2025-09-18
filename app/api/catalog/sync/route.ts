import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Запуск синхронизации каталога с данными из проектов
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔄 [API] Запуск синхронизации каталога для пользователя ${user.id}`);

    // Запускаем синхронизацию поставщиков
    const { data: syncResult, error: syncError } = await supabase.rpc('sync_catalog_suppliers');

    if (syncError) {
      console.error("❌ [API] Ошибка синхронизации каталога:", syncError);
      return NextResponse.json({ error: syncError.message }, { status: 500 });
    }

    console.log("✅ [API] Синхронизация каталога завершена:", syncResult);

    return NextResponse.json({
      message: "Синхронизация каталога успешно завершена",
      result: syncResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при синхронизации:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Получение статуса синхронизации и статистики
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем статистику личных поставщиков пользователя
    const { data: userStats, error: userStatsError } = await supabase
      .from("catalog_user_suppliers")
      .select("source_type, total_projects, total_spent, last_project_date")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (userStatsError) {
      console.error("❌ [API] Ошибка получения статистики пользователя:", userStatsError);
      return NextResponse.json({ error: userStatsError.message }, { status: 500 });
    }

    // Подсчитываем статистику
    const stats = {
      total_suppliers: userStats.length,
      extracted_from_projects: userStats.filter(s => s.source_type === 'extracted_from_7steps').length,
      manually_added: userStats.filter(s => s.source_type === 'user_added').length,
      imported_from_catalog: userStats.filter(s => s.source_type === 'imported_from_catalog').length,
      total_projects: userStats.reduce((sum, s) => sum + (s.total_projects || 0), 0),
      total_spent: userStats.reduce((sum, s) => sum + parseFloat(s.total_spent || '0'), 0),
      last_sync_date: userStats
        .map(s => s.last_project_date)
        .filter(d => d)
        .sort()
        .reverse()[0] || null
    };

    // Получаем общую статистику аккредитованных поставщиков
    const { data: verifiedStats, error: verifiedStatsError } = await supabase
      .from("catalog_verified_suppliers")
      .select("category, country, is_featured")
      .eq("is_active", true);

    if (verifiedStatsError) {
      console.error("❌ [API] Ошибка получения статистики аккредитованных поставщиков:", verifiedStatsError);
    }

    const verifiedStatsData = verifiedStats ? {
      total_verified: verifiedStats.length,
      featured: verifiedStats.filter(s => s.is_featured).length,
      by_category: verifiedStats.reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_country: verifiedStats.reduce((acc, s) => {
        acc[s.country] = (acc[s.country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    } : null;

    return NextResponse.json({
      user_catalog: stats,
      verified_catalog: verifiedStatsData,
      sync_available: true,
      last_check: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при получении статистики:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 