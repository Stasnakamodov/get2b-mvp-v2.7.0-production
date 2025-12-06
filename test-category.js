// Test script to check category ТЕСТОВАЯ
const fetch = require('node-fetch');

async function testCategory() {
  console.log('=== Testing Category ТЕСТОВАЯ ===\n');

  // 1. Check database
  console.log('1. Checking database...');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
  );

  const { data: dbProducts, error: dbError } = await supabase
    .from('catalog_verified_products')
    .select('id, product_name, category')
    .eq('category', 'ТЕСТОВАЯ')
    .limit(5);

  if (dbError) {
    console.error('Database error:', dbError);
  } else {
    console.log(`Found ${dbProducts.length} products in database (showing first 5)`);
    dbProducts.forEach(p => console.log(`  - ${p.product_name}`));
  }

  // 2. Check API
  console.log('\n2. Checking API...');
  try {
    const apiResponse = await fetch('http://localhost:3000/api/catalog/products-by-category/ТЕСТОВАЯ?limit=500');
    const apiData = await apiResponse.json();
    console.log(`API returned ${apiData.products?.length || 0} products`);
    if (apiData.products?.length > 0) {
      console.log('First 3 products from API:');
      apiData.products.slice(0, 3).forEach(p =>
        console.log(`  - ${p.product_name || p.name || 'No name'}`));
    }
  } catch (error) {
    console.error('API error:', error.message);
  }

  // 3. Check page rendering
  console.log('\n3. Checking page rendering...');
  console.log('URL: http://localhost:3000/dashboard/catalog?category=ТЕСТОВАЯ');
  console.log('\nNOTE: Open DevTools Console to see debug logs from the component:');
  console.log('  - Look for "🔍 Загружаю категорию:" message');
  console.log('  - Look for "📡 Ответ API:" message');
  console.log('  - Look for "📦 Загружено товаров:" message');
  console.log('\n✅ Test complete. Check the browser console for more details.');
}

testCategory().catch(console.error);