import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Исправление изображений у импортированных товаров
export async function POST(request: NextRequest) {
  try {

    // Получаем все импортированные товары без изображений
    const { data: userProducts, error: productsError } = await supabase
      .from("catalog_user_products")
      .select(`
        id,
        name,
        supplier_id,
        images,
        catalog_user_suppliers!inner (
          source_supplier_id,
          name
        )
      `)
      .is("images", null)
      .not("catalog_user_suppliers.source_supplier_id", "is", null);

    if (productsError) {
      console.error('❌ [API] Ошибка получения товаров:', productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }


    const results = [];

    for (const userProduct of userProducts || []) {
      const sourceSupplierID = (userProduct.catalog_user_suppliers as any).source_supplier_id;
      
      // Находим соответствующий товар в оранжевой комнате по имени (может быть несколько дубликатов)
      const { data: verifiedProducts, error: verifiedError } = await supabase
        .from("catalog_verified_products")
        .select("images, specifications")
        .eq("supplier_id", sourceSupplierID)
        .eq("name", userProduct.name)
        .limit(1);

      if (verifiedError || !verifiedProducts || verifiedProducts.length === 0) {
        continue;
      }

      const verifiedProduct = verifiedProducts[0]; // Берем первый найденный товар

      if (!verifiedProduct.images || verifiedProduct.images.length === 0) {
        continue;
      }

      // Обновляем изображения
      const { data: updatedProduct, error: updateError } = await supabase
        .from("catalog_user_products")
        .update({
          images: verifiedProduct.images,
          specifications: verifiedProduct.specifications
        })
        .eq("id", userProduct.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ [API] Ошибка обновления товара ${userProduct.name}:`, updateError);
        results.push({
          product: userProduct.name,
          success: false,
          error: updateError.message
        });
      } else {
        results.push({
          product: userProduct.name,
          success: true,
          images_count: verifiedProduct.images?.length || 0
        });
      }
    }


    return NextResponse.json({
      message: "Исправление изображений товаров завершено",
      results: results,
      total_products_processed: results.length
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при исправлении изображений:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}