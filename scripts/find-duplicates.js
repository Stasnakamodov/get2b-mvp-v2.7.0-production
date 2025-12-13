#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const TARGET_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const db = createClient(TARGET_URL, TARGET_KEY);

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🔍 ПОИСК ДУБЛИКАТОВ');
  console.log('═══════════════════════════════════════════════════\n');

  const { data: supplier } = await db
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'TechnoModern Import')
    .single();

  // Загружаем ВСЕ товары
  const allProducts = [];
  let offset = 0;
  while (true) {
    const { data } = await db
      .from('catalog_verified_products')
      .select('id, sku, name, category, created_at')
      .eq('supplier_id', supplier.id)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allProducts.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }

  console.log(`📦 Всего записей: ${allProducts.length}`);

  // Группируем по SKU
  const bySku = {};
  allProducts.forEach(p => {
    bySku[p.sku] = bySku[p.sku] || [];
    bySku[p.sku].push(p);
  });

  const uniqueSkus = Object.keys(bySku).length;
  const duplicateSkus = Object.entries(bySku).filter(([_, items]) => items.length > 1);

  console.log(`🔑 Уникальных SKU: ${uniqueSkus}`);
  console.log(`📋 SKU с дубликатами: ${duplicateSkus.length}`);

  const totalDuplicates = duplicateSkus.reduce((sum, [_, items]) => sum + items.length - 1, 0);
  console.log(`🔄 Всего дубликатов (лишних записей): ${totalDuplicates}`);

  // Показываем примеры
  console.log('\n📝 Примеры дубликатов:');
  duplicateSkus.slice(0, 5).forEach(([sku, items]) => {
    console.log(`\n  SKU: ${sku} (${items.length} записей)`);
    items.forEach(p => {
      console.log(`    - id: ${p.id.substring(0,8)}... | ${p.category} | ${p.created_at}`);
    });
  });

  // Статистика по количеству дубликатов
  const dupCounts = {};
  duplicateSkus.forEach(([_, items]) => {
    dupCounts[items.length] = (dupCounts[items.length] || 0) + 1;
  });

  console.log('\n📊 Распределение дубликатов:');
  Object.entries(dupCounts).sort((a,b) => Number(a[0]) - Number(b[0])).forEach(([count, skus]) => {
    console.log(`  ${count} записей на SKU: ${skus} SKU`);
  });

  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
