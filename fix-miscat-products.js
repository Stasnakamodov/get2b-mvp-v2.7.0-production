const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixMiscategorizedProducts() {
  console.log('🔧 Исправляем неправильно категоризированные товары\n');
  
  // Товары-автозапчасти, которые попали в electronics
  const automotiveProducts = [
    {
      id: '3bbb55df-193d-4cec-9067-efbf651be555',
      name: 'Масляный фильтр Mann W914/2',
      correctCategory: 'automotive'
    },
    {
      id: 'f623e21b-0bd3-431e-be83-1514bef428a7',
      name: 'Тормозные колодки Brembo',
      correctCategory: 'automotive'
    },
    {
      id: '3fd129a2-6d34-4024-8a64-1b591eb2e0fe',
      name: 'Аккумулятор Bosch S5',
      correctCategory: 'automotive'
    }
  ];
  
  console.log('📝 Исправляем категории товаров:');
  
  for (const product of automotiveProducts) {
    console.log(`   Исправляем "${product.name}"...`);
    
    const { error } = await supabase
      .from('catalog_user_products')
      .update({ 
        category: product.correctCategory,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);
      
    if (error) {
      console.error(`   ❌ Ошибка для ${product.name}:`, error.message);
    } else {
      console.log(`   ✅ ${product.name} перемещен в категорию "${product.correctCategory}"`);
    }
  }
  
  console.log('\n🔍 Проверяем результат...');
  
  // Проверяем, остались ли товары в electronics
  const { data: remainingElectronics } = await supabase
    .from('catalog_user_products')
    .select('id, name, category')
    .in('supplier_id', [
      '8b147de1-c465-48d0-ad7a-8b38000e0dfb',
      '44309e0f-f830-4211-a7f4-7cd8dde9c16f',
      '77656a83-1504-4b82-b85e-2656de84b665',
      'e35f3664-e645-457f-bd0c-dc0ced8ee451',
      'f06f1ceb-e24c-440d-a1ad-584a200ea48d'
    ])
    .eq('category', 'electronics');
    
  console.log(`📱 Товаров осталось в категории electronics: ${remainingElectronics?.length || 0}`);
  
  if (remainingElectronics && remainingElectronics.length > 0) {
    remainingElectronics.forEach(p => {
      console.log(`   - ${p.name} (${p.category})`);
    });
  }
  
  // Проверяем automotive категорию
  const { data: automotiveCount } = await supabase
    .from('catalog_user_products')
    .select('id, name')
    .in('supplier_id', [
      '8b147de1-c465-48d0-ad7a-8b38000e0dfb',
      '44309e0f-f830-4211-a7f4-7cd8dde9c16f',
      '77656a83-1504-4b82-b85e-2656de84b665',
      'e35f3664-e645-457f-bd0c-dc0ced8ee451',
      'f06f1ceb-e24c-440d-a1ad-584a200ea48d'
    ])
    .eq('category', 'automotive');
    
  console.log(`🚗 Товаров в категории automotive: ${automotiveCount?.length || 0}`);
  
  if (automotiveCount && automotiveCount.length > 0) {
    automotiveCount.forEach(p => {
      console.log(`   - ${p.name}`);
    });
  }
  
  console.log('\n✅ Исправление завершено!');
  console.log('🔄 Теперь счетчик товаров в категории "Электроника и IT" должен показать 0 товаров в синей комнате.');

  process.exit(0);
}

fixMiscategorizedProducts().catch(console.error);