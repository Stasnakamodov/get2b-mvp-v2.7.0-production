import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
// GET: Получение списка товаров с фильтрацией
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplier_id = searchParams.get("supplier_id");
    const category = searchParams.get("category");
    const in_stock = searchParams.get("in_stock");
    const supplier_type = searchParams.get("supplier_type") || "user"; // "user" или "verified"
    const search = searchParams.get("search"); // Поисковый запрос
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined; // Лимит результатов

    let userId: string | null = null;

    // Для verified (оранжевая комната) авторизация НЕ ТРЕБУЕТСЯ
    if (supplier_type === "verified") {
    } else {
      // Для user (синяя комната) требуется авторизация
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Проверяем токен через Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          logger.error("❌ [SECURITY] Недействительный токен авторизации");
          return NextResponse.json({ 
            error: "Unauthorized - недействительный токен" 
          }, { status: 401 });
        }
        
        userId = user.id;
      } else {
        // Fallback: пытаемся получить пользователя из сессии
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          logger.error("❌ [SECURITY] Пользователь не авторизован для user-товаров");
          return NextResponse.json({ 
            error: "Unauthorized - требуется авторизация" 
          }, { status: 401 });
        }
        
        userId = user.id;
      }
    }


    // Определяем таблицу на основе типа поставщика
    const tableName = supplier_type === "verified" ? "catalog_verified_products" : "catalog_user_products";

    let query = supabase
      .from(tableName)
      .select("*")
      .eq("is_active", true)  // Показываем только активные товары
      .order("created_at", { ascending: false });

    if (supplier_id) query = query.eq("supplier_id", supplier_id);
    if (category) query = query.eq("category", category);
    if (in_stock !== null && in_stock !== undefined) query = query.eq("in_stock", in_stock === "true");

    // Для пользовательских товаров добавляем фильтр по user_id
    if (supplier_type === "user") {
      query = query.eq("user_id", userId);
    }

    // Поиск по тексту (в названии и описании)
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Ограничение количества результатов
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

  if (error) {
    logger.error(`❌ [API] Ошибка получения товаров из ${tableName}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data });
  } catch (error) {
    logger.error("❌ [API] Критическая ошибка при получении товаров:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Добавление нового товара
export async function POST(request: NextRequest) {
  const productData = await request.json();

  // Валидация обязательных полей
  const requiredFields = ["name", "supplier_id"];
  for (const field of requiredFields) {
    if (!productData[field]) {
      return NextResponse.json({ error: `Поле ${field} обязательно` }, { status: 400 });
    }
  }

  // Определяем тип поставщика и соответствующую таблицу
  const supplier_type = productData.supplier_type || "user";
  const tableName = supplier_type === "verified" ? "catalog_verified_products" : "catalog_user_products";
  
  // Убираем supplier_type из данных для вставки, так как этого поля нет в таблице
  const { supplier_type: _, ...cleanProductData } = productData;
  
  // Добавляем user_id для пользовательских товаров
  if (supplier_type === "user" && !cleanProductData.user_id) {
    // Получаем user_id из поставщика
    const { data: supplier } = await supabase
      .from("catalog_user_suppliers")
      .select("user_id")
      .eq("id", cleanProductData.supplier_id)
      .single();
      
    if (supplier) {
      cleanProductData.user_id = supplier.user_id;
    }
  }

  // ИСПРАВЛЕНИЕ: Обеспечиваем наличие обязательного поля category
  if (!cleanProductData.category || cleanProductData.category === null) {
    // Получаем категорию поставщика как значение по умолчанию
    const { data: supplier } = await supabase
      .from(supplier_type === "verified" ? "catalog_verified_suppliers" : "catalog_user_suppliers")
      .select("category")
      .eq("id", cleanProductData.supplier_id)
      .single();
      
    cleanProductData.category = supplier?.category || "Без категории";
  }


  const { data, error } = await supabase
    .from(tableName)
    .insert([cleanProductData])
    .select()
    .single();

  if (error) {
    logger.error(`❌ [API] Ошибка создания товара в ${tableName}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}

// PATCH: Обновление товара
export async function PATCH(request: NextRequest) {
  const { id, supplier_type, ...updateData } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для обновления" }, { status: 400 });
  }

  const tableName = supplier_type === "verified" ? "catalog_verified_products" : "catalog_user_products";
  
  const { data, error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    logger.error(`❌ [API] Ошибка обновления товара в ${tableName}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ product: data });
}

// DELETE: Удаление товара
export async function DELETE(request: NextRequest) {
  const { id, supplier_type } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Поле id обязательно для удаления" }, { status: 400 });
  }

  const tableName = supplier_type === "verified" ? "catalog_verified_products" : "catalog_user_products";
  
  const { data, error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    logger.error(`❌ [API] Ошибка удаления товара из ${tableName}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ product: data });
} 