import { NextRequest, NextResponse } from "next/server";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";

/**
 * POST /api/catalog/search-by-image
 * Поиск товаров по изображению с использованием Yandex Vision Classification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body; // Base64 encoded image

    if (!image) {
      return NextResponse.json(
        { error: "Изображение не предоставлено" },
        { status: 400 }
      );
    }

    console.log("🔍 [IMAGE SEARCH] Начинаем поиск товаров по изображению");

    // Получаем сервис Yandex Vision
    const visionService = getYandexVisionService();

    // Шаг 1: Классифицируем изображение
    const { labels, description } = await visionService.classifyImage(image);

    console.log("🏷️ [IMAGE SEARCH] Классификация:", { labels, description });

    // Шаг 2: Ищем товары по описанию
    // Берем топ-3 метки с наибольшей уверенностью
    const topLabels = labels
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(label => label.name);

    console.log("🔍 [IMAGE SEARCH] Ищем товары по меткам:", topLabels);

    // Импортируем supabase для поиска товаров
    const { supabase } = await import("@/lib/supabaseClient");

    // Ищем товары, которые содержат хотя бы одну из меток в названии или описании
    const searchQueries = topLabels.map(label =>
      `name.ilike.%${label}%,description.ilike.%${label}%`
    ).join(',');

    const { data: products, error } = await supabase
      .from("catalog_verified_products")
      .select("*")
      .eq("is_active", true)
      .or(searchQueries)
      .limit(20);

    if (error) {
      console.error("❌ [IMAGE SEARCH] Ошибка поиска товаров:", error);
      return NextResponse.json(
        { error: "Ошибка поиска товаров" },
        { status: 500 }
      );
    }

    console.log(`✅ [IMAGE SEARCH] Найдено товаров: ${products?.length || 0}`);

    return NextResponse.json({
      success: true,
      labels,
      description,
      products: products || [],
      searchQuery: topLabels.join(", ")
    });

  } catch (error: any) {
    console.error("❌ [IMAGE SEARCH] Ошибка:", error);
    return NextResponse.json(
      {
        error: error.message || "Внутренняя ошибка сервера",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
