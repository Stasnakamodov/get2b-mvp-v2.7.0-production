#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const SOURCE_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTk5NDcsImV4cCI6MjA2NDE3NTk0N30.cpW1S5MK7eOfYSZx9gHP_AP-wH5BRIigUFwlBYNA2MI';

const db = createClient(SOURCE_URL, SOURCE_KEY);

async function main() {
  // 1. Получаем все категории
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  📂 АНАЛИЗ СТРУКТУРЫ TechnoModern');
  console.log('═══════════════════════════════════════════════════\n');

  const { data: categories, error: catError } = await db
    .from('categories')
    .select('id, name, slug, parent_id, level, product_count')
    .order('level')
    .order('name');

  if (catError) {
    console.error('❌ Ошибка загрузки категорий:', catError.message);
    return;
  }

  console.log('📊 Всего категорий:', categories.length);

  // Группируем по level
  const byLevel = {};
  categories.forEach(c => {
    byLevel[c.level] = byLevel[c.level] || [];
    byLevel[c.level].push(c);
  });

  console.log('\n--- Категории по уровням ---');
  Object.entries(byLevel).forEach(([level, cats]) => {
    console.log(`  Level ${level}: ${cats.length} категорий`);
  });

  console.log('\n--- ВСЕ КАТЕГОРИИ ---');
  categories.forEach(c => {
    const parent = c.parent_id ? categories.find(p => p.id === c.parent_id) : null;
    console.log(`  [L${c.level}] ${c.slug} | "${c.name}" | parent: ${parent ? parent.slug : 'NULL'} | product_count: ${c.product_count || 0}`);
  });

  // 2. Получаем товары
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  📦 СТАТИСТИКА ТОВАРОВ');
  console.log('═══════════════════════════════════════════════════\n');

  const { data: products, error: prodError } = await db
    .from('products')
    .select('id, name, category_id, sku');

  if (prodError) {
    console.error('❌ Ошибка загрузки товаров:', prodError.message);
    return;
  }

  console.log('📊 Всего товаров:', products.length);

  // Создаём map категорий
  const catMap = new Map(categories.map(c => [c.id, c]));

  // Группируем товары по category_id
  const stats = {};
  let nullCount = 0;
  let unknownCount = 0;

  products.forEach(p => {
    if (p.category_id === null || p.category_id === undefined) {
      nullCount++;
    } else {
      const cat = catMap.get(p.category_id);
      if (cat) {
        stats[cat.slug] = stats[cat.slug] || { name: cat.name, count: 0 };
        stats[cat.slug].count++;
      } else {
        unknownCount++;
        const key = 'UNKNOWN_' + p.category_id.substring(0, 8);
        stats[key] = stats[key] || { name: 'Unknown category', count: 0 };
        stats[key].count++;
      }
    }
  });

  console.log('\n--- РАСПРЕДЕЛЕНИЕ ТОВАРОВ ---');
  console.log(`  ❓ Товаров БЕЗ category_id (null): ${nullCount}`);
  console.log(`  ⚠️ Товаров с несуществующим category_id: ${unknownCount}`);
  console.log('\n  По категориям:');

  Object.entries(stats)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([slug, data]) => {
      console.log(`    ${slug}: ${data.count} товаров ("${data.name}")`);
    });

  // 3. Проверяем структуру таблицы products
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🔍 ПРИМЕРЫ ТОВАРОВ');
  console.log('═══════════════════════════════════════════════════\n');

  // Берём по 2 примера из разных категорий
  const sampleCats = Object.keys(stats).slice(0, 5);

  for (const slug of sampleCats) {
    const cat = categories.find(c => c.slug === slug);
    if (!cat) continue;

    const { data: samples } = await db
      .from('products')
      .select('id, name, sku, price, category_id')
      .eq('category_id', cat.id)
      .limit(3);

    console.log(`\n📁 Категория: ${slug} (${cat.name})`);
    if (samples && samples.length > 0) {
      samples.forEach(p => {
        console.log(`    - ${p.name} (SKU: ${p.sku}, price: ${p.price})`);
      });
    } else {
      console.log('    (нет товаров)');
    }
  }

  // 4. Проверяем есть ли другие поля категоризации
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🏷️ ДОПОЛНИТЕЛЬНЫЕ ПОЛЯ ТОВАРОВ');
  console.log('═══════════════════════════════════════════════════\n');

  const { data: sample } = await db
    .from('products')
    .select('*')
    .limit(1);

  if (sample && sample.length > 0) {
    console.log('Поля в таблице products:');
    Object.keys(sample[0]).forEach(key => {
      const val = sample[0][key];
      const type = Array.isArray(val) ? 'array' : typeof val;
      console.log(`  - ${key}: ${type}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ АНАЛИЗ ЗАВЕРШЁН');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
