import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServiceClient";
import crypto from "crypto";

export async function POST() {
  try {
    console.log("🧪 [TEST-ACCREDITATION-WITH-FILES] Создание тестовой аккредитации с файлами");
    
    const applicationId = crypto.randomUUID();
    const supplierId = crypto.randomUUID();
    
    // Создаем тестовые данные аккредитации
    const testApplication = {
      id: applicationId,
      user_id: "86cc190d-0c80-463b-b0df-39a25b22365f", // Тестовый пользователь
      supplier_id: supplierId,
      supplier_type: "profile",
      supplier_name: "Тестовый Поставщик",
      company_name: "ООО Тест Компания",
      category: "Тестовая категория",
      country: "Россия",
      status: "pending",
      
      // Данные приложения (JSON строка)
      application_data: JSON.stringify({
        name: "Тестовый Поставщик",
        company_name: "ООО Тест Компания",
        category: "Тестовая категория",
        country: "Россия",
        contact_email: "test@example.com",
        contact_phone: "+7 999 123-45-67"
      }),
      
      // Данные товаров (JSON строка)
      products_data: JSON.stringify([
        {
          id: crypto.randomUUID(),
          name: "Тестовый товар 1",
          description: "Описание тестового товара",
          category: "Тестовая категория",
          price: "1000",
          currency: "RUB",
          images: ["test-svg-image-1753455315159.svg"],
          imageNames: ["test-svg-image-1753455315159.svg"],
          certificates: ["Receipt-2186-3845.pdf"],
          certificateNames: ["Receipt-2186-3845.pdf"],
          images_info: [
            {
              name: "test-svg-image-1753455315159.svg",
              size: 1024,
              type: "image/svg+xml",
              public_url: "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/project-images/accreditation/test-1753468788256/products/0/images/1753468788256_test-svg-image-1753455315159.svg"
            }
          ],
          certificates_info: [
            {
              name: "Receipt-2186-3845.pdf",
              size: 2048,
              type: "application/pdf",
              public_url: "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/accreditation-certificates/accreditation/test-1753468790096/products/0/certificates/1753468790096_Receipt-2186-3845.pdf"
            }
          ]
        }
      ]),
      
      // Юридические документы (JSON строка)
      legal_documents_data: JSON.stringify([
        {
          type: "business_license",
          name: "Лицензия на деятельность",
          fileName: "Receipt-2976-0063.pdf",
          size: 3072,
          fileType: "application/pdf",
          public_url: "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/accreditation-documents/accreditation/test-1753468792757/legal/1753468792757_Receipt-2976-0063.pdf"
        }
      ]),
      
      // Юридическое подтверждение (JSON строка)
      legal_confirmation: JSON.stringify({
        isLegalEntity: true,
        hasRightToRepresent: true,
        confirmAccuracy: true
      }),
      
      // Счетчики
      products_count: 1,
      certificates_count: 1,
      legal_documents_count: 1,
      
      // Даты
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Бакеты
      images_bucket: "project-images",
      certificates_bucket: "accreditation-certificates", 
      documents_bucket: "accreditation-documents"
    };

    console.log("📝 [TEST-ACCREDITATION-WITH-FILES] Сохраняем тестовую аккредитацию в БД");
    
    const { data, error } = await supabaseService
      .from('accreditation_applications')
      .insert(testApplication)
      .select()
      .single();

    if (error) {
      console.error("❌ [TEST-ACCREDITATION-WITH-FILES] Ошибка сохранения:", error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    console.log("✅ [TEST-ACCREDITATION-WITH-FILES] Тестовая аккредитация создана:", data.id);

    return NextResponse.json({
      success: true,
      message: "Тестовая аккредитация с файлами создана",
      application: {
        id: data.id,
        supplier_name: data.supplier_name,
        products_count: data.products?.length || 0,
        has_images: data.products?.[0]?.images?.length > 0,
        has_certificates: data.products?.[0]?.certificates?.length > 0,
        has_legal_docs: data.legal_confirmation?.documents?.length > 0
      }
    });

  } catch (error) {
    console.error("❌ [TEST-ACCREDITATION-WITH-FILES] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 