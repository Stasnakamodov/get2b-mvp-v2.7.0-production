import { type NextRequest, NextResponse } from "next/server";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 API /test-yandex-vision вызван");

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl обязателен" },
        { status: 400 }
      );
    }

    console.log("🔍 Тестируем Yandex Vision с URL:", imageUrl.substring(0, 100) + "...");

    // Получаем сервис Yandex Vision
    const visionService = getYandexVisionService();

    // Тестируем распознавание текста
    const extractedText = await visionService.recognizeText(imageUrl);

    console.log("✅ Тест успешен, извлеченный текст:", extractedText.substring(0, 200) + "...");

    return NextResponse.json({
      success: true,
      extractedText,
      message: "Yandex Vision API работает корректно"
    });
  } catch (error) {
    console.error("❌ Ошибка в тесте Yandex Vision:", error);
    return NextResponse.json(
      {
        error: "Ошибка тестирования Yandex Vision",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 