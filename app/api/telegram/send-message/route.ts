import { type NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 API /telegram/send-message вызван")

    const body = await request.json()
    console.log("📦 Тело запроса:", body)

    const { text } = await body

    if (!text) {
      console.error("❌ Текст не передан")
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log("📤 Отправляем в Telegram:", text.substring(0, 100) + "...")
    await sendTelegramMessage(text)
    console.log("✅ Отправлено успешно")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Ошибка в API роуте:", error)
    console.error("❌ Детали ошибки:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Failed to send message",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
