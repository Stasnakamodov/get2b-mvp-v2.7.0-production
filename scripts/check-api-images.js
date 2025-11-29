#!/usr/bin/env node

async function check() {
  const response = await fetch('http://localhost:3002/api/catalog/products-by-category/ТЕСТОВАЯ?limit=1');
  const data = await response.json();

  const p = data.products?.[0];

  if (!p) {
    console.log('❌ Товары не найдены');
    return;
  }

  console.log('=== ПРОВЕРКА API ОТВЕТА ===\n');
  console.log('Товар:', p.product_name);
  console.log('');
  console.log('Поля:');
  console.log('  image_url:', p.image_url ? '✅ ЕСТЬ' : '❌ НЕТ');
  console.log('  images:   ', p.images ? '✅ ЕСТЬ' : '❌ НЕТ');
  console.log('');

  if (p.image_url) {
    console.log('Image URL:', p.image_url.substring(0, 100) + '...');
  }

  if (p.images) {
    console.log('Images array:', p.images);
  }

  console.log('');

  if (!p.images) {
    console.log('⚠️  ПРОБЛЕМА: Поле images ОТСУТСТВУЕТ!');
    console.log('   Нужно применить SQL миграцию:');
    console.log('   supabase/migrations/20251127_fix_get_products_by_category_images.sql');
  } else {
    console.log('✅ Поле images присутствует - миграция применена!');
  }
}

check().catch(console.error);
