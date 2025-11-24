import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: Проверка файлов в Supabase Storage
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'accreditation';
    const listBuckets = searchParams.get('buckets') === 'true';

    if (listBuckets) {
      // Получаем список всех buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("❌ [STORAGE] Ошибка получения buckets:", bucketsError);
        return NextResponse.json({ error: bucketsError.message }, { status: 500 });
      }


      return NextResponse.json({
        success: true,
        buckets: buckets?.map(bucket => ({
          name: bucket.name,
          public: bucket.public,
          created_at: bucket.created_at
        })) || []
      });
    }

    // Получаем список файлов в указанной папке
    const { data: files, error } = await supabase.storage
      .from('project-images')
      .list(path, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error("❌ [STORAGE] Ошибка получения файлов:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    // Получаем публичные URL для первых нескольких файлов
    const filesWithUrls = files?.slice(0, 5).map(file => {
      const filePath = `${path}/${file.name}`;
      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        size: file.metadata?.size,
        type: file.metadata?.mimetype,
        path: filePath,
        public_url: urlData.publicUrl,
        created_at: file.created_at
      };
    });

    return NextResponse.json({
      success: true,
      path,
      total_files: files?.length || 0,
      files_with_urls: filesWithUrls || []
    });

  } catch (error) {
    console.error("❌ [STORAGE] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 