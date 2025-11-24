import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Отправка юридического документа из аккредитации в Telegram
export async function POST(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const docIndex = searchParams.get('docIndex') || '0';
    const chatId = searchParams.get('chatId') || process.env.TELEGRAM_CHAT_ID;

    if (!applicationId) {
      return NextResponse.json({ 
        error: "Не указан ID заявки" 
      }, { status: 400 });
    }

    if (!chatId) {
      return NextResponse.json({ 
        error: "Не указан chat_id" 
      }, { status: 400 });
    }


    // Получаем данные заявки
    const { data: application, error } = await supabase
      .from('accreditation_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !application) {
      return NextResponse.json({ 
        error: "Заявка не найдена" 
      }, { status: 404 });
    }

    // Парсим данные юридических документов
    let legalDocumentsData = [];
    try {
      legalDocumentsData = typeof application.legal_documents_data === 'string' 
        ? JSON.parse(application.legal_documents_data) 
        : application.legal_documents_data || [];
    } catch (parseError) {
      console.error('Ошибка парсинга legal_documents_data:', parseError);
      return NextResponse.json({ 
        error: "Ошибка чтения данных документов" 
      }, { status: 500 });
    }

    const document = legalDocumentsData[parseInt(docIndex)];
    
    if (!document) {
      return NextResponse.json({ 
        error: "Документ не найден" 
      }, { status: 404 });
    }


    if (!document.public_url) {
      return NextResponse.json({ 
        error: "У документа нет публичного URL" 
      }, { status: 400 });
    }

    try {
      // Извлекаем путь из public_url
      const urlParts = document.public_url.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        return NextResponse.json({ 
          error: "Неверный формат public_url" 
        }, { status: 400 });
      }
      
      const bucketAndPath = urlParts[1];
      const [bucket, ...pathParts] = bucketAndPath.split('/');
      const storagePath = pathParts.join('/');
      
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(storagePath);

      if (downloadError) {
        console.error("❌ [SEND-LEGAL-DOC] Ошибка скачивания файла:", downloadError);
        return NextResponse.json({ 
          error: "Ошибка скачивания файла",
          details: downloadError.message
        }, { status: 500 });
      }


      // Конвертируем в Buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());

      // Отправляем в Telegram как документ
      const botToken = process.env.TELEGRAM_CHAT_BOT_TOKEN;
      if (!botToken) {
        return NextResponse.json({ 
          error: "Не настроен токен бота" 
        }, { status: 500 });
      }

      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', new Blob([buffer]), document.fileName);
      formData.append('caption', `⚖️ Юридический документ\n\n🏢 Поставщик: ${application.supplier_name}\n📋 Тип: ${document.type}\n📝 Название: ${document.name}\n📏 Размер: ${(document.size / 1024).toFixed(1)} KB`);


      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.ok) {
        console.error("❌ [SEND-LEGAL-DOC] Ошибка Telegram API:", result);
        return NextResponse.json({ 
          error: "Ошибка отправки в Telegram",
          details: result.description
        }, { status: 500 });
      }


      return NextResponse.json({
        success: true,
        message: "Юридический документ отправлен в Telegram",
        result: result
      });

    } catch (error) {
      console.error("❌ [SEND-LEGAL-DOC] Ошибка:", error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ [SEND-LEGAL-DOC] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 