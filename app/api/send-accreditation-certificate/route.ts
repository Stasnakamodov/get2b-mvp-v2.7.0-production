import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Отправка сертификата товара из аккредитации в Telegram
export async function POST(request: NextRequest) {
  try {
    console.log("📤 [SEND-CERTIFICATE] Отправка сертификата в Telegram");

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const productIndex = searchParams.get('productIndex') || '0';
    const certIndex = searchParams.get('certIndex') || '0';
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

    console.log("🔍 [SEND-CERTIFICATE] Получаем данные заявки:", { applicationId, productIndex, certIndex });

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

    const certificates = product.certificates_info || [];
    const certificate = certificates[parseInt(certIndex)];
    
    if (!certificate) {
      return NextResponse.json({ 
        error: "Сертификат не найден" 
      }, { status: 404 });
    }

    console.log("📄 [SEND-CERTIFICATE] Найден сертификат:", certificate);

    if (!certificate.public_url) {
      return NextResponse.json({ 
        error: "У сертификата нет публичного URL" 
      }, { status: 400 });
    }

    try {
      // Извлекаем путь из public_url
      const urlParts = certificate.public_url.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        return NextResponse.json({ 
          error: "Неверный формат public_url" 
        }, { status: 400 });
      }
      
      const bucketAndPath = urlParts[1];
      const [bucket, ...pathParts] = bucketAndPath.split('/');
      const storagePath = pathParts.join('/');
      
      console.log("📥 [SEND-CERTIFICATE] Скачиваем файл из бакета:", bucket, "по пути:", storagePath);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(storagePath);

      if (downloadError) {
        console.error("❌ [SEND-CERTIFICATE] Ошибка скачивания файла:", downloadError);
        return NextResponse.json({ 
          error: "Ошибка скачивания файла",
          details: downloadError.message
        }, { status: 500 });
      }

      console.log("✅ [SEND-CERTIFICATE] Файл скачан, размер:", fileData.size);

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
      formData.append('document', new Blob([buffer]), certificate.name);
      formData.append('caption', `📄 Сертификат товара: ${product.name}\n\n📦 Товар: ${product.name}\n📋 Тип: ${certificate.type}\n📏 Размер: ${(certificate.size / 1024).toFixed(1)} KB`);

      console.log("📤 [SEND-CERTIFICATE] Отправляем в Telegram...");

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.ok) {
        console.error("❌ [SEND-CERTIFICATE] Ошибка Telegram API:", result);
        return NextResponse.json({ 
          error: "Ошибка отправки в Telegram",
          details: result.description
        }, { status: 500 });
      }

      console.log("✅ [SEND-CERTIFICATE] Сертификат отправлен успешно");

      return NextResponse.json({
        success: true,
        message: "Сертификат отправлен в Telegram",
        result: result
      });

    } catch (error) {
      console.error("❌ [SEND-CERTIFICATE] Ошибка:", error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ [SEND-CERTIFICATE] Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 