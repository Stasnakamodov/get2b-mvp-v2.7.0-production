import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServiceClient";

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json();
    
    if (!applicationId) {
      return NextResponse.json({
        success: false,
        error: "Не указан ID аккредитации"
      }, { status: 400 });
    }

    console.log("🔧 [FIX-OLD-ACCREDITATION] Исправляем старую аккредитацию:", applicationId);

    // Получаем данные аккредитации
    const { data: application, error } = await supabaseService
      .from('accreditation_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      return NextResponse.json({
        success: false,
        error: "Аккредитация не найдена"
      }, { status: 404 });
    }

    // Парсим данные товаров
    let productsData = [];
    try {
      productsData = typeof application.products_data === 'string' 
        ? JSON.parse(application.products_data) 
        : application.products_data;
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: "Ошибка чтения данных товаров"
      }, { status: 500 });
    }

    let hasChanges = false;

    // Исправляем каждый товар
    for (let i = 0; i < productsData.length; i++) {
      const product = productsData[i];
      
      // Проверяем сертификаты
      if (product.certificates && product.certificates.length > 0 && (!product.certificates_info || product.certificates_info.length === 0)) {
        console.log(`🔧 [FIX-OLD-ACCREDITATION] Исправляем сертификаты для товара ${i}:`, product.certificates);
        
        product.certificates_info = [];
        
        for (let j = 0; j < product.certificates.length; j++) {
          const certName = product.certificates[j];
          const certPath = `accreditation/${applicationId}/products/${i}/certificates/${certName}`;
          
          try {
            // Пробуем получить public_url из Storage
            const { data: urlData } = supabaseService.storage
              .from('project-images') // Старые сертификаты могли быть в project-images
              .getPublicUrl(certPath);
            
            if (urlData.publicUrl) {
              product.certificates_info.push({
                name: certName,
                size: 1024, // Примерный размер
                type: 'image/jpeg', // Предполагаемый тип
                public_url: urlData.publicUrl
              });
              console.log(`✅ [FIX-OLD-ACCREDITATION] Добавлен public_url для сертификата:`, certName);
            } else {
              // Пробуем в новом бакете
              const { data: urlData2 } = supabaseService.storage
                .from('accreditation-certificates')
                .getPublicUrl(certPath);
              
              if (urlData2.publicUrl) {
                product.certificates_info.push({
                  name: certName,
                  size: 1024,
                  type: 'image/jpeg',
                  public_url: urlData2.publicUrl
                });
                console.log(`✅ [FIX-OLD-ACCREDITATION] Добавлен public_url для сертификата (новый бакет):`, certName);
              }
            }
          } catch (error) {
            console.log(`⚠️ [FIX-OLD-ACCREDITATION] Не удалось найти сертификат:`, certName);
          }
        }
        
        hasChanges = true;
      }
    }

    if (hasChanges) {
      // Обновляем данные в базе
      const { error: updateError } = await supabaseService
        .from('accreditation_applications')
        .update({
          products_data: JSON.stringify(productsData),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) {
        return NextResponse.json({
          success: false,
          error: "Ошибка обновления данных"
        }, { status: 500 });
      }

      console.log("✅ [FIX-OLD-ACCREDITATION] Аккредитация исправлена");
    }

    return NextResponse.json({
      success: true,
      message: "Аккредитация проверена и исправлена",
      has_changes: hasChanges,
      products_count: productsData.length
    });

  } catch (error) {
    console.error("❌ [FIX-OLD-ACCREDITATION] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 