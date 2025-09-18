require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCartFlow() {
  console.log('\n🧪 ТЕСТИРОВАНИЕ FLOW КОРЗИНА → ПРОЕКТ\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Проверяем таблицу project_carts
    console.log('\n1️⃣ Проверка таблицы project_carts...');
    const { data: testCart, error: cartError } = await supabase
      .from('project_carts')
      .select('id')
      .limit(1);
    
    if (cartError) {
      console.log('❌ Таблица project_carts не найдена:', cartError.message);
      console.log('   Создайте таблицу через SQL файл');
      return;
    }
    console.log('✅ Таблица project_carts существует');
    
    // 2. Получаем тестового пользователя
    console.log('\n2️⃣ Получение тестового пользователя...');
    // Используем реальный ID из БД
    const testUserId = '86cc190d-0c80-463b-b0df-39a25b22365f';
    console.log('✅ Используем тестовый user_id:', testUserId);
    
    // 3. Создаем тестовую корзину
    console.log('\n3️⃣ Создание тестовой корзины...');
    const testCartData = {
      user_id: testUserId,
      supplier_id: '655833fa-395e-4785-bd9a-894efef4db24',
      supplier_type: 'verified',
      supplier_name: 'ТехноКомплект',
      supplier_company_name: 'ТехноКомплект ООО',
      supplier_data: {
        category: 'Электроника',
        country: 'Россия',
        city: 'Москва',
        payment_methods: ['bank-transfer', 'p2p'],
        bank_requisites: {
          bankName: 'Сбербанк',
          accountNumber: '40702810123456789012',
          swift: 'SABRRUMM',
          bic: '044525225',
          inn: '7707123456',
          kpp: '770701001',
          recipientName: 'ООО ТехноКомплект'
        }
      },
      cart_items: {
        items: [
          {
            id: 'test-item-1',
            product_name: 'IP-камера Hikvision DS-2CD2143G0-IS',
            supplier_name: 'ТехноКомплект ООО',
            price: 150.00,
            quantity: 2,
            total_price: 300.00,
            currency: 'USD',
            sku: 'DS-2CD2143G0-IS'
          },
          {
            id: 'test-item-2',
            product_name: 'Коммутатор Cisco Catalyst 2960-X',
            supplier_name: 'ТехноКомплект ООО',
            price: 1200.00,
            quantity: 1,
            total_price: 1200.00,
            currency: 'USD',
            sku: 'WS-C2960X-24PS-L'
          }
        ]
      },
      items_count: 3,
      total_amount: 1500.00,
      currency: 'USD'
    };
    
    const { data: savedCart, error: saveError } = await supabase
      .from('project_carts')
      .insert(testCartData)
      .select()
      .single();
    
    if (saveError) {
      console.log('❌ Ошибка создания корзины:', saveError.message);
      return;
    }
    console.log('✅ Корзина создана с ID:', savedCart.id);
    
    // 4. Проверяем загрузку корзины
    console.log('\n4️⃣ Проверка загрузки корзины...');
    const { data: loadedCart, error: loadError } = await supabase
      .from('project_carts')
      .select('*')
      .eq('id', savedCart.id)
      .single();
    
    if (loadError) {
      console.log('❌ Ошибка загрузки корзины:', loadError.message);
      return;
    }
    
    console.log('✅ Корзина загружена успешно');
    console.log('   - Товаров:', loadedCart.cart_items?.items?.length);
    console.log('   - Сумма:', loadedCart.total_amount);
    console.log('   - Поставщик:', loadedCart.supplier_company_name);
    
    // 5. Проверяем данные для автозаполнения
    console.log('\n5️⃣ Данные для автозаполнения:');
    console.log('\n📦 ШАГ 2 - Товары:');
    loadedCart.cart_items?.items?.forEach((item, idx) => {
      console.log(`   ${idx + 1}. ${item.product_name} - ${item.quantity} шт × $${item.price}`);
    });
    
    console.log('\n💳 ШАГ 4 - Способы оплаты:');
    const paymentMethods = loadedCart.supplier_data?.payment_methods || [];
    paymentMethods.forEach(method => {
      console.log(`   - ${method}`);
    });
    
    console.log('\n🏦 ШАГ 5 - Реквизиты:');
    const requisites = loadedCart.supplier_data?.bank_requisites || {};
    Object.entries(requisites).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // 6. URL для перехода
    console.log('\n6️⃣ URL для тестирования:');
    console.log(`\n🔗 http://localhost:3000/dashboard/create-project?from_cart=true&cart_id=${savedCart.id}\n`);
    
    console.log('✅ Тест завершен успешно!');
    console.log('\nЧто произойдет при переходе по ссылке:');
    console.log('1. Откроется страница создания проекта');
    console.log('2. Шаг 2 автоматически заполнится товарами');
    console.log('3. Шаг 4 предложит способ оплаты "bank-transfer"');
    console.log('4. Шаг 5 заполнится реквизитами Сбербанка');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
  }
}

testCartFlow();