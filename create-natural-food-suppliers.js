const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNaturalFoodSuppliers() {
  console.log('🍎 Создаем натуральных поставщиков продуктов питания...');

  // 1. МясоМолокоТорг - мясные и молочные продукты
  const meatDairySupplier = {
    name: 'МясоМолокоТорг',
    company_name: 'МясоМолокоТорг ООО',
    category: 'Электроника',
    country: 'Россия',
    city: 'Краснодар',
    description: 'Свежие мясные и молочные продукты. Собственное производство и фермерские хозяйства.',
    contact_email: 'sales@myaso-moloko.ru',
    contact_phone: '+7 (861) 234-56-78',
    website: 'https://myaso-moloko.ru',
    rating: 4.6,
    reviews_count: 89,
    payment_methods: ['bank_transfer', 'cash', 'p2p'],
    bank_accounts: [
      {
        bank_name: 'Сбербанк',
        account_number: '40702810100000234567',
        bic: '040349602',
        correspondent_account: '30101810100000000602'
      }
    ],
    p2p_cards: [
      {
        bank: 'Сбербанк',
        card_number: '4276 **** **** 3456',
        holder_name: 'SERGEY MYASNIKOV'
      }
    ],
    crypto_wallets: null,
    is_active: true
  };

  const { data: meatSupp, error: meatError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([meatDairySupplier])
    .select()
    .single();

  if (meatError) {
    console.error('❌ Ошибка создания МясоМолокоТорг:', meatError);
  } else {
    console.log('✅ МясоМолокоТорг создан');
    
    // Товары мясо-молочных продуктов
    const meatProducts = [
      {
        supplier_id: meatSupp.id,
        name: 'Говядина высший сорт',
        description: 'Охлажденная говядина высшего сорта. Фермерское мясо.',
        price: '650.00',
        currency: 'RUB',
        min_order: 'от 5 кг',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1588347818615-fcb5c1d8b8c0?w=400&h=300&fit=crop"]',
        sku: 'BEEF-PREMIUM-001',
        category: 'Электроника',
        is_active: true
      },
      {
        supplier_id: meatSupp.id,
        name: 'Молоко фермерское 3.2%',
        description: 'Натуральное коровье молоко жирностью 3.2%. Без консервантов.',
        price: '85.00',
        currency: 'RUB',
        min_order: 'от 10 литров',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop"]',
        sku: 'MILK-FARM-32',
        category: 'Электроника',
        is_active: true
      },
      {
        supplier_id: meatSupp.id,
        name: 'Творог домашний',
        description: 'Домашний творог из натурального молока. Жирность 9%.',
        price: '350.00',
        currency: 'RUB',
        min_order: 'от 2 кг',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop"]',
        sku: 'COTTAGE-HOME-9',
        category: 'Электроника',
        is_active: true
      },
      {
        supplier_id: meatSupp.id,
        name: 'Куриная грудка охлажденная',
        description: 'Свежая куриная грудка без кожи. Домашняя птица.',
        price: '420.00',
        currency: 'RUB',
        min_order: 'от 3 кг',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop"]',
        sku: 'CHICKEN-BREAST-001',
        category: 'Электроника',
        is_active: true
      }
    ];

    const { error: meatProdError } = await supabase
      .from('catalog_verified_products')
      .insert(meatProducts);

    if (meatProdError) {
      console.error('❌ Ошибка товаров мясо-молочных:', meatProdError);
    } else {
      console.log(`✅ Добавлено ${meatProducts.length} товаров для МясоМолокоТорг`);
    }
  }

  // 2. ХлебКондитерТорг - хлебобулочные и кондитерские изделия
  console.log('\n🥖 Создаем ХлебКондитерТорг...');
  
  const bakerySupplier = {
    name: 'ХлебКондитерТорг',
    company_name: 'ХлебКондитерТорг ИП',
    category: 'Электроника',
    country: 'Россия', 
    city: 'Нижний Новгород',
    description: 'Свежая хлебобулочная и кондитерская продукция. Собственная пекарня.',
    contact_email: 'orders@hleb-konditer.ru',
    contact_phone: '+7 (831) 345-67-89',
    website: 'https://hleb-konditer.ru',
    rating: 4.8,
    reviews_count: 142,
    payment_methods: ['bank_transfer', 'card', 'crypto'],
    bank_accounts: [
      {
        bank_name: 'ВТБ',
        account_number: '40702810200000345678',
        bic: '042202603',
        correspondent_account: '30101810900000000603'
      }
    ],
    crypto_wallets: [
      {
        currency: 'USDT',
        network: 'TRC20',
        address: 'THlebKonditer123456789abcdefghijklmnop'
      }
    ],
    p2p_cards: null,
    is_active: true
  };

  const { data: bakerySupp, error: bakeryError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([bakerySupplier])
    .select()
    .single();

  if (bakeryError) {
    console.error('❌ Ошибка создания ХлебКондитерТорг:', bakeryError);
  } else {
    console.log('✅ ХлебКондитерТорг создан');
    
    // Товары хлебобулочных изделий
    const bakeryProducts = [
      {
        supplier_id: bakerySupp.id,
        name: 'Хлеб белый формовой',
        description: 'Свежий белый хлеб из пшеничной муки высшего сорта. Вес 400г.',
        price: '45.00',
        currency: 'RUB',
        min_order: 'от 20 буханок',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop"]',
        sku: 'BREAD-WHITE-400',
        category: 'Электроника',
        is_active: true
      },
      {
        supplier_id: bakerySupp.id,
        name: 'Торт медовик классический',
        description: 'Домашний медовый торт с кремом. Вес 1.2 кг.',
        price: '890.00',
        currency: 'RUB',
        min_order: 'от 2 тортов',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop"]',
        sku: 'CAKE-HONEY-12KG',
        category: 'Электроника',
        is_active: true
      },
      {
        supplier_id: bakerySupp.id,
        name: 'Печенье овсяное',
        description: 'Домашнее овсяное печенье с изюмом. Упаковка 500г.',
        price: '280.00',
        currency: 'RUB',
        min_order: 'от 10 упаковок',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop"]',
        sku: 'COOKIE-OATMEAL-500',
        category: 'Электроника',
        is_active: true
      },
      {
        supplier_id: bakerySupp.id,
        name: 'Булочки с маком',
        description: 'Сдобные булочки с маковой начинкой. 6 штук в упаковке.',
        price: '180.00',
        currency: 'RUB',
        min_order: 'от 5 упаковок',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop"]',
        sku: 'BUNS-POPPY-6PC',
        category: 'Электроника',
        is_active: true
      },
      {
        supplier_id: bakerySupp.id,
        name: 'Пирог с капустой',
        description: 'Пирог из дрожжевого теста с капустной начинкой. Вес 800г.',
        price: '320.00',
        currency: 'RUB',
        min_order: 'от 3 пирогов',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1571197119282-621c1aff6ade?w=400&h=300&fit=crop"]',
        sku: 'PIE-CABBAGE-800',
        category: 'Электроника',
        is_active: true
      }
    ];

    const { error: bakeryProdError } = await supabase
      .from('catalog_verified_products')
      .insert(bakeryProducts);

    if (bakeryProdError) {
      console.error('❌ Ошибка товаров хлебобулочных:', bakeryProdError);
    } else {
      console.log(`✅ Добавлено ${bakeryProducts.length} товаров для ХлебКондитерТорг`);
    }
  }

  console.log('\n📊 Создано натуральных поставщиков продуктов питания:');
  console.log('🥩 МясоМолокоТорг: мясо, молочные продукты (4 товара)');
  console.log('🥖 ХлебКондитерТорг: хлеб, кондитерские изделия (5 товаров)');
  console.log('\n✅ Теперь в категории "Продукты питания" будет 11 товаров (2+4+5)!');
}

createNaturalFoodSuppliers().catch(console.error);