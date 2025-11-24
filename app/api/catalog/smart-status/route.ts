import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface SmartStatusResponse {
  timestamp: string;
  status: string;
  tables: Record<string, { exists: boolean; count?: number; error?: string }>;
  functions: Record<string, { exists: boolean; error?: string; executed?: boolean; result_count?: number }>;
  errors: string[];
}

// GET: Проверка состояния умного каталога
export async function GET() {
  try {
    const results: SmartStatusResponse = {
      timestamp: new Date().toISOString(),
      status: "checking",
      tables: {},
      functions: {},
      errors: []
    };

    // 1. Проверка таблицы project_product_history
    try {
      const { count: historyCount, error: historyError } = await supabase
        .from("project_product_history")
        .select("*", { count: "exact", head: true });

      if (historyError) {
        results.errors.push(`project_product_history: ${historyError.message}`);
        results.tables.project_product_history = { exists: false, error: historyError.message };
      } else {
        results.tables.project_product_history = { exists: true, count: historyCount || 0 };
      }
    } catch (error) {
      results.errors.push(`project_product_history check failed: ${error}`);
      results.tables.project_product_history = { exists: false, error: String(error) };
    }

    // 2. Проверка таблицы supplier_usage_patterns
    try {
      const { count: patternsCount, error: patternsError } = await supabase
        .from("supplier_usage_patterns")
        .select("*", { count: "exact", head: true });

      if (patternsError) {
        results.errors.push(`supplier_usage_patterns: ${patternsError.message}`);
        results.tables.supplier_usage_patterns = { exists: false, error: patternsError.message };
      } else {
        results.tables.supplier_usage_patterns = { exists: true, count: patternsCount || 0 };
      }
    } catch (error) {
      results.errors.push(`supplier_usage_patterns check failed: ${error}`);
      results.tables.supplier_usage_patterns = { exists: false, error: String(error) };
    }

    // 3. Проверка функций через вызов
    try {
      // Пробуем вызвать функцию get_user_supplier_stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_supplier_stats', { target_user_id: '86cc190d-0c80-463b-b0df-39a25b22365f' });

      if (statsError) {
        results.functions.get_user_supplier_stats = { exists: false, error: statsError.message };
      } else {
        results.functions.get_user_supplier_stats = { exists: true, result_count: statsData?.length || 0 };
      }
    } catch (error) {
      results.functions.get_user_supplier_stats = { exists: false, error: String(error) };
    }

    // 4. Проверка функции update_supplier_usage_patterns
    try {
      const { data: updateData, error: updateError } = await supabase
        .rpc('update_supplier_usage_patterns', { target_user_id: '86cc190d-0c80-463b-b0df-39a25b22365f' });

      if (updateError) {
        results.functions.update_supplier_usage_patterns = { exists: false, error: updateError.message };
      } else {
        results.functions.update_supplier_usage_patterns = { exists: true, executed: true };
      }
    } catch (error) {
      results.functions.update_supplier_usage_patterns = { exists: false, error: String(error) };
    }

    // 5. Общий статус
    const hasErrors = results.errors.length > 0;
    const allTablesExist = Object.values(results.tables).every(table => table.exists);
    const someFunctionsWork = Object.values(results.functions).some(func => func.exists);

    if (!hasErrors && allTablesExist && someFunctionsWork) {
      results.status = "✅ Умный каталог работает";
    } else if (allTablesExist) {
      results.status = "⚠️ Таблицы созданы, но есть проблемы с функциями";
    } else {
      results.status = "❌ Умный каталог не готов";
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [SMART CATALOG] Критическая ошибка проверки:', error);
    return NextResponse.json({ 
      status: "❌ Критическая ошибка",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 