import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseServiceClient";

export async function GET() {
  try {
    
    // Получаем информацию о структуре таблицы
    const { data, error } = await supabaseService
      .from('accreditation_applications')
      .select('*')
      .limit(1);

    if (error) {
      console.error("❌ [CHECK-ACCREDITATION-STRUCTURE] Ошибка:", error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Получаем одну запись для анализа структуры
    const { data: sampleRecord, error: sampleError } = await supabaseService
      .from('accreditation_applications')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error("❌ [CHECK-ACCREDITATION-STRUCTURE] Ошибка получения записи:", sampleError);
      return NextResponse.json({
        success: false,
        error: sampleError.message
      }, { status: 500 });
    }

    // Анализируем структуру
    const structure = {
      columns: Object.keys(sampleRecord || {}),
      sample_data: sampleRecord
    };


    return NextResponse.json({
      success: true,
      message: "Структура таблицы получена",
      structure
    });

  } catch (error) {
    console.error("❌ [CHECK-ACCREDITATION-STRUCTURE] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 