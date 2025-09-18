import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { supplierId, logoUrl } = await request.json();
    
    if (!supplierId || !logoUrl) {
      return NextResponse.json({ error: "supplierId и logoUrl обязательны" }, { status: 400 });
    }

    console.log("🖼️ Обновляем логотип для поставщика:", supplierId);

    const { data, error } = await supabase
      .from('catalog_verified_suppliers')
      .update({ logo_url: logoUrl })
      .eq('id', supplierId)
      .select()
      .single();

    if (error) {
      console.error("❌ Ошибка обновления логотипа:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Логотип обновлен для поставщика:", data.name);

    return NextResponse.json({ 
      success: true,
      message: "Логотип обновлен",
      supplier: {
        id: data.id,
        name: data.name,
        logo_url: data.logo_url
      }
    });

  } catch (error) {
    console.error("❌ Test update logo error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 