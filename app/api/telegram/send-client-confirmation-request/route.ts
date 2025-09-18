import { type NextRequest, NextResponse } from "next/server"
import { sendTelegramDocument } from "@/lib/telegram"
import { supabase } from "@/lib/supabaseClient"

export async function POST(request: NextRequest) {
  try {
    const { projectId, email, companyName } = await request.json()
    if (!projectId || !email || !companyName) {
      console.error("❌ Не все поля переданы", { projectId, email, companyName });
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }
    // Получаем ссылку на подтверждение из Supabase
    const { data, error } = await supabase
      .from("projects")
      .select("client_confirmation_url")
      .eq("id", projectId)
      .single();
    if (error || !data?.client_confirmation_url) {
      console.error("❌ Нет ссылки на подтверждение или ошибка запроса", { error, data });
      return NextResponse.json({ error: "No confirmation file" }, { status: 400 })
    }
    // Отправляем файл в Telegram менеджеру
    try {
      const telegramResponse = await sendTelegramDocument(
        data.client_confirmation_url,
        `Клиент загрузил подтверждение по проекту ${projectId}\nКомпания: ${companyName}\nEmail: ${email}`
      )
      console.log("Ответ Telegram API:", telegramResponse)
    } catch (telegramError) {
      console.error("Ошибка отправки в Telegram:", telegramError)
      return NextResponse.json({ error: "Telegram error", details: String(telegramError) }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to send client confirmation request" }, { status: 500 })
  }
} 