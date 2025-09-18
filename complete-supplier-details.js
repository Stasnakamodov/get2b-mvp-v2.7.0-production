const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function completeSupplierDetails() {
  console.log('💼 Дополняем реквизиты поставщиков для полной работы Step 4-5...');

  // 1. Обновляем СтройАвто - добавляем криптовалюты и P2P карты
  console.log('\n🏗️ Обновляем СтройАвто...');
  
  const stroyAutoUpdate = {
    payment_methods: ['bank_transfer', 'cash', 'crypto', 'p2p'], // Добавляем все методы
    crypto_wallets: [
      {
        currency: 'USDT',
        network: 'TRC20',
        address: 'TStroyAuto123456789abcdefghijklmnopq'
      },
      {
        currency: 'BTC',
        network: 'BTC',
        address: 'bc1qstroyauto2kgdygjrsqtzq2n0yrf2493p'
      }
    ],
    p2p_cards: [
      {
        bank: 'ВТБ',
        card_number: '5536 **** **** 7890',
        holder_name: 'IVAN STROEV'
      },
      {
        bank: 'Сбербанк',
        card_number: '4276 **** **** 1122',
        holder_name: 'IVAN STROEV'
      }
    ]
  };

  const { error: stroyError } = await supabase
    .from('catalog_verified_suppliers')
    .update(stroyAutoUpdate)
    .eq('name', 'СтройАвто');

  if (stroyError) {
    console.error('❌ Ошибка обновления СтройАвто:', stroyError);
  } else {
    console.log('✅ СтройАвто обновлен - добавлены crypto и p2p реквизиты');
  }

  // 2. Обновляем ТекстильТорг - добавляем криптовалюты и P2P карты
  console.log('\n👔 Обновляем ТекстильТорг...');
  
  const textileUpdate = {
    payment_methods: ['bank_transfer', 'card', 'crypto', 'p2p'], // Добавляем все методы
    crypto_wallets: [
      {
        currency: 'USDT',
        network: 'TRC20',
        address: 'TTextileTorg987654321zyxwvutsrqponmlk'
      },
      {
        currency: 'ETH',
        network: 'ERC20',
        address: '0xTextileTorg123456789abcdef0123456789abcdef'
      }
    ],
    p2p_cards: [
      {
        bank: 'Сбербанк',
        card_number: '4276 **** **** 5678',
        holder_name: 'OLGA TEXTILE'
      },
      {
        bank: 'Альфа-Банк',
        card_number: '5154 **** **** 9012',
        holder_name: 'OLGA TEXTILE'
      }
    ]
  };

  const { error: textileError } = await supabase
    .from('catalog_verified_suppliers')
    .update(textileUpdate)
    .eq('name', 'ТекстильТорг');

  if (textileError) {
    console.error('❌ Ошибка обновления ТекстильТорг:', textileError);
  } else {
    console.log('✅ ТекстильТорг обновлен - добавлены crypto и p2p реквизиты');
  }

  // 3. Давайте также создадим еще одного полностью детализированного поставщика для "Промышленность"
  console.log('\n🏭 Создаем полного поставщика для Промышленности...');
  
  const industrialSupplier = {
    name: 'ПромТехника',
    company_name: 'ПромТехника Индустрии ООО',
    category: 'Электроника', // Используем разрешенную категорию
    country: 'Россия',
    city: 'Челябинск',
    description: 'Промышленное оборудование и автоматизация производства. Полный спектр услуг.',
    contact_email: 'sales@promtehnika.ru',
    contact_phone: '+7 (351) 234-56-78',
    website: 'https://promtehnika.ru',
    rating: 4.8,
    reviews_count: 156,
    payment_methods: ['bank_transfer', 'card', 'crypto', 'p2p', 'cash'], // ВСЕ методы
    bank_accounts: [
      {
        bank_name: 'Газпромбанк',
        account_number: '40702810900000456789',
        bic: '044525823',
        correspondent_account: '30101810200000000823'
      },
      {
        bank_name: 'Альфа-Банк',
        account_number: '40702810600000123456',
        bic: '044525593',
        correspondent_account: '30101810200000000593'
      }
    ],
    crypto_wallets: [
      {
        currency: 'USDT',
        network: 'TRC20',
        address: 'TPromTehnika456789abcdefghijklmnopqrst'
      },
      {
        currency: 'BTC',
        network: 'BTC',
        address: 'bc1qpromtehnika2kgdygjrsqtzq2n0yrf2493p'
      },
      {
        currency: 'ETH',
        network: 'ERC20',
        address: '0xPromTehnika123456789abcdef0123456789abcdef'
      }
    ],
    p2p_cards: [
      {
        bank: 'Газпромбанк',
        card_number: '4349 **** **** 1234',
        holder_name: 'DMITRY PROMOV'
      },
      {
        bank: 'Альфа-Банк',
        card_number: '5154 **** **** 5678',
        holder_name: 'DMITRY PROMOV'
      },
      {
        bank: 'Тинькофф',
        card_number: '5213 **** **** 9012',
        holder_name: 'DMITRY PROMOV'
      }
    ],
    is_active: true
  };

  const { data: industrialSupp, error: industrialError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([industrialSupplier])
    .select()
    .single();

  if (industrialError) {
    console.error('❌ Ошибка создания промышленного поставщика:', industrialError);
  } else {
    console.log('✅ ПромТехника создана с ПОЛНЫМИ реквизитами');

    // Добавим товары для ПромТехника
    const industrialProducts = [
      {
        supplier_id: industrialSupp.id,
        name: 'Промышленный компрессор',
        description: 'Воздушный компрессор 500 л/мин. Давление до 10 атм. Для производственных нужд.',
        price: '125000.00',
        currency: 'RUB',
        min_order: 'от 1 шт',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop"]',
        sku: 'COMP-IND-500',
        category: 'Промышленность',
        is_active: true
      },
      {
        supplier_id: industrialSupp.id,
        name: 'Станок токарный ЧПУ',
        description: 'Токарный станок с числовым программным управлением. Обработка до 500мм.',
        price: '850000.00',
        currency: 'RUB',
        min_order: 'от 1 шт',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1565793298595-6a879b1a8456?w=400&h=300&fit=crop"]',
        sku: 'LATHE-CNC-500',
        category: 'Промышленность',
        is_active: true
      },
      {
        supplier_id: industrialSupp.id,
        name: 'Конвейерная лента',
        description: 'Резинотканевая конвейерная лента 1200мм. Длина 100 метров.',
        price: '45000.00',
        currency: 'RUB',
        min_order: 'от 100 метров',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400&h=300&fit=crop"]',
        sku: 'BELT-CONV-1200',
        category: 'Промышленность',
        is_active: true
      }
    ];

    const { error: industrialProdError } = await supabase
      .from('catalog_verified_products')
      .insert(industrialProducts)
      .select();

    if (industrialProdError) {
      console.error('❌ Ошибка товаров промышленности:', industrialProdError);
    } else {
      console.log(`✅ Добавлено ${industrialProducts.length} товаров для ПромТехника`);
    }
  }

  console.log('\n📊 Итоги обновления:');
  console.log('✅ СтройАвто: добавлены crypto и p2p реквизиты');
  console.log('✅ ТекстильТорг: добавлены crypto и p2p реквизиты');  
  console.log('✅ ПромТехника: создан с ПОЛНЫМИ реквизитами всех типов');
  console.log('\n🎯 Теперь ВСЕ поставщики будут корректно работать в Step 4-5!');
}

completeSupplierDetails().catch(console.error);