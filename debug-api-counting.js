const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAPICounting() {
  console.log('🔍 Отладка подсчета товаров в API для пользователя c021fb58-c00f-405e-babd-47d20e8a8ff6\n');
  
  // 1. Проверяем всех поставщиков пользователя
  const { data: userSuppliers } = await supabase
    .from('catalog_user_suppliers')
    .select('id, name, category, catalog_user_products(*)')
    .eq('user_id', 'c021fb58-c00f-405e-babd-47d20e8a8ff6')
    .eq('is_active', true);
    
  console.log('👥 ВСЕ поставщики пользователя:');
  if (userSuppliers) {
    userSuppliers.forEach(supplier => {
      console.log(`   - ${supplier.name}: категория "${supplier.category}", товаров: ${supplier.catalog_user_products?.length || 0}`);
      
      // Показываем товары каждого поставщика
      if (supplier.catalog_user_products && supplier.catalog_user_products.length > 0) {
        supplier.catalog_user_products.forEach(product => {
          console.log(`      • ${product.name} (${product.category})`);
        });
      }
    });
  }
  
  // 2. Проверяем поставщиков категории "Электроника"
  console.log('\n📱 Поставщики в категории "Электроника":');
  
  const electronicsKeywords = ['электрон', 'electronic', 'компьютер', 'computer', 'it', 'tech'];
  
  const electronicsSuppliers = userSuppliers?.filter(supplier => {
    const supplierCategory = supplier.category?.toLowerCase() || '';
    return electronicsKeywords.some(keyword => 
      supplierCategory.includes(keyword) || keyword.includes(supplierCategory)
    );
  });
  
  let totalElectronicsProducts = 0;
  
  if (electronicsSuppliers && electronicsSuppliers.length > 0) {
    electronicsSuppliers.forEach(supplier => {
      const productsCount = supplier.catalog_user_products?.length || 0;
      totalElectronicsProducts += productsCount;
      
      console.log(`   - ${supplier.name}: ${productsCount} товаров`);
      if (supplier.catalog_user_products) {
        supplier.catalog_user_products.forEach(product => {
          console.log(`      • ${product.name} (реальная категория: ${product.category})`);
        });
      }
    });
    
    console.log(`\n📊 ИТОГО в "Электронике": ${electronicsSuppliers.length} поставщиков, ${totalElectronicsProducts} товаров`);
  } else {
    console.log('   Поставщики не найдены');
  }
  
  // 3. Проверим что возвращает реальный API
  console.log('\n🌐 Проверяем реальный API:');
  
  try {
    const response = await fetch('http://localhost:3000/api/catalog/categories/hierarchical?room=user', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const apiData = await response.json();
    
    if (apiData.success) {
      const electronicsCategory = apiData.categoryTrees?.find(tree => 
        tree.main_category.name.toLowerCase().includes('электрон')
      );
      
      if (electronicsCategory) {
        console.log(`   API показывает: ${electronicsCategory.main_category.products_count || 0} товаров`);
        console.log(`   API показывает: ${electronicsCategory.main_category.suppliers_count || 0} поставщиков`);
        
        console.log('   Подкатегории в API:');
        electronicsCategory.subcategories?.forEach(sub => {
          console.log(`      - ${sub.name}: ${sub.products_count || 0} товаров`);
        });
        
        console.log(`\n🚨 ПРОБЛЕМА: Реальных товаров ${totalElectronicsProducts}, но API показывает ${electronicsCategory.main_category.products_count || 0}`);
        
        if (totalElectronicsProducts !== (electronicsCategory.main_category.products_count || 0)) {
          console.log('❌ Подсчет в API работает неправильно!');
          console.log('🔧 Возможные причины:');
          console.log('   1. API считает товары из других пользователей');
          console.log('   2. API кэширует старые данные');
          console.log('   3. Ошибка в логике подсчета API');
        }
      }
    }
  } catch (error) {
    console.log('❌ Ошибка запроса к API:', error.message);
  }

  process.exit(0);
}

debugAPICounting().catch(console.error);