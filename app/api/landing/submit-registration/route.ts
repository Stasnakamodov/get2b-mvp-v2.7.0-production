import { type NextRequest, NextResponse } from "next/server"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 API /landing/submit-registration вызван")

    const formData = await request.json()
    console.log("📦 Данные регистрации:", formData)

    // Validation
    if (!formData.name || !formData.inn || !formData.phone) {
      console.error("❌ Не все обязательные поля переданы")
      return NextResponse.json({
        error: "Заполните обязательные поля: название компании, ИНН, телефон"
      }, { status: 400 })
    }

    // Format the message for manager
    const message = `
🎯 НОВАЯ РЕГИСТРАЦИЯ С ЛЕНДИНГА

📋 Данные компании:
━━━━━━━━━━━━━━━━
📌 Название: ${formData.name || '—'}
📝 Юридическое название: ${formData.legalName || '—'}

🔢 Реквизиты:
━━━━━━━━━━━━━━━━
• ИНН: ${formData.inn || '—'}
• КПП: ${formData.kpp || '—'}
• ОГРН: ${formData.ogrn || '—'}
• Адрес: ${formData.address || '—'}

🏦 Банковские данные:
━━━━━━━━━━━━━━━━
• Банк: ${formData.bankName || '—'}
• Р/с: ${formData.bankAccount || '—'}
• БИК: ${formData.bik || '—'}
• Корр. счет: ${formData.correspondentAccount || '—'}

📞 Контактные данные:
━━━━━━━━━━━━━━━━
• Телефон: ${formData.phone || '—'}
• Email: ${formData.email || '—'}
• Сайт: ${formData.website || '—'}
• Директор: ${formData.director || '—'}

⏰ Время регистрации: ${new Date().toLocaleString('ru-RU')}

⚡️ ТРЕБУЕТСЯ: Связаться с клиентом в течение 15 минут!
    `.trim()

    console.log("📤 Отправляем в Telegram:", message.substring(0, 100) + "...")

    try {
      await sendTelegramMessage(message)
      console.log("✅ Регистрация отправлена менеджеру")
    } catch (telegramError) {
      console.error("❌ Ошибка отправки в Telegram:", telegramError)
      // Don't fail the request if Telegram fails - we still want to return success
      console.warn("⚠️ Продолжаем несмотря на ошибку Telegram")
    }

    return NextResponse.json({
      success: true,
      message: "Заявка успешно отправлена менеджеру"
    })
  } catch (error) {
    console.error("❌ Ошибка в API роуте:", error)
    console.error("❌ Детали ошибки:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      error: "Не удалось отправить заявку",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
