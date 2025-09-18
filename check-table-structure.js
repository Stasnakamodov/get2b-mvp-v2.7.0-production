const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 Проверяем структуру таблиц\n');
  
  // Получаем один товар, чтобы увидеть структуру
  const { data: sampleProduct, error } = await supabase
    .from('catalog_user_products')
    .select('*')
    .limit(1)
    .single();
    
  if (error) {
    console.error('❌ Ошибка:', error);
  } else {
    console.log('📦 Структура catalog_user_products:');
    console.log('Доступные поля:', Object.keys(sampleProduct));
    console.log('Пример записи:', sampleProduct);
  }
  
  // Проверим также поставщиков
  const { data: sampleSupplier } = await supabase
    .from('catalog_user_suppliers')
    .select('*')
    .eq('user_id', 'c021fb58-c00f-405e-babd-47d20e8a8ff6')
    .limit(1)
    .single();
    
  if (sampleSupplier) {
    console.log('\n🏢 Структура catalog_user_suppliers:');
    console.log('Доступные поля:', Object.keys(sampleSupplier));
    console.log('Пример записи:', sampleSupplier);
  }
  
  process.exit(0);
}

checkTableStructure().catch(console.error);