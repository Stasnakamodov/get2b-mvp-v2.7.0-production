import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";
import { getYandexGPTService } from "@/lib/services/YandexGPTService";
import { getOptionalAuthUser } from "@/lib/api/getOptionalAuthUser";
import { buildOrFilter } from "@/lib/api/escapePostgrestTerm";

/**
 * POST /api/catalog/search-by-image
 * Поиск товаров по изображению с использованием:
 * - Yandex Vision Classification (категоризация)
 * - Yandex Vision OCR (распознавание текста)
 * - YandexGPT (умный анализ и генерация ключевых слов)
 */
export async function POST(request: NextRequest) {
  try {
    // BUG-4: Optional auth — log user if present, don't block anonymous
    const user = await getOptionalAuthUser(request);
    if (user) {
      logger.info(`[IMAGE SEARCH] Authenticated user: ${user.id}`);
    }

    const body = await request.json();
    const { image } = body; // Base64 encoded image

    if (!image) {
      return NextResponse.json(
        { error: "Изображение не предоставлено" },
        { status: 400 }
      );
    }

    // BUG-2: Server-side base64 size limit (~10MB image = ~13.3M base64 chars)
    if (image.length > 14_000_000) {
      return NextResponse.json(
        { error: "Изображение слишком большое. Максимум 10MB" },
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

      // BUG-6: Log OCR result instead of empty if/else
      if (ocrText && ocrText.trim()) {
        logger.info(`[IMAGE SEARCH] OCR text found: ${ocrText.trim().slice(0, 100)}`);
      } else {
        logger.info("[IMAGE SEARCH] No OCR text detected");
      }
    } catch (error) {
      // BUG-6: Log OCR errors instead of swallowing
      logger.warn("[IMAGE SEARCH] OCR failed, continuing without text:", error);
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


    // BUG-3: Use dynamic import only (removed duplicate top-level import)
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

    // BUG-1: Use safe buildOrFilter instead of raw string interpolation
    const safeTerms = searchTerms.filter((t): t is string => typeof t === 'string')
    const orFilter = buildOrFilter(safeTerms);

    let query = supabase
      .from("catalog_verified_products")
      .select("*")
      .eq("is_active", true);

    if (orFilter) {
      query = query.or(orFilter);
    }

    const { data: products, error } = await query.limit(20);

    if (error) {
      logger.error("[IMAGE SEARCH] Ошибка поиска товаров:", error);
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

  } catch (error: unknown) {
    // BUG-5: Don't leak error details to client
    logger.error("[IMAGE SEARCH] Ошибка:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
