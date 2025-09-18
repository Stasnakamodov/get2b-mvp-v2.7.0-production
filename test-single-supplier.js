const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

async function testSingleSupplier() {
  try {
    console.log('🧪 Тестируем добавление одного поставщика...');
    
    // Тестируем с минимальными данными
    const supplier = {
      name: 'ТехноКомплект',
      company_name: 'ТехноКомплект ООО',
      category: 'Электроника',
      country: 'Россия',
      city: 'Москва',
      description: 'Поставщик электроники',
      contact_email: 'test@test.ru',
      public_rating: 4.8,
      reviews_count: 127,
      projects_count: 189,
      is_featured: true,
      is_active: true,
      is_verified: true,
      moderation_status: 'approved'
    };
    
    const { data, error } = await supabase
      .from('catalog_verified_suppliers')
      .insert([supplier])
      .select();
    
    if (error) {
      console.error('❌ Ошибка:', error);
      
      // Попробуем с другими категориями
      console.log('\n🔄 Пробуем другие категории...');
      const categories = ['Электроника', 'Автотовары', 'Промышленность', 'Здоровье и медицина', 'Строительство'];
      
      for (const cat of categories) {
        console.log(`Тестируем категорию: ${cat}`);
        const testSupplier = { ...supplier, category: cat, name: `Тест ${cat}` };
        
        const { data: testData, error: testError } = await supabase
          .from('catalog_verified_suppliers')
          .insert([testSupplier])
          .select();
        
        if (testError) {
          console.log(`❌ ${cat}: ${testError.message}`);
        } else {
          console.log(`✅ ${cat}: успешно`);
          console.log('Данные:', testData?.[0]);
          break;
        }
      }
      
    } else {
      console.log('✅ Поставщик успешно добавлен:', data?.[0]);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

testSingleSupplier();