import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json();
    
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId обязателен" }, { status: 400 });
    }

    console.log("🧪 Тестируем одобрение заявки:", applicationId);

    // Получаем данные заявки
    const { data: application, error: fetchError } = await supabase
      .from('accreditation_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    console.log("📋 Найдена заявка:", application.supplier_name);

    // Обновляем статус заявки
    const { error: updateError } = await supabase
      .from('accreditation_applications')
      .update({ 
        status: 'approved',
        reviewed_by: 'Тестовый менеджер',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log("✅ Статус заявки обновлен на approved");

    // Парсим application_data
    let applicationData: any = {};
    try {
      applicationData = typeof application.application_data === 'string' 
        ? JSON.parse(application.application_data) 
        : application.application_data;
    } catch (e) {
      console.warn("⚠️ Ошибка парсинга application_data:", e);
    }

    // Маппинг категорий для замены неразрешенных на разрешенные
    const categoryMapping: { [key: string]: string } = {
      'Тестовая категория': 'Электроника',
      'танковая': 'Автотовары',
      '321d': 'Текстиль и одежда',
      '312312': 'Текстиль и одежда',
      '.kjblubuy': 'Спорт и отдых',
      '12412': 'Электроника'
    };

    const mappedCategory = categoryMapping[application.category] || application.category;

    // 🟠 СОЗДАЕМ ЗАПИСЬ В ОРАНЖЕВОМ КАБИНЕТЕ (catalog_verified_suppliers)
    const verifiedSupplierData = {
      name: application.supplier_name,
      company_name: application.company_name,
      category: mappedCategory,
      country: application.country,
      description: applicationData.description || '',
      contact_email: applicationData.contact_email || '',
      contact_phone: applicationData.contact_phone || '',
      website: applicationData.website || '',
      contact_person: applicationData.contact_person || '',
      min_order: applicationData.min_order || '',
      response_time: applicationData.response_time || '',
      employees: applicationData.employees || '',
      established: applicationData.established || '',
      certifications: applicationData.certifications || null,
      specialties: applicationData.specialties || null,
      payment_methods: applicationData.payment_methods || null,
      logo_url: applicationData.logo_url || null,
      moderation_status: 'approved',
      moderated_by: null,
      moderated_at: new Date().toISOString(),
      is_verified: true,
      is_active: true,
      public_rating: 0,
      reviews_count: 0,
      projects_count: 0,
      success_rate: 0
    };

    console.log("🟠 Создаем поставщика в оранжевом кабинете:", verifiedSupplierData.name);

    const { data: verifiedSupplier, error: createError } = await supabase
      .from('catalog_verified_suppliers')
      .insert([verifiedSupplierData])
      .select()
      .single();

    if (createError) {
      console.error("❌ Ошибка создания поставщика в оранжевом кабинете:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    console.log("✅ Поставщик создан в оранжевом кабинете:", verifiedSupplier.id);

    // Обновляем заявку с ID созданного поставщика
    await supabase
      .from('accreditation_applications')
      .update({ 
        verified_supplier_id: verifiedSupplier.id 
      })
      .eq('id', applicationId);

    console.log("✅ Заявка обновлена с verified_supplier_id");

    // 📦 КОПИРУЕМ ТОВАРЫ В ОРАНЖЕВЫЙ КАБИНЕТ (если есть)
    if (application.products_data) {
      try {
        const products = typeof application.products_data === 'string' 
          ? JSON.parse(application.products_data) 
          : application.products_data;

        if (Array.isArray(products) && products.length > 0) {
          console.log("📦 Копируем товары:", products.length);
          
          const verifiedProducts = products.map((product: any) => ({
            supplier_id: verifiedSupplier.id,
            name: product.name || 'Товар без названия',
            description: product.description || '',
            category: product.category || application.category,
            price: product.price || 0,
            currency: product.currency || 'USD',
            min_order: product.min_order || '',
            in_stock: true,
            image_url: product.image_url || null,
            certification: product.certification || null
          }));

          await supabase
            .from('catalog_verified_products')
            .insert(verifiedProducts);
          
          console.log("✅ Товары скопированы в оранжевый кабинет");
        }
      } catch (productError) {
        console.warn("⚠️ Ошибка копирования товаров:", productError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Заявка одобрена! Поставщик добавлен в оранжевый кабинет.",
      application_id: applicationId,
      verified_supplier_id: verifiedSupplier.id,
      supplier_name: application.supplier_name
    });

  } catch (error) {
    console.error("❌ Test approve accreditation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 