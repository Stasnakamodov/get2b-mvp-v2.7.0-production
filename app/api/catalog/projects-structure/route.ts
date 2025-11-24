import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Анализ структуры таблицы projects и связи с поставщиками
export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      table_structure: {},
      supplier_fields: {},
      sample_projects: [],
      analysis: {}
    };

    // 1. Получаем структуру таблицы projects через information_schema
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('sql', { 
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'projects' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      // Если функция sql не работает, попробуем другой подход
      results.table_structure = { error: "Нет доступа к information_schema", message: columnsError.message };
    } else {
      results.table_structure = columnsData;
    }

    // 2. Проверяем наличие полей для поставщиков в projects
    const supplierFields = ['supplier_id', 'supplier_type', 'supplier_data', 'company_data'];
    const fieldChecks: any = {};

    for (const field of supplierFields) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(field)
          .limit(1);

        if (error) {
          fieldChecks[field] = { exists: false, error: error.message };
        } else {
          fieldChecks[field] = { exists: true, sample_value: data?.[0]?.[field as keyof typeof data[0]] || null };
        }
      } catch (e) {
        fieldChecks[field] = { exists: false, error: String(e) };
      }
    }

    results.supplier_fields = fieldChecks;

    // 3. Получаем несколько примеров проектов для анализа
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('projects')
        .select('id, user_id, company_data, status, created_at')
        .limit(3)
        .order('created_at', { ascending: false });

      if (sampleError) {
        results.sample_projects = { error: sampleError.message };
      } else {
        results.sample_projects = sampleData;
      }
    } catch (e) {
      results.sample_projects = { error: String(e) };
    }

    // 4. Анализ данных поставщиков в проектах
    try {
      const { data: projectsWithSuppliers, error: suppliersError } = await supabase
        .from('projects')
        .select('company_data')
        .not('company_data', 'is', null)
        .limit(5);

      if (suppliersError) {
        results.analysis.suppliers_in_projects = { error: suppliersError.message };
      } else {
        const suppliersAnalysis = {
          total_projects_with_company_data: projectsWithSuppliers?.length || 0,
          company_data_examples: projectsWithSuppliers?.map(p => p.company_data) || []
        };
        results.analysis.suppliers_in_projects = suppliersAnalysis;
      }
    } catch (e) {
      results.analysis.suppliers_in_projects = { error: String(e) };
    }

    // 5. Общий анализ
    const hasSupplierFields = Object.values(fieldChecks).some((field: any) => field.exists);
    const hasCompanyData = results.analysis.suppliers_in_projects?.total_projects_with_company_data > 0;

    results.analysis.summary = {
      has_supplier_integration: hasSupplierFields,
      has_company_data: hasCompanyData,
      recommendation: hasSupplierFields ? 
        "✅ Поля для интеграции с каталогом есть" : 
        "⚠️ Нужно добавить поля supplier_id, supplier_type в таблицу projects",
      current_supplier_storage: hasCompanyData ?
        "Данные поставщиков сохраняются в поле company_data" :
        "Данные поставщиков не найдены"
    };

    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [PROJECTS STRUCTURE] Критическая ошибка:', error);
    return NextResponse.json({ 
      status: "❌ Критическая ошибка",
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 