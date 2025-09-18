import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || '91f29faa-be11-4348-a804-69293a84d4d5'
    
    // Получаем проект и все его поля
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      project: data,
      fields: Object.keys(data || {}),
      hasSupplierReceiptUrl: 'supplier_receipt_url' in (data || {}),
      hasSupplierReceiptUploadedAt: 'supplier_receipt_uploaded_at' in (data || {})
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 