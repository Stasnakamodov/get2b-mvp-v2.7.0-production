import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Импорт поставщика из каталога Get2B в личный список пользователя
export async function POST(request: NextRequest) {
  try {
    // Получаем токен из заголовков
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "Токен авторизации отсутствует" }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Устанавливаем сессию в Supabase клиенте
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verified_supplier_id } = await request.json();
    
    if (!verified_supplier_id) {
      return NextResponse.json({ 
        error: "verified_supplier_id обязателен" 
      }, { status: 400 });
    }

    // Получаем данные аккредитованного поставщика
    const { data: verifiedSupplier, error: fetchError } = await supabase
      .from("catalog_verified_suppliers")
      .select("*")
      .eq("id", verified_supplier_id)
      .eq("is_active", true)
      .single();

    if (fetchError || !verifiedSupplier) {
      return NextResponse.json({ 
        error: "Аккредитованный поставщик не найден" 
      }, { status: 404 });
    }

    // Проверяем, не импортирован ли уже этот поставщик (только активные)
    const { data: existingSupplier } = await supabase
      .from("catalog_user_suppliers")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_supplier_id", verified_supplier_id)
      .eq("is_active", true) // 🔥 ИСПРАВЛЕНИЕ: проверяем только активных поставщиков
      .single();

    // Проверяем, есть ли удаленный поставщик с таким же source_supplier_id
    const { data: deletedSupplier } = await supabase
      .from("catalog_user_suppliers")
      .select("id")
      .eq("user_id", user.id)
      .eq("source_supplier_id", verified_supplier_id)
      .eq("is_active", false) // Ищем удаленных поставщиков
      .single();

    if (existingSupplier) {
      return NextResponse.json({ 
        error: "Поставщик уже импортирован в ваш список" 
      }, { status: 409 });
    }

    // Если есть удаленный поставщик, восстанавливаем его
    if (deletedSupplier) {
      
      const { data: restoredSupplier, error: restoreError } = await supabase
        .from("catalog_user_suppliers")
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", deletedSupplier.id)
        .select()
        .single();

      if (restoreError) {
        console.error("❌ [API] Ошибка восстановления поставщика:", restoreError);
        return NextResponse.json({ error: restoreError.message }, { status: 500 });
      }

      // Восстанавливаем также товары поставщика
      const { data: restoredProducts, error: restoreProductsError } = await supabase
        .from("catalog_user_products")
        .update({ is_active: true })
        .eq("supplier_id", restoredSupplier.id)
        .eq("is_active", false)
        .select();

      if (restoreProductsError) {
        console.warn("⚠️ [API] Ошибка восстановления товаров:", restoreProductsError);
      } else if (restoredProducts) {
      }

      // Если товары не восстановились (их не было), импортируем заново
      let insertedProducts = [];
      if (!restoredProducts || restoredProducts.length === 0) {
        
        const { data: verifiedProducts } = await supabase
          .from("catalog_verified_products")
          .select("*")
          .eq("supplier_id", verified_supplier_id);
        
        if (verifiedProducts && verifiedProducts.length > 0) {
          const userProducts = verifiedProducts.map(product => ({
            user_id: user.id,
            supplier_id: restoredSupplier.id,
            name: product.name,
            price: product.price,
            currency: product.currency || 'USD',
            category: product.category,
            description: product.description,
            min_order: product.min_order,
            in_stock: product.in_stock,
            images: product.images,
            specifications: product.specifications
          }));

          const { data: newInsertedProducts } = await supabase
            .from("catalog_user_products")
            .insert(userProducts)
            .select();

          if (newInsertedProducts) {
            insertedProducts = newInsertedProducts;
          }
        }
      }

      const totalProductsCount = (restoredProducts?.length || 0) + (insertedProducts?.length || 0);
      
      return NextResponse.json({ 
        message: "Поставщик и товары восстановлены в ваш список",
        supplier: restoredSupplier,
        restored_products_count: totalProductsCount
      });
    }

    // Импортируем поставщика с ВСЕМИ полями
    const { data: newSupplier, error: insertError } = await supabase
      .from("catalog_user_suppliers")
      .insert([{
        user_id: user.id,
        
        // Основная информация
        name: verifiedSupplier.name || 'Supplier',
        company_name: verifiedSupplier.company_name || 'Company',
        category: verifiedSupplier.category || 'Другое',
        country: verifiedSupplier.country || 'Не указано',
        city: verifiedSupplier.city || 'Не указано',
        description: verifiedSupplier.description || 'Описание не предоставлено',
        logo_url: verifiedSupplier.logo_url, // ⚠️ ВАЖНО: копируем логотип!
        
        // Контактная информация
        contact_email: verifiedSupplier.contact_email || 'contact@supplier.com',
        contact_phone: verifiedSupplier.contact_phone,
        website: verifiedSupplier.website,
        contact_person: verifiedSupplier.contact_person,
        
        // Бизнес-профиль
        min_order: verifiedSupplier.min_order || 'Не указан',
        response_time: verifiedSupplier.response_time || 'Не указано',
        employees: verifiedSupplier.employees,
        established: verifiedSupplier.established,
        certifications: verifiedSupplier.certifications,
        specialties: verifiedSupplier.specialties,
        payment_methods: verifiedSupplier.payment_methods,
        
        // Источник данных
        source_type: 'imported_from_catalog',
        source_supplier_id: verified_supplier_id,
        import_date: new Date().toISOString(),
        is_active: true
      }])
      .select()
      .single();

    if (insertError) {
      console.error("❌ [API] Ошибка импорта поставщика:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Импортируем товары поставщика (если есть)
    let importedProducts = [];
    if (newSupplier) {
      // Получаем ВСЕ товары поставщика (убираем фильтр in_stock для корректного импорта)
      const { data: verifiedProducts, error: productsError } = await supabase
        .from("catalog_verified_products")
        .select("*")
        .eq("supplier_id", verified_supplier_id);

      
      if (productsError) {
        console.error(`❌ [API] Ошибка поиска товаров:`, productsError);
      }

      if (!productsError && verifiedProducts && verifiedProducts.length > 0) {
        const userProducts = verifiedProducts.map(product => ({
          user_id: user.id,
          supplier_id: newSupplier.id,
          name: product.name,
          price: product.price,
          currency: product.currency || 'USD',
          category: product.category,
          description: product.description,
          min_order: product.min_order,
          in_stock: product.in_stock,
          images: product.images,
          specifications: product.specifications
        }));

        const { data: insertedProducts, error: insertProductsError } = await supabase
          .from("catalog_user_products")
          .insert(userProducts)
          .select();

        if (!insertProductsError && insertedProducts) {
          importedProducts = insertedProducts;
        } else {
          console.warn("⚠️ [API] Ошибка импорта товаров:", insertProductsError);
        }
      }
    }

    
    return NextResponse.json({ 
      message: "Поставщик успешно импортирован в ваш личный список",
      supplier: newSupplier,
      imported_products_count: importedProducts.length
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при импорте поставщика:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Проверка возможности импорта поставщика
export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const verified_supplier_id = searchParams.get("verified_supplier_id");
    
    if (!verified_supplier_id) {
      return NextResponse.json({ 
        error: "verified_supplier_id обязателен" 
      }, { status: 400 });
    }

    // Проверяем, существует ли аккредитованный поставщик
    const { data: verifiedSupplier, error: verifiedError } = await supabase
      .from("catalog_verified_suppliers")
      .select("id, name, company_name, is_active")
      .eq("id", verified_supplier_id)
      .eq("is_active", true)
      .single();

    if (verifiedError || !verifiedSupplier) {
      return NextResponse.json({ 
        can_import: false,
        reason: "Аккредитованный поставщик не найден или неактивен"
      });
    }

    // Проверяем, не импортирован ли уже этот поставщик
    const { data: existingImport } = await supabase
      .from("catalog_user_suppliers")
      .select("id, name, import_date")
      .eq("user_id", user.id)
      .eq("source_supplier_id", verified_supplier_id)
      .eq("is_active", true)
      .single();

    if (existingImport) {
      return NextResponse.json({ 
        can_import: false,
        reason: "Поставщик уже импортирован в ваш личный список",
        existing_supplier: existingImport
      });
    }

    return NextResponse.json({ 
      can_import: true,
      verified_supplier: verifiedSupplier
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при проверке импорта:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 