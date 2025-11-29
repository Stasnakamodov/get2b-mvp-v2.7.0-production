#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки ответа RPC функции get_products_by_category
 * Цель: выяснить, возвращает ли функция поле 'images' или только 'image_url'
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY не установлен в .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRPCFunction() {
  console.log('🔍 Тестирование RPC функции get_products_by_category...\n');

  const { data, error } = await supabase.rpc('get_products_by_category', {
    category_name: 'ТЕСТОВАЯ',
    user_id_param: null,
    search_query: null,
    limit_param: 1,
    offset_param: 0
  });

  if (error) {
    console.error('❌ Ошибка вызова RPC:', error);
    return;
  }

  console.log('✅ RPC функция вызвана успешно\n');

  // Проверяем структуру ответа
  console.log('📦 Тип данных:', typeof data);
  console.log('📦 Это массив?', Array.isArray(data));
  console.log('📦 Количество элементов:', data?.length || 0);
  console.log('');

  if (Array.isArray(data) && data.length > 0) {
    const product = data[0];

    console.log('🔍 АНАЛИЗ ПЕРВОГО ТОВАРА:');
    console.log('='.repeat(80));

    // Проверяем наличие ключевых полей
    const fields = ['id', 'product_name', 'image_url', 'images', 'price', 'category'];

    fields.forEach(field => {
      if (field in product) {
        const value = product[field];
        console.log(`✅ ${field.padEnd(20)}: ${typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : value}`);
      } else {
        console.log(`❌ ${field.padEnd(20)}: ОТСУТСТВУЕТ`);
      }
    });

    console.log('='.repeat(80));
    console.log('');

    // Детальный анализ image_url
    if ('image_url' in product) {
      console.log('🖼️  АНАЛИЗ ПОЛЯ image_url:');
      console.log('   Тип:', typeof product.image_url);
      console.log('   Значение:', product.image_url);
      console.log('   Длина:', product.image_url?.length || 0);
      console.log('');
    }

    // Детальный анализ images
    if ('images' in product) {
      console.log('🖼️  АНАЛИЗ ПОЛЯ images:');
      console.log('   Тип:', typeof product.images);
      console.log('   Значение:', JSON.stringify(product.images, null, 2));

      if (Array.isArray(product.images)) {
        console.log('   Количество элементов:', product.images.length);
        product.images.forEach((img, i) => {
          console.log(`   [${i}]:`, img);
        });
      }
      console.log('');
    } else {
      console.log('❌ КРИТИЧЕСКАЯ ПРОБЛЕМА: Поле "images" отсутствует в ответе RPC!');
      console.log('   Это значит, что RPC функция НЕ возвращает массив изображений.');
      console.log('   Необходимо применить миграцию: supabase/migrations/20251127_fix_get_products_by_category_images.sql');
      console.log('');
    }

    // Полный JSON для отладки
    console.log('📄 ПОЛНЫЙ JSON ОБЪЕКТА:');
    console.log(JSON.stringify(product, null, 2));

  } else {
    console.log('⚠️  Товары не найдены или пустой ответ');
  }
}

testRPCFunction().catch(console.error);
