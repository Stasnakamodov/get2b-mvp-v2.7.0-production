import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    logger.info("📤 API /upload-supplier-proforma вызван");

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const supplierType = formData.get('supplierType') as string; // 'construction' или 'electronics'
    const supplierName = formData.get('supplierName') as string;

    if (!file || !supplierType || !supplierName) {
      return NextResponse.json(
        { error: "Файл, тип поставщика и название обязательны" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Получаем поставщиков соответствующей категории
    const { data: suppliers, error: suppliersError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name, category')
      .ilike('category', `%${supplierType === 'construction' ? 'строител' : 'электрон'}%`)
      .limit(1);

    if (suppliersError) {
      logger.error("❌ Ошибка поиска поставщика:", suppliersError);
      return NextResponse.json({ error: "Ошибка поиска поставщика" }, { status: 500 });
    }

    let supplierId;
    if (suppliers && suppliers.length > 0) {
      supplierId = suppliers[0].id;
      logger.info(`✅ Найден существующий поставщик: ${suppliers[0].name} (${suppliers[0].category})`);
    } else {
      // Создаем нового поставщика
      const { data: newSupplier, error: createError } = await supabase
        .from('catalog_user_suppliers')
        .insert({
          name: supplierName,
          company_name: `${supplierName} Company`,
          category: supplierType === 'construction' ? 'Строительные материалы' : 'Электроника и оборудование',
          room_type: 'user',
          is_active: true,
          country: 'Russia',
          city: 'Moscow'
        })
        .select('id')
        .single();

      if (createError) {
        logger.error("❌ Ошибка создания поставщика:", createError);
        return NextResponse.json({ error: "Ошибка создания поставщика" }, { status: 500 });
      }

      supplierId = newSupplier.id;
      logger.info(`✅ Создан новый поставщик: ${supplierName} (ID: ${supplierId})`);
    }

    // Генерируем путь для файла
    const fileExtension = file.name.split('.').pop();
    const fileName = `template_${supplierType}_${Date.now()}.${fileExtension}`;
    const storagePath = `${supplierId}/templates/${fileName}`;

    // Загружаем файл в storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('supplier-proformas')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) {
      logger.error("❌ Ошибка загрузки файла:", uploadError);
      return NextResponse.json({ error: "Ошибка загрузки файла" }, { status: 500 });
    }

    logger.info("✅ Проформа-шаблон загружена:", {
      supplierId,
      supplierName,
      fileName,
      storagePath
    });

    return NextResponse.json({
      success: true,
      data: {
        supplierId,
        supplierName,
        fileName,
        storagePath,
        uploadPath: uploadData.path
      }
    });

  } catch (error) {
    logger.error('❌ [API] Ошибка загрузки проформы:', error);
    return NextResponse.json(
      {
        error: 'Ошибка загрузки проформы',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}