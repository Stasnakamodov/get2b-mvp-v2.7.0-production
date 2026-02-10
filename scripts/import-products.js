#!/usr/bin/env node
/**
 * ================================================================
 * ЕДИНЫЙ УНИВЕРСАЛЬНЫЙ СКРИПТ ИМПОРТА ТОВАРОВ
 * ================================================================
 *
 * Замена всех 17+ старых скриптов. Ключевые принципы:
 * - ДЕТЕРМИНИРОВАННЫЕ SKU: {source}-{marketplace_id} (без рандома!)
 * - UPSERT через ON CONFLICT вместо check-then-insert
 * - Валидация данных перед вставкой
 * - Привязка к category_id/subcategory_id
 * - Подробное логирование
 *
 * Использование:
 *   node scripts/import-products.js --source=otapi --category=home --query="furniture" [--limit=50]
 *   node scripts/import-products.js --source=otapi --category=construction --subcategory="Инструменты" --query="drill"
 *   node scripts/import-products.js --source=otapi --category=home --plan=home800
 *
 * Параметры:
 *   --source       Источник: otapi (обязательный)
 *   --category     Ключ категории: home, automotive, construction, etc. (обязательный)
 *   --subcategory  Название подкатегории (опционально, если не указан - определяется автоматически)
 *   --query        Поисковый запрос для OTAPI (обязательный, если нет --plan)
 *   --plan         Предустановленный план импорта: home800 (опционально)
 *   --limit        Количество товаров на запрос (по умолчанию 20)
 *   --provider     Маркетплейс OTAPI: Taobao, 1688, AliExpress (по умолчанию Taobao)
 *   --dry-run      Только показать что будет импортировано, без записи в БД
 */

const { createClient } = require('@supabase/supabase-js');

// ================================================================
// КОНФИГУРАЦИЯ
// ================================================================

const CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg',
  OTAPI_KEY: process.env.OTAPI_INSTANCE_KEY || '0e4fb57d-d80e-4274-acc5-f22f354e3577',
  OTAPI_BASE_URL: 'http://otapi.net/service-json/',
  CNY_TO_RUB: 13.5,
  BATCH_SIZE: 10,
  API_DELAY_MS: 1500,
  MIN_PRICE_RUB: 10,
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// ================================================================
// ПЛАНЫ ИМПОРТА (предустановленные)
// ================================================================

const IMPORT_PLANS = {
  home800: [
    { subcategory: 'Мебель', queries: ['sofa living room', 'coffee table modern', 'bookshelf storage', 'armchair', 'TV stand cabinet'], target: 100 },
    { subcategory: 'Кухонная техника', queries: ['blender kitchen', 'rice cooker electric', 'kettle electric', 'toaster oven', 'food processor'], target: 100 },
    { subcategory: 'Домашний текстиль', queries: ['bedding set cotton', 'curtains window', 'towel bath set', 'pillow cover decorative', 'blanket fleece'], target: 100 },
    { subcategory: 'Освещение', queries: ['chandelier modern', 'table lamp LED', 'floor lamp', 'wall sconce', 'outdoor garden light'], target: 80 },
    { subcategory: 'Декор', queries: ['wall art canvas', 'vase ceramic', 'clock wall modern', 'mirror decorative', 'statue figurine'], target: 100 },
    { subcategory: 'Посуда', queries: ['dinnerware set', 'cooking pot stainless', 'knife set kitchen', 'glass cup set', 'cutting board bamboo'], target: 80 },
    { subcategory: 'Бытовая техника', queries: ['vacuum cleaner robot', 'air purifier HEPA', 'humidifier ultrasonic', 'iron steam', 'fan tower'], target: 80 },
    { subcategory: 'Хранение и организация', queries: ['storage box plastic', 'organizer drawer', 'basket woven', 'shelf rack metal', 'hanger set'], target: 80 },
    { subcategory: 'Сантехника', queries: ['faucet kitchen', 'shower head rain', 'bathroom accessory set', 'soap dispenser', 'towel rack'], target: 80 },
  ],
};

// ================================================================
// OTAPI КЛИЕНТ
// ================================================================

class OtapiClient {
  constructor() {
    this.apiCalls = 0;
  }

  async search(query, provider = 'Taobao', limit = 30) {
    this.apiCalls++;
    const xmlParameters = `<SearchItemsParameters><Provider>${provider}</Provider><SearchMethod>Catalog</SearchMethod><ItemTitle>${query}</ItemTitle></SearchItemsParameters>`;

    const params = new URLSearchParams({
      instanceKey: CONFIG.OTAPI_KEY,
      language: 'ru',
      xmlParameters,
      framePosition: '0',
      frameSize: limit.toString(),
    });

    try {
      const response = await fetch(`${CONFIG.OTAPI_BASE_URL}SearchItemsFrame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: params.toString(),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.ErrorCode && data.ErrorCode !== 'Ok') {
        throw new Error(`OTAPI: ${data.ErrorCode} - ${data.ErrorDescription || ''}`);
      }

      return data.Result?.Items?.Content
        || data.OtapiResponse?.Result?.Items?.Content
        || [];
    } catch (error) {
      console.error(`  [ERROR] OTAPI "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Детерминированный SKU: source-marketplaceId
   * Никакого Math.random()!
   */
  static makeSku(source, item) {
    const id = item.Id || item.ItemId;
    if (!id) return null;
    return `${source}-${id}`;
  }

  static extractPrice(item) {
    if (item.Price?.ConvertedPriceList?.Internal?.Price) {
      return parseFloat(item.Price.ConvertedPriceList.Internal.Price);
    }
    if (item.Price?.ConvertedPrice) {
      return parseFloat(item.Price.ConvertedPrice.replace(/[^0-9.]/g, ''));
    }
    if (item.Price?.OriginalPrice) {
      return parseFloat(item.Price.OriginalPrice) * CONFIG.CNY_TO_RUB;
    }
    return 0;
  }

  static extractImages(item) {
    const imageSet = new Set();
    if (item.MainPictureUrl) imageSet.add(item.MainPictureUrl);
    if (item.Pictures?.length > 0) {
      item.Pictures.forEach(pic => {
        const url = pic.Large?.Url || pic.Medium?.Url || pic.Url || pic;
        if (url && typeof url === 'string') imageSet.add(url);
      });
    }
    return Array.from(imageSet).slice(0, 10);
  }

  static formatProduct(item, source, category, categoryId, subcategoryId, supplierId) {
    const sku = OtapiClient.makeSku(source, item);
    const price = Math.round(OtapiClient.extractPrice(item) * 100) / 100;
    const images = OtapiClient.extractImages(item);
    const name = (item.Title || item.OriginalTitle || '').substring(0, 200).trim();

    const specifications = {};
    if (item.BrandName) specifications['Бренд'] = item.BrandName;
    if (item.VendorName) specifications['Продавец'] = item.VendorName;
    if (item.Rating) specifications['Рейтинг'] = `${item.Rating}/5`;
    if (item.SoldCount) specifications['Продано'] = `${item.SoldCount} шт.`;
    if (item.Price?.OriginalPrice) specifications['Оригинальная цена'] = `${item.Price.OriginalPrice} CNY`;

    return {
      name,
      description: item.Description || `Товар из категории ${category}`,
      category,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      sku,
      price,
      currency: 'RUB',
      min_order: item.MasterQuantity > 1 ? `${Math.min(item.MasterQuantity, 10)} шт.` : '1 шт.',
      in_stock: true,
      specifications,
      images,
      supplier_id: supplierId,
      is_active: true,
      is_featured: false,
    };
  }
}

// ================================================================
// ВАЛИДАЦИЯ
// ================================================================

function validateProduct(product) {
  if (!product.name || product.name.length < 3) return 'Пустое или слишком короткое название';
  if (!product.sku) return 'Нет SKU';
  if (product.price <= 0) return 'Цена <= 0';
  if (product.price < CONFIG.MIN_PRICE_RUB) return `Цена ${product.price} < ${CONFIG.MIN_PRICE_RUB}`;
  if (!product.supplier_id) return 'Нет supplier_id';
  if (!product.images || product.images.length === 0) return 'Нет изображений';
  return null;
}

// ================================================================
// UPSERT — ключевая функция
// ================================================================

async function upsertProducts(products) {
  const stats = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  for (let i = 0; i < products.length; i += CONFIG.BATCH_SIZE) {
    const batch = products.slice(i, i + CONFIG.BATCH_SIZE);

    // Используем upsert с onConflict
    // Конфликт по sku — обновляем данные
    const { data, error } = await supabase
      .from('catalog_verified_products')
      .upsert(batch, {
        onConflict: 'sku',
        ignoreDuplicates: false, // обновлять при конфликте
      })
      .select('id');

    if (error) {
      // Если конфликт по name+supplier_id, пробуем по одному
      if (error.message.includes('idx_unique_product_name_supplier')) {
        for (const product of batch) {
          const { data: single, error: singleError } = await supabase
            .from('catalog_verified_products')
            .upsert(product, { onConflict: 'sku', ignoreDuplicates: false })
            .select('id');

          if (singleError) {
            if (singleError.message.includes('duplicate') || singleError.message.includes('unique')) {
              stats.skipped++;
            } else {
              console.error(`  [ERROR] ${product.name.substring(0, 40)}: ${singleError.message}`);
              stats.errors++;
            }
          } else {
            stats.inserted++;
          }
        }
      } else {
        console.error(`  [ERROR] Batch: ${error.message}`);
        stats.errors += batch.length;
      }
    } else {
      stats.inserted += (data?.length || batch.length);
    }
  }

  return stats;
}

// ================================================================
// ПОЛУЧЕНИЕ СПРАВОЧНЫХ ДАННЫХ
// ================================================================

async function getOrCreateSupplier(source, provider) {
  const supplierName = `OTAPI ${provider} Import`;

  let { data: supplier } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .eq('name', supplierName)
    .single();

  if (!supplier) {
    const { data: newSupplier, error } = await supabase
      .from('catalog_verified_suppliers')
      .insert({
        name: supplierName,
        company_name: `${provider} через OTAPI`,
        category: 'Универсальный',
        country: 'Китай',
        city: 'Гуанчжоу',
        description: `Импорт товаров с ${provider} через OTAPI API`,
        is_active: true,
        is_verified: true,
        moderation_status: 'approved',
        min_order: 'От 1 шт.',
        public_rating: 4.5,
      })
      .select()
      .single();

    if (error) throw new Error(`Не удалось создать поставщика: ${error.message}`);
    supplier = newSupplier;
  }

  return supplier;
}

async function getCategory(key) {
  const { data, error } = await supabase
    .from('catalog_categories')
    .select('id, name, key')
    .eq('key', key)
    .single();

  if (error || !data) throw new Error(`Категория "${key}" не найдена`);
  return data;
}

async function getSubcategory(name, categoryId) {
  const { data, error } = await supabase
    .from('catalog_subcategories')
    .select('id, name')
    .eq('name', name)
    .eq('category_id', categoryId)
    .single();

  if (error || !data) {
    // Пробуем найти по частичному совпадению
    const { data: all } = await supabase
      .from('catalog_subcategories')
      .select('id, name')
      .eq('category_id', categoryId);

    const found = all?.find(s => s.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(s.name.toLowerCase()));
    if (found) return found;

    throw new Error(`Подкатегория "${name}" не найдена в категории ${categoryId}`);
  }
  return data;
}

async function getAllSubcategories(categoryId) {
  const { data } = await supabase
    .from('catalog_subcategories')
    .select('id, name')
    .eq('category_id', categoryId)
    .order('name');
  return data || [];
}

// ================================================================
// ОСНОВНЫЕ РЕЖИМЫ РАБОТЫ
// ================================================================

async function importSingleQuery(params) {
  const { source, categoryKey, subcategoryName, query, limit, provider, dryRun } = params;

  console.log(`\n[IMPORT] Источник: ${source}, Категория: ${categoryKey}, Запрос: "${query}"`);

  const otapi = new OtapiClient();
  const category = await getCategory(categoryKey);
  const supplier = await getOrCreateSupplier(source, provider);

  let subcategoryId = null;
  if (subcategoryName) {
    const subcat = await getSubcategory(subcategoryName, category.id);
    subcategoryId = subcat.id;
    console.log(`  Подкатегория: ${subcat.name} (${subcat.id})`);
  }

  console.log(`  Категория: ${category.name} (${category.id})`);
  console.log(`  Поставщик: ${supplier.name} (${supplier.id})`);

  // Поиск через OTAPI
  const items = await otapi.search(query, provider, limit);
  console.log(`  Найдено товаров в OTAPI: ${items.length}`);

  // Форматирование и валидация
  const products = [];
  const rejected = [];

  for (const item of items) {
    const product = OtapiClient.formatProduct(
      item, source, category.name, category.id, subcategoryId, supplier.id
    );

    const validationError = validateProduct(product);
    if (validationError) {
      rejected.push({ name: product.name?.substring(0, 40), reason: validationError });
      continue;
    }

    products.push(product);
  }

  console.log(`  Валидных товаров: ${products.length}, Отклонено: ${rejected.length}`);
  if (rejected.length > 0) {
    rejected.slice(0, 3).forEach(r => console.log(`    [SKIP] ${r.name}: ${r.reason}`));
    if (rejected.length > 3) console.log(`    ... и ещё ${rejected.length - 3}`);
  }

  if (dryRun) {
    console.log('\n  [DRY-RUN] Товары НЕ записаны в БД');
    products.slice(0, 5).forEach(p => console.log(`    ${p.sku}: ${p.name.substring(0, 50)} - ${p.price} руб`));
    return { inserted: 0, updated: 0, skipped: 0, errors: 0, total: products.length };
  }

  // UPSERT
  const stats = await upsertProducts(products);
  console.log(`  Результат: +${stats.inserted} новых, ~${stats.updated} обновлено, =${stats.skipped} пропущено, x${stats.errors} ошибок`);

  return stats;
}

async function importByPlan(params) {
  const { source, categoryKey, planName, provider, dryRun } = params;
  const plan = IMPORT_PLANS[planName];
  if (!plan) throw new Error(`План "${planName}" не найден. Доступные: ${Object.keys(IMPORT_PLANS).join(', ')}`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`[PLAN] Запуск плана "${planName}" для категории "${categoryKey}"`);
  console.log(`${'='.repeat(70)}`);

  const category = await getCategory(categoryKey);
  const supplier = await getOrCreateSupplier(source, provider);
  const otapi = new OtapiClient();

  const totalStats = { inserted: 0, updated: 0, skipped: 0, errors: 0 };

  for (const step of plan) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`[STEP] ${step.subcategory} (цель: ${step.target} товаров)`);

    let subcategoryId = null;
    try {
      const subcat = await getSubcategory(step.subcategory, category.id);
      subcategoryId = subcat.id;
      console.log(`  Подкатегория ID: ${subcat.id}`);
    } catch {
      console.log(`  [WARN] Подкатегория "${step.subcategory}" не найдена, пропускаем привязку`);
    }

    const allProducts = [];
    const targetPerQuery = Math.ceil(step.target / step.queries.length);

    for (const query of step.queries) {
      if (allProducts.length >= step.target) break;

      console.log(`  [SEARCH] "${query}"...`);
      const items = await otapi.search(query, provider, targetPerQuery + 10);

      for (const item of items) {
        if (allProducts.length >= step.target) break;

        const product = OtapiClient.formatProduct(
          item, source, category.name, category.id, subcategoryId, supplier.id
        );

        const validationError = validateProduct(product);
        if (validationError) continue;

        // Проверяем дубли в текущем батче по SKU
        if (allProducts.some(p => p.sku === product.sku)) continue;

        allProducts.push(product);
      }

      await new Promise(r => setTimeout(r, CONFIG.API_DELAY_MS));
    }

    console.log(`  Собрано: ${allProducts.length}/${step.target}`);

    if (!dryRun && allProducts.length > 0) {
      const stats = await upsertProducts(allProducts);
      totalStats.inserted += stats.inserted;
      totalStats.updated += stats.updated;
      totalStats.skipped += stats.skipped;
      totalStats.errors += stats.errors;
      console.log(`  Записано: +${stats.inserted} | ~${stats.updated} | =${stats.skipped} | x${stats.errors}`);
    } else if (dryRun) {
      console.log(`  [DRY-RUN] ${allProducts.length} товаров не записано`);
      totalStats.inserted += allProducts.length;
    }
  }

  return totalStats;
}

// ================================================================
// MAIN
// ================================================================

async function main() {
  // Парсим аргументы
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) args[match[1]] = match[2] !== undefined ? match[2] : true;
  });

  const source = args.source || 'otapi';
  const categoryKey = args.category;
  const subcategoryName = args.subcategory;
  const query = args.query;
  const planName = args.plan;
  const limit = parseInt(args.limit) || 20;
  const provider = args.provider || 'Taobao';
  const dryRun = !!args['dry-run'];

  if (!categoryKey) {
    console.error('ОШИБКА: --category обязателен');
    console.log('\nДоступные категории: home, automotive, construction, industrial, textiles, electronics, food, healthcare, health-beauty');
    console.log('\nПримеры:');
    console.log('  node scripts/import-products.js --source=otapi --category=home --query="furniture"');
    console.log('  node scripts/import-products.js --source=otapi --category=home --plan=home800');
    console.log('  node scripts/import-products.js --source=otapi --category=construction --subcategory="Инструменты" --query="drill" --limit=50');
    process.exit(1);
  }

  if (!query && !planName) {
    console.error('ОШИБКА: нужен --query="..." или --plan=...');
    console.log('  Доступные планы:', Object.keys(IMPORT_PLANS).join(', '));
    process.exit(1);
  }

  console.log('[START] УНИВЕРСАЛЬНЫЙ ИМПОРТ ТОВАРОВ');
  console.log(`  Источник: ${source}`);
  console.log(`  Категория: ${categoryKey}`);
  console.log(`  Маркетплейс: ${provider}`);
  if (dryRun) console.log('  РЕЖИМ: DRY-RUN (без записи в БД)');
  console.log('');

  let stats;
  const startTime = Date.now();

  if (planName) {
    stats = await importByPlan({ source, categoryKey, planName, provider, dryRun });
  } else {
    stats = await importSingleQuery({ source, categoryKey, subcategoryName, query, limit, provider, dryRun });
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n${'='.repeat(70)}`);
  console.log('[ИТОГИ]');
  console.log(`${'='.repeat(70)}`);
  console.log(`  Новых:      ${stats.inserted}`);
  console.log(`  Обновлено:  ${stats.updated}`);
  console.log(`  Пропущено:  ${stats.skipped}`);
  console.log(`  Ошибок:     ${stats.errors}`);
  console.log(`  Время:      ${elapsed} сек`);
  console.log(`${'='.repeat(70)}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n[FATAL]', error.message);
    process.exit(1);
  });
