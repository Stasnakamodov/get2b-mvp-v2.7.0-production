const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

async function checkProductsSchema() {
  try {
    console.log('🔍 Проверяем схему таблицы catalog_verified_products...');
    
    // Попробуем добавить один простой товар чтобы увидеть ошибку
    const testProduct = {
      supplier_id: 'test',
      product_name: 'Тестовый товар',
      description: 'Тестовое описание',
      price: '₽1000',
      currency: 'RUB'
    };
    
    const { data, error } = await supabase
      .from('catalog_verified_products')
      .insert([testProduct])
      .select();
    
    if (error) {
      console.error('❌ Ошибка при вставке тестового товара:', error);
      
      // Попробуем получить любые существующие товары чтобы увидеть структуру
      console.log('\n🔍 Проверяем существующие товары...');
      const { data: existing, error: selectError } = await supabase
        .from('catalog_verified_products')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.error('❌ Ошибка при получении товаров:', selectError);
      } else {
        if (existing && existing.length > 0) {
          console.log('📋 Структура существующего товара:');
          console.log(JSON.stringify(existing[0], null, 2));
        } else {
          console.log('📋 Таблица пуста');
        }
      }
      
      // Попробуем получить схему через минимальный select
      console.log('\n🔍 Проверяем доступные поля...');
      try {
        const { data: schemaTest, error: schemaError } = await supabase
          .from('catalog_verified_products')
          .select('id, supplier_id, product_name, description, price, currency')
          .limit(0);
          
        if (schemaError) {
          console.error('❌ Ошибка схемы:', schemaError);
        } else {
          console.log('✅ Базовые поля доступны');
        }
      } catch (e) {
        console.error('❌ Ошибка проверки схемы:', e.message);
      }
      
    } else {
      console.log('✅ Тестовый товар добавлен:', data[0]);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

checkProductsSchema();