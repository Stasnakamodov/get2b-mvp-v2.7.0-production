import { type NextRequest, NextResponse } from "next/server"
import { sendTelegramProjectApprovalRequest } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    console.log("📡 [API] /api/telegram/send-project-approval вызван");
    
    const { text, projectId, type } = await request.json()
    console.log("📋 [API] Получены данные:", { text: text?.substring(0, 100) + "...", projectId, type });

    if (!text || !projectId) {
      console.error("❌ [API] Отсутствуют обязательные поля");
      return NextResponse.json({ error: "Text and projectId are required" }, { status: 400 })
    }

    console.log("🚀 [API] Вызываем sendTelegramProjectApprovalRequest...");
    await sendTelegramProjectApprovalRequest(text, projectId, type)
    console.log("✅ [API] sendTelegramProjectApprovalRequest выполнен успешно");

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
