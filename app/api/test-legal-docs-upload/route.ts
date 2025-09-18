import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Тест загрузки юридических документов
export async function POST(request: NextRequest) {
  try {
    console.log("🧪 [TEST-LEGAL] Тест загрузки юридических документов");
    
    // Создаем тестовый файл
    const testFileName = `test-legal-doc-${Date.now()}.pdf`;
    const testContent = Buffer.from('Test legal document content');
    
    // Тестовые данные заявки
    const testApplicationId = crypto.randomUUID();
    
    // Сохраняем файл в Storage
    const storagePath = `accreditation/${testApplicationId}/legal/${testFileName}`;
    
    console.log("📁 [TEST-LEGAL] Сохраняем файл:", storagePath);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(storagePath, testContent, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("❌ [TEST-LEGAL] Ошибка загрузки файла:", uploadError);
      return NextResponse.json({ 
        error: "Ошибка загрузки файла",
        details: uploadError.message
      }, { status: 500 });
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(storagePath);

    console.log("✅ [TEST-LEGAL] Файл сохранен:", urlData.publicUrl);

    // Создаем тестовую заявку в базе
    const testApplicationData = {
      user_id: "86cc190d-0c80-463b-b0df-39a25b22365f",
      supplier_id: crypto.randomUUID(),
      supplier_type: "profile",
      supplier_name: "Тестовый поставщик с юр. документами",
      company_name: "Тестовая компания",
      category: "Тестовая категория",
      country: "Россия",
      status: 'pending',
      application_data: JSON.stringify({}),
      products_data: JSON.stringify([]),
      legal_documents_data: JSON.stringify([{
        type: "business_license",
        name: "Тестовая лицензия",
        fileName: testFileName,
        size: testContent.length,
        fileType: "application/pdf",
        public_url: urlData.publicUrl
      }]),
      legal_confirmation: JSON.stringify({
        isLegalEntity: true,
        hasRightToRepresent: true,
        confirmAccuracy: true
      }),
      products_count: 0,
      certificates_count: 0,
      legal_documents_count: 1
    };

    const { data: application, error: appError } = await supabase
      .from('accreditation_applications')
      .insert([testApplicationData])
      .select()
      .single();

    if (appError) {
      console.error("❌ [TEST-LEGAL] Ошибка создания заявки:", appError);
      return NextResponse.json({ 
        error: "Ошибка создания заявки",
        details: appError.message
      }, { status: 500 });
    }

    console.log("✅ [TEST-LEGAL] Заявка создана:", application.id);

    return NextResponse.json({
      success: true,
      message: "Тестовая заявка с юридическими документами создана",
      data: {
        application_id: application.id,
        file_path: storagePath,
        public_url: urlData.publicUrl,
        legal_documents_count: 1
      }
    });

  } catch (error) {
    console.error("❌ [TEST-LEGAL] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 