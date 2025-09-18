import { type NextRequest, NextResponse } from "next/server"
import { sendTelegramDocument } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    console.log("📡 [API] /api/telegram/send-document вызван");
    
    const { documentUrl, caption } = await request.json()
    console.log("📋 [API] Получены данные:", { 
      documentUrl: documentUrl?.substring(0, 100) + "...", 
      caption: caption?.substring(0, 100) + "..." 
    });

    if (!documentUrl) {
      console.error("❌ [API] Отсутствует documentUrl");
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 })
    }

    console.log("🚀 [API] Вызываем sendTelegramDocument...");
    await sendTelegramDocument(documentUrl, caption)
    console.log("✅ [API] sendTelegramDocument выполнен успешно");

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ [API] Ошибка в /api/telegram/send-document:", error)
    console.error("❌ [API] Детали ошибки:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Failed to send document",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
