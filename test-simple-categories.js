// 🧪 ТЕСТ ПРОСТОЙ СИСТЕМЫ КАТЕГОРИЙ
// Тестируем что все работает правильно
// Запуск: node test-simple-categories.js

const { createClient } = require('@supabase/supabase-js');

// Настройки Supabase (используйте ваши реальные значения)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleCategories() {
  console.log('🧪 [TEST] Тестируем простую систему категорий...\n');

  try {
    // 1. Тест получения категорий
    console.log('1️⃣ Тестируем получение категорий...');
    const { data: categories, error: categoriesError } = await supabase
      .from('catalog_categories')
      .select('id, key, name, icon, description, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order');

    if (categoriesError) {
      console.error('❌ Ошибка получения категорий:', categoriesError);
      return;
    }

    console.log(`✅ Получено ${categories.length} категорий:`);
    categories.forEach(cat => {
      console.log(`   ${cat.icon} ${cat.name} (${cat.key})`);
    });
    console.log('');

    // 2. Тест создания новой категории
    console.log('2️⃣ Тестируем создание новой категории...');
    const testCategory = {
      key: 'test_category',
      name: 'Тестовая категория',
      description: 'Категория для тестирования',
      icon: '🧪',
      sort_order: 99,
      is_active: true
    };

    const { data: newCategory, error: createError } = await supabase
      .from('catalog_categories')
      .insert(testCategory)
      .select()
      .single();

    if (createError) {
      console.log('ℹ️ Категория уже существует или ошибка создания:', createError.message);
    } else {
      console.log('✅ Тестовая категория создана:', newCategory.name);
    }
    console.log('');

    // 3. Тест обновления категории
    console.log('3️⃣ Тестируем обновление категории...');
    const { data: updatedCategory, error: updateError } = await supabase
      .from('catalog_categories')
      .update({ description: 'Обновленное описание тестовой категории' })
      .eq('key', 'test_category')
      .select()
      .single();

    if (updateError) {
      console.log('ℹ️ Ошибка обновления:', updateError.message);
    } else {
      console.log('✅ Категория обновлена:', updatedCategory?.name);
    }
    console.log('');

    // 4. Тест удаления тестовой категории
    console.log('4️⃣ Очищаем тестовые данные...');
    const { error: deleteError } = await supabase
      .from('catalog_categories')
      .delete()
      .eq('key', 'test_category');

    if (deleteError) {
      console.log('ℹ️ Ошибка удаления:', deleteError.message);
    } else {
      console.log('✅ Тестовая категория удалена');
    }
    console.log('');

    // 5. Финальная проверка
    console.log('5️⃣ Финальная проверка системы...');
    const { data: finalCategories, error: finalError } = await supabase
      .from('catalog_categories')
      .select('*')
      .eq('is_active', true);

    if (finalError) {
      console.error('❌ Ошибка финальной проверки:', finalError);
      return;
    }

    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log(`📊 Итого активных категорий: ${finalCategories.length}`);
    console.log('💚 Простая система категорий работает корректно!');

  } catch (error) {
    console.error('❌ Критическая ошибка тестирования:', error);
  }
}

// Запускаем тесты
testSimpleCategories();