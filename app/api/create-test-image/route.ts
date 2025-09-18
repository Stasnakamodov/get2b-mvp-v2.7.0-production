import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: Создание качественного тестового изображения
export async function POST(request: NextRequest) {
  try {
    console.log("🎨 [CREATE-IMAGE] Создание качественного тестового изображения");

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId') || '05fdf6bd-7f27-4e54-9b3f-485b938e7c33';

    // Создаем простое изображение с помощью Canvas API
    const { createCanvas } = await import('canvas');
    
    // Создаем canvas 400x300
    const canvas = createCanvas(400, 300);
    const ctx = canvas.getContext('2d');

    // Заполняем фон
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 400, 300);

    // Рисуем рамку
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 380, 280);

    // Добавляем текст
    ctx.fillStyle = '#333';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Тестовое изображение', 200, 100);
    
    ctx.font = '16px Arial';
    ctx.fillText('для аккредитации', 200, 130);
    
    ctx.font = '12px Arial';
    ctx.fillText(`ID: ${applicationId}`, 200, 160);
    ctx.fillText(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 200, 180);

    // Рисуем простую иконку
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(200, 220, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('✓', 200, 228);

    // Конвертируем в PNG
    const buffer = canvas.toBuffer('image/png');
    
    console.log("✅ [CREATE-IMAGE] Изображение создано, размер:", buffer.length);

    // Сохраняем в Storage
    const fileName = `test-quality-image-${Date.now()}.png`;
    const storagePath = `accreditation/${applicationId}/products/0/images/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("❌ [CREATE-IMAGE] Ошибка загрузки изображения:", uploadError);
      return NextResponse.json({ 
        error: "Ошибка загрузки изображения",
        details: uploadError.message
      }, { status: 500 });
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(storagePath);

    console.log("✅ [CREATE-IMAGE] Изображение сохранено:", urlData.publicUrl);

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
      console.error('Ошибка парсинга products_data:', parseError);
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
        type: 'image/png',
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
        console.error("❌ [CREATE-IMAGE] Ошибка обновления заявки:", updateError);
      } else {
        console.log("✅ [CREATE-IMAGE] Заявка обновлена с новым изображением");
      }
    }

    return NextResponse.json({
      success: true,
      message: "Качественное тестовое изображение создано",
      image: {
        name: fileName,
        size: buffer.length,
        type: 'image/png',
        public_url: urlData.publicUrl,
        storage_path: storagePath
      }
    });

  } catch (error) {
    console.error("❌ [CREATE-IMAGE] Критическая ошибка:", error);
    return NextResponse.json({ 
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }, { status: 500 });
  }
} 