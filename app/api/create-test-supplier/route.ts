import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 Создание тестового поставщика...");

    const { data, error } = await supabase
      .from('supplier_profiles')
      .upsert({
        id: '86cc190d-0c80-463b-b0df-39a25b22365f',
        user_id: '86cc190d-0c80-463b-b0df-39a25b22365f',
        name: 'Тестовый поставщик для файлов',
        company_name: 'Тестовая компания ООО',
        category: 'Электроника',
        country: 'Россия',
        description: 'Тестовый поставщик для проверки функциональности файлов в аккредитации',
        accreditation_status: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Ошибка создания поставщика:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Тестовый поставщик создан:", data.id);
    return NextResponse.json({ 
      success: true, 
      supplier: data 
    });

  } catch (error) {
    console.error("❌ Ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера" 
    }, { status: 500 });
  }
} 