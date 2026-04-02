import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_CERTIFICATIONS } from "@/src/shared/config";

const BASE_CATEGORIES = [
  'Автотовары', 'Электроника', 'Дом и быт',
  'Здоровье и красота', 'Продукты питания', 'Промышленность',
  'Строительство', 'Текстиль и одежда'
]

// GET: Categories with hierarchy, tree, and stats support
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get('includeSubcategories') !== 'false';
    const simpleList = searchParams.get('simple') === 'true';
    const treeMode = searchParams.get('tree') === 'true';
    const statsMode = searchParams.get('stats') === 'true';

    // ?stats=true — return product counts per category (replaces category-stats)
    if (statsMode) {
      const countPromises = BASE_CATEGORIES.map(async (category) => {
        const { count, error } = await db
          .from('catalog_verified_products')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('category', category)
        return { category, count: error ? 0 : (count || 0) }
      })
      const results = await Promise.all(countPromises)
      const categoryStats: Record<string, { verified: number; user: number; total: number }> = {}
      for (const { category, count } of results) {
        categoryStats[category] = { verified: count, user: 0, total: count }
      }
      const response = NextResponse.json({ success: true, categoryStats })
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      return response
    }

    // ?tree=true — return full category tree via RPC (replaces category-tree)
    if (treeMode) {
      const { data, error } = await db.rpc('get_category_tree')
      if (error) {
        console.error("[API] Category tree error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, tree: data })
    }

    // ?simple=true — return just category names
    if (simpleList) {
      const { data: categories, error } = await db
        .from("catalog_categories")
        .select("name")
        .order("name");

      if (error) {
        console.error("[API] Ошибка загрузки категорий:", error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }

      // Извлекаем названия категорий
      const categoryNames = categories?.map(c => c.name).filter(Boolean) || [];

      return NextResponse.json({
        success: true,
        categories: categoryNames,
        count: categoryNames.length
      });
    }

    // ПРАВИЛЬНАЯ АРХИТЕКТУРА: Используем отдельные таблицы
    // catalog_categories - корневые категории (8 штук)
    // catalog_subcategories - подкатегории (33 штуки)

    // Загружаем корневые категории
    const { data: rootCategories, error: categoriesError } = await db
      .from("catalog_categories")
      .select("*")
      .order("name");

    if (categoriesError) {
      console.error("[API] Ошибка загрузки категорий:", categoriesError);
      return NextResponse.json({
        success: false,
        error: categoriesError.message
      }, { status: 500 });
    }


    // ОПТИМИЗАЦИЯ: Загружаем подкатегории ТОЛЬКО если нужно
    let subcategories = null;
    if (includeSubcategories) {
      const { data, error: subcategoriesError } = await db
        .from("catalog_subcategories")
        .select("*")
        .order("name");

      if (subcategoriesError) {
        console.error("[API] Ошибка загрузки подкатегорий:", subcategoriesError);
        return NextResponse.json({
          success: false,
          error: subcategoriesError.message
        }, { status: 500 });
      }

      subcategories = data;
    }

    // ОПТИМИЗАЦИЯ: Загружаем подкатегории ТОЛЬКО если запрошено
    let categoriesWithSubcategories = rootCategories;
    let totalSubcategories = 0;

    if (includeSubcategories) {

      // Подсчитываем количество товаров через RPC (GROUP BY на сервере, без загрузки строк)
      const subcategoryIds = (subcategories || []).map(s => s.id);
      const countsBySubcategory: Record<string, number> = {};

      if (subcategoryIds.length > 0) {
        const { data: countData, error: rpcError } = await db.rpc(
          'count_products_by_subcategory',
          { subcategory_ids: subcategoryIds }
        );

        if (!rpcError && countData) {
          for (const row of countData) {
            if (row.subcategory_id) {
              countsBySubcategory[row.subcategory_id] = Number(row.count);
            }
          }
        } else if (rpcError) {
          console.warn("[API] RPC fallback: count_products_by_subcategory failed:", rpcError.message);
          // Fallback: parallel HEAD count queries
          const countPromises = subcategoryIds.map(async (id) => {
            const { count } = await db
              .from("catalog_verified_products")
              .select("*", { count: 'exact', head: true })
              .eq('subcategory_id', id)
              .eq('is_active', true);
            return { id, count: count || 0 };
          });
          const counts = await Promise.all(countPromises);
          for (const { id, count } of counts) {
            countsBySubcategory[id] = count;
          }
        }
      }

      const subcategoriesWithCounts = (subcategories || []).map(sub => ({
        ...sub,
        products_count: countsBySubcategory[sub.id] || 0
      }));

      // Count products directly by category name (single GROUP BY RPC instead of N HEAD queries)
      const countsByCategory: Record<string, number> = {};
      if (rootCategories && rootCategories.length > 0) {
        const categoryNames = rootCategories.map(cat => cat.name);
        const { data: catCountData, error: catRpcError } = await db.rpc(
          'count_products_by_category_name',
          { category_names: categoryNames }
        );

        if (!catRpcError && catCountData) {
          for (const row of catCountData) {
            if (row.category_name) {
              countsByCategory[row.category_name] = Number(row.count);
            }
          }
        } else if (catRpcError) {
          console.warn("[API] RPC fallback: count_products_by_category_name failed:", catRpcError.message);
          // Fallback: parallel HEAD count queries (N+1, only if RPC unavailable)
          const countPromises = rootCategories.map(async (cat) => {
            const { count } = await db
              .from("catalog_verified_products")
              .select("*", { count: 'exact', head: true })
              .eq('category', cat.name)
              .eq('is_active', true);
            return { name: cat.name, count: count || 0 };
          });
          const catCounts = await Promise.all(countPromises);
          for (const { name, count } of catCounts) {
            countsByCategory[name] = count;
          }
        }
      }

      // Добавляем подкатегории к корневым категориям
      categoriesWithSubcategories = rootCategories.map(category => {
        const catSubs = subcategoriesWithCounts?.filter(sub => sub.category_id === category.id) || [];
        const subcategoryTotal = catSubs.reduce((sum, s) => sum + (s.products_count || 0), 0);
        // Use direct category count when subcategory count is 0
        const directCount = countsByCategory[category.name] || 0;
        return {
          ...category,
          products_count: Math.max(subcategoryTotal, directCount),
          subcategories: catSubs,
        };
      });

      totalSubcategories = subcategories?.length || 0;
    } else {
    }

    // Статистика
    const stats = {
      total_categories: rootCategories?.length || 0,
      total_subcategories: totalSubcategories,
    };

    const response = NextResponse.json({
      success: true,
      categories: categoriesWithSubcategories,
      stats
    });

    // Cache for 60s, serve stale for 5 min
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

    return response;
  } catch (error) {
    console.error("[API] Критическая ошибка загрузки категорий:", error);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}

// POST: Синхронизация категорий из кода в БД
export async function POST() {
  try {

    // Получаем существующие категории
    const { data: existingCategories, error: selectError } = await db
      .from("catalog_categories")
      .select("key, name, id");

    if (selectError) {
      console.error("[API] Ошибка получения существующих категорий:", selectError);
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
    const { data, error } = await db
      .from("catalog_categories")
      .insert(categoriesToInsert)
      .select();

    if (error) {
      console.error("[API] Ошибка создания категорий:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    
    return NextResponse.json({ 
      message: "Категории успешно синхронизированы",
      created: data?.length || 0,
      existing: existingCategories?.length || 0,
      total: (existingCategories?.length || 0) + (data?.length || 0)
    });

  } catch (error) {
    console.error("[API] Критическая ошибка синхронизации:", error);
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
  const { data, error } = await db
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
  const { data, error } = await db
    .from("catalog_categories")
    .delete()
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
} 