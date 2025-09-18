import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [DEBUG] Проверяем содержимое таблицы catalog_user_suppliers");

    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization');
    let userId: string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      userId = user.id;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      userId = user.id;
    }

    console.log("✅ [DEBUG] Пользователь авторизован:", userId);

    // Проверяем все записи в таблице catalog_user_suppliers
    const { data: allSuppliers, error: allError } = await supabase
      .from("catalog_user_suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("❌ [DEBUG] Ошибка получения всех поставщиков:", allError);
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }

    console.log("📊 [DEBUG] Все записи в catalog_user_suppliers:", allSuppliers);

    // Проверяем записи текущего пользователя
    const { data: userSuppliers, error: userError } = await supabase
      .from("catalog_user_suppliers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (userError) {
      console.error("❌ [DEBUG] Ошибка получения поставщиков пользователя:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    console.log("📊 [DEBUG] Поставщики пользователя:", userSuppliers);

    // Проверяем таблицу project_templates
    const { data: templates, error: templatesError } = await supabase
      .from("project_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (templatesError) {
      console.error("❌ [DEBUG] Ошибка получения шаблонов:", templatesError);
    } else {
      console.log("📊 [DEBUG] Шаблоны пользователя:", templates);
    }

    return NextResponse.json({
      debug: {
        user_id: userId,
        all_suppliers_count: allSuppliers?.length || 0,
        user_suppliers_count: userSuppliers?.length || 0,
        templates_count: templates?.length || 0,
        all_suppliers: allSuppliers,
        user_suppliers: userSuppliers,
        templates: templates
      }
    });

  } catch (error) {
    console.error("❌ [DEBUG] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 