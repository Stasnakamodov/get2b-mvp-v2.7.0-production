import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// OPTIONS: Поддержка CORS и предварительных запросов
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET: Получение личных поставщиков пользователя (синяя комната)
export async function GET(request: NextRequest) {
  try {
    console.log("🔧 [DEBUG] Начинаем обработку запроса к user-suppliers");

    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Проверяем токен через Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Недействительный токен авторизации");
        return NextResponse.json({ 
          error: "Unauthorized - недействительный токен" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через токен, user_id:", userId);
    } else {
      // Fallback: пытаемся получить пользователя из сессии
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Пользователь не авторизован");
        return NextResponse.json({ 
          error: "Unauthorized - требуется авторизация" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через сессию, user_id:", userId);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); // Добавлено для получения одного поставщика
    const category = searchParams.get("category");
    const source_type = searchParams.get("source_type");
    const search = searchParams.get("search");
    const sort_by = searchParams.get("sort_by") || "total_projects";

    console.log("🔍 [DEBUG] Параметры запроса:", { id, category, source_type, search, sort_by });

    // СПЕЦИАЛЬНЫЙ СЛУЧАЙ: Получение одного поставщика по ID
    if (id) {
      console.log("🔍 [DEBUG] Запрос одного поставщика по ID:", id);
      console.log("🔍 [DEBUG] Текущий user_id:", userId);
      
      // Сначала проверим, существует ли поставщик вообще
      const { data: allSuppliers, error: allError } = await supabase
        .from("catalog_user_suppliers")
        .select("id, name, user_id, is_active")
        .eq("id", id);
      
      console.log("🔍 [DEBUG] Все поставщики с этим ID:", allSuppliers);
      console.log("🔍 [DEBUG] Ошибка при поиске всех:", allError);
      
      const { data: supplier, error: supplierError } = await supabase
        .from("catalog_user_suppliers")
        .select(`
          *,
          catalog_user_products (
            id, name, description, price, currency, in_stock, min_order, sku, images, category
          )
        `)
        .eq("id", id)
        .eq("is_active", true)
        .eq("user_id", userId)
        .single();

      console.log("🔍 [DEBUG] Результат запроса с фильтрами:");
      console.log("🔍 [DEBUG] - supplier:", supplier);
      console.log("🔍 [DEBUG] - supplierError:", supplierError);

      if (supplierError) {
        console.error("❌ [API] Ошибка получения поставщика по ID:", supplierError);
        return NextResponse.json({ error: "Поставщик не найден" }, { status: 404 });
      }

      console.log("✅ [API] Поставщик по ID загружен:", supplier?.name);
      return NextResponse.json({ supplier });
    }

    // ОСНОВНОЙ ЗАПРОС - показываем только поставщиков текущего пользователя
    let query = supabase
      .from("catalog_user_suppliers")
      .select(`
        *,
        catalog_user_products (
          id, name, price, currency, in_stock, min_order, images
        )
      `)
      .eq("is_active", true) // Только активные поставщики
      .eq("user_id", userId); // 🔥 ВОССТАНОВЛЕН: только поставщики текущего пользователя

    console.log("🔍 [DEBUG] Выполняем запрос с фильтрами: is_active=true, user_id=" + userId);

    // Фильтры
    if (category && category !== "all") {
      query = query.eq("category", category);
      console.log("🔍 [DEBUG] Добавлен фильтр по категории:", category);
    }

    if (source_type && source_type !== "all") {
      query = query.eq("source_type", source_type);
      console.log("🔍 [DEBUG] Добавлен фильтр по источнику:", source_type);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,description.ilike.%${search}%`);
      console.log("🔍 [DEBUG] Добавлен поиск:", search);
    }

    // Сортировка
    switch (sort_by) {
      case "total_projects":
        query = query.order("total_projects", { ascending: false });
        break;
      case "last_project_date":
        query = query.order("last_project_date", { ascending: false, nullsFirst: false });
        break;
      case "created_at":
        query = query.order("created_at", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      default:
        query = query.order("total_projects", { ascending: false });
    }

    console.log("🔍 [DEBUG] Сортировка установлена:", sort_by);

    const { data, error } = await query;

    if (error) {
      console.error("❌ [API] Ошибка получения личных поставщиков:", error);
      console.error("❌ [API] Детали ошибки:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ [API] Личные поставщики загружены для пользователя ${userId}:`, data?.length);
    console.log("📊 [API] Данные поставщиков:", JSON.stringify(data, null, 2));
    
    return NextResponse.json({ 
      suppliers: data,
      total: data?.length || 0,
      user_id: userId,
      debug: {
        filters_applied: { category, source_type, search, sort_by },
        query_executed: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    console.error("❌ [API] Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: "Internal server error", 
      debug: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST: Добавление нового личного поставщика
export async function POST(request: NextRequest) {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Проверяем токен через Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Недействительный токен авторизации");
        return NextResponse.json({ 
          error: "Unauthorized - недействительный токен" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через токен, user_id:", userId);
    } else {
      // Fallback: пытаемся получить пользователя из сессии
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Пользователь не авторизован");
        return NextResponse.json({ 
          error: "Unauthorized - требуется авторизация" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через сессию, user_id:", userId);
    }

    const supplierData = await request.json();
    console.log("🔧 [DEBUG POST] Получены данные поставщика:", JSON.stringify(supplierData, null, 2));
    console.log("🔧 [DEBUG POST] Logo URL в данных:", supplierData.logo_url);
    console.log("📊 [DEBUG POST] Статистика проектов:", {
      total: supplierData.total_projects,
      successful: supplierData.successful_projects,
      cancelled: supplierData.cancelled_projects,
      spent: supplierData.total_spent
    });

    // Валидация обязательных полей
    const requiredFields = ["name", "company_name", "category", "country"];
    for (const field of requiredFields) {
      if (!supplierData[field]) {
        return NextResponse.json({ 
          error: `Поле ${field} обязательно` 
        }, { status: 400 });
      }
    }

    // Проверяем дубликаты ТОЛЬКО среди АКТИВНЫХ поставщиков
    const { data: existingSupplier } = await supabase
      .from("catalog_user_suppliers")
      .select("id")
      .eq("user_id", userId)
      .eq("name", supplierData.name)
      .eq("company_name", supplierData.company_name)
      .eq("is_active", true) // 🔥 ИСПРАВЛЕНИЕ: проверяем только активных
      .single();

    if (existingSupplier) {
      return NextResponse.json({ 
        error: "Поставщик с таким именем и названием компании уже существует в вашем списке" 
      }, { status: 409 });
    }

    // Подготавливаем данные для вставки
    const insertData = {
      ...supplierData,
      user_id: userId,
      source_type: "user_added",
      is_active: true,
      // 📊 Используем статистику из запроса (эхо карточки) или устанавливаем 0 для новых поставщиков
      total_projects: supplierData.total_projects ?? 0,
      successful_projects: supplierData.successful_projects ?? 0,
      cancelled_projects: supplierData.cancelled_projects ?? 0,
      total_spent: supplierData.total_spent ?? 0
    };

    console.log("🔧 [DEBUG POST] Данные для вставки:", JSON.stringify(insertData, null, 2));
    console.log("🔧 [DEBUG POST] Logo URL для вставки:", insertData.logo_url);

    const { data, error } = await supabase
      .from("catalog_user_suppliers")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Ошибка создания личного поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ [API] Личный поставщик создан:", data.id);
    console.log("✅ [API] Созданный поставщик с logo_url:", data.logo_url);
    console.log("📊 [API] Статистика созданного поставщика:", {
      total: data.total_projects,
      successful: data.successful_projects,
      cancelled: data.cancelled_projects,
      spent: data.total_spent
    });
    return NextResponse.json({ supplier: data });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Обновление личного поставщика
export async function PATCH(request: NextRequest) {
  try {
    console.log("🔧 [DEBUG PATCH] Начинаем обработку PATCH запроса");
    console.log("🔧 [DEBUG PATCH] URL:", request.url);
    console.log("🔧 [DEBUG PATCH] Метод:", request.method);
    console.log("🔧 [DEBUG PATCH] Заголовки:", Object.fromEntries(request.headers.entries()));

    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Проверяем токен через Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Недействительный токен авторизации");
        return NextResponse.json({ 
          error: "Unauthorized - недействительный токен" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через токен, user_id:", userId);
    } else {
      // Fallback: пытаемся получить пользователя из сессии
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Пользователь не авторизован");
        return NextResponse.json({ 
          error: "Unauthorized - требуется авторизация" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через сессию, user_id:", userId);
    }

    const requestBody = await request.json();
    console.log("🔧 [DEBUG PATCH] Тело запроса:", JSON.stringify(requestBody, null, 2));
    
    const { id, ...updateData } = requestBody;
    
    if (!id) {
      console.error("❌ [DEBUG PATCH] Отсутствует ID в запросе");
      return NextResponse.json({ 
        error: "Поле id обязательно для обновления" 
      }, { status: 400 });
    }

    console.log("🔧 [DEBUG PATCH] Обновляем поставщика с ID:", id);
    console.log("🔧 [DEBUG PATCH] Данные для обновления:", JSON.stringify(updateData, null, 2));

    const { data, error } = await supabase
      .from("catalog_user_suppliers")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId) // Важно: пользователь может редактировать только свои записи
      .eq("is_active", true) // 🔥 ИСПРАВЛЕНИЕ: редактировать можно только активных поставщиков
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Ошибка обновления личного поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: "Поставщик не найден или у вас нет прав на его редактирование" 
      }, { status: 404 });
    }

    console.log("✅ [API] Личный поставщик обновлен:", data.id);
    return NextResponse.json({ supplier: data });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Мягкое удаление личного поставщика
export async function DELETE(request: NextRequest) {
  try {
    console.log("🔧 [DEBUG] Начинаем обработку DELETE запроса к user-suppliers");

    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Проверяем токен через Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Недействительный токен авторизации");
        return NextResponse.json({ 
          error: "Unauthorized - недействительный токен" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через токен, user_id:", userId);
    } else {
      // Fallback: пытаемся получить пользователя из сессии
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("❌ [SECURITY] Пользователь не авторизован");
        return NextResponse.json({ 
          error: "Unauthorized - требуется авторизация" 
        }, { status: 401 });
      }
      
      userId = user.id;
      console.log("✅ [SECURITY] Авторизация успешна через сессию, user_id:", userId);
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        error: "Поле id обязательно для удаления" 
      }, { status: 400 });
    }

    // Сначала проверяем, существует ли поставщик и принадлежит ли он пользователю
    console.log(`🔍 [API] Проверка поставщика ${id} для пользователя ${userId}`);
    
    const { data: existingSupplier, error: checkError } = await supabase
      .from("catalog_user_suppliers")
      .select("id, name, is_active")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingSupplier) {
      console.error("❌ [API] Поставщик не найден или принадлежит другому пользователю:", checkError);
      return NextResponse.json({ 
        error: "Поставщик не найден или у вас нет прав на его удаление" 
      }, { status: 404 });
    }

    if (!existingSupplier.is_active) {
      console.warn("⚠️ [API] Поставщик уже удален");
      return NextResponse.json({ 
        error: "Поставщик уже был удален ранее" 
      }, { status: 409 });
    }

    console.log(`✅ [API] Поставщик найден и активен: ${existingSupplier.name}`);

    // Мягкое удаление товаров поставщика
    console.log(`🔄 [API] Удаление товаров поставщика ${id}`);
    const { data: deletedProducts, error: productsError } = await supabase
      .from("catalog_user_products")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("supplier_id", id)
      .eq("is_active", true)
      .select();

    if (productsError) {
      console.warn("⚠️ [API] Ошибка при удалении товаров:", productsError);
    } else {
      console.log(`✅ [API] Удалено товаров: ${deletedProducts?.length || 0}`);
    }

    // Мягкое удаление поставщика
    const { data, error } = await supabase
      .from("catalog_user_suppliers")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Ошибка удаления личного поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: "Поставщик не найден или у вас нет прав на его удаление" 
      }, { status: 404 });
    }

    console.log("✅ [API] Личный поставщик удален:", data.id);
    return NextResponse.json({ 
      message: "Поставщик и его товары успешно удалены",
      supplier: data,
      deleted_products_count: deletedProducts?.length || 0
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 