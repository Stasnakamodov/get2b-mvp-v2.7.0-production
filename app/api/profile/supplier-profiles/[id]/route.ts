import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// PUT: Обновление профиля поставщика
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // ВРЕМЕННО: Отключаем аутентификацию для тестирования
    const user = { id: "86cc190d-0c80-463b-b0df-39a25b22365f" };
    
    const supplierId = id;
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

    // Проверяем, что профиль принадлежит пользователю
    const { data: existingProfile, error: checkError } = await supabase
      .from("supplier_profiles")
      .select("id, user_id")
      .eq("id", supplierId)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingProfile) {
      return NextResponse.json({ 
        error: "Профиль поставщика не найден или нет доступа" 
      }, { status: 404 });
    }

    // Подготавливаем данные для обновления
    const updateData = {
      ...supplierData,
      updated_at: new Date().toISOString()
    };

    // Удаляем ID из данных обновления, если он есть
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.created_at;


    const { data, error } = await supabase
      .from("supplier_profiles")
      .update(updateData)
      .eq("id", supplierId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("❌ [API] Ошибка обновления профиля поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Удаление профиля поставщика
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // ВРЕМЕННО: Отключаем аутентификацию для тестирования
    const user = { id: "86cc190d-0c80-463b-b0df-39a25b22365f" };
    
    const supplierId = id;
    

    // Проверяем, что профиль принадлежит пользователю
    const { data: existingProfile, error: checkError } = await supabase
      .from("supplier_profiles")
      .select("id")
      .eq("id", supplierId)
      .eq("user_id", user.id)
      .single();

    if (checkError || !existingProfile) {
      return NextResponse.json({ 
        error: "Профиль поставщика не найден или нет доступа" 
      }, { status: 404 });
    }

    // Мягкое удаление - помечаем как неактивный
    const { error } = await supabase
      .from("supplier_profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", supplierId)
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ [API] Ошибка удаления профиля поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Профиль поставщика удален" });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 