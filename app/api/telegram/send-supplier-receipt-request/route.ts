import { type NextRequest, NextResponse } from "next/server"
import { sendSupplierReceiptRequestToManager } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const { projectId, email, companyName, amount, currency, paymentMethod, requisites } = await request.json()

    console.log("[API] Получен запрос на отправку уведомления менеджеру:", {
      projectId,
      email,
      companyName,
      amount,
      currency,
      paymentMethod,
      requisites,
      types: {
        projectId: typeof projectId,
        email: typeof email,
        companyName: typeof companyName,
        amount: typeof amount,
        currency: typeof currency,
        paymentMethod: typeof paymentMethod,
        requisites: typeof requisites
      }
    })

    if (!projectId || !email || !companyName || amount === undefined || amount === null || !currency || !paymentMethod) {
      console.error("[API] Не все обязательные поля переданы:", {
        projectId: !!projectId,
        email: !!email,
        companyName: !!companyName,
        amount: amount !== undefined && amount !== null,
        currency: !!currency,
        paymentMethod: !!paymentMethod,
        values: {
          projectId,
          email,
          companyName,
          amount,
          currency,
          paymentMethod
        }
      })
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const result = await sendSupplierReceiptRequestToManager({
      projectId,
      email,
      companyName,
      amount,
      currency,
      paymentMethod,
      requisites,
    })

    console.log("[API] Результат отправки:", result)

    if (result?.success === false) {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to send request" 
      })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[API] Error sending supplier receipt request:", error)
    
    // Проверяем, является ли это ошибкой Telegram API
    if (error instanceof Error && error.message.includes('Telegram API error')) {
      return NextResponse.json({ 
        error: "Telegram API error", 
        details: error.message 
      }, { status: 502 })
    }
    
    return NextResponse.json({ 
      error: "Failed to send supplier receipt request", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
