/**
 * Добавочный импорт для достижения 55 товаров в категориях
 */

const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';
const OTAPI_KEY = '0e4fb57d-d80e-4274-acc5-f22f354e3577';
const CNY_TO_RUB = 13.5;
const SUPPLIER_ID = 'f736ad55-106e-427f-841f-ddba530c08c2';

// Категории которым нужно добавить товары
const IMPORT_TASKS = [
  {
    category: 'Строительство',
    subcategory: 'Строительные материалы',
    subcategory_id: '13eb757a-f06e-42d5-ae5e-4657814b2096',
    targetCount: 5, // нужно добавить 5 (было 53)
    queries: ['drywall', 'brick', 'mortar']
  },
  {
    category: 'Текстиль и одежда',
    subcategory: 'Аксессуары и фурнитура',
    subcategory_id: '996138fa-3c1e-41c1-8dca-865c4fcf255a',
    targetCount: 7, // нужно добавить 7 (было 50)
    queries: ['brooch pin', 'needle', 'thimble']
  },
  {
    category: 'Дом и быт',
    subcategory: 'Посуда',
    subcategory_id: '4ec8d2f4-d14f-4661-b83c-e06197731aaa',
    targetCount: 7, // нужно добавить 7 (было 50)
    queries: ['plate set', 'bowl ceramic', 'serving dish']
  },
  {
    category: 'Строительство',
    subcategory: 'Крепеж и метизы',
    subcategory_id: '8542c089-6667-4ccb-a849-d34c63c03de3',
    targetCount: 10, // нужно добавить 10 (было 48)
    queries: ['wall anchor', 'bracket metal', 'spring clip']
  }
];

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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function searchOtapi(query, limit = 20, offset = 0) {
  const xmlParams = `<SearchItemsParameters><Provider>Taobao</Provider><SearchMethod>Catalog</SearchMethod><ItemTitle>${query}</ItemTitle></SearchItemsParameters>`;
  const params = new URLSearchParams({
    instanceKey: OTAPI_KEY,
    language: 'ru',
    xmlParameters: xmlParams,
    framePosition: offset.toString(),
    frameSize: limit.toString()
  });

  try {
    const response = await makeRequest('http://otapi.net/service-json/SearchItemsFrame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
    }, params.toString());

    return response.data?.Result?.Items?.Content || [];
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return [];
  }
}

async function getExistingNames(subcategory_id) {
  const url = `${SUPABASE_URL}/rest/v1/catalog_verified_products?subcategory_id=eq.${subcategory_id}&select=name`;
  const response = await makeRequest(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  return new Set((response.data || []).map(p => p.name));
}

function mapOtapiItem(item, category, subcategory_id) {
  const priceInCny = parseFloat(item.Price?.OriginalPrice || 0);
  const priceInRub = Math.round(priceInCny * CNY_TO_RUB);
  const images = item.Pictures?.map(pic => pic.Large?.Url || pic.Medium?.Url || pic.Url).filter(Boolean) || [];
  if (images.length === 0 && item.MainPictureUrl) images.push(item.MainPictureUrl);

  return {
    name: item.Title || 'Товар',
    description: `${item.Title || ''}\n\nИмпортировано с Taobao`,
    category: category,
    subcategory_id: subcategory_id,
    sku: `tb3-${item.Id || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    price: priceInRub,
    currency: 'RUB',
    min_order: '1 шт.',
    in_stock: true,
    specifications: { 'Маркетплейс': 'Taobao', 'ID': item.Id },
    images: images.slice(0, 10),
    supplier_id: SUPPLIER_ID,
    is_active: true,
    is_featured: false
  };
}

async function insertProducts(products) {
  const response = await makeRequest(`${SUPABASE_URL}/rest/v1/catalog_verified_products`, {
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

async function importCategory(task) {
  console.log(`\n📦 ${task.category} - ${task.subcategory} (+${task.targetCount})`);

  // Получаем существующие названия чтобы избежать дубликатов
  const existingNames = await getExistingNames(task.subcategory_id);
  console.log(`  Существующих товаров: ${existingNames.size}`);

  const allProducts = [];
  const seenNames = new Set(existingNames);

  for (const query of task.queries) {
    if (allProducts.length >= task.targetCount) break;

    console.log(`  🔍 "${query}"`);
    // Пропускаем первые 20 результатов (они уже импортированы)
    const items = await searchOtapi(query, 20, 20);

    for (const item of items) {
      if (allProducts.length >= task.targetCount) break;

      const name = item.Title || 'Товар';
      if (seenNames.has(name)) continue;
      seenNames.add(name);

      const product = mapOtapiItem(item, task.category, task.subcategory_id);
      if (product.price > 0) allProducts.push(product);
    }

    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`  📊 Новых: ${allProducts.length}`);

  if (allProducts.length === 0) return 0;

  const result = await insertProducts(allProducts);
  if (result.status >= 200 && result.status < 300) {
    console.log(`  ✅ Импортировано: ${result.data?.length || allProducts.length}`);
    return result.data?.length || allProducts.length;
  } else {
    console.error(`  ❌`, result.data?.message || result.status);
    return 0;
  }
}

async function main() {
  console.log('🚀 Добавочный импорт товаров\n');

  let total = 0;
  for (const task of IMPORT_TASKS) {
    total += await importCategory(task);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n\n🎉 Добавлено: ${total} товаров`);
}

main().catch(console.error);
