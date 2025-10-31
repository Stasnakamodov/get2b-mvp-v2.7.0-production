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

    // Шаг 2: Распознаем текст на изображении (OCR)
    let ocrText = "";
    try {
      console.log("📝 [IMAGE SEARCH] Запускаем OCR для распознавания текста...");
      ocrText = await visionService.recognizeTextFromBase64(image);

      if (ocrText && ocrText.trim()) {
        console.log("✅ [IMAGE SEARCH] Распознанный текст:", ocrText);
      } else {
        console.log("ℹ️ [IMAGE SEARCH] Текст на изображении не найден");
      }
    } catch (error) {
      console.log("⚠️ [IMAGE SEARCH] OCR не удался:", error);
    }

    // Шаг 3: Формируем поисковые запросы
    // Комбинируем метки классификации и распознанный текст
    const topLabels = labels
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(label => label.name);

    // Добавляем слова из OCR (фильтруем короткие слова и числа)
    const ocrWords = ocrText
      .split(/\s+/)
      .filter(word => word.length > 2 && !/^\d+$/.test(word))
      .slice(0, 5); // Берем первые 5 значимых слов

    const searchTerms = [...topLabels, ...ocrWords].filter(Boolean);

    console.log("🔍 [IMAGE SEARCH] Поисковые термины:", searchTerms);

    // Импортируем supabase для поиска товаров
    const { supabase } = await import("@/lib/supabaseClient");

    // Ищем товары, которые содержат хотя бы один из поисковых терминов
    if (searchTerms.length === 0) {
      console.log("⚠️ [IMAGE SEARCH] Не найдено поисковых терминов");
      return NextResponse.json({
        success: true,
        labels,
        description,
        ocrText,
        products: [],
        searchQuery: "Не удалось определить товар"
      });
    }

    // Формируем OR запрос для каждого термина (в названии или описании)
    const searchQueries = searchTerms.map(term =>
      `name.ilike.%${term}%,description.ilike.%${term}%`
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
      ocrText,
      products: products || [],
      searchQuery: searchTerms.join(", ")
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
