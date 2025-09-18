const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCategories() {
  console.log('🔧 Пробуем исправить constraint через RPC функцию...');
  
  try {
    // Попробуем через execute_sql RPC функцию
    const { data, error } = await supabase.rpc('execute_sql', { 
      sql_query: 'ALTER TABLE catalog_verified_suppliers DROP CONSTRAINT IF EXISTS valid_category_verified;' 
    });
    
    if (error) {
      console.log('❌ RPC не работает:', error);
      console.log('💡 Нужно удалить constraint через Supabase Dashboard');
      console.log('📋 Заходите в Dashboard > SQL Editor и выполните:');
      console.log('ALTER TABLE catalog_verified_suppliers DROP CONSTRAINT IF EXISTS valid_category_verified;');
      console.log('ALTER TABLE catalog_verified_products DROP CONSTRAINT IF EXISTS valid_category_products;');
    } else {
      console.log('✅ Constraint удален успешно:', data);
    }
  } catch (err) {
    console.log('❌ Критическая ошибка:', err);
    console.log('\n🎯 РЕШЕНИЕ: Заходите в Supabase Dashboard:');
    console.log('1. Откройте https://supabase.com/dashboard/project/ejkhdhexkadecpbjjmsz/sql/new');
    console.log('2. Выполните эти SQL команды:');
    console.log('\nALTER TABLE catalog_verified_suppliers DROP CONSTRAINT IF EXISTS valid_category_verified;');
    console.log('ALTER TABLE catalog_verified_products DROP CONSTRAINT IF EXISTS valid_category_products;');
    console.log('\n3. После этого запустите снова: node create-natural-food-suppliers.js');
  }
}

fixCategories().catch(console.error);