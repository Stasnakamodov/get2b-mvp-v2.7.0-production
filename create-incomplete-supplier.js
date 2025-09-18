const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createIncompleteSupplier() {
  console.log('🤔 Создаем поставщика с НЕПОЛНЫМИ реквизитами для тестирования...');

  // Поставщик ТОЛЬКО с банковскими реквизитами (НЕТ crypto и p2p)
  const incompleteSupplier = {
    name: 'МинималПоставка',
    company_name: 'МинималПоставка ООО',
    category: 'Электроника',
    country: 'Россия',
    city: 'Тула',
    description: 'Поставщик с ограниченными способами оплаты. Только банковские переводы.',
    contact_email: 'info@minimal.ru',
    contact_phone: '+7 (487) 123-45-67',
    website: 'https://minimal.ru',
    rating: 4.2,
    reviews_count: 34,
    
    // ТОЛЬКО банковские переводы (НЕТ crypto и p2p)
    payment_methods: ['bank_transfer'], // Только один метод!
    
    bank_accounts: [
      {
        bank_name: 'Сбербанк',
        account_number: '40702810100000111111',
        bic: '044525225',
        correspondent_account: '30101810400000000225'
      }
    ],
    
    // НЕТ crypto и p2p данных
    crypto_wallets: null,
    p2p_cards: null,
    
    is_active: true
  };

  const { data: minimalSupp, error: minimalError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([incompleteSupplier])
    .select()
    .single();

  if (minimalError) {
    console.error('❌ Ошибка создания неполного поставщика:', minimalError);
    return;
  }

  console.log('✅ МинималПоставка создан (только банковские переводы)');

  // Добавим товары
  const minimalProducts = [
    {
      supplier_id: minimalSupp.id,
      name: 'Простая мышка USB',
      description: 'Обычная компьютерная мышь с USB подключением. Базовая модель.',
      price: '450.00',
      currency: 'RUB',
      min_order: 'от 50 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop"]',
      sku: 'MOUSE-USB-BASIC',
      category: 'Электроника',
      is_active: true
    },
    {
      supplier_id: minimalSupp.id,
      name: 'Клавиатура проводная',
      description: 'Стандартная клавиатура с русской раскладкой. PS/2 разъем.',
      price: '890.00',
      currency: 'RUB',
      min_order: 'от 20 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=300&fit=crop"]',
      sku: 'KEYB-PS2-RU',
      category: 'Электроника',
      is_active: true
    }
  ];

  const { error: minimalProdError } = await supabase
    .from('catalog_verified_products')
    .insert(minimalProducts)
    .select();

  if (minimalProdError) {
    console.error('❌ Ошибка товаров минимального поставщика:', minimalProdError);
  } else {
    console.log(`✅ Добавлено ${minimalProducts.length} товаров для МинималПоставка`);
  }

  // Создадим также поставщика ТОЛЬКО с P2P (без банков и крипты)
  console.log('\n💳 Создаем поставщика ТОЛЬКО с P2P картами...');
  
  const p2pOnlySupplier = {
    name: 'P2P-Торг',
    company_name: 'P2P-Торг ИП',
    category: 'Электроника',
    country: 'Россия',
    city: 'Воронеж',
    description: 'Небольшой поставщик, работающий только через переводы по карте.',
    contact_email: 'cards@p2ptorg.ru',
    contact_phone: '+7 (473) 987-65-43',
    website: 'https://p2ptorg.ru',
    rating: 4.0,
    reviews_count: 18,
    
    // ТОЛЬКО P2P переводы
    payment_methods: ['p2p'],
    
    // НЕТ банковских счетов и криптокошельков
    bank_accounts: null,
    crypto_wallets: null,
    
    p2p_cards: [
      {
        bank: 'Сбербанк',
        card_number: '4276 **** **** 0987',
        holder_name: 'SERGEY P2P'
      },
      {
        bank: 'Тинькофф',
        card_number: '5213 **** **** 6543',
        holder_name: 'SERGEY P2P'
      }
    ],
    
    is_active: true
  };

  const { data: p2pSupp, error: p2pError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([p2pOnlySupplier])
    .select()
    .single();

  if (p2pError) {
    console.error('❌ Ошибка создания P2P поставщика:', p2pError);
  } else {
    console.log('✅ P2P-Торг создан (только P2P карты)');

    // Товары для P2P поставщика
    const p2pProducts = [
      {
        supplier_id: p2pSupp.id,
        name: 'Наушники бюджетные',
        description: 'Простые наушники-вкладыши. Подходят для повседневного использования.',
        price: '320.00',
        currency: 'RUB',
        min_order: 'от 100 шт',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"]',
        sku: 'HEADPH-BUDGET',
        category: 'Электроника',
        is_active: true
      }
    ];

    const { error: p2pProdError } = await supabase
      .from('catalog_verified_products')
      .insert(p2pProducts)
      .select();

    if (p2pProdError) {
      console.error('❌ Ошибка товаров P2P поставщика:', p2pProdError);
    } else {
      console.log(`✅ Добавлен ${p2pProducts.length} товар для P2P-Торг`);
    }
  }

  console.log('\n📊 Создано для тестирования неполных реквизитов:');
  console.log('🏦 МинималПоставка: ТОЛЬКО банковские переводы (НЕТ crypto, НЕТ p2p)');
  console.log('💳 P2P-Торг: ТОЛЬКО P2P карты (НЕТ банков, НЕТ crypto)');
  console.log('\n🎯 Теперь в Step4 будет показано:');
  console.log('• МинималПоставка: ✅ Банковский перевод, 🔧 Криптовалюта, 🔧 P2P');
  console.log('• P2P-Торг: 🔧 Банковский перевод, 🔧 Криптовалюта, ✅ P2P');
}

createIncompleteSupplier().catch(console.error);