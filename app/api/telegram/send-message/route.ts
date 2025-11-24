import { type NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {

    const body = await request.json()

    const { text } = await body

    if (!text) {
      console.error("❌ Текст не передан")
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    await sendTelegramMessage(text)

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
