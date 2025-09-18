import { NextRequest, NextResponse } from "next/server"

const TELEGRAM_MANAGER_BOT_TOKEN = '7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ'

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl } = await req.json()

    if (!webhookUrl) {
      return NextResponse.json({
        error: "Не указан URL вебхука"
      }, { status: 400 })
    }

    console.log("🔧 Настраиваем вебхук для менеджерского бота...")
    console.log("📡 URL вебхука:", webhookUrl)

    // Устанавливаем вебхук
    const webhookResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_MANAGER_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${webhookUrl}/api/telegram-manager-webhook`,
          allowed_updates: [
            "message",
            "callback_query"
          ],
          drop_pending_updates: true
        })
      }
    )

    const webhookData = await webhookResponse.json()

    if (!webhookData.ok) {
      console.error("❌ Ошибка установки вебхука:", webhookData)
      return NextResponse.json({
        error: `Ошибка установки вебхука: ${webhookData.description}`,
        details: webhookData
      }, { status: 500 })
    }

    console.log("✅ Вебхук успешно установлен!")
    console.log("📊 Ответ Telegram:", webhookData)

    // Получаем информацию о текущем вебхуке
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_MANAGER_BOT_TOKEN}/getWebhookInfo`
    )

    const infoData = await infoResponse.json()

    if (infoData.ok) {
      console.log("📋 Информация о вебхуке:", infoData.result)
    }

    return NextResponse.json({
      success: true,
      message: "Вебхук менеджерского бота успешно установлен",
      webhookUrl: `${webhookUrl}/api/telegram-manager-webhook`,
      telegramResponse: webhookData,
      webhookInfo: infoData.ok ? infoData.result : null
    })

  } catch (error) {
    console.error("❌ Ошибка настройки вебхука:", error)
    return NextResponse.json({
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : "Неизвестная ошибка"
    }, { status: 500 })
  }
}

// GET метод для проверки текущего вебхука
export async function GET() {
  try {
    console.log("🔍 Проверяем текущий вебхук менеджерского бота...")

    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_MANAGER_BOT_TOKEN}/getWebhookInfo`
    )

    const infoData = await infoResponse.json()

    if (!infoData.ok) {
      console.error("❌ Ошибка получения информации о вебхуке:", infoData)
      return NextResponse.json({
        error: `Ошибка получения информации: ${infoData.description}`,
        details: infoData
      }, { status: 500 })
    }

    console.log("📋 Текущая информация о вебхуке:", infoData.result)

    return NextResponse.json({
      success: true,
      webhookInfo: infoData.result
    })

  } catch (error) {
    console.error("❌ Ошибка получения информации о вебхуке:", error)
    return NextResponse.json({
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : "Неизвестная ошибка"
    }, { status: 500 })
  }
}