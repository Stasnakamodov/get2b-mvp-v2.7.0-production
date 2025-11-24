import { type NextRequest, NextResponse } from "next/server"
import { sendTelegramProjectApprovalRequest } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    
    const { text, projectId, type } = await request.json()

    if (!text || !projectId) {
      console.error("❌ [API] Отсутствуют обязательные поля");
      return NextResponse.json({ error: "Text and projectId are required" }, { status: 400 })
    }

    await sendTelegramProjectApprovalRequest(text, projectId, type)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API] Ошибка в /api/telegram/send-project-approval:", error)
    console.error("❌ [API] Детали ошибки:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Failed to send approval request",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
