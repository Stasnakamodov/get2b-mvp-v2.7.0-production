const { exec } = require('child_process');

// Получаем последний созданный cart_id из базы данных
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCartInBrowser() {
  console.log('🧪 ТЕСТИРОВАНИЕ ЗАГРУЗКИ КОРЗИНЫ В БРАУЗЕРЕ\n');
  console.log('=' .repeat(60));
  
  try {
    // Получаем последнюю активную корзину
    const { data: cart, error } = await supabase
      .from('project_carts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !cart) {
      console.log('❌ Корзина не найдена. Создайте сначала через test-cart-flow.js');
      return;
    }
    
    console.log('✅ Найдена корзина:', cart.id);
    console.log('   - Товаров:', cart.cart_items?.items?.length);
    console.log('   - Сумма:', cart.total_amount);
    console.log('   - Поставщик:', cart.supplier_company_name);
    
    const url = `http://localhost:3000/dashboard/create-project?from_cart=true&cart_id=${cart.id}`;
    
    console.log('\n🌐 Открываем URL в браузере:');
    console.log(url);
    
    // Открываем URL в браузере по умолчанию
    exec(`open "${url}"`, (error) => {
      if (error) {
        console.error('❌ Ошибка открытия браузера:', error);
        return;
      }
      console.log('\n✅ Браузер открыт!');
      console.log('\nПроверьте в браузере:');
      console.log('1. Откройте DevTools (F12) и перейдите на вкладку Console');
      console.log('2. Должны быть логи [CartLoader] с данными корзины');
      console.log('3. Шаг 2 должен содержать товары из корзины');
      console.log('4. Шаг 4 должен предлагать способ оплаты');
      console.log('5. Шаг 5 должен содержать реквизиты поставщика');
    });
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

testCartInBrowser();