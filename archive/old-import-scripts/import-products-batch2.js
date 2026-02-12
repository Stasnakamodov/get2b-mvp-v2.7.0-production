/**
 * Дополнительный импорт товаров через OTAPI - расширенные запросы
 */

const https = require('https');
const http = require('http');

const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';
const OTAPI_KEY = '0e4fb57d-d80e-4274-acc5-f22f354e3577';
const CNY_TO_RUB = 13.5;
const SUPPLIER_ID = 'f736ad55-106e-427f-841f-ddba530c08c2';

// Дополнительные запросы для каждой подкатегории
const IMPORT_TASKS = [
  {
    category: 'Текстиль и одежда',
    subcategory: 'Аксессуары и фурнитура',
    subcategory_id: '996138fa-3c1e-41c1-8dca-865c4fcf255a',
    targetCount: 47, // нужно ещё 47 (было 8)
    queries: [
      'lace trim', 'elastic band', 'velcro', 'thread spool', 'hook eye',
      'snap button', 'leather cord', 'satin ribbon', 'embroidery thread', 'tassel',
      'bead string', 'sequin', 'rhinestone', 'patch badge', 'iron patch',
      'clothing tag', 'label', 'woven label', 'care label', 'shoulder pad'
    ]
  },
  {
    category: 'Дом и быт',
    subcategory: 'Посуда',
    subcategory_id: '4ec8d2f4-d14f-4661-b83c-e06197731aaa',
    targetCount: 26, // нужно ещё 26 (было 29)
    queries: [
      'bowl set', 'teapot', 'coffee mug', 'spoon fork set', 'cutting board',
      'wok pan', 'salad bowl', 'storage container', 'lunch box', 'thermos',
      'chopsticks', 'ladle', 'strainer', 'grater', 'peeler'
    ]
  },
  {
    category: 'Строительство',
    subcategory: 'Строительные материалы',
    subcategory_id: '13eb757a-f06e-42d5-ae5e-4657814b2096',
    targetCount: 23, // нужно ещё 23 (было 32)
    queries: [
      'adhesive tape', 'silicone sealant', 'paint brush', 'sandpaper', 'wire mesh',
      'plastic sheet', 'foam board', 'wood panel', 'plywood', 'steel mesh',
      'gypsum board', 'corner bead', 'waterproof membrane', 'floor tile', 'wall panel'
    ]
  },
  {
    category: 'Строительство',
    subcategory: 'Крепеж и метизы',
    subcategory_id: '8542c089-6667-4ccb-a849-d34c63c03de3',
    targetCount: 47, // нужно ещё 47 (было 8)
    queries: [
      'nail set', 'rivet', 'cable tie', 'metal bracket', 'corner bracket',
      'hinge', 'door handle', 'lock', 'latch', 'magnetic catch',
      'drawer slide', 'shelf bracket', 'wall mount', 'hook', 'chain',
      'metal ring', 'carabiner', 'U bolt', 'eye bolt', 'turnbuckle'
    ]
  },
  {
    category: 'Строительство',
    subcategory: 'Инструменты',
    subcategory_id: '03e141a2-54c8-456a-8e0b-b493caa17c6b',
    targetCount: 33, // нужно ещё 33 (было 22)
    queries: [
      'pliers', 'wire cutter', 'level', 'tape measure', 'utility knife',
      'saw', 'chisel', 'file', 'clamp', 'vise',
      'multimeter', 'soldering iron', 'heat gun', 'angle grinder', 'jigsaw',
      'paint roller', 'spray gun', 'sander', 'router', 'circular saw'
    ]
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

async function searchOtapi(query, limit = 20) {
  const xmlParams = `<SearchItemsParameters><Provider>Taobao</Provider><SearchMethod>Catalog</SearchMethod><ItemTitle>${query}</ItemTitle></SearchItemsParameters>`;
  const params = new URLSearchParams({
    instanceKey: OTAPI_KEY,
    language: 'ru',
    xmlParameters: xmlParams,
    framePosition: '0',
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
    sku: `tb2-${item.Id || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
  console.log(`\n📦 ${task.category} - ${task.subcategory} (нужно ${task.targetCount})`);

  const allProducts = [];
  const seenIds = new Set();

  for (const query of task.queries) {
    if (allProducts.length >= task.targetCount) break;

    console.log(`  🔍 "${query}"`);
    const items = await searchOtapi(query, 15);

    for (const item of items) {
      if (allProducts.length >= task.targetCount) break;
      if (seenIds.has(item.Id)) continue;
      seenIds.add(item.Id);

      const product = mapOtapiItem(item, task.category, task.subcategory_id);
      if (product.price > 0) allProducts.push(product);
    }

    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`  📊 Собрано: ${allProducts.length}`);

  if (allProducts.length === 0) return 0;

  let imported = 0;
  for (let i = 0; i < allProducts.length; i += 10) {
    const batch = allProducts.slice(i, i + 10);
    const result = await insertProducts(batch);
    if (result.status >= 200 && result.status < 300) {
      imported += result.data?.length || batch.length;
      console.log(`  ✅ ${imported}/${allProducts.length}`);
    } else {
      console.error(`  ❌`, result.data?.message || result.status);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  return imported;
}

async function main() {
  console.log('🚀 Дополнительный импорт товаров\n');

  let total = 0;
  for (const task of IMPORT_TASKS) {
    total += await importCategory(task);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n\n🎉 Всего: ${total} товаров`);
}

main().catch(console.error);
