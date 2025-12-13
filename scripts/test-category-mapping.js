#!/usr/bin/env node
/**
 * Тест маппинга категорий TechnoModern → Get2B
 * Показывает как товары распределятся после импорта
 */

const { createClient } = require('@supabase/supabase-js');

const SOURCE_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTk5NDcsImV4cCI6MjA2NDE3NTk0N30.cpW1S5MK7eOfYSZx9gHP_AP-wH5BRIigUFwlBYNA2MI';

const db = createClient(SOURCE_URL, SOURCE_KEY);

// Новый маппинг (из import-technomodern-catalog.js)
const CATEGORY_MAPPING = {
  'electronics': 'Электроника',
  'computer-accessories': 'Электроника',
  'peripherals': 'Электроника',
  'smartphones-tablets': 'Электроника',
  'smartwatches': 'Электроника',
  'smart-home': 'Электроника',

  'home': 'Дом и быт',
  'bedroom': 'Дом и быт',
  'furniture': 'Дом и быт',
  'household-goods': 'Дом и быт',
  'lighting': 'Дом и быт',
  'textiles': 'Дом и быт',
  'storage': 'Дом и быт',
  'kitchen': 'Дом и быт',
  'tableware': 'Дом и быт',
  'plumbing': 'Дом и быт',
  'decor': 'Дом и быт',
  'sewing-supplies': 'Дом и быт',

  'health-beauty': 'Здоровье и красота',
  'skincare': 'Здоровье и красота',
  'cosmetics': 'Здоровье и красота',
  'hygiene': 'Здоровье и красота',
  'vitamins': 'Здоровье и красота',

  'automotive': 'Автотовары',
  'auto-chemicals': 'Автотовары',
  'auto-parts': 'Автотовары',
  'tires-wheels': 'Автотовары',

  'construction': 'Строительство',
  'tools': 'Строительство',
  'electrical': 'Строительство',
  'fasteners': 'Строительство',
  'paints': 'Строительство',
  'building-materials': 'Строительство',
  'finishing-materials': 'Строительство',
  'electrical-components': 'Строительство',
  'doors-windows': 'Строительство',
  'solvents': 'Строительство',

  'industrial': 'Строительство',
  'machinery': 'Строительство',

  'clothing-wholesale': 'Одежда и аксессуары',

  'books': 'Хобби и творчество',
};

const DEFAULT_CATEGORY = 'Электроника';

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🧪 ТЕСТ МАППИНГА КАТЕГОРИЙ');
  console.log('═══════════════════════════════════════════════════\n');

  // Загружаем категории
  const { data: categories } = await db
    .from('categories')
    .select('id, name, slug');

  const catMap = new Map(categories.map(c => [c.id, c]));

  // Загружаем товары
  const { data: products } = await db
    .from('products')
    .select('id, name, category_id');

  console.log(`📦 Всего товаров: ${products.length}\n`);

  // Считаем распределение по Get2B категориям
  const get2bStats = {};
  const unmapped = [];

  products.forEach(p => {
    const cat = catMap.get(p.category_id);
    const slug = cat ? cat.slug : null;

    let targetCategory;
    if (slug && CATEGORY_MAPPING[slug]) {
      targetCategory = CATEGORY_MAPPING[slug];
    } else {
      targetCategory = DEFAULT_CATEGORY;
      if (slug) {
        unmapped.push({ slug, name: cat.name, product: p.name });
      }
    }

    get2bStats[targetCategory] = get2bStats[targetCategory] || 0;
    get2bStats[targetCategory]++;
  });

  // Выводим результат
  console.log('📊 РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ Get2B:\n');

  const total = products.length;
  Object.entries(get2bStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const bar = '█'.repeat(Math.round(pct / 2));
      console.log(`  ${cat.padEnd(22)} ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
    });

  console.log(`\n  ${'─'.repeat(50)}`);
  console.log(`  ${'ИТОГО'.padEnd(22)} ${String(total).padStart(4)} (100.0%)`);

  // Проверяем немаппированные
  if (unmapped.length > 0) {
    console.log('\n⚠️  НЕМАППИРОВАННЫЕ КАТЕГОРИИ (fallback → Электроника):');
    const uniqueUnmapped = [...new Set(unmapped.map(u => u.slug))];
    uniqueUnmapped.forEach(slug => {
      const items = unmapped.filter(u => u.slug === slug);
      console.log(`    ${slug}: ${items.length} товаров`);
    });
  } else {
    console.log('\n✅ Все категории успешно замаплены!');
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ ТЕСТ ЗАВЕРШЁН');
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
