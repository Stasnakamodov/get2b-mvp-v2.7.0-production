#!/usr/bin/env node
/**
 * Исправляет категории уже импортированных товаров TechnoModern
 * Обновляет товары, у которых category = 'Электроника', на правильную категорию
 */

const { createClient } = require('@supabase/supabase-js');

// TechnoModern (источник)
const SOURCE_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTk5NDcsImV4cCI6MjA2NDE3NTk0N30.cpW1S5MK7eOfYSZx9gHP_AP-wH5BRIigUFwlBYNA2MI';

// Get2B (цель)
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const sourceDb = createClient(SOURCE_URL, SOURCE_KEY);
const targetDb = createClient(TARGET_URL, TARGET_KEY);

// Маппинг категорий
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

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  🔧 ИСПРАВЛЕНИЕ КАТЕГОРИЙ TechnoModern');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Загружаем категории из TechnoModern
  console.log('📂 Загружаем категории из TechnoModern...');
  const { data: categories } = await sourceDb
    .from('categories')
    .select('id, name, slug, parent_id');

  const catMap = new Map(categories.map(c => [c.id, c]));
  console.log(`✅ Загружено ${categories.length} категорий\n`);

  // 2. Загружаем товары из TechnoModern (для маппинга SKU → category)
  console.log('📦 Загружаем товары из TechnoModern...');
  const { data: sourceProducts } = await sourceDb
    .from('products')
    .select('sku, category_id');

  // Создаём маппинг SKU → правильная категория Get2B
  const skuToCategory = new Map();
  sourceProducts.forEach(p => {
    const cat = catMap.get(p.category_id);
    if (cat) {
      const targetCategory = CATEGORY_MAPPING[cat.slug] || 'Электроника';
      skuToCategory.set(p.sku, targetCategory);
    }
  });
  console.log(`✅ Загружено ${sourceProducts.length} товаров\n`);

  // 3. Получаем товары Get2B с category = 'Электроника' от TechnoModern
  console.log('🔍 Ищем товары с неправильной категорией в Get2B...');

  const { data: supplier } = await targetDb
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'TechnoModern Import')
    .single();

  if (!supplier) {
    console.error('❌ Поставщик TechnoModern Import не найден');
    return;
  }

  const { data: wrongProducts } = await targetDb
    .from('catalog_verified_products')
    .select('id, sku, name, category')
    .eq('supplier_id', supplier.id)
    .eq('category', 'Электроника');

  console.log(`📊 Найдено ${wrongProducts.length} товаров с category='Электроника'\n`);

  // 4. Фильтруем те, которые должны быть в другой категории
  const toUpdate = wrongProducts.filter(p => {
    const correctCategory = skuToCategory.get(p.sku);
    return correctCategory && correctCategory !== 'Электроника';
  });

  console.log(`🔧 Нужно исправить: ${toUpdate.length} товаров\n`);

  if (toUpdate.length === 0) {
    console.log('✅ Все категории уже правильные!');
    return;
  }

  // 5. Обновляем категории
  const stats = {};
  let updated = 0;
  let errors = 0;

  for (const product of toUpdate) {
    const correctCategory = skuToCategory.get(product.sku);

    const { error } = await targetDb
      .from('catalog_verified_products')
      .update({ category: correctCategory })
      .eq('id', product.id);

    if (error) {
      errors++;
      console.error(`❌ Ошибка обновления ${product.sku}: ${error.message}`);
    } else {
      updated++;
      stats[correctCategory] = (stats[correctCategory] || 0) + 1;
    }

    // Прогресс каждые 100 товаров
    if (updated % 100 === 0) {
      process.stdout.write(`\r⏳ Обновлено: ${updated}/${toUpdate.length}`);
    }
  }

  console.log(`\r⏳ Обновлено: ${updated}/${toUpdate.length}`);

  // 6. Итоги
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  📦 Обновлено товаров: ${updated}`);
  console.log(`  ❌ Ошибок: ${errors}`);
  console.log('\n  По категориям:');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`    ${cat}: ${count}`);
    });
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
