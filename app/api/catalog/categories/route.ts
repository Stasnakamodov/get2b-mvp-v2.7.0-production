import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORY_CERTIFICATIONS } from "@/components/catalog-categories-and-certifications";

// GET: Получение всех категорий с иерархией
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTree = searchParams.get('includeTree') !== 'false';
    const level = searchParams.get('level');

    // Пытаемся использовать разные RPC функции по приоритету
    let data: any[] = [];
    let rpcError: any = null;

    // Попытка 1: TEXT функция (самая простая, должна появиться в кэше быстрее)
    const { data: textData, error: textError } = await supabase.rpc('get_categories_as_text');

    if (!textError && textData) {
      try {
        data = JSON.parse(textData);
        console.log(`✅ [API] Категории загружены через TEXT RPC: ${data.length}`);
      } catch (parseError) {
        console.error("❌ [API] Ошибка парсинга TEXT RPC:", parseError);
        rpcError = parseError;
      }
    } else {
      rpcError = textError;
    }

    // Попытка 2: JSON функция
    if ((!data || data.length === 0) && rpcError) {
      const { data: jsonData, error: jsonError } = await supabase.rpc('get_categories_json', {
        p_include_inactive: false,
        p_level: level ? parseInt(level) : null
      });

      if (!jsonError && jsonData) {
        data = Array.isArray(jsonData) ? jsonData : JSON.parse(jsonData);
        rpcError = null;
        console.log(`✅ [API] Категории загружены через JSON RPC: ${data.length}`);
      } else {
        rpcError = jsonError;
      }
    }

    // Если RPC не работает (кэш не обновился), используем fallback
    if ((!data || data.length === 0) && rpcError) {
      console.log("⚠️ [API] RPC функция недоступна, используем fallback через VIEW");

      // Fallback 1: Пробуем VIEW (обходит кэш таблицы)
      let viewQuery = supabase
        .from("v_catalog_categories")
        .select("*");

      // Фильтр по уровню для VIEW
      if (level !== null) {
        viewQuery = viewQuery.eq("level", parseInt(level));
      }

      let { data: fallbackData, error: fallbackError } = await viewQuery;

      // Fallback 2: Если VIEW не работает, используем старую таблицу
      if (fallbackError) {
        console.log("⚠️ [API] VIEW недоступен, используем прямой select из таблицы");
        const result = await supabase
          .from("catalog_categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        fallbackData = result.data;
        fallbackError = result.error;
      }

      if (fallbackError) {
        console.error("❌ [API] Ошибка fallback запроса:", fallbackError);
        return NextResponse.json({
          success: false,
          error: fallbackError.message,
          hint: "PostgREST schema cache не обновлён. Попробуйте позже или обратитесь в поддержку."
        }, { status: 500 });
      }

      data = fallbackData || [];
      console.log(`✅ [API] Категории загружены через fallback: ${data.length}`);
    } else {
      // Преобразуем JSON ответ в массив
      data = jsonData ? (Array.isArray(jsonData) ? jsonData : JSON.parse(jsonData)) : [];
      console.log(`✅ [API] Категории загружены через RPC: ${data.length}`);
    }

    console.log("✅ [API] Категории загружены:", data?.length);

    // Построить дерево категорий
    let categoryTree: any[] = [];
    if (includeTree && data) {
      categoryTree = buildCategoryTree(data);
    }

    // Статистика
    const stats = {
      total: data?.length || 0,
      byLevel: {
        0: data?.filter(c => c.level === 0).length || 0,
        1: data?.filter(c => c.level === 1).length || 0,
        2: data?.filter(c => c.level === 2).length || 0,
      },
      totalProducts: data?.reduce((sum, c) => sum + (c.products_count || 0), 0) || 0,
      totalSuppliers: data?.reduce((sum, c) => sum + (c.suppliers_count || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      categories: data,
      categoryTree,
      stats
    });
  } catch (error) {
    console.error("❌ [API] Критическая ошибка загрузки категорий:", error);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
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

// POST: Синхронизация категорий из кода в БД
export async function POST() {
  try {
    console.log("🔄 [API] Начинаем синхронизацию категорий...");

    // Получаем существующие категории
    const { data: existingCategories, error: selectError } = await supabase
      .from("catalog_categories")
      .select("key, name, id");

    if (selectError) {
      console.error("❌ [API] Ошибка получения существующих категорий:", selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    const existingKeys = new Set(existingCategories?.map(cat => cat.key) || []);
    
    // Подготавливаем данные для вставки
    const categoriesToInsert = CATEGORY_CERTIFICATIONS
      .filter(cat => !existingKeys.has(cat.category.toLowerCase().replace(/\s+/g, '_')))
      .map(cat => ({
        key: cat.category.toLowerCase().replace(/\s+/g, '_'),
        name: cat.category,
        description: `${cat.category}. Сертификации: ${cat.certifications.join(', ')}`,
        icon: getCategoryIcon(cat.category),
        is_active: true
      }));

    if (categoriesToInsert.length === 0) {
      return NextResponse.json({ 
        message: "Все категории уже синхронизированы", 
        existing: existingCategories?.length || 0,
        total: CATEGORY_CERTIFICATIONS.length
      });
    }

    // Вставляем новые категории
    const { data, error } = await supabase
      .from("catalog_categories")
      .insert(categoriesToInsert)
      .select();

    if (error) {
      console.error("❌ [API] Ошибка создания категорий:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`✅ [API] Синхронизировано ${data?.length} новых категорий`);
    
    return NextResponse.json({ 
      message: "Категории успешно синхронизированы",
      created: data?.length || 0,
      existing: existingCategories?.length || 0,
      total: (existingCategories?.length || 0) + (data?.length || 0)
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка синхронизации:", error);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}

// Функция для получения иконки категории
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    "Текстиль и одежда": "👕",
    "Электроника и электротехника": "⚡",
    "Электроника": "📱", 
    "Оборудование и машиностроение": "⚙️",
    "FMCG (продукты, напитки, косметика)": "🛒",
    "Строительные материалы": "🏗️",
    "Мебель и интерьер": "🪑",
    "Химия и сырье": "⚗️",
    "Логистика и транспорт": "🚛"
  };
  
  return iconMap[category] || "📦";
}

// PATCH: Обновление категории
export async function PATCH(request: NextRequest) {
  const { id, ...updateData } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для обновления" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("catalog_categories")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

// DELETE: Удаление категории
export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для удаления" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("catalog_categories")
    .delete()
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
} 