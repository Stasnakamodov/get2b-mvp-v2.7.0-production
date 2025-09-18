import { NextRequest, NextResponse } from "next/server";

// GET: Получение поставщиков (редирект на catalog API)
export async function GET(request: NextRequest) {
  try {
    // Перенаправляем запрос к catalog API
    const baseUrl = new URL(request.url).origin;
    const response = await fetch(`${baseUrl}/api/catalog/verified-suppliers`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ [API] Поставщики загружены:', data.length);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки поставщиков:', error);
    return NextResponse.json(
      { error: 'Ошибка загрузки поставщиков' },
      { status: 500 }
    );
  }
}