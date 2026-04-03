import { NextRequest, NextResponse } from "next/server"
import { logger } from "@/src/shared/lib/logger";
import { getUserFromRequest } from '@/lib/auth'
import { pool } from '@/lib/db/pool'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await pool.query(`
      ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS supplier_receipt_url TEXT,
      ADD COLUMN IF NOT EXISTS supplier_receipt_uploaded_at TIMESTAMPTZ;
    `)

    return NextResponse.json({
      success: true,
      message: "Fields added successfully or already exist"
    })
  } catch (error: any) {
    logger.error("Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 