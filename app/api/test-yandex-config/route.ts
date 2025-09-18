import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 API /test-yandex-config вызван");
    
    const apiKey = process.env.YANDEX_VISION_API_KEY || '';
    const folderId = process.env.YANDEX_FOLDER_ID || '';
    
    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'НЕ НАЙДЕН');
    console.log('📁 Folder ID:', folderId ? folderId : 'НЕ НАЙДЕН');
    
    return NextResponse.json({
      success: true,
      config: {
        apiKeyExists: !!apiKey,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : null,
        folderIdExists: !!folderId,
        folderId: folderId || null
      },
      message: "Конфигурация Yandex Vision проверена"
    });
  } catch (error) {
    console.error("❌ Ошибка в API test-yandex-config:", error);
    return NextResponse.json(
      {
        error: "Ошибка проверки конфигурации",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 