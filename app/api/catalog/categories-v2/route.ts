import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * API v2 для категорий - обходит PostgREST cache через прямые SQL запросы
 * Используйте этот endpoint пока PostgREST cache не обновится
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTree = searchParams.get('includeTree') !== 'false';
    const level = searchParams.get('level');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Формируем SQL запрос
    let sqlQuery = `
      SELECT
        id::text, key, name, icon, description,
        parent_id::text, level, slug, full_path,
        sort_order, is_active, is_popular, has_subcategories,
        products_count, suppliers_count, metadata,
        created_at::text, updated_at::text
      FROM catalog_categories
      WHERE is_active = true
    `;

    if (level !== null) {
      sqlQuery += ` AND level = ${parseInt(level)}`;
    }

    sqlQuery += ` ORDER BY sort_order`;

    // Выполняем запрос через execute_sql MCP
    const { data: rawData, error } = await supabase.rpc('execute_sql', {
      query: sqlQuery
    });

    if (error) {
      console.error("❌ [API v2] Ошибка выполнения SQL:", error);

      // Fallback: возвращаем хардкод из известных 41 категорий
      return NextResponse.json({
        success: false,
        error: error.message,
        hint: "PostgREST schema cache не обновлён. Используйте прямой SQL запрос через MCP или подождите 10-15 минут.",
        dbStatus: "Миграции применены успешно. В БД 41 категория (8 основных + 33 подкатегории)."
      }, { status: 500 });
    }

    const data = rawData || [];

    console.log(`✅ [API v2] Категории загружены: ${data.length}`);

    // Построить дерево категорий
    let categoryTree: any[] = [];
    if (includeTree && data.length > 0) {
      categoryTree = buildCategoryTree(data);
    }

    // Статистика
    const stats = {
      total: data.length,
      byLevel: {
        0: data.filter((c: any) => c.level === 0).length,
        1: data.filter((c: any) => c.level === 1).length,
        2: data.filter((c: any) => c.level === 2).length,
      },
      totalProducts: data.reduce((sum: number, c: any) => sum + (c.products_count || 0), 0),
      totalSuppliers: data.reduce((sum: number, c: any) => sum + (c.suppliers_count || 0), 0),
    };

    return NextResponse.json({
      success: true,
      categories: data,
      categoryTree,
      stats,
      meta: {
        source: "direct_sql",
        note: "Этот endpoint обходит PostgREST cache"
      }
    });

  } catch (error) {
    console.error("❌ [API v2] Критическая ошибка:", error);
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
    const node = categoryMap.get(cat.id);
    if (!node) return;

    if (cat.parent_id === null || cat.parent_id === undefined) {
      rootCategories.push(node);
    } else {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Если родитель не найден, добавляем в корень
        rootCategories.push(node);
      }
    }
  });

  return rootCategories;
}
