import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🔧 API /test-yandex-auth вызван");
    
    const apiKey = process.env.YANDEX_VISION_API_KEY || '';
    const folderId = process.env.YANDEX_FOLDER_ID || '';
    
    // Тест 1: API Key авторизация
    console.log('🧪 Тест 1: API Key авторизация');
    const testResponse1 = await fetch('https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: folderId,
        analyzeSpecs: [{
          content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 pixel PNG
          features: [{
            type: 'TEXT_DETECTION',
            textDetectionConfig: {
              languageCodes: ['ru', 'en']
            }
          }]
        }]
      })
    });
    
    console.log('📡 Тест 1 результат:', {
      status: testResponse1.status,
      ok: testResponse1.ok
    });
    
    if (!testResponse1.ok) {
      const errorText1 = await testResponse1.text();
      console.log('❌ Тест 1 ошибка:', errorText1);
    } else {
      const data1 = await testResponse1.json();
      console.log('✅ Тест 1 успешен:', data1);
    }
    
    // Тест 2: Bearer токен авторизация
    console.log('🧪 Тест 2: Bearer токен авторизация');
    const testResponse2 = await fetch('https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderId: folderId,
        analyzeSpecs: [{
          content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          features: [{
            type: 'TEXT_DETECTION',
            textDetectionConfig: {
              languageCodes: ['ru', 'en']
            }
          }]
        }]
      })
    });
    
    console.log('📡 Тест 2 результат:', {
      status: testResponse2.status,
      ok: testResponse2.ok
    });
    
    if (!testResponse2.ok) {
      const errorText2 = await testResponse2.text();
      console.log('❌ Тест 2 ошибка:', errorText2);
    } else {
      const data2 = await testResponse2.json();
      console.log('✅ Тест 2 успешен:', data2);
    }
    
    return NextResponse.json({
      success: true,
      message: "Тесты авторизации завершены. Проверьте логи сервера."
    });
  } catch (error) {
    console.error("❌ Ошибка в API test-yandex-auth:", error);
    return NextResponse.json(
      {
        error: "Ошибка тестирования авторизации",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 