import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Отправка файла из аккредитации как документа в Telegram
export async function POST(request: NextRequest) {
  try {
    console.log("📤 [SEND-DOCUMENT] Отправка файла как документа в Telegram");

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const productIndex = searchParams.get('productIndex') || '0';
    const imageIndex = searchParams.get('imageIndex') || '0';
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

    console.log("🔍 [SEND-DOCUMENT] Получаем данные заявки:", { applicationId, productIndex, imageIndex });

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

    // Парсим данные товаров
    let productsData = [];
    try {
      productsData = typeof application.products_data === 'string' 
        ? JSON.parse(application.products_data) 
        : application.products_data;
    } catch (parseError) {
      console.error('Ошибка парсинга products_data:', parseError);
      return NextResponse.json({ 
        error: "Ошибка чтения данных товаров" 
      }, { status: 500 });
    }

    const product = productsData[parseInt(productIndex)];
    if (!product) {
      return NextResponse.json({ 
        error: "Товар не найден" 
      }, { status: 404 });
    }

    const images = product.images_info || [];
    const image = images[parseInt(imageIndex)];
    
    if (!image) {
      return NextResponse.json({ 
        error: "Изображение не найдено" 
      }, { status: 404 });
    }

    console.log("📷 [SEND-DOCUMENT] Найдено изображение:", image);

    if (!image.public_url) {
      return NextResponse.json({ 
        error: "У изображения нет публичного URL" 
      }, { status: 400 });
    }

    try {
      // Извлекаем путь из public_url
      const urlParts = image.public_url.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        return NextResponse.json({ 
          error: "Неверный формат public_url" 
        }, { status: 400 });
      }
      
      const bucketAndPath = urlParts[1];
      const [bucket, ...pathParts] = bucketAndPath.split('/');
      const storagePath = pathParts.join('/');
      
      console.log("📥 [SEND-DOCUMENT] Скачиваем файл из бакета:", bucket, "по пути:", storagePath);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(storagePath);

      if (downloadError) {
        console.error("❌ [SEND-DOCUMENT] Ошибка скачивания файла:", downloadError);
        return NextResponse.json({ 
          error: "Ошибка скачивания файла",
          details: downloadError.message
        }, { status: 500 });
      }

      console.log("✅ [SEND-DOCUMENT] Файл скачан, размер:", fileData.size);

      // Конвертируем в Buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());
      
      // Создаем FormData для отправки файла в Telegram как документ
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('document', new Blob([buffer], { type: image.type }), image.name);
      formData.append('caption', `📷 ${image.name}\nРазмер: ${(image.size / 1024).toFixed(1)} KB\nТип: ${image.type}`);

      // Отправляем файл в Telegram через Bot API как документ
      const botToken = process.env.TELEGRAM_CHAT_BOT_TOKEN;
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;

      console.log("📤 [SEND-DOCUMENT] Отправляем документ в Telegram...");

      const response = await fetch(telegramUrl, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ [SEND-DOCUMENT] Ошибка Telegram API:", result);
        return NextResponse.json({ 
          error: "Ошибка отправки в Telegram",
          details: result.description || 'Неизвестная ошибка'
        }, { status: 500 });
      }

      console.log("✅ [SEND-DOCUMENT] Документ отправлен успешно");

      return NextResponse.json({
        success: true,
        message: "Документ отправлен в Telegram",
        result: result
      });

    } catch (telegramError) {
      console.error("❌ [SEND-DOCUMENT] Ошибка отправки в Telegram:", telegramError);
      return NextResponse.json({ 
        error: "Ошибка отправки в Telegram",
        details: telegramError instanceof Error ? telegramError.message : 'Неизвестная ошибка'
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ [SEND-DOCUMENT] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 