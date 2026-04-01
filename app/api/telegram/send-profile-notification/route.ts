import { type NextRequest, NextResponse } from "next/server"
import { sendClientProfileNotificationToManager, sendSupplierProfileNotificationToManager } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    if (!type || (type !== "client" && type !== "supplier")) {
      return NextResponse.json({ error: "type must be 'client' or 'supplier'" }, { status: 400 })
    }

    if (type === "client") {
      const { userId, userName, userEmail, profileId, companyName, legalName, inn, kpp, ogrn, address, email, phone, bankName, bankAccount, corrAccount, bik } = data

      if (!userId || !profileId || !companyName) {
        return NextResponse.json({ error: "userId, profileId, companyName are required" }, { status: 400 })
      }

      const result = await sendClientProfileNotificationToManager({
        userId, userName, userEmail, profileId, companyName, legalName, inn, kpp, ogrn, address, email, phone, bankName, bankAccount, corrAccount, bik
      })

      return NextResponse.json({ success: true, result })
    }

    if (type === "supplier") {
      const { userId, userName, userEmail, profileId, companyName, category, country, city, description, contactEmail, contactPhone, website } = data

      if (!userId || !profileId || !companyName) {
        return NextResponse.json({ error: "userId, profileId, companyName are required" }, { status: 400 })
      }

      const result = await sendSupplierProfileNotificationToManager({
        userId, userName, userEmail, profileId, companyName, category, country, city, description, contactEmail, contactPhone, website
      })

      return NextResponse.json({ success: true, result })
    }
  } catch (error) {
    console.error("[API] Error sending profile notification:", error)
    return NextResponse.json({
      error: "Failed to send profile notification",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
