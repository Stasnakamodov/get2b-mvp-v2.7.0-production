import { type NextRequest, NextResponse } from "next/server";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl обязателен" }, { status: 400 });
    }

    console.log("🔍 ТЕСТ YANDEX VISION PDF");
    console.log("📄 URL файла:", fileUrl);

    // Получаем сервис Yandex Vision
    const visionService = getYandexVisionService();

    // Извлекаем текст из PDF
    const extractedText = await visionService.recognizeTextFromPdf(fileUrl);

    console.log("✅ ТЕСТ ЗАВЕРШЕН");
    console.log("📄 Длина извлеченного текста:", extractedText.length);
    console.log("📄 Превью текста:", extractedText.substring(0, 500));

    return NextResponse.json({
      success: true,
      textLength: extractedText.length,
      textPreview: extractedText.substring(0, 500),
      fullText: extractedText
    });
  } catch (error) {
    console.error("❌ Ошибка в тесте Yandex Vision PDF:", error);
    return NextResponse.json(
      { 
        error: "Ошибка тестирования", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 