import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Создание заявки на аккредитацию поставщика
export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_supplier_id, accreditation_notes } = await request.json();
    
    if (!user_supplier_id) {
      return NextResponse.json({ 
        error: "user_supplier_id обязателен" 
      }, { status: 400 });
    }

    // Получаем данные поставщика из профиля пользователя
    const { data: userSupplier, error: fetchError } = await supabase
      .from("supplier_profiles")
      .select("*")
      .eq("id", user_supplier_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !userSupplier) {
      return NextResponse.json({ 
        error: "Поставщик не найден в ваших профилях" 
      }, { status: 404 });
    }

    // Проверяем, нет ли уже заявки на аккредитацию или готового поставщика
    const { data: existingRequest } = await supabase
      .from("catalog_verified_suppliers")
      .select("id, name, moderation_status")
      .eq("company_name", userSupplier.company_name)
      .eq("country", userSupplier.country)
      .eq("is_active", true)
      .single();

    if (existingRequest) {
      if (existingRequest.moderation_status === 'approved') {
        return NextResponse.json({ 
          error: "Поставщик уже аккредитован в каталоге Get2B",
          existing_supplier: existingRequest
        }, { status: 409 });
      } else if (existingRequest.moderation_status === 'pending') {
        return NextResponse.json({ 
          error: "Заявка на аккредитацию уже подана и находится на рассмотрении",
          existing_request: existingRequest
        }, { status: 409 });
      }
    }

    // Создаем ЗАЯВКУ на аккредитацию (pending для модерации)
    const accreditationRequestData = {
      name: userSupplier.name,
      company_name: userSupplier.company_name,
      category: userSupplier.category || 'Разное',
      country: userSupplier.country,
      city: userSupplier.city,
      description: userSupplier.description,
      logo_url: userSupplier.logo_url,
      contact_email: userSupplier.contact_email,
      contact_phone: userSupplier.contact_phone,
      website: userSupplier.website,
      contact_person: userSupplier.contact_person,
      min_order: userSupplier.min_order,
      response_time: userSupplier.response_time,
      employees: userSupplier.employees,
      established: userSupplier.established,
      certifications: userSupplier.certifications,
      specialties: userSupplier.specialties,
      payment_methods: userSupplier.payment_methods,
      manager_notes: accreditation_notes || `Заявка от пользователя ${user.email}`,
      moderation_status: 'pending', // ← ЗАЯВКА НА МОДЕРАЦИЮ
      moderated_by: null,
      moderated_at: null,
      is_active: true,
      is_verified: false,
      is_featured: false,
      public_rating: 0,
      reviews_count: 0,
      projects_count: userSupplier.total_projects || 0,
      success_rate: userSupplier.successful_projects && userSupplier.total_projects 
        ? (userSupplier.successful_projects / userSupplier.total_projects) * 100 
        : 0
    };

    const { data: accreditationRequest, error: createError } = await supabase
      .from("catalog_verified_suppliers")
      .insert([accreditationRequestData])
      .select()
      .single();

    if (createError) {
      console.error("❌ [API] Ошибка создания заявки на аккредитацию:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Сохраняем товары в черновики для будущей модерации
    const { data: userProducts } = await supabase
      .from("catalog_user_products")
      .select("*")
      .eq("supplier_id", user_supplier_id)
      .eq("is_active", true);

    if (userProducts && userProducts.length > 0) {
      // Создаем черновик с товарами для модерации
      await supabase
        .from("supplier_drafts")
        .insert({
          user_id: user.id,
          name: `Аккредитация: ${userSupplier.name}`,
          supplier_data: {
            verified_supplier_id: accreditationRequest.id,
            source_user_supplier_id: user_supplier_id
          },
          products: userProducts,
          source_type: 'echo_card',
          current_step: 4,
          max_step_reached: 4
        });
    }

    // Отмечаем поставщика в синей комнате что заявка подана
    await supabase
      .from("catalog_user_suppliers")
      .update({
        accreditation_request_id: accreditationRequest.id,
        accreditation_request_date: new Date().toISOString()
      })
      .eq("id", user_supplier_id);

    // 📱 ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ В TELEGRAM
    try {
      await fetch('/api/telegram/send-accreditation-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: accreditationRequest.id,
          supplierName: userSupplier.name,
          companyName: userSupplier.company_name,
          country: userSupplier.country,
          category: userSupplier.category || 'Разное',
          userEmail: user.email,
          notes: accreditation_notes,
          productsCount: userProducts?.length || 0
        })
      });
    } catch (telegramError) {
      console.warn("⚠️ [API] Ошибка отправки уведомления в Telegram:", telegramError);
      // Не прерываем процесс, если Telegram недоступен
    }

    console.log("✅ [API] Заявка на аккредитацию подана:", accreditationRequest.id);
    return NextResponse.json({ 
      message: "Заявка на аккредитацию успешно подана на рассмотрение менеджерам",
      accreditation_request: accreditationRequest,
      products_included: userProducts?.length || 0,
      status: "pending_moderation"
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при подаче заявки:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 