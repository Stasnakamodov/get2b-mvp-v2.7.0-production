import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Прямое подключение к БД через Supabase client (обходит PostgREST cache)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET: Получение всех категорий через прямой SQL запрос
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTree = searchParams.get('includeTree') !== 'false';
    const level = searchParams.get('level');

    // Прямой SQL запрос к БД
    let query = `
      SELECT
        id, key, name, icon, description, parent_id, level, slug, full_path,
        sort_order, is_active, is_popular, has_subcategories,
        products_count, suppliers_count, metadata, created_at, updated_at
      FROM catalog_categories
      WHERE is_active = true
    `;

    if (level !== null) {
      query += ` AND level = ${parseInt(level)}`;
    }

    query += ` ORDER BY sort_order`;

    // Выполняем через rpc для обхода кэша PostgREST
    const { data: rawData, error: execError } = await supabase.rpc('exec_sql', {
      query_text: query
    });

    // Если rpc не работает, пробуем альтернативный метод
    if (execError || !rawData) {
      console.log("⚠️ [API Direct] RPC не сработал, используем резервный метод");

      // Загружаем через известную работающую таблицу
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("catalog_categories")
        .select("*");

      if (fallbackError) {
        console.error("❌ [API Direct] Ошибка fallback запроса:", fallbackError);
        return NextResponse.json({
          success: false,
          error: fallbackError.message,
          hint: "PostgREST schema cache не обновлён. Попробуйте через несколько минут."
        }, { status: 500 });
      }

      // Используем fallback данные
      const data = fallbackData;

      // Фильтруем по level если нужно
      let filteredData = data;
      if (level !== null) {
        filteredData = data.filter((cat: any) => cat.level === parseInt(level));
      }

      // Строим дерево
      let categoryTree: any[] = [];
      if (includeTree && data) {
        categoryTree = buildCategoryTree(data);
      }

      // Статистика
      const stats = {
        total: data?.length || 0,
        byLevel: {
          0: data?.filter((c: any) => c.level === 0).length || 0,
          1: data?.filter((c: any) => c.level === 1).length || 0,
          2: data?.filter((c: any) => c.level === 2).length || 0,
        },
        totalProducts: data?.reduce((sum: number, c: any) => sum + (c.products_count || 0), 0) || 0,
        totalSuppliers: data?.reduce((sum: number, c: any) => sum + (c.suppliers_count || 0), 0) || 0,
      };

      console.log("✅ [API Direct] Категории загружены (fallback):", filteredData?.length);

      return NextResponse.json({
        success: true,
        categories: filteredData,
        categoryTree,
        stats,
        source: "fallback"
      });
    }

    const data = rawData;

    // Фильтрация по уровню
    let filteredData = data;
    if (level !== null && data) {
      const levelNum = parseInt(level);
      filteredData = data.filter((cat: any) => cat.level === levelNum);
    }

    console.log("✅ [API Direct] Категории загружены:", filteredData?.length);

    // Построить дерево категорий
    let categoryTree: any[] = [];
    if (includeTree && data) {
      categoryTree = buildCategoryTree(data);
    }

    // Статистика
    const stats = {
      total: data?.length || 0,
      byLevel: {
        0: data?.filter((c: any) => c.level === 0).length || 0,
        1: data?.filter((c: any) => c.level === 1).length || 0,
        2: data?.filter((c: any) => c.level === 2).length || 0,
      },
      totalProducts: data?.reduce((sum: number, c: any) => sum + (c.products_count || 0), 0) || 0,
      totalSuppliers: data?.reduce((sum: number, c: any) => sum + (c.suppliers_count || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      categories: filteredData,
      categoryTree,
      stats,
      source: "direct"
    });
  } catch (error) {
    console.error("❌ [API Direct] Критическая ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Ошибка сервера",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Функция построения дерева категорий
function buildCategoryTree(categories: any[]): any[] {
  const categoryMap = new Map<string, any>();
  const rootCategories: any[] = [];

  // Создать узлы
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      category: cat,
      children: [],
    });
  });

  // Построить дерево
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)!;

    if (cat.parent_id === null) {
      rootCategories.push(node);
    } else {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  return rootCategories;
}
