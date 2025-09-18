// Тестируем обновление поставщика
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpdate() {
  console.log('🧪 Тестируем обновление полей поставщика...\n');

  // Попробуем обновить существующее поле
  console.log('1. Тестируем обновление payment_methods (поле существует):');
  const { data: test1, error: error1 } = await supabase
    .from('catalog_verified_suppliers')
    .update({ 
      payment_methods: ['bank-transfer', 'crypto'] 
    })
    .eq('name', 'ТехноКомплект')
    .select();

  if (error1) {
    console.log('❌ Ошибка:', error1.message);
  } else {
    console.log('✅ Успешно обновлено payment_methods');
  }

  // Попробуем обновить несуществующее поле
  console.log('\n2. Тестируем обновление address (поле НЕ существует):');
  const { data: test2, error: error2 } = await supabase
    .from('catalog_verified_suppliers')
    .update({ 
      address: 'Moscow, Test Street 123'
    })
    .eq('name', 'ТехноКомплект')
    .select();

  if (error2) {
    console.log('❌ Ошибка:', error2.message);
    console.log('Код ошибки:', error2.code);
  } else {
    console.log('✅ Успешно обновлено address');
  }

  // Проверим результат
  console.log('\n📊 Проверяем текущие данные:');
  const { data: current } = await supabase
    .from('catalog_verified_suppliers')
    .select('name, payment_methods')
    .eq('name', 'ТехноКомплект')
    .single();

  console.log('Текущий ТехноКомплект:', current);
}

testUpdate();