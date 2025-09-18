import { NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function GET() {
  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN не установлен" }, { status: 400 })
  }

  try {
    console.log("🤖 Тестируем бота...")
    console.log("🔑 Токен:", TELEGRAM_BOT_TOKEN ? `${TELEGRAM_BOT_TOKEN.substring(0, 10)}...` : "Отсутствует")

    // Получаем информацию о боте
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`)
    const result = await response.json()

    console.log("🤖 Информация о боте:", result)

    if (result.ok) {
      return NextResponse.json({
        success: true,
        bot: result.result,
        message: "Бот работает корректно",
      })
    } else {
      return NextResponse.json(
        {
          error: result.description,
          error_code: result.error_code,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ Ошибка тестирования бота:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Неизвестная ошибка' }, { status: 500 })
  }
}
