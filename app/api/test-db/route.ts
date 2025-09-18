import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [TEST-DB] Проверка подключения к базе данных...");

    // Тест 1: Проверка подключения
    const { data: testData, error: testError } = await supabase
      .from('supplier_profiles')
      .select('count')
      .limit(1);

    if (testError) {
      console.error("❌ [TEST-DB] Ошибка подключения:", testError);
      return NextResponse.json({ 
        error: "Ошибка подключения к базе данных",
        details: testError.message 
      }, { status: 500 });
    }

    // Тест 2: Проверка структуры supplier_profiles
    let supplierColumns = null;
    let columnsError = null;
    try {
      const result = await supabase.rpc('get_table_columns', { table_name: 'supplier_profiles' });
      supplierColumns = result.data;
      columnsError = result.error;
    } catch (error) {
      columnsError = { message: 'RPC function not available' };
    }

    // Тест 3: Проверка поставщиков (без поля accreditation_status)
    const { data: suppliers, error: suppliersError } = await supabase
      .from('supplier_profiles')
      .select('id, name, company_name, category, country, user_id')
      .limit(5);

    if (suppliersError) {
      console.error("❌ [TEST-DB] Ошибка получения поставщиков:", suppliersError);
    }

    // Тест 4: Проверка существования таблицы accreditation_applications
    const { data: accreditationTest, error: accreditationError } = await supabase
      .from('accreditation_applications')
      .select('id')
      .limit(1);

    // Тест 5: Проверка существования таблицы catalog_verified_suppliers
    const { data: verifiedTest, error: verifiedError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id')
      .limit(1);

    console.log("✅ [TEST-DB] Проверка завершена");

    return NextResponse.json({
      success: true,
      message: "Подключение к базе данных работает",
      data: {
        supplier_profiles: {
          exists: !suppliersError,
          count: suppliers?.length || 0,
          sample: suppliers?.[0] || null,
          error: suppliersError?.message
        },
        accreditation_applications: {
          exists: !accreditationError,
          error: accreditationError?.message
        },
        catalog_verified_suppliers: {
          exists: !verifiedError,
          error: verifiedError?.message
        },
        columns: {
          supplier_profiles: supplierColumns || 'RPC not available',
          error: columnsError?.message
        }
      }
    });

  } catch (error) {
    console.error("❌ [TEST-DB] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Критическая ошибка при проверке базы данных",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 