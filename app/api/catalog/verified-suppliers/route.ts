import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Получение аккредитованных поставщиков Get2B (оранжевая комната)
export async function GET(request: NextRequest) {
  try {
    console.log("🚀 [API] Получение аккредитованных поставщиков");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");

    // Если передан ID, возвращаем одного поставщика
    if (id) {
      const { data, error } = await supabase
        .from("catalog_verified_suppliers")
        .select(`
          *,
          catalog_verified_products (
            id, name, price, currency, in_stock, min_order, description, category, sku, images
          )
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("❌ [API] Ошибка получения аккредитованного поставщика по ID:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log("✅ [API] Аккредитованный поставщик загружен по ID:", data?.name);
      return NextResponse.json({ supplier: data });
    }

    // Иначе возвращаем список поставщиков БЕЗ продуктов для ускорения
    let query = supabase
      .from("catalog_verified_suppliers")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("public_rating", { ascending: false })
      .order("projects_count", { ascending: false });

    // Фильтры
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (country && country !== "all") {
      query = query.eq("country", country);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ [API] Ошибка получения аккредитованных поставщиков:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ [API] Аккредитованные поставщики загружены:", data?.length);
    return NextResponse.json({
      suppliers: data,
      total: data?.length || 0
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Добавление нового аккредитованного поставщика (только для менеджеров Get2B)
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Проверяем права менеджера (можно добавить проверку роли)
    // TODO: Добавить проверку роли менеджера Get2B

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

    const { data, error } = await supabase
      .from("catalog_verified_suppliers")
      .insert([{
        ...supplierData,
        verified_by: user.id,
        is_active: true,
        public_rating: 0,
        reviews_count: 0,
        projects_count: 0
      }])
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Ошибка создания аккредитованного поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ [API] Аккредитованный поставщик создан:", data.id);
    return NextResponse.json({ supplier: data });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Обновление аккредитованного поставщика (только для менеджеров)
export async function PATCH(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({
        error: "Поле id обязательно для обновления"
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("catalog_verified_suppliers")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Ошибка обновления аккредитованного поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ [API] Аккредитованный поставщик обновлен:", data.id);
    return NextResponse.json({ supplier: data });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}