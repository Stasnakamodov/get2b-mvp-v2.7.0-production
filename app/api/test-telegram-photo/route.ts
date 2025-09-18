import { NextRequest, NextResponse } from "next/server";
import { ChatBotService } from "@/lib/telegram/ChatBotService";

// POST: Тест отправки изображения в Telegram
export async function POST(request: NextRequest) {
  try {
    console.log("🧪 [TEST-PHOTO] Тест отправки изображения в Telegram");

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId') || process.env.TELEGRAM_CHAT_ID;

    if (!chatId) {
      return NextResponse.json({ 
        error: "Не указан chat_id" 
      }, { status: 400 });
    }

    // Получаем параметры из запроса или используем тестовые значения
    const body = await request.json().catch(() => ({}));
    const testImageUrl = body.imageUrl || "https://picsum.photos/400/300";
    const caption = body.caption || "🧪 Тестовое изображение для проверки функциональности Telegram бота";

    console.log("📤 [TEST-PHOTO] Отправляем изображение:", testImageUrl);

    try {
      const service = new ChatBotService();
      
      // Отправляем изображение
      const result = await service.sendPhoto(chatId, testImageUrl, caption);
      
      console.log("✅ [TEST-PHOTO] Изображение отправлено успешно:", result);

      return NextResponse.json({
        success: true,
        message: "Тестовое изображение отправлено в Telegram",
        result: result
      });

    } catch (telegramError) {
      console.error("❌ [TEST-PHOTO] Ошибка отправки в Telegram:", telegramError);
      return NextResponse.json({ 
        error: "Ошибка отправки в Telegram",
        details: telegramError instanceof Error ? telegramError.message : 'Неизвестная ошибка'
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ [TEST-PHOTO] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 