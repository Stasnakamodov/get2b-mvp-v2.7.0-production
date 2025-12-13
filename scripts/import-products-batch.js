/**
 * Скрипт для массового импорта товаров через OTAPI
 * Запуск: node scripts/import-products-batch.js
 */

const https = require('https');
const http = require('http');

// Конфигурация
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';
const OTAPI_KEY = process.env.OTAPI_INSTANCE_KEY || '0e4fb57d-d80e-4274-acc5-f22f354e3577';

// Курс юаня к рублю
const CNY_TO_RUB = 13.5;

// Категории для импорта - TAOBAO провайдер с китайскими/английскими запросами
const IMPORT_TASKS = [
  {
    category: 'Текстиль и одежда',
    subcategory: 'Аксессуары и фурнитура',
    subcategory_id: '996138fa-3c1e-41c1-8dca-865c4fcf255a',
    queries: ['buttons', 'zipper', 'sewing thread', 'buckles', 'ribbon']
  },
  {
    category: 'Дом и быт',
    subcategory: 'Посуда',
    subcategory_id: '4ec8d2f4-d14f-4661-b83c-e06197731aaa',
    queries: ['ceramic plate', 'kitchen utensils', 'glass cup', 'dinnerware', 'cooking pot']
  },
  {
    category: 'Строительство',
    subcategory: 'Строительные материалы',
    subcategory_id: '13eb757a-f06e-42d5-ae5e-4657814b2096',
    queries: ['tile', 'PVC pipe', 'insulation', 'building material', 'cement']
  },
  {
    category: 'Строительство',
    subcategory: 'Крепеж и метизы',
    subcategory_id: '8542c089-6667-4ccb-a849-d34c63c03de3',
    queries: ['screw', 'bolt', 'fastener', 'anchor', 'hardware']
  },
  {
    category: 'Строительство',
    subcategory: 'Инструменты',
    subcategory_id: '03e141a2-54c8-456a-8e0b-b493caa17c6b',
    queries: ['power tool', 'drill', 'wrench', 'hammer', 'screwdriver']
  }
];

// Простой HTTP запрос
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;

    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (postData) req.write(postData);
    req.end();
  });
}

// Запрос к OTAPI - используем Taobao
async function searchOtapi(query, limit = 15) {
  const xmlParams = `<SearchItemsParameters><Provider>Taobao</Provider><SearchMethod>Catalog</SearchMethod><ItemTitle>${query}</ItemTitle></SearchItemsParameters>`;

  const params = new URLSearchParams({
    instanceKey: OTAPI_KEY,
    language: 'ru',
    xmlParameters: xmlParams,
    framePosition: '0',
    frameSize: limit.toString()
  });

  const url = `http://otapi.net/service-json/SearchItemsFrame`;

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    }, params.toString());

    if (response.data?.Result?.Items?.Content) {
      return response.data.Result.Items.Content;
    }
    if (response.data?.ErrorCode !== 'Ok') {
      console.error(`  ❌ OTAPI Error: ${response.data?.ErrorDescription || 'Unknown'}`);
    }
    return [];
  } catch (error) {
    console.error(`  ❌ OTAPI error for "${query}":`, error.message);
    return [];
  }
}

// Преобразование товара OTAPI в формат БД
function mapOtapiItem(item, category, subcategory, subcategory_id, supplierId) {
  // Цена в CNY - конвертируем в рубли
  const priceInCny = parseFloat(item.Price?.OriginalPrice || 0);
  const priceInRub = Math.round(priceInCny * CNY_TO_RUB);

  // Изображения
  const images = item.Pictures?.map(pic => pic.Large?.Url || pic.Medium?.Url || pic.Url).filter(Boolean) || [];
  if (images.length === 0 && item.MainPictureUrl) {
    images.push(item.MainPictureUrl);
  }

  return {
    name: item.Title || 'Без названия',
    description: `${item.Title || ''}\n\nИмпортировано с Taobao через OTAPI`,
    category: category,
    subcategory_id: subcategory_id,
    sku: `tb-${item.Id || Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    price: priceInRub,
    currency: 'RUB',
    min_order: item.MasterQuantity > 1 ? `${Math.min(item.MasterQuantity, 10)} шт.` : '1 шт.',
    in_stock: true,
    specifications: {
      'Маркетплейс': 'Taobao',
      'Оригинальная цена': `${priceInCny} CNY`,
      'Продавец': item.VendorDisplayName || item.VendorName || 'Taobao Seller',
      'ID товара': item.Id
    },
    images: images.slice(0, 10),
    supplier_id: supplierId,
    is_active: true,
    is_featured: false
  };
}

// Вставка товаров в Supabase
async function insertProducts(products) {
  const url = `${SUPABASE_URL}/rest/v1/catalog_verified_products`;

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    }
  }, JSON.stringify(products));

  return response;
}

// Получение или создание поставщика
async function getOrCreateSupplier(category) {
  const supplierName = `OTAPI Taobao Import`;

  // Проверяем существующего
  const checkUrl = `${SUPABASE_URL}/rest/v1/catalog_verified_suppliers?name=eq.${encodeURIComponent(supplierName)}&select=id,name`;
  const existing = await makeRequest(checkUrl, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (existing.data && existing.data.length > 0) {
    return existing.data[0];
  }

  // Создаем нового
  const createUrl = `${SUPABASE_URL}/rest/v1/catalog_verified_suppliers`;
  const newSupplier = {
    name: supplierName,
    company_name: 'Taobao через OTAPI',
    category: category,
    country: 'Китай',
    city: 'Шэньчжэнь',
    description: 'Автоматический импорт товаров с Taobao через OTAPI API. Прямые поставки из Китая.',
    is_active: true,
    is_verified: true,
    moderation_status: 'approved',
    contact_email: 'import@otapi.net',
    min_order: 'От 1 шт.',
    response_time: '1-2 дня',
    public_rating: 4.5
  };

  const created = await makeRequest(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    }
  }, JSON.stringify(newSupplier));

  return created.data?.[0] || null;
}

// Основная функция импорта
async function importCategory(task) {
  console.log(`\n📦 Импорт: ${task.category} - ${task.subcategory}`);

  // Получаем поставщика
  const supplier = await getOrCreateSupplier(task.category);
  if (!supplier) {
    console.error('❌ Не удалось получить поставщика');
    return 0;
  }
  console.log(`✅ Поставщик: ${supplier.name} (${supplier.id})`);

  const allProducts = [];
  const seenIds = new Set();

  // Собираем товары по всем запросам
  for (const query of task.queries) {
    if (allProducts.length >= 55) break;

    const remaining = 55 - allProducts.length;
    const fetchCount = Math.min(20, remaining + 5); // +5 на случай дубликатов

    console.log(`  🔍 Поиск: "${query}" (нужно ещё ${remaining})`);
    const items = await searchOtapi(query, fetchCount);
    console.log(`    Найдено: ${items.length}`);

    for (const item of items) {
      if (allProducts.length >= 55) break;

      const itemId = item.Id;
      if (seenIds.has(itemId)) continue;
      seenIds.add(itemId);

      // Пропускаем товары с Features содержащими Expired
      if (item.Features?.includes('Expired')) continue;

      const product = mapOtapiItem(item, task.category, task.subcategory, task.subcategory_id, supplier.id);

      // Проверяем что есть хотя бы цена и название
      if (product.price > 0 && product.name && product.name !== 'Без названия') {
        allProducts.push(product);
      }
    }

    // Пауза между запросами
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`  📊 Всего собрано: ${allProducts.length} товаров`);

  if (allProducts.length === 0) {
    console.log('  ⚠️ Нет товаров для импорта');
    return 0;
  }

  // Импортируем пачками по 10
  let imported = 0;
  for (let i = 0; i < allProducts.length; i += 10) {
    const batch = allProducts.slice(i, i + 10);
    const result = await insertProducts(batch);

    if (result.status >= 200 && result.status < 300) {
      const count = result.data?.length || batch.length;
      imported += count;
      console.log(`  ✅ Импортировано: ${imported}/${allProducts.length}`);
    } else {
      console.error(`  ❌ Ошибка импорта:`, result.data?.message || result.data);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return imported;
}

// Запуск
async function main() {
  console.log('🚀 Начинаем импорт товаров через OTAPI (Taobao)\n');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`OTAPI Key: ${OTAPI_KEY.substring(0, 8)}...`);
  console.log(`Курс CNY/RUB: ${CNY_TO_RUB}`);

  let totalImported = 0;

  for (const task of IMPORT_TASKS) {
    const count = await importCategory(task);
    totalImported += count;
    console.log(`\n✅ ${task.category} - ${task.subcategory}: импортировано ${count} товаров`);

    // Пауза между категориями
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n\n🎉 Импорт завершен! Всего импортировано: ${totalImported} товаров`);
}

main().catch(console.error);
