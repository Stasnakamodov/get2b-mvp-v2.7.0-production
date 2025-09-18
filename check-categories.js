const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

async function checkCategories() {
  try {
    console.log('🔍 Проверяем доступные категории...');
    
    // Получаем все категории из catalog_categories
    const { data: categories, error: categoriesError } = await supabase
      .from('catalog_categories')
      .select('*')
      .eq('is_active', true);
    
    if (categoriesError) {
      console.error('❌ Ошибка получения категорий:', categoriesError);
      return;
    }
    
    console.log('\n📋 Доступные категории в catalog_categories:');
    categories?.forEach(cat => {
      console.log(`- ${cat.name} (ключ: ${cat.key})`);
    });
    
    // Получаем существующих поставщиков и их категории
    const { data: suppliers, error: suppliersError } = await supabase
      .from('catalog_verified_suppliers')
      .select('name, category')
      .eq('is_active', true)
      .limit(10);
    
    if (suppliersError) {
      console.log('⚠️ Ошибка получения поставщиков:', suppliersError.message);
    } else {
      console.log('\n👥 Существующие поставщики и их категории:');
      suppliers?.forEach(supplier => {
        console.log(`- ${supplier.name}: ${supplier.category}`);
      });
    }
    
    console.log('\n📝 Рекомендуемые категории для новых поставщиков:');
    const validCategories = categories?.map(cat => cat.name) || [];
    console.log(validCategories.join(', '));
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

checkCategories();