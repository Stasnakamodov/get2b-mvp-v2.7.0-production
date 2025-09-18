import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Исправление URL файлов в существующих заявках на аккредитацию
export async function POST(request: NextRequest) {
  try {
    console.log("🔧 [FIX] Исправление URL файлов в заявках на аккредитацию");

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (applicationId) {
      // Исправляем конкретную заявку
      const result = await fixApplicationUrls(applicationId);
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    }

    // Получаем все заявки с файлами, но без URL
    const { data: applications, error } = await supabase
      .from('accreditation_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ [FIX] Ошибка получения заявок:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ [FIX] Найдено заявок:", applications?.length || 0);

    let fixedCount = 0;
    let errorCount = 0;

    for (const application of applications || []) {
      try {
        const result = await fixApplicationUrls(application.id);
        if (result.success) {
          fixedCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ [FIX] Ошибка исправления заявки ${application.id}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Исправлено заявок: ${fixedCount}, ошибок: ${errorCount}`,
      summary: {
        total: applications?.length || 0,
        fixed: fixedCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error("❌ [FIX] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
}

async function fixApplicationUrls(applicationId: string) {
  console.log(`🔧 [FIX] Исправление заявки: ${applicationId}`);

  // Получаем заявку
  const { data: application, error } = await supabase
    .from('accreditation_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (error || !application) {
    return { success: false, error: "Заявка не найдена" };
  }

  // Парсим данные товаров
  let productsData = [];
  try {
    productsData = typeof application.products_data === 'string' 
      ? JSON.parse(application.products_data) 
      : application.products_data;
  } catch (e) {
    return { success: false, error: "Ошибка парсинга products_data" };
  }

  let hasChanges = false;

  // Проверяем и исправляем изображения товаров
  for (let productIndex = 0; productIndex < productsData.length; productIndex++) {
    const product = productsData[productIndex];
    
    if (product.images_info && Array.isArray(product.images_info)) {
      for (let imageIndex = 0; imageIndex < product.images_info.length; imageIndex++) {
        const image = product.images_info[imageIndex];
        
        if (!image.public_url && image.name) {
          // Генерируем путь к файлу в Storage
          const fileName = `accreditation/${applicationId}/products/${productIndex}/images/${image.name}`;
          
          try {
            // Получаем публичный URL
            const { data: urlData } = supabase.storage
              .from('project-images')
              .getPublicUrl(fileName);

            if (urlData.publicUrl) {
              // Добавляем URL к изображению
              product.images_info[imageIndex] = {
                ...image,
                public_url: urlData.publicUrl
              };
              hasChanges = true;
              console.log(`✅ [FIX] Добавлен URL для изображения: ${image.name}`);
            } else {
              console.log(`⚠️ [FIX] Не удалось получить URL для: ${fileName}`);
            }
          } catch (urlError) {
            console.error(`❌ [FIX] Ошибка получения URL для ${fileName}:`, urlError);
          }
        }
      }
    }

    // Проверяем и исправляем сертификаты товаров
    if (product.certificates_info && Array.isArray(product.certificates_info)) {
      for (let certIndex = 0; certIndex < product.certificates_info.length; certIndex++) {
        const cert = product.certificates_info[certIndex];
        
        if (!cert.public_url && cert.name) {
          // Генерируем путь к файлу в Storage
          const fileName = `accreditation/${applicationId}/products/${productIndex}/certificates/${cert.name}`;
          
          try {
            // Получаем публичный URL
            const { data: urlData } = supabase.storage
              .from('project-images')
              .getPublicUrl(fileName);

            if (urlData.publicUrl) {
              // Добавляем URL к сертификату
              product.certificates_info[certIndex] = {
                ...cert,
                public_url: urlData.publicUrl
              };
              hasChanges = true;
              console.log(`✅ [FIX] Добавлен URL для сертификата: ${cert.name}`);
            } else {
              console.log(`⚠️ [FIX] Не удалось получить URL для: ${fileName}`);
            }
          } catch (urlError) {
            console.error(`❌ [FIX] Ошибка получения URL для ${fileName}:`, urlError);
          }
        }
      }
    }
  }

  // Если есть изменения, обновляем заявку
  if (hasChanges) {
    const { error: updateError } = await supabase
      .from('accreditation_applications')
      .update({
        products_data: JSON.stringify(productsData),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error("❌ [FIX] Ошибка обновления заявки:", updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ [FIX] Заявка ${applicationId} обновлена с URL файлов`);
    return { success: true, message: "URL файлов добавлены" };
  } else {
    console.log(`ℹ️ [FIX] Заявка ${applicationId} не требует исправлений`);
    return { success: true, message: "Исправления не требуются" };
  }
} 