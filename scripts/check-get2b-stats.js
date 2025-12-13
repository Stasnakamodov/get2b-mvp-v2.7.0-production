#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const TARGET_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const db = createClient(TARGET_URL, TARGET_KEY);

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  📊 СТАТИСТИКА КАТАЛОГА Get2B');
  console.log('═══════════════════════════════════════════════════\n');

  // Получаем все товары с их категориями
  const { data: products } = await db
    .from('catalog_verified_products')
    .select('category, supplier_id');

  // Получаем поставщика TechnoModern
  const { data: supplier } = await db
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'TechnoModern Import')
    .single();

  const technomodernId = supplier?.id;

  // Группируем по категориям
  const allStats = {};
  const tmStats = {};

  products.forEach(p => {
    allStats[p.category] = (allStats[p.category] || 0) + 1;
    if (p.supplier_id === technomodernId) {
      tmStats[p.category] = (tmStats[p.category] || 0) + 1;
    }
  });

  console.log('📦 ВСЕГО ТОВАРОВ В КАТАЛОГЕ:', products.length);
  console.log('\n--- Все товары по категориям ---\n');

  const total = products.length;
  Object.entries(allStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(pct / 2));
      console.log(`  ${cat.padEnd(22)} ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
    });

  console.log('\n--- Товары TechnoModern ---\n');

  const tmTotal = Object.values(tmStats).reduce((a, b) => a + b, 0);
  console.log(`📦 Товаров от TechnoModern: ${tmTotal}\n`);

  Object.entries(tmStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / tmTotal) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(pct / 2));
      console.log(`  ${cat.padEnd(22)} ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
    });

  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
