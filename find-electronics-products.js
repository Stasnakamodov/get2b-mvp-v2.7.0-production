const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function findElectronicsProducts() {
  console.log('🔍 Поиск всех товаров в категории electronics для пользователя c021fb58-c00f-405e-babd-47d20e8a8ff6\n');
  
  // Находим всех поставщиков этого пользователя
  const { data: suppliers } = await supabase
    .from('catalog_user_suppliers')
    .select('id, name')
    .eq('user_id', 'c021fb58-c00f-405e-babd-47d20e8a8ff6');
  
  const supplierIds = suppliers?.map(s => s.id) || [];
  console.log(`👥 Поставщики пользователя: ${suppliers?.length || 0}`);
  suppliers?.forEach(s => console.log(`   - ${s.name} (${s.id})`));
  
  // Ищем товары в категории electronics у этих поставщиков
  const { data: electronicsProducts, error } = await supabase
    .from('catalog_user_products')
    .select(`
      id,
      name,
      category,
      supplier_id,
      price,
      currency,
      description,
      in_stock
    `)
    .in('supplier_id', supplierIds)
    .eq('category', 'electronics');
    
  if (error) {
    console.error('❌ Ошибка:', error);
    return;
  }
  
  console.log(`\n📱 Товары в категории "electronics": ${electronicsProducts?.length || 0}\n`);
  
  if (electronicsProducts && electronicsProducts.length > 0) {
    electronicsProducts.forEach((product, i) => {
      const supplier = suppliers?.find(s => s.id === product.supplier_id);
      console.log(`${i + 1}. "${product.name}"`);
      console.log(`   💰 Цена: ${product.price} ${product.currency || ''}`);
      console.log(`   📋 Описание: ${product.description || 'не указано'}`);
      console.log(`   📦 В наличии: ${product.in_stock ? 'Да' : 'Нет'}`);
      console.log(`   🏢 Поставщик: ${supplier?.name || 'неизвестен'} (${product.supplier_id})`);
      console.log(`   🆔 ID товара: ${product.id}\n`);
    });
  } else {
    console.log('❌ Товары не найдены');
  }
  
  // Теперь проверим, что показывает API hierarchical categories
  console.log('🌳 Проверяем что возвращает API /api/catalog/categories/hierarchical...\n');
  
  const response = await fetch('http://localhost:3000/api/catalog/categories/hierarchical?room=user', {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const apiData = await response.json();
  
  if (apiData.success) {
    const electronicsCategory = apiData.categoryTrees?.find(tree => 
      tree.main_category.name.toLowerCase().includes('электрон') || 
      tree.main_category.key === 'electronics'
    );
    
    if (electronicsCategory) {
      console.log('📱 Категория "Электроника и IT" найдена в API:');
      console.log(`   Главная категория: ${electronicsCategory.main_category.name}`);
      console.log(`   Товаров: ${electronicsCategory.main_category.products_count || 0}`);
      
      if (electronicsCategory.subcategories?.length > 0) {
        console.log('   Подкатегории:');
        electronicsCategory.subcategories.forEach(sub => {
          console.log(`      - ${sub.name}: ${sub.products_count || 0} товаров`);
        });
      }
    } else {
      console.log('❌ Категория "Электроника и IT" не найдена в API');
      console.log('Доступные категории:');
      apiData.categoryTrees?.forEach(tree => {
        console.log(`   - ${tree.main_category.name} (${tree.main_category.products_count || 0} товаров)`);
      });
    }
  } else {
    console.log('❌ Ошибка API:', apiData.error);
  }

  process.exit(0);
}

findElectronicsProducts().catch(console.error);