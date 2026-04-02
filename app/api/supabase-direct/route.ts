import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";

// GET: Прямой запрос к Supabase для диагностики
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const supplierId = searchParams.get("supplier_id");
    
    if (!table) {
      return NextResponse.json({ error: "table parameter required" }, { status: 400 });
    }
    
    
    let query = db.from(table).select("*");
    
    if (supplierId) {
      query = query.eq("supplier_id", supplierId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logger.error(`❌ [DIRECT] Ошибка запроса к ${table}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    
    return NextResponse.json(data || []);
    
  } catch (error: any) {
    logger.error("💥 [DIRECT] Критическая ошибка:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}