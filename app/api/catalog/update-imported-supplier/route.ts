import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
// POST: Обновление импортированного поставщика из оригинала
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_supplier_id } = await request.json();
    
    if (!user_supplier_id) {
      return NextResponse.json({ 
        error: "user_supplier_id обязателен" 
      }, { status: 400 });
    }

    // Проверяем, что поставщик существует и принадлежит пользователю
    const { data: userSupplier, error: fetchError } = await supabase
      .from("catalog_user_suppliers")
      .select("*")
      .eq("id", user_supplier_id)
      .eq("user_id", user.id)
      .eq("source_type", 'imported_from_catalog')
      .single();

    if (fetchError || !userSupplier) {
      return NextResponse.json({ 
        error: "Импортированный поставщик не найден" 
      }, { status: 404 });
    }

    // Получаем данные оригинального поставщика
    const { data: verifiedSupplier, error: verifiedError } = await supabase
      .from("catalog_verified_suppliers")
      .select("*")
      .eq("id", userSupplier.source_supplier_id)
      .eq("is_active", true)
      .single();

    if (verifiedError || !verifiedSupplier) {
      return NextResponse.json({ 
        error: "Оригинальный поставщик не найден или неактивен" 
      }, { status: 404 });
    }

    // Обновляем данные поставщика
    const { data: updatedSupplier, error: updateError } = await supabase
      .from("catalog_user_suppliers")
      .update({
        // Основная информация
        name: verifiedSupplier.name || userSupplier.name,
        company_name: verifiedSupplier.company_name || userSupplier.company_name,
        category: verifiedSupplier.category || userSupplier.category,
        country: verifiedSupplier.country || userSupplier.country,
        city: verifiedSupplier.city,
        description: verifiedSupplier.description,
        logo_url: verifiedSupplier.logo_url, // ⚠️ ВАЖНО: обновляем логотип!
        
        // Контактная информация
        contact_email: verifiedSupplier.contact_email,
        contact_phone: verifiedSupplier.contact_phone,
        website: verifiedSupplier.website,
        contact_person: verifiedSupplier.contact_person,
        
        // Бизнес-профиль
        min_order: verifiedSupplier.min_order,
        response_time: verifiedSupplier.response_time,
        employees: verifiedSupplier.employees,
        established: verifiedSupplier.established,
        certifications: verifiedSupplier.certifications,
        specialties: verifiedSupplier.specialties,
        payment_methods: verifiedSupplier.payment_methods,
        
        updated_at: new Date().toISOString()
      })
      .eq("id", user_supplier_id)
      .select()
      .single();

    if (updateError) {
      logger.error("❌ [API] Ошибка обновления поставщика:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    
    return NextResponse.json({ 
      message: "Данные поставщика успешно обновлены из оригинала",
      supplier: updatedSupplier,
      updated_from: {
        name: verifiedSupplier.name,
        company_name: verifiedSupplier.company_name
      }
    });

  } catch (error) {
    logger.error("❌ [API] Критическая ошибка при обновлении поставщика:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Проверка возможности обновления
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const user_supplier_id = searchParams.get("user_supplier_id");
    
    if (!user_supplier_id) {
      return NextResponse.json({ 
        error: "user_supplier_id обязателен" 
      }, { status: 400 });
    }

    // Проверяем, что поставщик существует и может быть обновлен
    const { data: userSupplier, error: fetchError } = await supabase
      .from("catalog_user_suppliers")
      .select("id, name, source_type, source_supplier_id, import_date")
      .eq("id", user_supplier_id)
      .eq("user_id", user.id)
      .eq("source_type", 'imported_from_catalog')
      .single();

    if (fetchError || !userSupplier) {
      return NextResponse.json({ 
        can_update: false,
        reason: "Импортированный поставщик не найден"
      });
    }

    // Проверяем, существует ли оригинальный поставщик
    const { data: verifiedSupplier, error: verifiedError } = await supabase
      .from("catalog_verified_suppliers")
      .select("id, name, company_name, is_active, updated_at")
      .eq("id", userSupplier.source_supplier_id)
      .eq("is_active", true)
      .single();

    if (verifiedError || !verifiedSupplier) {
      return NextResponse.json({ 
        can_update: false,
        reason: "Оригинальный поставщик не найден или неактивен"
      });
    }

    // Проверяем, есть ли обновления в оригинале
    const hasUpdates = verifiedSupplier.updated_at > userSupplier.import_date;

    return NextResponse.json({ 
      can_update: true,
      user_supplier: {
        id: userSupplier.id,
        name: userSupplier.name,
        import_date: userSupplier.import_date
      },
      verified_supplier: {
        id: verifiedSupplier.id,
        name: verifiedSupplier.name,
        company_name: verifiedSupplier.company_name,
        last_updated: verifiedSupplier.updated_at
      },
      has_updates: hasUpdates,
      reason: hasUpdates ? "Есть обновления в оригинальном поставщике" : "Данные актуальны"
    });

  } catch (error) {
    logger.error("❌ [API] Критическая ошибка при проверке обновления:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 