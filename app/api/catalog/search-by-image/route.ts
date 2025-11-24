import { NextRequest, NextResponse } from "next/server";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";
import { getYandexGPTService } from "@/lib/services/YandexGPTService";

/**
 * POST /api/catalog/search-by-image
 * Поиск товаров по изображению с использованием:
 * - Yandex Vision Classification (категоризация)
 * - Yandex Vision OCR (распознавание текста)
 * - YandexGPT (умный анализ и генерация ключевых слов)
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


    // Получаем сервис Yandex Vision
    const visionService = getYandexVisionService();

    // Шаг 1: Классифицируем изображение
    const { labels, description } = await visionService.classifyImage(image);


    // Шаг 2: Распознаем текст на изображении (OCR)
    let ocrText = "";
    try {
      ocrText = await visionService.recognizeTextFromBase64(image);

      if (ocrText && ocrText.trim()) {
      } else {
      }
    } catch (error) {
    }

    // Шаг 3: YandexGPT - умный анализ товара
    const gptService = getYandexGPTService();
    const topLabels = labels
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(label => label.name);

    const gptAnalysis = await gptService.analyzeProductImage(
      image,
      ocrText,
      topLabels
    );

    // Шаг 4: Формируем поисковые запросы
    // Комбинируем ВСЕ источники данных
    const ocrWords = ocrText
      .split(/\s+/)
      .filter(word => word.length > 2 && !/^\d+$/.test(word))
      .slice(0, 5);

    // Объединяем все ключевые слова
    const searchTerms = [
      ...topLabels.slice(0, 3),           // Топ-3 метки из классификации
      ...ocrWords,                         // Слова из OCR
      gptAnalysis.brand,                   // Бренд от GPT
      gptAnalysis.category,                // Категория от GPT
      ...gptAnalysis.keywords.slice(0, 10) // Топ-10 ключевых слов от GPT
    ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i); // Убираем дубликаты


    // Импортируем supabase для поиска товаров
    const { supabase } = await import("@/lib/supabaseClient");

    // Ищем товары, которые содержат хотя бы один из поисковых терминов
    if (searchTerms.length === 0) {
      return NextResponse.json({
        success: true,
        labels,
        description,
        ocrText,
        gptAnalysis: {
          brand: gptAnalysis.brand,
          category: gptAnalysis.category,
          description: gptAnalysis.description
        },
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


    return NextResponse.json({
      success: true,
      labels,
      description,
      ocrText,
      gptAnalysis: {
        brand: gptAnalysis.brand,
        category: gptAnalysis.category,
        description: gptAnalysis.description
      },
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
