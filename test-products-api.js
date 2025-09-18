const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

async function testProductsAPI() {
  try {
    console.log('🧪 ТЕСТИРОВАНИЕ API ТОВАРОВ\n');
    
    // 1. Получаем всех поставщиков с их ID
    const { data: suppliers, error: suppliersError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name, category')
      .eq('is_active', true)
      .order('name');
      
    if (suppliersError) {
      console.error('❌ Ошибка получения поставщиков:', suppliersError);
      return;
    }
    
    console.log('👥 ПОСТАВЩИКИ:');
    suppliers?.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name} (${s.category})`);
      console.log(`   ID: ${s.id}\n`);
    });
    
    // 2. Тестируем API для каждого поставщика
    console.log('📦 ТЕСТИРОВАНИЕ API ТОВАРОВ:\n');
    
    for (const supplier of suppliers) {
      console.log(`🔍 Проверяем товары для ${supplier.name}:`);
      
      try {
        const response = await fetch(`http://localhost:3002/api/catalog/products?supplier_id=${supplier.id}&supplier_type=verified`);
        const data = await response.json();
        
        if (response.ok) {
          console.log(`✅ API ответил: ${data.products?.length || 0} товаров`);
          
          if (data.products && data.products.length > 0) {
            data.products.forEach(p => {
              console.log(`   - ${p.name} (${p.price} ${p.currency || 'RUB'})`);
            });
          }
        } else {
          console.error(`❌ Ошибка API:`, data.error);
        }
      } catch (error) {
        console.error(`❌ Ошибка запроса:`, error.message);
      }
      console.log('');
    }
    
    // 3. Прямая проверка базы данных
    console.log('🔍 ПРЯМАЯ ПРОВЕРКА БД:\n');
    
    for (const supplier of suppliers) {
      const { data: products, error: productsError } = await supabase
        .from('catalog_verified_products')
        .select('id, name, price, currency, is_active')
        .eq('supplier_id', supplier.id)
        .eq('is_active', true);
        
      if (productsError) {
        console.error(`❌ Ошибка БД для ${supplier.name}:`, productsError);
        continue;
      }
      
      console.log(`📋 ${supplier.name}: ${products?.length || 0} товаров в БД`);
      if (products && products.length > 0) {
        products.forEach(p => {
          console.log(`   - ${p.name} (${p.price} ${p.currency || 'RUB'}) [${p.is_active ? 'активен' : 'неактивен'}]`);
        });
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

testProductsAPI();