"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Получить все категории напрямую из БД (обход PostgREST cache)
 */
export async function getAllCategoriesServer(options?: {
  level?: number;
  includeInactive?: boolean;
}) {
  try {
    // Формируем SQL запрос
    const query = `
      SELECT
        id, key, name, icon, description, parent_id, level, slug, full_path,
        sort_order, is_active, is_popular, has_subcategories,
        products_count, suppliers_count, metadata, created_at, updated_at
      FROM catalog_categories
      WHERE (is_active = true OR $1 = true)
        AND ($2::integer IS NULL OR level = $2)
      ORDER BY sort_order
    `;

    // Используем MCP для прямого SQL
    const { data, error } = await supabase.rpc('exec_raw_sql', {
      sql: query,
      params: [options?.includeInactive || false, options?.level || null]
    });

    if (error) {
      console.error("❌ [Server Action] Ошибка SQL:", error);
      return { success: false, error: error.message, categories: [] };
    }

    return { success: true, categories: data, error: null };
  } catch (err) {
    console.error("❌ [Server Action] Критическая ошибка:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      categories: []
    };
  }
}

/**
 * Получить дерево категорий
 */
export async function getCategoryTreeServer() {
  try {
    const result = await getAllCategoriesServer({ includeInactive: false });

    if (!result.success || !result.categories) {
      return { success: false, tree: [], error: result.error };
    }

    const tree = buildCategoryTree(result.categories);

    return { success: true, tree, error: null };
  } catch (err) {
    console.error("❌ [Server Action] Ошибка построения дерева:", err);
    return {
      success: false,
      tree: [],
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

// Вспомогательная функция построения дерева
function buildCategoryTree(categories: any[]): any[] {
  const categoryMap = new Map<string, any>();
  const rootCategories: any[] = [];

  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      ...cat,
      children: [],
    });
  });

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
