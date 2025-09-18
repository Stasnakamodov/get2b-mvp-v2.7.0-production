const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsByCategory() {
  console.log('🔍 Проверяем товары по категориям...');

  // Проверим все товары
  const { data: allProducts, error: allError } = await supabase
    .from('catalog_verified_products')
    .select('name, category, supplier_id')
    .limit(10);

  if (allError) {
    console.error('❌ Ошибка получения всех товаров:', allError);
  } else {
    console.log('\n📦 Последние 10 товаров:');
    allProducts.forEach(product => {
      console.log(`  - ${product.name} (${product.category})`);
    });
  }

  // Проверим товары в Промышленности
  const { data: industryProducts, error: industryError } = await supabase
    .from('catalog_verified_products')
    .select('name, category, supplier_id')
    .eq('category', 'Промышленность');

  if (industryError) {
    console.error('❌ Ошибка получения товаров Промышленности:', industryError);
  } else {
    console.log(`\n🏭 Товары в категории "Промышленность": ${industryProducts.length}`);
    industryProducts.forEach(product => {
      console.log(`  - ${product.name}`);
    });
  }

  // Проверим товары в Продуктах питания  
  const { data: foodProducts, error: foodError } = await supabase
    .from('catalog_verified_products')
    .select('name, category, supplier_id')
    .eq('category', 'Продукты питания');

  if (foodError) {
    console.error('❌ Ошибка получения Продуктов питания:', foodError);
  } else {
    console.log(`\n🍎 Товары в категории "Продукты питания": ${foodProducts.length}`);
    foodProducts.forEach(product => {
      console.log(`  - ${product.name}`);
    });
  }

  // Проверим статистику по всем категориям
  const { data: categoryStats, error: statsError } = await supabase
    .from('catalog_verified_products')
    .select('category')
    .neq('category', null);

  if (!statsError && categoryStats) {
    const stats = {};
    categoryStats.forEach(item => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    
    console.log('\n📊 Статистика по категориям:');
    Object.entries(stats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} товаров`);
    });
  }
}

checkProductsByCategory().catch(console.error);