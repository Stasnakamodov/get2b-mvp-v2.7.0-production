import { logger } from "@/src/shared/lib/logger"
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
// GET: Полное дерево категорий через SQL функцию
export async function GET() {
  try {
    // Использовать рекурсивный CTE для построения дерева
    const { data, error } = await supabase.rpc('get_category_tree');

    if (error) {
      logger.error("❌ [API Category Tree] Ошибка:", error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tree: data,
    });

  } catch (error) {
    logger.error("❌ [API Category Tree] Критическая ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Ошибка сервера"
    }, { status: 500 });
  }
}
