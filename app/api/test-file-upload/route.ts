import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServiceClient";

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 [TEST-UPLOAD] Тестирование загрузки файлов");
    
    const formData = await request.formData();
    
    // Логируем все поля FormData
    console.log("📝 [TEST-UPLOAD] Содержимое FormData:");
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value}`);
    }

    // Проверяем наличие файлов
    const productImage = formData.get('product_image') as File;
    const productCert = formData.get('product_certificate') as File;
    const legalDoc = formData.get('legal_document') as File;

    console.log("📁 [TEST-UPLOAD] Найденные файлы:");
    console.log(`  Изображение товара: ${productImage ? `${productImage.name} (${productImage.size} bytes)` : 'НЕТ'}`);
    console.log(`  Сертификат товара: ${productCert ? `${productCert.name} (${productCert.size} bytes)` : 'НЕТ'}`);
    console.log(`  Юридический документ: ${legalDoc ? `${legalDoc.name} (${legalDoc.size} bytes)` : 'НЕТ'}`);

    // Тестируем загрузку в Storage
    const testResults: any = {
      product_image: null,
      product_certificate: null,
      legal_document: null
    };

    if (productImage) {
      try {
        const testApplicationId = 'test-' + Date.now();
        const fileName = `accreditation/${testApplicationId}/products/0/images/${Date.now()}_${productImage.name}`;
        const { data, error } = await supabaseService.storage
          .from('project-images')
          .upload(fileName, productImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("❌ [TEST-UPLOAD] Ошибка загрузки изображения:", error);
          testResults.product_image = { error: error.message };
        } else {
          const { data: urlData } = supabaseService.storage
            .from('project-images')
            .getPublicUrl(fileName);
          
          testResults.product_image = { 
            success: true, 
            path: fileName, 
            url: urlData.publicUrl 
          };
          console.log("✅ [TEST-UPLOAD] Изображение загружено:", fileName);
        }
      } catch (error) {
        console.error("❌ [TEST-UPLOAD] Ошибка обработки изображения:", error);
        testResults.product_image = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    if (productCert) {
      try {
        const testApplicationId = 'test-' + Date.now();
        const fileName = `accreditation/${testApplicationId}/products/0/certificates/${Date.now()}_${productCert.name}`;
        const { data, error } = await supabaseService.storage
          .from('accreditation-certificates')
          .upload(fileName, productCert, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("❌ [TEST-UPLOAD] Ошибка загрузки сертификата:", error);
          testResults.product_certificate = { error: error.message };
        } else {
          const { data: urlData } = supabaseService.storage
            .from('accreditation-certificates')
            .getPublicUrl(fileName);
          
          testResults.product_certificate = { 
            success: true, 
            path: fileName, 
            url: urlData.publicUrl 
          };
          console.log("✅ [TEST-UPLOAD] Сертификат загружен:", fileName);
        }
      } catch (error) {
        console.error("❌ [TEST-UPLOAD] Ошибка обработки сертификата:", error);
        testResults.product_certificate = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    if (legalDoc) {
      try {
        const testApplicationId = 'test-' + Date.now();
        const fileName = `accreditation/${testApplicationId}/legal/${Date.now()}_${legalDoc.name}`;
        const { data, error } = await supabaseService.storage
          .from('accreditation-documents')
          .upload(fileName, legalDoc, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("❌ [TEST-UPLOAD] Ошибка загрузки документа:", error);
          testResults.legal_document = { error: error.message };
        } else {
          const { data: urlData } = supabaseService.storage
            .from('accreditation-documents')
            .getPublicUrl(fileName);
          
          testResults.legal_document = { 
            success: true, 
            path: fileName, 
            url: urlData.publicUrl 
          };
          console.log("✅ [TEST-UPLOAD] Документ загружен:", fileName);
        }
      } catch (error) {
        console.error("❌ [TEST-UPLOAD] Ошибка обработки документа:", error);
        testResults.legal_document = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Тест загрузки файлов завершен",
      results: testResults
    });

  } catch (error) {
    console.error("❌ [TEST-UPLOAD] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Используйте POST для тестирования загрузки файлов",
    example: {
      method: "POST",
      body: "FormData с полями: product_image, product_certificate, legal_document"
    }
  });
} 