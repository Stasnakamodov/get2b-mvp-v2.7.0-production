import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log("📤 API /upload-supplier-template вызван");

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const supplierId = formData.get('supplierId') as string;
    const supplierType = formData.get('supplierType') as string;
    const templateName = formData.get('templateName') as string;
    const description = formData.get('description') as string;
    const fillingRules = formData.get('fillingRules') as string;
    const isDefault = formData.get('isDefault') === 'true';

    console.log("📋 Параметры загрузки:", {
      supplierId,
      supplierType,
      templateName,
      hasFile: !!file,
      fileSize: file?.size,
      fileName: file?.name,
      isDefault
    });

    // Validation
    if (!file || !supplierId || !supplierType || !templateName || !fillingRules) {
      return NextResponse.json(
        { error: "Обязательные поля: file, supplierId, supplierType, templateName, fillingRules" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Поддерживаются только файлы Excel (.xlsx, .xls)" },
        { status: 400 }
      );
    }

    // Validate JSON rules
    let parsedRules;
    try {
      parsedRules = JSON.parse(fillingRules);
    } catch (e) {
      return NextResponse.json(
        { error: "Некорректный JSON в правилах заполнения" },
        { status: 400 }
      );
    }

    // Validate required rule fields
    const requiredRuleFields = ['start_row', 'end_row', 'columns'];
    for (const field of requiredRuleFields) {
      if (!parsedRules[field]) {
        return NextResponse.json(
          { error: `Отсутствует обязательное поле в правилах: ${field}` },
          { status: 400 }
        );
      }
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate file path in storage
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const sanitizedTemplateName = templateName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    const fileName = `${sanitizedTemplateName}_${timestamp}.${fileExtension}`;
    const storagePath = `templates/${supplierId}/${fileName}`;

    console.log("💾 Загрузка файла в Storage:", storagePath);

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    // Optional: Validate Excel file by trying to read it
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { error: "Файл Excel не содержит листов" },
          { status: 400 }
        );
      }
      console.log("✅ Excel файл валиден, листов:", workbook.SheetNames.length);
    } catch (e) {
      console.error("❌ Ошибка чтения Excel файла:", e);
      return NextResponse.json(
        { error: "Не удается прочитать файл Excel. Проверьте его целостность." },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('supplier-proformas')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false // Don't overwrite existing files
      });

    if (uploadError) {
      console.error("❌ Ошибка загрузки файла:", uploadError);
      return NextResponse.json(
        { error: "Ошибка загрузки файла в Storage" },
        { status: 500 }
      );
    }

    console.log("✅ Файл загружен в Storage:", uploadData);

    // If setting as default, first unset other defaults for this supplier
    if (isDefault) {
      const { error: unsetError } = await supabase
        .from('supplier_proforma_templates')
        .update({ is_default: false })
        .eq('supplier_id', supplierId)
        .eq('supplier_type', supplierType)
        .eq('is_default', true);

      if (unsetError) {
        console.warn("⚠️ Ошибка сброса предыдущего шаблона по умолчанию:", unsetError);
      }
    }

    // Save template metadata to database
    const { data: templateData, error: dbError } = await supabase
      .from('supplier_proforma_templates')
      .insert({
        supplier_id: supplierId,
        supplier_type: supplierType,
        template_name: templateName,
        description: description || null,
        file_path: storagePath,
        file_size: file.size,
        original_filename: file.name,
        filling_rules: parsedRules,
        is_default: isDefault,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Ошибка сохранения в БД:", dbError);

      // Try to cleanup uploaded file
      await supabase.storage
        .from('supplier-proformas')
        .remove([storagePath]);

      return NextResponse.json(
        { error: "Ошибка сохранения шаблона в базе данных" },
        { status: 500 }
      );
    }

    console.log("✅ Шаблон сохранен в БД:", templateData);

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Шаблон успешно загружен",
      template: {
        id: templateData.id,
        template_name: templateData.template_name,
        file_path: templateData.file_path,
        file_size: templateData.file_size,
        is_default: templateData.is_default,
        created_at: templateData.created_at
      }
    });

  } catch (error) {
    console.error('❌ [API] Ошибка загрузки шаблона:', error);
    return NextResponse.json(
      {
        error: 'Ошибка загрузки шаблона',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve templates for a supplier
export async function GET(request: NextRequest) {
  try {
    console.log("📋 API /upload-supplier-template GET вызван");

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const supplierType = searchParams.get('supplierType');

    if (!supplierId || !supplierType) {
      return NextResponse.json(
        { error: "supplierId и supplierType обязательны" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get templates for supplier
    const { data: templates, error } = await supabase
      .from('supplier_proforma_templates')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('supplier_type', supplierType)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Ошибка получения шаблонов:", error);
      return NextResponse.json(
        { error: "Ошибка получения шаблонов" },
        { status: 500 }
      );
    }

    console.log("✅ Найдено шаблонов:", templates?.length || 0);

    return NextResponse.json({
      success: true,
      templates: templates || [],
      supplier_id: supplierId,
      supplier_type: supplierType
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

// DELETE method to remove a template
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ API /upload-supplier-template DELETE вызван");

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId обязателен" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get template info first
    const { data: template, error: getError } = await supabase
      .from('supplier_proforma_templates')
      .select('file_path, template_name')
      .eq('id', templateId)
      .single();

    if (getError || !template) {
      return NextResponse.json(
        { error: "Шаблон не найден" },
        { status: 404 }
      );
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('supplier_proforma_templates')
      .delete()
      .eq('id', templateId);

    if (dbError) {
      console.error("❌ Ошибка удаления из БД:", dbError);
      return NextResponse.json(
        { error: "Ошибка удаления шаблона" },
        { status: 500 }
      );
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('supplier-proformas')
      .remove([template.file_path]);

    if (storageError) {
      console.warn("⚠️ Ошибка удаления файла из Storage:", storageError);
      // Don't fail the request if storage cleanup fails
    }

    console.log("✅ Шаблон удален:", template.template_name);

    return NextResponse.json({
      success: true,
      message: "Шаблон успешно удален"
    });

  } catch (error) {
    console.error('❌ [API] Ошибка удаления шаблона:', error);
    return NextResponse.json(
      {
        error: 'Ошибка удаления шаблона',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}