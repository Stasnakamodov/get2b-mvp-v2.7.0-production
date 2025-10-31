import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORY_CERTIFICATIONS } from "@/components/catalog-categories-and-certifications";

// GET: Получение всех категорий с иерархией (Unified архитектура: catalog_categories с parent_id, без level)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get('includeSubcategories') !== 'false';

    // ПРАВИЛЬНАЯ АРХИТЕКТУРА: Используем отдельные таблицы
    // catalog_categories - корневые категории (8 штук)
    // catalog_subcategories - подкатегории (33 штуки)

    // Загружаем корневые категории
    const { data: rootCategories, error: categoriesError } = await supabase
      .from("catalog_categories")
      .select("*")
      .order("name");

    if (categoriesError) {
      console.error("❌ [API] Ошибка загрузки категорий:", categoriesError);
      return NextResponse.json({
        success: false,
        error: categoriesError.message
      }, { status: 500 });
    }

    // Загружаем подкатегории
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from("catalog_subcategories")
      .select("*")
      .order("name");

    if (subcategoriesError) {
      console.error("❌ [API] Ошибка загрузки подкатегорий:", subcategoriesError);
      return NextResponse.json({
        success: false,
        error: subcategoriesError.message
      }, { status: 500 });
    }

    console.log(`✅ [API] Загружено ${rootCategories?.length || 0} корневых категорий`);
    console.log(`✅ [API] Загружено ${subcategories?.length || 0} подкатегорий`);

    // Если нужно, добавляем подкатегории к корневым категориям
    let categoriesWithSubcategories = rootCategories;
    if (includeSubcategories) {
      categoriesWithSubcategories = rootCategories.map(category => ({
        ...category,
        subcategories: subcategories?.filter(sub => sub.category_id === category.id) || []
      }));
    }

    // Статистика
    const stats = {
      total_categories: rootCategories?.length || 0,
      total_subcategories: subcategories?.length || 0,
    };

    return NextResponse.json({
      success: true,
      categories: categoriesWithSubcategories,
      stats
    });
  } catch (error) {
    console.error("❌ [API] Критическая ошибка загрузки категорий:", error);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
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