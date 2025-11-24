import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Исправление отсутствующих товаров у импортированных поставщиков
export async function POST(request: NextRequest) {
  try {

    // Получаем всех импортированных поставщиков без товаров
    const { data: importedSuppliers, error: suppliersError } = await supabase
      .from("catalog_user_suppliers")
      .select(`
        id,
        name,
        user_id,
        source_supplier_id
      `)
      .eq("source_type", "imported_from_catalog")
      .eq("is_active", true)
      .not("source_supplier_id", "is", null);

    if (suppliersError) {
      console.error('❌ [API] Ошибка получения поставщиков:', suppliersError);
      return NextResponse.json({ error: suppliersError.message }, { status: 500 });
    }


    const results = [];

    for (const supplier of importedSuppliers || []) {

      // Проверяем есть ли товары в синей комнате
      const { data: userProducts, error: userProductsError } = await supabase
        .from("catalog_user_products")
        .select("id")
        .eq("supplier_id", supplier.id)
        .eq("is_active", true);

      if (userProductsError) {
        console.error(`❌ [API] Ошибка проверки товаров ${supplier.name}:`, userProductsError);
        continue;
      }

      if (userProducts && userProducts.length > 0) {
        continue;
      }

      // Получаем товары из оранжевой комнаты
      const { data: verifiedProducts, error: verifiedProductsError } = await supabase
        .from("catalog_verified_products")
        .select("*")
        .eq("supplier_id", supplier.source_supplier_id);

      if (verifiedProductsError) {
        console.error(`❌ [API] Ошибка получения товаров из оранжевой комнаты для ${supplier.name}:`, verifiedProductsError);
        continue;
      }

      if (!verifiedProducts || verifiedProducts.length === 0) {
        continue;
      }


      // Импортируем товары с изображениями
      const userProductsToInsert = verifiedProducts.map(product => ({
        user_id: supplier.user_id,
        supplier_id: supplier.id,
        name: product.name,
        price: product.price,
        currency: product.currency || 'USD',
        category: product.category,
        description: product.description,
        min_order: product.min_order,
        in_stock: product.in_stock,
        images: product.images, // Добавляем изображения
        specifications: product.specifications, // Добавляем спецификации
        is_active: true
      }));

      const { data: insertedProducts, error: insertError } = await supabase
        .from("catalog_user_products")
        .insert(userProductsToInsert)
        .select();

      if (insertError) {
        console.error(`❌ [API] Ошибка импорта товаров для ${supplier.name}:`, insertError);
        results.push({
          supplier: supplier.name,
          success: false,
          error: insertError.message
        });
      } else {
        results.push({
          supplier: supplier.name,
          success: true,
          imported_products: insertedProducts?.length || 0
        });
      }
    }


    return NextResponse.json({
      message: "Исправление отсутствующих товаров завершено",
      results: results,
      total_suppliers_processed: results.length
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при исправлении товаров:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: Проверка состояния товаров у импортированных поставщиков
export async function GET(request: NextRequest) {
  try {
    // Получаем статистику по импортированным поставщикам
    const { data: importedSuppliers, error: suppliersError } = await supabase
      .from("catalog_user_suppliers")
      .select(`
        id,
        name,
        source_supplier_id,
        catalog_user_products (
          id
        )
      `)
      .eq("source_type", "imported_from_catalog")
      .eq("is_active", true)
      .not("source_supplier_id", "is", null);

    if (suppliersError) {
      return NextResponse.json({ error: suppliersError.message }, { status: 500 });
    }

    const analysis = [];

    for (const supplier of importedSuppliers || []) {
      const userProductsCount = supplier.catalog_user_products?.length || 0;

      // Получаем количество товаров в оранжевой комнате
      const { count: verifiedProductsCount } = await supabase
        .from("catalog_verified_products")
        .select("*", { count: 'exact' })
        .eq("supplier_id", supplier.source_supplier_id);

      analysis.push({
        supplier_name: supplier.name,
        products_in_blue_room: userProductsCount,
        products_in_orange_room: verifiedProductsCount || 0,
        needs_fix: userProductsCount === 0 && (verifiedProductsCount || 0) > 0
      });
    }

    return NextResponse.json({
      suppliers_analysis: analysis,
      suppliers_needing_fix: analysis.filter(s => s.needs_fix).length
    });

  } catch (error) {
    console.error("❌ [API] Ошибка анализа товаров:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}