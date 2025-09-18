import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServiceClient";

export async function GET() {
  try {
    console.log("🧪 [TEST-BUCKETS] Проверка доступности Storage бакетов");
    
    const buckets = ['project-images', 'accreditation-certificates', 'accreditation-documents'];
    const results: any = {};

    for (const bucketName of buckets) {
      try {
        console.log(`🔍 [TEST-BUCKETS] Проверяем бакет: ${bucketName}`);
        
        // Пробуем получить список файлов (даже если пустой)
        const { data, error } = await supabaseService.storage
          .from(bucketName)
          .list('', { limit: 1 });

        if (error) {
          console.error(`❌ [TEST-BUCKETS] Ошибка доступа к бакету ${bucketName}:`, error);
          results[bucketName] = { 
            available: false, 
            error: error.message 
          };
        } else {
          console.log(`✅ [TEST-BUCKETS] Бакет ${bucketName} доступен`);
          results[bucketName] = { 
            available: true, 
            files_count: data?.length || 0 
          };
        }
      } catch (error) {
        console.error(`❌ [TEST-BUCKETS] Исключение при проверке бакета ${bucketName}:`, error);
        results[bucketName] = { 
          available: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Проверка бакетов завершена",
      results
    });

  } catch (error) {
    console.error("❌ [TEST-BUCKETS] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 