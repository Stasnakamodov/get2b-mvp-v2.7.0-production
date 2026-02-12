#!/usr/bin/env node
/**
 * Скрипт импорта каталога из TechnoModern в Get2B
 *
 * Импортирует:
 * - 95 категорий (маппинг на 8 категорий Get2B)
 * - ~1500 товаров с трансформацией полей
 * - Создаёт дефолтного поставщика
 */

const { createClient } = require('@supabase/supabase-js');

// ========================================
// CREDENTIALS
// ========================================

// TechnoModern (источник) - только чтение
const SOURCE_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1OTk5NDcsImV4cCI6MjA2NDE3NTk0N30.cpW1S5MK7eOfYSZx9gHP_AP-wH5BRIigUFwlBYNA2MI';

// Get2B (цель) - запись
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

// Создаём клиенты
const sourceDb = createClient(SOURCE_URL, SOURCE_KEY);
const targetDb = createClient(TARGET_URL, TARGET_KEY);

// ========================================
// МАППИНГ КАТЕГОРИЙ TechnoModern → Get2B
// ========================================
//
// TechnoModern имеет 2 уровня категорий:
// - Level 1 (корневые): 9 категорий
// - Level 2 (подкатегории): 32 категории
//
// ВАЖНО: Товары привязаны к ПОДКАТЕГОРИЯМ (Level 2)!

const CATEGORY_MAPPING = {
  // ═══════════════════════════════════════════════════
  // ЭЛЕКТРОНИКА (parent: electronics)
  // ═══════════════════════════════════════════════════
  'electronics': 'Электроника',
  'computer-accessories': 'Электроника',    // 95 товаров - Компьютерные аксессуары
  'peripherals': 'Электроника',             // 95 товаров - Периферия
  'smartphones-tablets': 'Электроника',     // 1 товар - Смартфоны и планшеты
  'smartwatches': 'Электроника',            // 3 товара - Смарт-часы и браслеты
  'smart-home': 'Электроника',              // 36 товаров - Умный дом

  // ═══════════════════════════════════════════════════
  // ДОМ И БЫТ (parent: home)
  // ═══════════════════════════════════════════════════
  'home': 'Дом и быт',
  'bedroom': 'Дом и быт',                   // 166 товаров - Спальня
  'furniture': 'Дом и быт',                 // 115 товаров - Мебель
  'household-goods': 'Дом и быт',           // 127 товаров - Хозяйственные товары
  'lighting': 'Дом и быт',                  // 85 товаров - Освещение
  'textiles': 'Дом и быт',                  // 65 товаров - Текстиль
  'storage': 'Дом и быт',                   // 43 товара - Системы хранения
  'kitchen': 'Дом и быт',                   // 40 товаров - Кухонная техника
  'tableware': 'Дом и быт',                 // 38 товаров - Посуда
  'plumbing': 'Дом и быт',                  // 30 товаров - Сантехника
  'decor': 'Дом и быт',                     // 21 товар - Декор
  'sewing-supplies': 'Дом и быт',           // Швейная фурнитура

  // ═══════════════════════════════════════════════════
  // ЗДОРОВЬЕ И КРАСОТА (parent: health-beauty)
  // ═══════════════════════════════════════════════════
  'health-beauty': 'Здоровье и красота',
  'skincare': 'Здоровье и красота',         // 134 товара - Уход за кожей
  'cosmetics': 'Здоровье и красота',        // 17 товаров - Косметика
  'hygiene': 'Здоровье и красота',          // 15 товаров - Средства гигиены
  'vitamins': 'Здоровье и красота',         // 11 товаров - Витамины и БАД

  // ═══════════════════════════════════════════════════
  // АВТОТОВАРЫ (parent: automotive)
  // ═══════════════════════════════════════════════════
  'automotive': 'Автотовары',
  'auto-chemicals': 'Автотовары',           // 49 товаров - Автохимия
  'auto-parts': 'Автотовары',               // 30 товаров - Автозапчасти
  'tires-wheels': 'Автотовары',             // 3 товара - Шины и диски

  // ═══════════════════════════════════════════════════
  // СТРОИТЕЛЬСТВО (parent: construction)
  // ═══════════════════════════════════════════════════
  'construction': 'Строительство',
  'tools': 'Строительство',                 // 53 товара - Инструменты
  'electrical': 'Строительство',            // 29 товаров - Электрика
  'fasteners': 'Строительство',             // 16 товаров - Крепеж и метизы
  'paints': 'Строительство',                // 12 товаров - Краски и лаки
  'building-materials': 'Строительство',    // 8 товаров - Строительные материалы
  'finishing-materials': 'Строительство',   // 4 товара - Отделочные материалы
  'electrical-components': 'Строительство', // 4 товара - Электрокомпоненты
  'doors-windows': 'Строительство',         // 2 товара - Двери и окна
  'solvents': 'Строительство',              // Растворители и разбавители

  // ═══════════════════════════════════════════════════
  // ПРОМЫШЛЕННОСТЬ (parent: industrial) → Строительство
  // ═══════════════════════════════════════════════════
  'industrial': 'Строительство',
  'machinery': 'Строительство',             // 103 товара - Станки и оборудование

  // ═══════════════════════════════════════════════════
  // ОДЕЖДА И АКСЕССУАРЫ
  // ═══════════════════════════════════════════════════
  'clothing-wholesale': 'Одежда и аксессуары', // 26 товаров - Одежда оптом

  // ═══════════════════════════════════════════════════
  // ХОББИ И ТВОРЧЕСТВО (parent: books)
  // ═══════════════════════════════════════════════════
  'books': 'Хобби и творчество',            // Профессиональная литература
};

// Дефолтная категория если не найден маппинг
const DEFAULT_CATEGORY = 'Электроника';

// ========================================
// УТИЛИТЫ
// ========================================

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function mapCategory(categorySlug, categoryName, categoryMap) {
  // Сначала пробуем по slug
  if (categorySlug && CATEGORY_MAPPING[categorySlug.toLowerCase()]) {
    return CATEGORY_MAPPING[categorySlug.toLowerCase()];
  }

  // Потом по name (для подкатегорий)
  const nameKey = categoryName?.toLowerCase().replace(/\s+/g, '-');
  if (nameKey && CATEGORY_MAPPING[nameKey]) {
    return CATEGORY_MAPPING[nameKey];
  }

  // Ищем родительскую категорию
  if (categoryMap) {
    const cat = categoryMap.get(categorySlug) || Array.from(categoryMap.values()).find(c => c.name === categoryName);
    if (cat?.parent_slug) {
      return mapCategory(cat.parent_slug, null, categoryMap);
    }
  }

  // По ключевым словам в названии
  const nameLower = (categoryName || '').toLowerCase();
  if (nameLower.includes('электрон') || nameLower.includes('телефон') || nameLower.includes('компьютер')) return 'Электроника';
  if (nameLower.includes('дом') || nameLower.includes('быт') || nameLower.includes('кухн')) return 'Дом и быт';
  if (nameLower.includes('здоров') || nameLower.includes('красот') || nameLower.includes('косметик')) return 'Здоровье и красота';
  if (nameLower.includes('авто') || nameLower.includes('машин')) return 'Автотовары';
  if (nameLower.includes('строит') || nameLower.includes('инструмент')) return 'Строительство';
  if (nameLower.includes('одежд') || nameLower.includes('обув') || nameLower.includes('аксессуар')) return 'Одежда и аксессуары';
  if (nameLower.includes('спорт') || nameLower.includes('отдых') || nameLower.includes('туризм')) return 'Спорт и отдых';
  if (nameLower.includes('хобби') || nameLower.includes('творчеств') || nameLower.includes('игруш')) return 'Хобби и творчество';

  return DEFAULT_CATEGORY;
}

// Трансформация товара TechnoModern → Get2B
function transformProduct(product, categoryMap, supplierId) {
  const category = categoryMap.get(product.category_id);
  const targetCategory = mapCategory(category?.slug, category?.name, categoryMap);

  return {
    supplier_id: supplierId,
    name: product.name,
    description: product.description || '',
    category: targetCategory,
    sku: product.sku || `IMPORT-${product.id.substring(0, 8)}`,
    price: product.price || 0,
    currency: product.currency || 'RUB',
    min_order: String(product.min_order || 1),
    in_stock: product.in_stock !== false,
    specifications: product.specifications || {},
    // images: TEXT[] → JSONB (массив уже в нужном формате)
    images: Array.isArray(product.images) ? product.images : [],
    is_active: true,
    is_featured: false,
    display_order: 0,
  };
}

// ========================================
// ОСНОВНЫЕ ФУНКЦИИ
// ========================================

async function fetchCategories() {
  log('📂', 'Загружаем категории из TechnoModern...');

  const { data, error } = await sourceDb
    .from('categories')
    .select('id, name, slug, parent_id, level, product_count')
    .order('level')
    .order('name');

  if (error) {
    throw new Error(`Ошибка загрузки категорий: ${error.message}`);
  }

  log('✅', `Загружено ${data.length} категорий`);

  // Создаём map для быстрого поиска по id
  const categoryMap = new Map();

  // TechnoModern структура:
  // - Level 1: корневые категории (automotive, home, electronics, etc) - parent_id = null
  // - Level 2: подкатегории (bedroom, furniture, skincare, etc) - parent_id указывает на Level 1
  // ВАЖНО: Товары привязаны к Level 2!

  // Сначала добавляем корневые (Level 1, parent_id = null)
  data.filter(c => c.parent_id === null).forEach(cat => {
    categoryMap.set(cat.id, { ...cat, parent_slug: null });
  });

  // Потом подкатегории (Level 2) с parent_slug
  data.filter(c => c.parent_id !== null).forEach(cat => {
    const parent = data.find(p => p.id === cat.parent_id);
    categoryMap.set(cat.id, { ...cat, parent_slug: parent?.slug || null });
  });

  log('📊', `Корневых: ${data.filter(c => c.parent_id === null).length}, подкатегорий: ${data.filter(c => c.parent_id !== null).length}`);

  return categoryMap;
}

async function fetchProducts() {
  log('📦', 'Загружаем товары из TechnoModern...');

  const allProducts = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    log('📥', `Загружаем товары ${offset} - ${offset + pageSize}...`);

    const { data, error } = await sourceDb
      .from('products')
      .select('id, name, description, sku, price, currency, min_order, in_stock, images, specifications, category_id')
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Ошибка загрузки товаров: ${error.message}`);
    }

    if (data.length === 0) {
      hasMore = false;
    } else {
      allProducts.push(...data);
      offset += pageSize;

      if (data.length < pageSize) {
        hasMore = false;
      }
    }
  }

  log('✅', `Загружено ${allProducts.length} товаров`);
  return allProducts;
}

async function createDefaultSupplier() {
  log('🏭', 'Создаём дефолтного поставщика...');

  // Проверяем, есть ли уже поставщик TechnoModern
  const { data: existing } = await targetDb
    .from('catalog_verified_suppliers')
    .select('id')
    .eq('name', 'TechnoModern Import')
    .single();

  if (existing) {
    log('✅', `Поставщик уже существует: ${existing.id}`);
    return existing.id;
  }

  // Создаём нового
  const { data, error } = await targetDb
    .from('catalog_verified_suppliers')
    .insert({
      name: 'TechnoModern Import',
      company_name: 'TechnoModern',
      category: 'Электроника',
      country: 'Китай',
      city: 'Шэньчжэнь',
      description: 'Импортированные товары из каталога TechnoModern. Широкий ассортимент электроники, товаров для дома, автотоваров и других категорий.',
      logo_url: null,
      contact_email: 'import@technomodern.ru',
      contact_phone: '+7 (999) 999-99-99',
      website: 'https://technomodern.ru',
      contact_person: 'Отдел импорта',
      min_order: '1 шт',
      response_time: '24 часа',
      employees: '50-100',
      established: '2020',
      certifications: ['ISO 9001', 'CE'],
      specialties: ['Электроника', 'Товары для дома', 'Автотовары'],
      payment_methods: ['Bank Transfer', 'USDT'],
      rating: 4.5,
      reviews_count: 0,
      projects_count: 0,
      is_active: true,
      is_verified: true,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Ошибка создания поставщика: ${error.message}`);
  }

  log('✅', `Создан поставщик: ${data.id}`);
  return data.id;
}

async function importProducts(products, categoryMap, supplierId) {
  log('📤', `Импортируем ${products.length} товаров в Get2B...`);

  const batchSize = 100;
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Получаем существующие SKU для дедупликации
  const { data: existingProducts } = await targetDb
    .from('catalog_verified_products')
    .select('sku');

  const existingSkus = new Set((existingProducts || []).map(p => p.sku));
  log('📊', `Существующих товаров: ${existingSkus.size}`);

  // Группируем по батчам
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    // Трансформируем и фильтруем дубликаты
    const transformedBatch = batch
      .map(p => transformProduct(p, categoryMap, supplierId))
      .filter(p => {
        if (existingSkus.has(p.sku)) {
          skipped++;
          return false;
        }
        existingSkus.add(p.sku);
        return true;
      });

    if (transformedBatch.length === 0) {
      continue;
    }

    // Вставляем батч
    const { data, error } = await targetDb
      .from('catalog_verified_products')
      .insert(transformedBatch)
      .select('id');

    if (error) {
      console.error(`❌ Ошибка батча ${i}-${i + batchSize}: ${error.message}`);
      errors += transformedBatch.length;
    } else {
      imported += data.length;
    }

    // Прогресс
    const progress = Math.round((i + batchSize) / products.length * 100);
    process.stdout.write(`\r⏳ Прогресс: ${Math.min(progress, 100)}% | Импортировано: ${imported} | Пропущено: ${skipped} | Ошибок: ${errors}`);
  }

  console.log(''); // Новая строка после прогресса
  log('✅', `Импорт завершён! Импортировано: ${imported}, пропущено: ${skipped}, ошибок: ${errors}`);

  return { imported, skipped, errors };
}

async function showCategoryStats(products, categoryMap) {
  log('📊', 'Статистика по категориям:');

  const stats = {};

  products.forEach(p => {
    const category = categoryMap.get(p.category_id);
    const targetCategory = mapCategory(category?.slug, category?.name, categoryMap);
    stats[targetCategory] = (stats[targetCategory] || 0) + 1;
  });

  Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} товаров`);
    });
}

// ========================================
// MAIN
// ========================================

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📦 ИМПОРТ КАТАЛОГА TechnoModern → Get2B');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // 1. Загружаем категории
    const categoryMap = await fetchCategories();

    // 2. Загружаем товары
    const products = await fetchProducts();

    // 3. Показываем статистику маппинга
    await showCategoryStats(products, categoryMap);
    console.log('');

    // 4. Создаём поставщика в Get2B
    const supplierId = await createDefaultSupplier();

    // 5. Импортируем товары
    const result = await importProducts(products, categoryMap, supplierId);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ ИМПОРТ ЗАВЕРШЁН УСПЕШНО!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  📦 Товаров импортировано: ${result.imported}`);
    console.log(`  ⏭️  Товаров пропущено (дубликаты): ${result.skipped}`);
    console.log(`  ❌ Ошибок: ${result.errors}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ОШИБКА:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Запуск
main();
