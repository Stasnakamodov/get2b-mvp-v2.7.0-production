import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Начинаем упрощенный анализ базы данных...");

    const analysis: any = {
      data: {},
      structures: {},
      summary: {}
    };

    // 1. Количество записей в основных таблицах
    const mainTables = [
      'client_profiles', 'supplier_profiles', 'projects', 
      'project_specifications', 'specifications',
      'catalog_verified_suppliers', 'catalog_user_suppliers',
      'catalog_verified_products', 'catalog_user_products',
      'chat_rooms', 'chat_messages', 'accreditation_applications'
    ];

    for (const tableName of mainTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          analysis.data[tableName] = count;
        } else {
          analysis.data[tableName] = 'TABLE_NOT_EXISTS';
        }
      } catch (err) {
        analysis.data[tableName] = 'TABLE_NOT_EXISTS';
      }
    }

    // 2. Анализ проектов - статусы
    try {
      const { data: projectStatuses, error } = await supabase
        .from('projects')
        .select('status');

      if (!error && projectStatuses) {
        const statusCounts: any = {};
        projectStatuses.forEach((project: any) => {
          statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
        });
        analysis.data.projectStatuses = statusCounts;
      }
    } catch (err) {
      analysis.data.projectStatuses = 'ERROR';
    }

    // 3. Анализ проектов - шаги
    try {
      const { data: projectSteps, error } = await supabase
        .from('projects')
        .select('current_step, max_step_reached');

      if (!error && projectSteps) {
        const stepCounts: any = {};
        projectSteps.forEach((project: any) => {
          const key = `${project.current_step}_${project.max_step_reached}`;
          stepCounts[key] = (stepCounts[key] || 0) + 1;
        });
        analysis.data.projectSteps = stepCounts;
      }
    } catch (err) {
      analysis.data.projectSteps = 'ERROR';
    }

    // 4. Анализ каталога - категории
    try {
      const { data: catalogCategories, error } = await supabase
        .from('catalog_verified_suppliers')
        .select('category');

      if (!error && catalogCategories) {
        const categoryCounts: any = {};
        catalogCategories.forEach((supplier: any) => {
          categoryCounts[supplier.category] = (categoryCounts[supplier.category] || 0) + 1;
        });
        analysis.data.catalogCategories = categoryCounts;
      }
    } catch (err) {
      analysis.data.catalogCategories = 'ERROR';
    }

    // 5. Анализ каталога - страны
    try {
      const { data: catalogCountries, error } = await supabase
        .from('catalog_verified_suppliers')
        .select('country');

      if (!error && catalogCountries) {
        const countryCounts: any = {};
        catalogCountries.forEach((supplier: any) => {
          countryCounts[supplier.country] = (countryCounts[supplier.country] || 0) + 1;
        });
        analysis.data.catalogCountries = countryCounts;
      }
    } catch (err) {
      analysis.data.catalogCountries = 'ERROR';
    }

    // 6. Анализ каталога - статус модерации
    try {
      const { data: moderationStatuses, error } = await supabase
        .from('catalog_verified_suppliers')
        .select('moderation_status');

      if (!error && moderationStatuses) {
        const statusCounts: any = {};
        moderationStatuses.forEach((supplier: any) => {
          statusCounts[supplier.moderation_status] = (statusCounts[supplier.moderation_status] || 0) + 1;
        });
        analysis.data.moderationStatuses = statusCounts;
      }
    } catch (err) {
      analysis.data.moderationStatuses = 'ERROR';
    }

    // 7. Структура таблицы projects
    try {
      const { data: projectSample, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

      if (!error && projectSample && projectSample.length > 0) {
        analysis.structures.projects = Object.keys(projectSample[0]);
      }
    } catch (err) {
      analysis.structures.projects = 'ERROR';
    }

    // 8. Структура таблицы catalog_verified_suppliers
    try {
      const { data: supplierSample, error } = await supabase
        .from('catalog_verified_suppliers')
        .select('*')
        .limit(1);

      if (!error && supplierSample && supplierSample.length > 0) {
        analysis.structures.catalog_verified_suppliers = Object.keys(supplierSample[0]);
      }
    } catch (err) {
      analysis.structures.catalog_verified_suppliers = 'ERROR';
    }

    // 9. Структура таблицы specifications
    try {
      const { data: specSample, error } = await supabase
        .from('specifications')
        .select('*')
        .limit(1);

      if (!error && specSample && specSample.length > 0) {
        analysis.structures.specifications = Object.keys(specSample[0]);
      }
    } catch (err) {
      analysis.structures.specifications = 'TABLE_NOT_EXISTS';
    }

    // 10. Итоговая сводка
    analysis.summary = {
      totalProjects: analysis.data.projects || 0,
      totalSuppliers: (analysis.data.catalog_verified_suppliers || 0) + (analysis.data.catalog_user_suppliers || 0),
      totalChatRooms: analysis.data.chat_rooms || 0,
      totalChatMessages: analysis.data.chat_messages || 0,
      totalAccreditationApplications: analysis.data.accreditation_applications || 0,
      analysisDate: new Date().toISOString()
    };

    console.log("✅ [API] Упрощенный анализ базы данных завершен");
    console.log("📊 [API] Сводка:", analysis.summary);

    return NextResponse.json({
      success: true,
      analysis,
      message: "Упрощенный анализ структуры базы данных завершен"
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при анализе БД:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 