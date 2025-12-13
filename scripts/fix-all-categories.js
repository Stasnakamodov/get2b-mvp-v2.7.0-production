#!/usr/bin/env node
/**
 * Полное исправление категорий всех товаров TechnoModern в Get2B
 * Загружает ВСЕ товары и обновляет категории
 */

const { createClient } = require('@supabase/supabase-js');

// TechnoModern (источник)
const SOURCE_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTk5NDcsImV4cCI6MjA2NDE3NTk0N30.cpW1S5MK7eOfYSZx9gHP_AP-wH5BRIigUFwlBYNA2MI';

// Get2B (цель)
const TARGET_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const sourceDb = createClient(SOURCE_URL, SOURCE_KEY);
const targetDb = createClient(TARGET_URL, TARGET_KEY);

// Маппинг категорий slug → Get2B category
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
  console.log('  🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ КАТЕГОРИЙ');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Загружаем ВСЕ категории из TechnoModern
  console.log('📂 Загружаем категории из TechnoModern...');
  const { data: categories } = await sourceDb
    .from('categories')
    .select('id, name, slug');

  const catMap = new Map(categories.map(c => [c.id, c]));
  console.log(`✅ Категорий: ${categories.length}`);

  // 2. Загружаем ВСЕ товары из TechnoModern (с пагинацией)
  console.log('\n📦 Загружаем ВСЕ товары из TechnoModern...');
  const allSourceProducts = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data } = await sourceDb
      .from('products')
      .select('sku, category_id')
      .range(offset, offset + pageSize - 1);

    if (!data || data.length === 0) break;
    allSourceProducts.push(...data);
    console.log(`  📥 Загружено: ${allSourceProducts.length}`);
    offset += pageSize;
    if (data.length < pageSize) break;
  }
  console.log(`✅ Всего товаров в TechnoModern: ${allSourceProducts.length}`);

  // 3. Создаём маппинг SKU → правильная категория Get2B
  const skuToCategory = new Map();
  allSourceProducts.forEach(p => {
    const cat = catMap.get(p.category_id);
    if (cat) {
      const targetCategory = CATEGORY_MAPPING[cat.slug] || 'Электроника';
      skuToCategory.set(p.sku, targetCategory);
    }
  });
  console.log(`📊 SKU с категориями: ${skuToCategory.size}`);

  // 4. Получаем ВСЕ товары Get2B от TechnoModern
  console.log('\n🔍 Загружаем товары из Get2B...');

  const { data: supplier } = await targetDb
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'TechnoModern Import')
    .single();

  if (!supplier) {
    console.error('❌ Поставщик TechnoModern Import не найден');
    return;
  }

  // Загружаем ВСЕ товары с пагинацией
  const targetProducts = [];
  let targetOffset = 0;
  while (true) {
    const { data } = await targetDb
      .from('catalog_verified_products')
      .select('id, sku, category')
      .eq('supplier_id', supplier.id)
      .range(targetOffset, targetOffset + 999);
    if (!data || data.length === 0) break;
    targetProducts.push(...data);
    targetOffset += 1000;
    if (data.length < 1000) break;
  }

  console.log(`✅ Товаров в Get2B от TechnoModern: ${targetProducts.length}`);

  // 5. Находим товары для обновления
  const toUpdate = [];
  targetProducts.forEach(p => {
    const correctCategory = skuToCategory.get(p.sku);
    if (correctCategory && correctCategory !== p.category) {
      toUpdate.push({ id: p.id, sku: p.sku, oldCat: p.category, newCat: correctCategory });
    }
  });

  console.log(`\n🔧 Нужно обновить: ${toUpdate.length} товаров`);

  if (toUpdate.length === 0) {
    console.log('✅ Все категории уже правильные!');
    return;
  }

  // Показываем что будет изменено
  const changes = {};
  toUpdate.forEach(p => {
    const key = `${p.oldCat} → ${p.newCat}`;
    changes[key] = (changes[key] || 0) + 1;
  });
  console.log('\n📊 Планируемые изменения:');
  Object.entries(changes).forEach(([change, count]) => {
    console.log(`    ${change}: ${count}`);
  });

  // 6. Обновляем категории
  console.log('\n⏳ Обновляем...');
  const stats = {};
  let updated = 0;
  let errors = 0;

  for (const product of toUpdate) {
    const { error } = await targetDb
      .from('catalog_verified_products')
      .update({ category: product.newCat })
      .eq('id', product.id);

    if (error) {
      errors++;
    } else {
      updated++;
      stats[product.newCat] = (stats[product.newCat] || 0) + 1;
    }

    if (updated % 100 === 0) {
      process.stdout.write(`\r⏳ Обновлено: ${updated}/${toUpdate.length}`);
    }
  }

  console.log(`\r⏳ Обновлено: ${updated}/${toUpdate.length}`);

  // 7. Итоги
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  📦 Обновлено: ${updated}`);
  console.log(`  ❌ Ошибок: ${errors}`);
  console.log('\n  Новые категории:');
  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`    ${cat}: ${count}`);
    });
  console.log('═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
