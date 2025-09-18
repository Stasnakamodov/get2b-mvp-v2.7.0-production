import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Тестовая загрузка файлов в аккредитацию
export async function POST(request: NextRequest) {
  try {
    console.log("🧪 [TEST-UPLOAD] Тестовая загрузка файлов в аккредитацию");

    // Создаем тестовую заявку
    const testApplicationId = "test-" + Date.now();
    
    console.log("📝 [TEST-UPLOAD] Создаем тестовую заявку:", testApplicationId);

    // Создаем тестовый файл (простой текстовый файл)
    const testContent = "Это тестовый файл для проверки загрузки в Storage";
    const testFileName = `test-file-${Date.now()}.txt`;
    
    console.log("📁 [TEST-UPLOAD] Загружаем тестовый файл:", testFileName);

    try {
      // Пробуем загрузить файл в Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(`test/${testFileName}`, testContent, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("❌ [TEST-UPLOAD] Ошибка загрузки файла:", uploadError);
        return NextResponse.json({ 
          error: "Ошибка загрузки файла",
          details: uploadError.message
        }, { status: 500 });
      }

      console.log("✅ [TEST-UPLOAD] Файл загружен:", uploadData.path);

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(uploadData.path);

      console.log("🔗 [TEST-UPLOAD] Публичный URL:", urlData.publicUrl);

      // Проверяем, что файл доступен
      const { data: fileData, error: fileError } = await supabase.storage
        .from('project-images')
        .download(uploadData.path);

      if (fileError) {
        console.error("❌ [TEST-UPLOAD] Ошибка скачивания файла:", fileError);
      } else {
        console.log("✅ [TEST-UPLOAD] Файл успешно скачан, размер:", fileData.size);
      }

      return NextResponse.json({
        success: true,
        message: "Тестовый файл успешно загружен",
        file: {
          path: uploadData.path,
          public_url: urlData.publicUrl,
          size: fileData?.size || 0
        }
      });

    } catch (storageError) {
      console.error("❌ [TEST-UPLOAD] Критическая ошибка Storage:", storageError);
      return NextResponse.json({ 
        error: "Критическая ошибка Storage",
        details: storageError instanceof Error ? storageError.message : 'Неизвестная ошибка'
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ [TEST-UPLOAD] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 