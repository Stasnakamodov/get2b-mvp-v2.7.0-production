import { type NextRequest, NextResponse } from "next/server"
import { ManagerBotService } from "@/lib/telegram/ManagerBotService"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 [TEST] Тестируем отправку в Telegram...")
    
    const service = new ManagerBotService()
    
    const testMessage = `🧪 ТЕСТОВОЕ СООБЩЕНИЕ
⏰ Время: ${new Date().toLocaleString('ru-RU')}
🔧 Статус: Webhook работает!
📡 Ngrok: https://52cef4a44337.ngrok-free.app
🤖 Бот: @Get2b_bot`

    console.log("📤 Отправляем тестовое сообщение...")
    const result = await service.sendMessage(testMessage)
    
    console.log("✅ Тестовое сообщение отправлено:", result)
    
    return NextResponse.json({ 
      success: true, 
      message: "Тестовое сообщение отправлено в Telegram",
      result 
    })
  } catch (error) {
    console.error("❌ Ошибка в тестовом API:", error)
    return NextResponse.json({ 
      error: "Failed to send test message",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 