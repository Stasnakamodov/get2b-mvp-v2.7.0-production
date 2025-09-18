import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get("detail");
    const checkOrange = searchParams.get("orange");

    // Проверка поставщиков в оранжевом кабинете
    if (checkOrange === "true") {
      const { data: orangeSuppliers, error: orangeError } = await supabase
        .from("catalog_verified_suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (orangeError) {
        return NextResponse.json({ error: orangeError.message }, { status: 500 });
      }

      return NextResponse.json({
        message: "Поставщики в оранжевом кабинете",
        count: orangeSuppliers?.length || 0,
        suppliers: orangeSuppliers
      });
    }

    // Получение детальной информации о конкретной заявке
    if (detail) {
      const { data: application, error } = await supabase
        .from("accreditation_applications")
        .select("*")
        .eq("id", detail)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Проверяем, есть ли связанный поставщик в оранжевом кабинете
      let verifiedSupplier = null;
      if (application.verified_supplier_id) {
        const { data: supplier } = await supabase
          .from("catalog_verified_suppliers")
          .select("*")
          .eq("id", application.verified_supplier_id)
          .single();
        
        verifiedSupplier = supplier;
      }

      return NextResponse.json({
        application,
        verified_supplier: verifiedSupplier,
        in_orange_cabinet: !!verifiedSupplier
      });
    }

    // Получение списка всех заявок
    const { data: applications, error } = await supabase
      .from("accreditation_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Последние заявки на аккредитацию",
      count: applications?.length || 0,
      applications
    });

  } catch (error) {
    console.error("❌ Test accreditation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 