import { NextRequest, NextResponse } from "next/server";

// POST: Тест callback query для Telegram бота
export async function POST(request: NextRequest) {
  try {
    console.log("🧪 [TEST-CALLBACK] Тест callback query для Telegram бота");

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId') || '05fdf6bd-7f27-4e54-9b3f-485b938e7c33';
    const productIndex = searchParams.get('productIndex') || '0';

    // Симулируем callback query от Telegram
    const mockCallbackQuery = {
      id: "test-callback-" + Date.now(),
      from: {
        id: 6725753966,
        first_name: "Тестовый пользователь",
        username: "testuser"
      },
      message: {
        chat: {
          id: 6725753966
        }
      },
      data: `accredit_product_images_${applicationId}_${productIndex}`
    };

    console.log("📞 [TEST-CALLBACK] Симулируем callback query:", mockCallbackQuery.data);

    // Отправляем POST запрос к webhook обработчику
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/telegram-chat-webhook`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callback_query: mockCallbackQuery
      })
    });

    const result = await response.json();
    
    console.log("📤 [TEST-CALLBACK] Ответ webhook:", result);

    return NextResponse.json({
      success: true,
      message: "Callback query протестирован",
      webhook_response: result,
      callback_data: mockCallbackQuery.data
    });

  } catch (error) {
    console.error("❌ [TEST-CALLBACK] Ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 