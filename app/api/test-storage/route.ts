import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 ТЕСТИРУЕМ SUPABASE STORAGE");
    
    // Проверяем список buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("❌ Ошибка получения списка buckets:", bucketsError);
      return NextResponse.json({
        success: false,
        error: "Ошибка получения списка buckets",
        details: bucketsError.message
      }, { status: 500 });
    }
    
    console.log("📦 Доступные buckets:", buckets);
    
    // Проверяем конкретный bucket
    const bucketName = "step2-ready-invoices";
    const { data: bucketFiles, error: bucketError } = await supabase.storage
      .from(bucketName)
      .list();
    
    if (bucketError) {
      console.error("❌ Ошибка доступа к bucket:", bucketError);
      return NextResponse.json({
        success: false,
        error: `Ошибка доступа к bucket ${bucketName}`,
        details: bucketError.message,
        buckets: buckets.map(b => b.name)
      }, { status: 500 });
    }
    
    console.log("📁 Файлы в bucket:", bucketFiles);
    
    return NextResponse.json({
      success: true,
      buckets: buckets.map(b => b.name),
      targetBucket: bucketName,
      bucketFiles: bucketFiles,
      bucketExists: true
    });
    
  } catch (error) {
    console.error("❌ Общая ошибка тестирования storage:", error);
    return NextResponse.json({
      success: false,
      error: "Общая ошибка тестирования storage",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 