import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { callback_data, application_id } = await request.json();
    
    console.log("🧪 [TEST-BOT-CALLBACK] Тестируем callback бота:", { callback_data, application_id });
    
    // Симулируем callback query от Telegram
    const mockCallbackQuery = {
      id: "test_callback_" + Date.now(),
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
        username: "testuser"
      },
      message: {
        message_id: 1,
        chat: {
          id: 123456789,
          type: "private"
        },
        date: Math.floor(Date.now() / 1000)
      },
      data: callback_data
    };

    // Отправляем запрос к webhook'у
    const webhookUrl = "http://localhost:3000/api/telegram-chat-webhook";
    
    console.log("📡 [TEST-BOT-CALLBACK] Отправляем запрос к webhook:", webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        update_id: Date.now(),
        callback_query: mockCallbackQuery
      })
    });

    const result = await response.text();
    
    console.log("📡 [TEST-BOT-CALLBACK] Ответ webhook:", result);

    return NextResponse.json({
      success: true,
      message: "Callback протестирован",
      callback_data,
      application_id,
      webhook_response: result
    });

  } catch (error) {
    console.error("❌ [TEST-BOT-CALLBACK] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 