import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server";

/**
 * Извлекает userId из токена авторизации или сессии.
 * Возвращает userId или NextResponse с ошибкой.
 */
async function extractUserId(request: NextRequest): Promise<string | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data: { user }, error } = await db.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized - недействительный токен" }, { status: 401 });
    }
    return user.id;
  }

  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized - требуется авторизация" }, { status: 401 });
  }
  return user.id;
}

// OPTIONS: Поддержка CORS и предварительных запросов
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [origin];
  const isAllowed = allowedOrigins.includes(origin);

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// GET: Получение личных поставщиков пользователя (синяя комната)
export async function GET(request: NextRequest) {
  try {
    const authResult = await extractUserId(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); // Добавлено для получения одного поставщика
    const category = searchParams.get("category");
    const source_type = searchParams.get("source_type");
    const search = searchParams.get("search");
    const sort_by = searchParams.get("sort_by") || "total_projects";


    // СПЕЦИАЛЬНЫЙ СЛУЧАЙ: Получение одного поставщика по ID
    if (id) {
      
      // Сначала проверим, существует ли поставщик вообще
      const { data: allSuppliers, error: allError } = await db
        .from("catalog_user_suppliers")
        .select("id, name, user_id, is_active")
        .eq("id", id);
      
      
      const { data: supplier, error: supplierError } = await db
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


      if (supplierError) {
        // Supplier not found by ID
        return NextResponse.json({ error: "Поставщик не найден" }, { status: 404 });
      }

      return NextResponse.json({ supplier });
    }

    // ОСНОВНОЙ ЗАПРОС - показываем только поставщиков текущего пользователя
    let query = db
      .from("catalog_user_suppliers")
      .select(`
        *,
        catalog_user_products (
          id, name, price, currency, in_stock, min_order, images
        )
      `)
      .eq("is_active", true) // Только активные поставщики
      .eq("user_id", userId); // 🔥 ВОССТАНОВЛЕН: только поставщики текущего пользователя


    // Фильтры
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (source_type && source_type !== "all") {
      query = query.eq("source_type", source_type);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,description.ilike.%${search}%`);
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


    const { data, error } = await query;

    if (error) {
      // Log suppressed in production
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    
    return NextResponse.json({
      suppliers: data,
      total: data?.length || 0
    });

  } catch (error) {
    // Critical error in GET
    return NextResponse.json({
      error: "Internal server error"
    }, { status: 500 });
  }
}

// POST: Добавление нового личного поставщика
export async function POST(request: NextRequest) {
  try {
    const authResult = await extractUserId(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const supplierData = await request.json();

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
    const { data: existingSupplier } = await db
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


    const { data, error } = await db
      .from("catalog_user_suppliers")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      // Create supplier error
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ supplier: data });

  } catch (error) {
    // Critical error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Обновление личного поставщика
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await extractUserId(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const requestBody = await request.json();
    
    const { id, ...updateData } = requestBody;
    
    if (!id) {
      // Missing ID
      return NextResponse.json({ 
        error: "Поле id обязательно для обновления" 
      }, { status: 400 });
    }


    const { data, error } = await db
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
      // Update supplier error
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: "Поставщик не найден или у вас нет прав на его редактирование" 
      }, { status: 404 });
    }

    return NextResponse.json({ supplier: data });

  } catch (error) {
    // Critical error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Мягкое удаление личного поставщика
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await extractUserId(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        error: "Поле id обязательно для удаления" 
      }, { status: 400 });
    }

    // Сначала проверяем, существует ли поставщик и принадлежит ли он пользователю
    
    const { data: existingSupplier, error: checkError } = await db
      .from("catalog_user_suppliers")
      .select("id, name, is_active")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingSupplier) {
      // Supplier not found or belongs to another user
      return NextResponse.json({ 
        error: "Поставщик не найден или у вас нет прав на его удаление" 
      }, { status: 404 });
    }

    if (!existingSupplier.is_active) {
      // Supplier already deleted
      return NextResponse.json({ 
        error: "Поставщик уже был удален ранее" 
      }, { status: 409 });
    }


    // Мягкое удаление товаров поставщика
    const { data: deletedProducts, error: productsError } = await db
      .from("catalog_user_products")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("supplier_id", id)
      .eq("is_active", true)
      .select();

    if (productsError) {
      // Products deletion error (non-critical)
    } else {
    }

    // Мягкое удаление поставщика
    const { data, error } = await db
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
      // Delete supplier error
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: "Поставщик не найден или у вас нет прав на его удаление" 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Поставщик и его товары успешно удалены",
      supplier: data,
      deleted_products_count: deletedProducts?.length || 0
    });

  } catch (error) {
    // Critical error
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 