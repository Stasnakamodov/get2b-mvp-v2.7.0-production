import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log("📋 API /supplier-templates вызван");

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const supplierType = searchParams.get('supplierType');

    if (!supplierId) {
      return NextResponse.json(
        { error: "supplierId обязателен" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Получаем шаблоны из базы данных с правилами заполнения
    const { data: templates, error } = await supabase
      .from('supplier_proforma_templates')
      .select(`
        id,
        template_name,
        description,
        file_path,
        file_size,
        original_filename,
        filling_rules,
        is_default,
        is_active,
        usage_count,
        created_at,
        updated_at
      `)
      .eq('supplier_id', supplierId)
      .eq('supplier_type', supplierType || 'verified')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Ошибка получения шаблонов из БД:", error);
      return NextResponse.json({ error: "Ошибка получения шаблонов" }, { status: 500 });
    }

    if (!templates || templates.length === 0) {
      console.log("📭 Шаблоны не найдены для поставщика:", supplierId);
      return NextResponse.json({
        success: true,
        templates: [],
        message: "Шаблоны не найдены"
      });
    }

    // Формируем ответ с дополнительной информацией
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.template_name,
      description: template.description,
      original_filename: template.original_filename,
      size: template.file_size || 0,
      storage_path: template.file_path,
      filling_rules: template.filling_rules,
      is_default: template.is_default,
      usage_count: template.usage_count || 0,
      created_at: template.created_at,
      updated_at: template.updated_at,
      // Для обратной совместимости с существующим кодом
      file_path: template.file_path
    }));

    console.log("✅ Найдено шаблонов из БД:", templates.length);

    return NextResponse.json({
      success: true,
      templates: formattedTemplates,
      supplierId,
      supplierType: supplierType || 'verified'
    });

  } catch (error) {
    console.error('❌ [API] Ошибка получения шаблонов:', error);
    return NextResponse.json(
      {
        error: 'Ошибка получения шаблонов',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}