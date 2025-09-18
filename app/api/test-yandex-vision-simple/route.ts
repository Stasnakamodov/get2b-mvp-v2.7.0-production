import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl обязателен" }, { status: 400 });
    }

    console.log("🔍 ПРОСТОЙ ТЕСТ YANDEX VISION");
    console.log("📄 URL файла:", fileUrl);

    // Проверяем переменные окружения
    const apiKey = process.env.YANDEX_VISION_API_KEY;
    const folderId = process.env.YANDEX_FOLDER_ID;
    
    console.log("🔑 API Key:", apiKey ? `${apiKey.substring(0, 10)}...` : "НЕ НАЙДЕН");
    console.log("📁 Folder ID:", folderId || "НЕ НАЙДЕН");

    if (!apiKey || !folderId) {
      return NextResponse.json({ error: "Отсутствуют переменные окружения" }, { status: 500 });
    }

    // Скачиваем файл
    console.log("📥 Скачиваем файл...");
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Ошибка загрузки файла: ${fileResponse.status}`);
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');
    
    console.log("📄 Файл загружен, размер:", arrayBuffer.byteLength, "байт");
    console.log("📄 Base64 длина:", base64Content.length);

    // Отправляем запрос к Yandex Vision API
    console.log("🚀 Отправляем запрос к Yandex Vision API...");
    
    const response = await fetch('https://vision.api.cloud.yandex.net/vision/v1/batchAnalyze', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Data-Center': 'ru-central1'
      },
      body: JSON.stringify({
        folderId: folderId,
        analyzeSpecs: [{
          content: base64Content,
          features: [{
            type: 'TEXT_DETECTION',
            textDetectionConfig: {
              languageCodes: ['ru', 'en']
            }
          }]
        }]
      })
    });

    console.log("📡 Статус ответа:", response.status);
    console.log("📡 Заголовки ответа:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Ошибка API:", errorText);
      return NextResponse.json({ 
        error: "Ошибка Yandex Vision API", 
        status: response.status,
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    console.log("✅ Ответ получен");
    console.log("📄 Структура ответа:", Object.keys(data));
    
    if (data.results) {
      console.log("📄 Количество результатов:", data.results.length);
      if (data.results[0]) {
        console.log("📄 Первый результат:", Object.keys(data.results[0]));
        if (data.results[0].results) {
          console.log("📄 Количество подрезультатов:", data.results[0].results.length);
          if (data.results[0].results[0]) {
            console.log("📄 Первый подрезультат:", Object.keys(data.results[0].results[0]));
            if (data.results[0].results[0].textDetection) {
              console.log("📄 textDetection найден:", Object.keys(data.results[0].results[0].textDetection));
              if (data.results[0].results[0].textDetection.pages) {
                console.log("📄 Количество страниц:", data.results[0].results[0].textDetection.pages.length);
              }
            }
          }
        }
      }
    }

    // Извлекаем текст
    const text = data.results?.[0]?.results?.[0]?.textDetection?.pages
      ?.map((page: any) => page.blocks
        ?.map((block: any) => block.lines?.map((line: any) => line.words?.map((word: any) => word.text).join(' ')).join(' '))
        .join('\n'))
      .join('\n\n') || '';

    console.log("📄 Извлеченный текст:", text);
    console.log("📄 Длина текста:", text.length);

    return NextResponse.json({
      success: true,
      textLength: text.length,
      textPreview: text.substring(0, 500),
      apiResponse: data
    });
  } catch (error) {
    console.error("❌ Ошибка в простом тесте:", error);
    return NextResponse.json(
      { 
        error: "Ошибка тестирования", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 