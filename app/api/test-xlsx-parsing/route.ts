import { NextRequest, NextResponse } from 'next/server';
import { getYandexVisionService } from '@/lib/services/YandexVisionService';

export async function POST(request: NextRequest) {
  try {
    const { fileUrl } = await request.json();
    
    if (!fileUrl) {
      return NextResponse.json({ error: 'URL файла не предоставлен' }, { status: 400 });
    }

    console.log('🔍 Тестируем парсинг XLSX файла:', fileUrl);
    
    const visionService = getYandexVisionService();
    const extractedText = await visionService.extractTextFromXlsx(fileUrl);
    
    console.log('✅ XLSX файл успешно обработан');
    console.log('📄 Извлеченный текст:', extractedText);
    console.log('📄 Длина текста:', extractedText.length);
    
    return NextResponse.json({
      success: true,
      extractedText,
      textLength: extractedText.length,
      message: 'XLSX файл успешно обработан'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при обработке XLSX файла:', error);
    return NextResponse.json({
      error: 'Ошибка при обработке XLSX файла',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 