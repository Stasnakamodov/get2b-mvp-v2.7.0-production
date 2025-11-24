import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Получение профилей поставщиков пользователя
export async function GET(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("❌ [SECURITY] Пользователь не авторизован");
      return NextResponse.json({ 
        error: "Unauthorized - требуется авторизация" 
      }, { status: 401 });
    }
    
    
    const { data, error } = await supabase
      .from("supplier_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [API] Ошибка получения профилей поставщиков:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: data });
  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Создание нового профиля поставщика
export async function POST(request: NextRequest) {
  try {
    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("❌ [SECURITY] Пользователь не авторизован");
      return NextResponse.json({ 
        error: "Unauthorized - требуется авторизация" 
      }, { status: 401 });
    }
    
    
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

    // Проверяем дубликаты
    const { data: existingProfile } = await supabase
      .from("supplier_profiles")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", supplierData.name)
      .eq("company_name", supplierData.company_name)
      .eq("is_active", true)
      .single();

    if (existingProfile) {
      return NextResponse.json({ 
        error: "Профиль поставщика с таким именем и названием компании уже существует" 
      }, { status: 409 });
    }

    // Подготавливаем данные для вставки
    const insertData = {
      ...supplierData,
      user_id: user.id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };


    const { data, error } = await supabase
      .from("supplier_profiles")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Ошибка создания профиля поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 