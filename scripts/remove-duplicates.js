#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const TARGET_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const db = createClient(TARGET_URL, TARGET_KEY);

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🗑️ УДАЛЕНИЕ ДУБЛИКАТОВ');
  console.log('═══════════════════════════════════════════════════\n');

  const { data: supplier } = await db
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'TechnoModern Import')
    .single();

  // Загружаем ВСЕ товары
  console.log('📦 Загружаем товары...');
  const allProducts = [];
  let offset = 0;
  while (true) {
    const { data } = await db
      .from('catalog_verified_products')
      .select('id, sku, created_at')
      .eq('supplier_id', supplier.id)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allProducts.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }

  console.log(`✅ Загружено: ${allProducts.length} записей\n`);

  // Группируем по SKU
  const bySku = {};
  allProducts.forEach(p => {
    bySku[p.sku] = bySku[p.sku] || [];
    bySku[p.sku].push(p);
  });

  // Находим дубликаты для удаления (оставляем самую новую запись)
  const toDelete = [];

  Object.entries(bySku).forEach(([sku, items]) => {
    if (items.length > 1) {
      // Сортируем по дате создания (новые первые)
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      // Оставляем первую (самую новую), удаляем остальные
      toDelete.push(...items.slice(1).map(p => p.id));
    }
  });

  console.log(`🗑️ К удалению: ${toDelete.length} дубликатов\n`);

  if (toDelete.length === 0) {
    console.log('✅ Дубликатов нет!');
    return;
  }

  // Удаляем батчами по 100
  let deleted = 0;
  const batchSize = 100;

  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);

    const { error } = await db
      .from('catalog_verified_products')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`❌ Ошибка: ${error.message}`);
    } else {
      deleted += batch.length;
    }

    process.stdout.write(`\r⏳ Удалено: ${deleted}/${toDelete.length}`);
  }

  console.log(`\r⏳ Удалено: ${deleted}/${toDelete.length}`);

  // Проверяем результат
  console.log('\n📊 Проверяем результат...');

  let remaining = 0;
  offset = 0;
  while (true) {
    const { data } = await db
      .from('catalog_verified_products')
      .select('id')
      .eq('supplier_id', supplier.id)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    remaining += data.length;
    offset += 1000;
    if (data.length < 1000) break;
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ УДАЛЕНИЕ ЗАВЕРШЕНО');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  🗑️ Удалено дубликатов: ${deleted}`);
  console.log(`  📦 Осталось товаров: ${remaining}`);
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
