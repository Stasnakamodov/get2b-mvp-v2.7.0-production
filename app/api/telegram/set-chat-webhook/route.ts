import { type NextRequest, NextResponse } from "next/server"

const TELEGRAM_CHAT_BOT_TOKEN = process.env.TELEGRAM_CHAT_BOT_TOKEN

export async function POST(req: NextRequest) {
  if (!TELEGRAM_CHAT_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_CHAT_BOT_TOKEN не установлен" }, { status: 400 })
  }

  try {
    const { webhookUrl } = await req.json()

    if (!webhookUrl) {
      return NextResponse.json({ error: "webhookUrl обязателен" }, { status: 400 })
    }

    console.log("🤖 Устанавливаем webhook для ChatHub Assistant:", webhookUrl)
    console.log("🔑 Используем чат-бот токен:", TELEGRAM_CHAT_BOT_TOKEN ? "Токен установлен" : "Токен отсутствует")

    // Сначала удаляем старый webhook
    const deleteResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    const deleteResult = await deleteResponse.json()
    console.log("🗑️ Удаление старого чат-бот webhook:", deleteResult)

    // Устанавливаем новый webhook для чат-бота
    const setResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true, // Очищаем старые обновления
      }),
    })

    const setResult = await setResponse.json()
    console.log("📡 ChatHub Assistant setWebhook ответ:", setResult)

    if (setResult.ok) {
      return NextResponse.json({
        success: true,
        result: setResult,
        message: "Webhook для ChatHub Assistant успешно установлен"
      })
    } else {
      console.error("❌ Ошибка установки webhook:", setResult)
      return NextResponse.json({ error: setResult.description || "Неизвестная ошибка" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("❌ Ошибка установки чат-бот webhook:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  if (!TELEGRAM_CHAT_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_CHAT_BOT_TOKEN не установлен" }, { status: 400 })
  }

  try {
    console.log("📋 Получаем информацию о чат-бот webhook")

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/getWebhookInfo`)
    const result = await response.json()

    console.log("📡 ChatHub Assistant getWebhookInfo ответ:", result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("❌ Ошибка получения чат-бот webhook info:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 