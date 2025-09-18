import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET() {
  try {
    // Проверяем существование полей supplier_receipt_url и supplier_receipt_uploaded_at
    const { data, error } = await supabase
      .from("projects")
      .select("id, supplier_receipt_url, supplier_receipt_uploaded_at")
      .limit(1)

    if (error) {
      // Если ошибка содержит информацию о несуществующих полях
      if (error.message.includes("supplier_receipt_url") || error.message.includes("supplier_receipt_uploaded_at")) {
        return NextResponse.json({
          fieldsExist: false,
          error: error.message,
          needsCreation: true
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      fieldsExist: true,
      message: "Fields supplier_receipt_url and supplier_receipt_uploaded_at exist"
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
} 