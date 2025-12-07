import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/src/shared/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST() {
  try {
    
    // Выполняем SQL запрос для добавления полей
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("id")
      .limit(1)

    if (error) {
      return NextResponse.json({ error: "Cannot access projects: " + error.message }, { status: 500 })
    }

    // Пробуем выполнить ALTER TABLE через raw SQL
    const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE projects 
        ADD COLUMN IF NOT EXISTS supplier_receipt_url TEXT,
        ADD COLUMN IF NOT EXISTS supplier_receipt_uploaded_at TIMESTAMPTZ;
      `
    })

    if (sqlError) {
      logger.error("SQL Error:", sqlError)
      
      // Если функция exec_sql не существует, попробуем другой способ
      const { error: directError } = await supabaseAdmin
        .from("projects")
        .update({ 
          supplier_receipt_url: "test",
          supplier_receipt_uploaded_at: new Date().toISOString()
        })
        .eq("id", "00000000-0000-0000-0000-000000000000")

      if (directError && directError.message.includes("column") && directError.message.includes("does not exist")) {
        return NextResponse.json({
          success: false,
          error: "Cannot add fields through API. Please add manually:",
          sql: `ALTER TABLE projects ADD COLUMN supplier_receipt_url TEXT, ADD COLUMN supplier_receipt_uploaded_at TIMESTAMPTZ;`,
          instructions: [
            "1. Go to Supabase Dashboard",
            "2. Open SQL Editor", 
            "3. Run the SQL command above",
            "4. Try uploading the file again"
          ]
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fields added successfully or already exist"
    })
  } catch (error: any) {
    logger.error("Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 