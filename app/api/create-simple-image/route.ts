import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { supabase } from "@/lib/supabaseClient";

// POST: Создание простого тестового изображения
export async function POST(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId') || '05fdf6bd-7f27-4e54-9b3f-485b938e7c33';

    // Создаем простое SVG изображение
    const svgContent = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f0f0f0" stroke="#333" stroke-width="2"/>
        <text x="200" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="#333">Тестовое изображение</text>
        <text x="200" y="130" font-family="Arial" font-size="16" text-anchor="middle" fill="#333">для аккредитации</text>
        <text x="200" y="160" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">ID: ${applicationId}</text>
        <text x="200" y="180" font-family="Arial" font-size="12" text-anchor="middle" fill="#333">Дата: ${new Date().toLocaleDateString('ru-RU')}</text>
        <circle cx="200" cy="220" r="30" fill="#4CAF50"/>
        <text x="200" y="228" font-family="Arial" font-size="20" text-anchor="middle" fill="white">✓</text>
      </svg>
    `;

    // Конвертируем SVG в Buffer
    const buffer = Buffer.from(svgContent, 'utf-8');
    

    // Сохраняем в Storage
    const fileName = `test-svg-image-${Date.now()}.svg`;
    const storagePath = `accreditation/${applicationId}/products/0/images/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(storagePath, buffer, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      logger.error("❌ [CREATE-SIMPLE-IMAGE] Ошибка загрузки изображения:", uploadError);
      return NextResponse.json({ 
        error: "Ошибка загрузки изображения",
        details: uploadError.message
      }, { status: 500 });
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(storagePath);


    // Обновляем заявку с новым изображением
    const { data: application, error: appError } = await supabase
      .from('accreditation_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
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
      logger.error('Ошибка парсинга products_data:', parseError);
      return NextResponse.json({ 
        error: "Ошибка чтения данных товаров" 
      }, { status: 500 });
    }

    // Добавляем новое изображение к первому товару
    if (productsData.length > 0) {
      if (!productsData[0].images_info) {
        productsData[0].images_info = [];
      }
      
      productsData[0].images_info.push({
        name: fileName,
        size: buffer.length,
        type: 'image/svg+xml',
        public_url: urlData.publicUrl
      });

      // Обновляем заявку
      const { error: updateError } = await supabase
        .from('accreditation_applications')
        .update({
          products_data: JSON.stringify(productsData),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) {
        logger.error("❌ [CREATE-SIMPLE-IMAGE] Ошибка обновления заявки:", updateError);
      } else {
      }
    }

    return NextResponse.json({
      success: true,
      message: "Простое тестовое изображение создано",
      image: {
        name: fileName,
        size: buffer.length,
        type: 'image/svg+xml',
        public_url: urlData.publicUrl,
        storage_path: storagePath
      }
    });

  } catch (error) {
    logger.error("❌ [CREATE-SIMPLE-IMAGE] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 