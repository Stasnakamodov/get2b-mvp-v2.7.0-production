import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Прямой запрос к Supabase для диагностики
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const supplierId = searchParams.get("supplier_id");
    
    if (!table) {
      return NextResponse.json({ error: "table parameter required" }, { status: 400 });
    }
    
    console.log(`🔍 [DIRECT] Запрос к таблице: ${table}, supplier_id: ${supplierId}`);
    
    let query = supabase.from(table).select("*");
    
    if (supplierId) {
      query = query.eq("supplier_id", supplierId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`❌ [DIRECT] Ошибка запроса к ${table}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`✅ [DIRECT] Найдено записей в ${table}:`, data?.length || 0);
    
    return NextResponse.json(data || []);
    
  } catch (error: any) {
    console.error("💥 [DIRECT] Критическая ошибка:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}