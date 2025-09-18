const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUserProducts() {
  console.log('🔍 Проверяем товары пользователя c021fb58-c00f-405e-babd-47d20e8a8ff6\n');
  
  // 1. Проверяем товары в категории Электроника
  const { data: electronicsProducts, error: error1 } = await supabase
    .from('catalog_user_products')
    .select(`
      *,
      catalog_user_suppliers!inner(*)
    `)
    .eq('catalog_user_suppliers.user_id', 'c021fb58-c00f-405e-babd-47d20e8a8ff6')
    .or('category.ilike.%электрон%,category.ilike.%IT%,category.ilike.%компьютер%');
    
  if (error1) {
    console.error('❌ Ошибка при получении товаров электроники:', error1);
  } else {
    console.log('📱 Товары в категории "Электроника и IT":');
    console.log(`   Найдено: ${electronicsProducts?.length || 0} товаров\n`);
    
    if (electronicsProducts && electronicsProducts.length > 0) {
      electronicsProducts.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.product_name}`);
        console.log(`      - Категория: ${p.category}`);
        console.log(`      - Подкатегория: ${p.subcategory || 'не указана'}`);
        console.log(`      - Поставщик: ${p.catalog_user_suppliers.name}`);
        console.log(`      - ID товара: ${p.id}\n`);
      });
    }
  }
  
  // 2. Проверяем ВСЕ товары пользователя
  const { data: allProducts, error: error2 } = await supabase
    .from('catalog_user_products')
    .select(`
      *,
      catalog_user_suppliers!inner(*)
    `)
    .eq('catalog_user_suppliers.user_id', 'c021fb58-c00f-405e-babd-47d20e8a8ff6');
    
  if (error2) {
    console.error('❌ Ошибка при получении всех товаров:', error2);
  } else {
    console.log('📦 ВСЕ товары пользователя:');
    console.log(`   Общее количество: ${allProducts?.length || 0} товаров\n`);
    
    if (allProducts && allProducts.length > 0) {
      // Группируем по категориям
      const categories = {};
      const suppliers = {};
      
      allProducts.forEach(p => {
        // Считаем по категориям
        const cat = p.category || 'Без категории';
        categories[cat] = (categories[cat] || 0) + 1;
        
        // Считаем по поставщикам
        const sup = p.catalog_user_suppliers.name;
        if (!suppliers[sup]) {
          suppliers[sup] = { count: 0, products: [] };
        }
        suppliers[sup].count++;
        suppliers[sup].products.push(p.product_name);
      });
      
      console.log('   📊 Распределение по категориям:');
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`      - ${cat}: ${count} товаров`);
      });
      
      console.log('\n   🏢 Распределение по поставщикам:');
      Object.entries(suppliers).forEach(([sup, data]) => {
        console.log(`      - ${sup}: ${data.count} товаров`);
        data.products.forEach(prod => {
          console.log(`         • ${prod}`);
        });
      });
    }
  }
  
  // 3. Проверяем конкретного поставщика ТехноСтрой
  const { data: technoStroy } = await supabase
    .from('catalog_user_suppliers')
    .select('*')
    .eq('user_id', 'c021fb58-c00f-405e-babd-47d20e8a8ff6')
    .eq('name', 'ТехноСтрой')
    .single();
    
  if (technoStroy) {
    console.log(`\n🏪 Поставщик "${technoStroy.name}":`);
    console.log(`   ID: ${technoStroy.id}`);
    console.log(`   Категория: ${technoStroy.category}`);
    
    // Получаем его товары
    const { data: technoProducts } = await supabase
      .from('catalog_user_products')
      .select('*')
      .eq('supplier_id', technoStroy.id);
      
    if (technoProducts) {
      console.log(`   Товаров: ${technoProducts.length}`);
      technoProducts.forEach(p => {
        console.log(`      - ${p.product_name} (${p.category})`);
      });
    }
  }
  
  process.exit(0);
}

checkUserProducts().catch(console.error);