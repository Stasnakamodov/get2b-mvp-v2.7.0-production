import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { supabaseService } from "@/lib/supabaseServiceClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    
    if (!fileName) {
      return NextResponse.json({
        success: false,
        error: "Не указано имя файла"
      }, { status: 400 });
    }

    
    interface SearchResults {
      [bucketName: string]: {
        found: boolean;
        files?: Array<{ name: string; size?: number; updated_at?: string }>;
        error?: string;
        publicUrl?: string;
      };
    }

    // Ищем в разных бакетах
    const buckets = ['project-images'];
    const results: SearchResults = {};

    for (const bucketName of buckets) {
      try {
        
        // Получаем список всех файлов в бакете
        const { data: files, error } = await supabaseService.storage
          .from(bucketName)
          .list('', { limit: 1000 });

        if (error) {
          logger.error(`❌ [FIND-FILE] Ошибка в бакете ${bucketName}:`, error);
          results[bucketName] = { found: false, error: error.message };
          continue;
        }

        // Ищем файл по имени
        const foundFiles = files?.filter(file => 
          file.name.includes(fileName) || 
          decodeURIComponent(file.name).includes(fileName)
        ) || [];

        if (foundFiles.length > 0) {
          
          results[bucketName] = {
            found: true,
            files: foundFiles.map(file => ({
              name: file.name,
              size: file.metadata?.size,
              path: file.name,
              public_url: supabaseService.storage.from(bucketName).getPublicUrl(file.name).data.publicUrl
            }))
          };
        } else {
          results[bucketName] = { found: false, files: [] };
        }
      } catch (error) {
        logger.error(`❌ [FIND-FILE] Исключение в бакете ${bucketName}:`, error);
        results[bucketName] = { found: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return NextResponse.json({
      success: true,
      fileName,
      results
    });

  } catch (error) {
    logger.error("❌ [FIND-FILE] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 