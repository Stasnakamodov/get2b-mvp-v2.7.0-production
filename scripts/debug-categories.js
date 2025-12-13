#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const SOURCE_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTk5NDcsImV4cCI6MjA2NDE3NTk0N30.cpW1S5MK7eOfYSZx9gHP_AP-wH5BRIigUFwlBYNA2MI';

const TARGET_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const sourceDb = createClient(SOURCE_URL, SOURCE_KEY);
const targetDb = createClient(TARGET_URL, TARGET_KEY);

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
  console.log('  🔍 ДЕТАЛЬНЫЙ АНАЛИЗ');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Категории TechnoModern
  const { data: categories } = await sourceDb.from('categories').select('id, name, slug');
  const catMap = new Map(categories.map(c => [c.id, c]));

  // 2. ВСЕ товары TechnoModern
  console.log('📦 TechnoModern:');
  let allSource = [];
  let offset = 0;
  while (true) {
    const { data } = await sourceDb.from('products').select('sku, category_id').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allSource.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }
  console.log(`   Всего товаров: ${allSource.length}`);

  // Ожидаемое распределение по Get2B категориям
  const expectedStats = {};
  const unmappedSlugs = new Set();

  allSource.forEach(p => {
    const cat = catMap.get(p.category_id);
    const slug = cat ? cat.slug : 'NO_CATEGORY';
    const targetCat = CATEGORY_MAPPING[slug];

    if (targetCat) {
      expectedStats[targetCat] = (expectedStats[targetCat] || 0) + 1;
    } else {
      expectedStats['UNMAPPED → Электроника'] = (expectedStats['UNMAPPED → Электроника'] || 0) + 1;
      unmappedSlugs.add(slug);
    }
  });

  console.log('\n   Ожидаемое распределение (если бы всё импортировалось):');
  Object.entries(expectedStats).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}`);
  });

  if (unmappedSlugs.size > 0) {
    console.log('\n   ⚠️ Немаппированные slug:', [...unmappedSlugs].join(', '));
  }

  // 3. Get2B товары
  console.log('\n📦 Get2B:');

  const { data: supplier } = await targetDb
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'TechnoModern Import')
    .single();

  // Получаем ВСЕ товары от TechnoModern (с пагинацией)
  let allTarget = [];
  offset = 0;
  while (true) {
    const { data } = await targetDb
      .from('catalog_verified_products')
      .select('id, sku, category')
      .eq('supplier_id', supplier.id)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allTarget.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }

  console.log(`   Всего товаров: ${allTarget.length}`);

  const actualStats = {};
  allTarget.forEach(p => {
    actualStats[p.category] = (actualStats[p.category] || 0) + 1;
  });

  console.log('\n   Фактическое распределение:');
  Object.entries(actualStats).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`     ${cat}: ${count}`);
  });

  // 4. Сравнение SKU
  console.log('\n🔗 Сравнение SKU:');
  const sourceSKUs = new Set(allSource.map(p => p.sku));
  const targetSKUs = new Set(allTarget.map(p => p.sku));

  const inSourceOnly = [...sourceSKUs].filter(s => !targetSKUs.has(s));
  const inTargetOnly = [...targetSKUs].filter(s => !sourceSKUs.has(s));
  const inBoth = [...sourceSKUs].filter(s => targetSKUs.has(s));

  console.log(`   В TechnoModern: ${sourceSKUs.size}`);
  console.log(`   В Get2B: ${targetSKUs.size}`);
  console.log(`   Совпадают: ${inBoth.length}`);
  console.log(`   Только в TechnoModern (не импортированы): ${inSourceOnly.length}`);
  console.log(`   Только в Get2B: ${inTargetOnly.length}`);

  // 5. Товары в Get2B с "Электроника" - проверяем правильно ли
  console.log('\n🔍 Анализ товаров в "Электроника":');
  const electronicsProducts = allTarget.filter(p => p.category === 'Электроника');

  let correctlyInElectronics = 0;
  let wronglyInElectronics = 0;
  const wrongCategories = {};

  electronicsProducts.forEach(p => {
    const sourceProduct = allSource.find(sp => sp.sku === p.sku);
    if (sourceProduct) {
      const cat = catMap.get(sourceProduct.category_id);
      const expectedCat = cat ? (CATEGORY_MAPPING[cat.slug] || 'Электроника') : 'Электроника';

      if (expectedCat === 'Электроника') {
        correctlyInElectronics++;
      } else {
        wronglyInElectronics++;
        wrongCategories[expectedCat] = (wrongCategories[expectedCat] || 0) + 1;
      }
    } else {
      // SKU не найден в источнике
      correctlyInElectronics++; // считаем правильным
    }
  });

  console.log(`   Правильно в "Электроника": ${correctlyInElectronics}`);
  console.log(`   Неправильно (нужно перенести): ${wronglyInElectronics}`);

  if (wronglyInElectronics > 0) {
    console.log('   Должны быть в:');
    Object.entries(wrongCategories).forEach(([cat, count]) => {
      console.log(`     ${cat}: ${count}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════\n');
}

main().catch(console.error);
