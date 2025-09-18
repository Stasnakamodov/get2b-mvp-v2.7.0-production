const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAllCategorySuppliers() {
  console.log('🚀 Создаем натуральных поставщиков из всех категорий с полными данными...\n');

  // ========== ПРОДУКТЫ ПИТАНИЯ ==========
  console.log('🍎 КАТЕГОРИЯ: Продукты питания');
  
  const foodSupplier1 = {
    name: 'ФермерПродукт',
    company_name: 'ФермерПродукт ООО',
    category: 'Продукты питания',
    country: 'Россия',
    city: 'Краснодар',
    description: 'Экологически чистые фермерские продукты. Прямые поставки от производителей.',
    contact_email: 'sales@fermer-product.ru',
    contact_phone: '+7 (861) 234-56-78',
    website: 'https://fermer-product.ru',
    logo_url: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?w=200&h=200&fit=crop',
    rating: 4.7,
    reviews_count: 124,
    payment_methods: ['bank_transfer', 'cash', 'p2p', 'crypto'],
    bank_accounts: [{
      bank_name: 'Сбербанк',
      account_number: '40702810100000234567',
      bic: '040349602',
      correspondent_account: '30101810100000000602'
    }],
    p2p_cards: [{
      bank: 'Сбербанк',
      card_number: '4276 **** **** 3456',
      holder_name: 'IVAN FERMEROV'
    }],
    crypto_wallets: [{
      currency: 'USDT',
      network: 'TRC20',
      address: 'TFermerProduct123456789abcdefghijklmno'
    }],
    is_active: true
  };

  const { data: food1, error: foodErr1 } = await supabase
    .from('catalog_verified_suppliers')
    .insert([foodSupplier1])
    .select()
    .single();

  if (foodErr1) {
    console.error('❌ Ошибка создания ФермерПродукт:', foodErr1);
  } else {
    console.log('✅ ФермерПродукт создан');
    
    const foodProducts1 = [
      {
        supplier_id: food1.id,
        name: 'Овощной набор сезонный',
        description: 'Набор свежих овощей: помидоры, огурцы, перец, зелень. Вес 5 кг.',
        price: '850.00',
        currency: 'RUB',
        min_order: 'от 3 наборов',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop"]',
        sku: 'VEGET-SET-5KG',
        category: 'Продукты питания',
        is_active: true
      },
      {
        supplier_id: food1.id,
        name: 'Мёд натуральный цветочный',
        description: 'Мёд из экологически чистых районов. Банка 1 литр.',
        price: '650.00',
        currency: 'RUB',
        min_order: 'от 5 банок',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1587049352846-4a222e784390?w=400&h=300&fit=crop"]',
        sku: 'HONEY-FLOWER-1L',
        category: 'Продукты питания',
        is_active: true
      },
      {
        supplier_id: food1.id,
        name: 'Яйца куриные домашние',
        description: 'Домашние куриные яйца от фермерских хозяйств. Лоток 30 штук.',
        price: '320.00',
        currency: 'RUB',
        min_order: 'от 10 лотков',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop"]',
        sku: 'EGGS-HOME-30',
        category: 'Продукты питания',
        is_active: true
      }
    ];

    await supabase.from('catalog_verified_products').insert(foodProducts1);
    console.log(`  📦 Добавлено ${foodProducts1.length} товаров`);
  }

  // ========== СТРОИТЕЛЬСТВО ==========
  console.log('\n🏗️ КАТЕГОРИЯ: Строительство');
  
  const constructionSupplier1 = {
    name: 'СтройМатериалПлюс',
    company_name: 'СтройМатериалПлюс ООО',
    category: 'Строительство',
    country: 'Россия',
    city: 'Москва',
    description: 'Полный спектр строительных материалов. Цемент, кирпич, арматура, инструменты.',
    contact_email: 'info@stroymaterial-plus.ru',
    contact_phone: '+7 (495) 123-45-67',
    website: 'https://stroymaterial-plus.ru',
    logo_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=200&fit=crop',
    rating: 4.5,
    reviews_count: 89,
    payment_methods: ['bank_transfer', 'card', 'crypto'],
    bank_accounts: [{
      bank_name: 'ВТБ',
      account_number: '40702810200000345678',
      bic: '044525187',
      correspondent_account: '30101810700000000187'
    }],
    crypto_wallets: [{
      currency: 'BTC',
      network: 'BTC',
      address: 'bc1qstroymaterial2kgdygjrsqtzq2n0yrf2493p'
    }],
    p2p_cards: null,
    is_active: true
  };

  const { data: constr1, error: constrErr1 } = await supabase
    .from('catalog_verified_suppliers')
    .insert([constructionSupplier1])
    .select()
    .single();

  if (constrErr1) {
    console.error('❌ Ошибка создания СтройМатериалПлюс:', constrErr1);
  } else {
    console.log('✅ СтройМатериалПлюс создан');
    
    const constrProducts1 = [
      {
        supplier_id: constr1.id,
        name: 'Цемент М500 Д0',
        description: 'Портландцемент марки М500 без добавок. Мешок 50 кг.',
        price: '450.00',
        currency: 'RUB',
        min_order: 'от 20 мешков',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=400&h=300&fit=crop"]',
        sku: 'CEMENT-M500-50',
        category: 'Строительство',
        is_active: true
      },
      {
        supplier_id: constr1.id,
        name: 'Кирпич красный полнотелый',
        description: 'Кирпич керамический полнотелый М150. Поддон 480 штук.',
        price: '12500.00',
        currency: 'RUB',
        min_order: 'от 1 поддона',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1564704799211-4b8b81116e3e?w=400&h=300&fit=crop"]',
        sku: 'BRICK-RED-M150',
        category: 'Строительство',
        is_active: true
      },
      {
        supplier_id: constr1.id,
        name: 'Арматура А3 12мм',
        description: 'Арматура рифленая класса А3 диаметром 12мм. Прут 11.7м.',
        price: '850.00',
        currency: 'RUB',
        min_order: 'от 1 тонны',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop"]',
        sku: 'REBAR-A3-12MM',
        category: 'Строительство',
        is_active: true
      },
      {
        supplier_id: constr1.id,
        name: 'Песок строительный',
        description: 'Песок речной мытый фракция 0-5мм. Цена за м³.',
        price: '1200.00',
        currency: 'RUB',
        min_order: 'от 5 м³',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=400&h=300&fit=crop"]',
        sku: 'SAND-RIVER-05',
        category: 'Строительство',
        is_active: true
      }
    ];

    await supabase.from('catalog_verified_products').insert(constrProducts1);
    console.log(`  📦 Добавлено ${constrProducts1.length} товаров`);
  }

  // ========== ТЕКСТИЛЬ И ОДЕЖДА ==========
  console.log('\n👕 КАТЕГОРИЯ: Текстиль и одежда');
  
  const textileSupplier1 = {
    name: 'ТекстильОпт',
    company_name: 'ТекстильОпт ИП',
    category: 'Текстиль и одежда',
    country: 'Россия',
    city: 'Иваново',
    description: 'Оптовые поставки тканей и готовой одежды. Собственное производство.',
    contact_email: 'opt@textile-opt.ru',
    contact_phone: '+7 (4932) 567-89-01',
    website: 'https://textile-opt.ru',
    logo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
    rating: 4.6,
    reviews_count: 156,
    payment_methods: ['bank_transfer', 'p2p'],
    bank_accounts: [{
      bank_name: 'Альфа-Банк',
      account_number: '40702810600000456789',
      bic: '044525593',
      correspondent_account: '30101810200000000593'
    }],
    p2p_cards: [{
      bank: 'Тинькофф',
      card_number: '5536 **** **** 4567',
      holder_name: 'MARIA TEXTILOVA'
    }],
    crypto_wallets: null,
    is_active: true
  };

  const { data: textile1, error: textileErr1 } = await supabase
    .from('catalog_verified_suppliers')
    .insert([textileSupplier1])
    .select()
    .single();

  if (textileErr1) {
    console.error('❌ Ошибка создания ТекстильОпт:', textileErr1);
  } else {
    console.log('✅ ТекстильОпт создан');
    
    const textileProducts1 = [
      {
        supplier_id: textile1.id,
        name: 'Ткань хлопок 100%',
        description: 'Хлопковая ткань плотностью 180 г/м². Ширина 150см. Цена за метр.',
        price: '320.00',
        currency: 'RUB',
        min_order: 'от 50 метров',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=400&h=300&fit=crop"]',
        sku: 'COTTON-100-180',
        category: 'Текстиль и одежда',
        is_active: true
      },
      {
        supplier_id: textile1.id,
        name: 'Футболка базовая унисекс',
        description: 'Однотонная футболка из хлопка. Размеры S-XXL. Разные цвета.',
        price: '450.00',
        currency: 'RUB',
        min_order: 'от 20 штук',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop"]',
        sku: 'TSHIRT-BASIC-UNI',
        category: 'Текстиль и одежда',
        is_active: true
      },
      {
        supplier_id: textile1.id,
        name: 'Постельное белье 2-спальное',
        description: 'Комплект постельного белья: пододеяльник, простыня, 2 наволочки.',
        price: '2800.00',
        currency: 'RUB',
        min_order: 'от 5 комплектов',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=300&fit=crop"]',
        sku: 'BEDDING-2BED-SET',
        category: 'Текстиль и одежда',
        is_active: true
      }
    ];

    await supabase.from('catalog_verified_products').insert(textileProducts1);
    console.log(`  📦 Добавлено ${textileProducts1.length} товаров`);
  }

  // ========== ПРОМЫШЛЕННОСТЬ ==========
  console.log('\n🏭 КАТЕГОРИЯ: Промышленность');
  
  const industrySupplier1 = {
    name: 'ПромОборудование',
    company_name: 'ПромОборудование ООО',
    category: 'Промышленность',
    country: 'Россия',
    city: 'Екатеринбург',
    description: 'Промышленное оборудование и станки. Поставка, монтаж, обслуживание.',
    contact_email: 'info@prom-oborud.ru',
    contact_phone: '+7 (343) 234-56-78',
    website: 'https://prom-oborud.ru',
    logo_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop',
    rating: 4.4,
    reviews_count: 67,
    payment_methods: ['bank_transfer', 'crypto'],
    bank_accounts: [{
      bank_name: 'Уралсиб',
      account_number: '40702810800000567890',
      bic: '046577964',
      correspondent_account: '30101810600000000964'
    }],
    crypto_wallets: [{
      currency: 'USDT',
      network: 'TRC20',
      address: 'TPromOborud123456789abcdefghijklmnopqr'
    }],
    p2p_cards: null,
    is_active: true
  };

  const { data: industry1, error: industryErr1 } = await supabase
    .from('catalog_verified_suppliers')
    .insert([industrySupplier1])
    .select()
    .single();

  if (industryErr1) {
    console.error('❌ Ошибка создания ПромОборудование:', industryErr1);
  } else {
    console.log('✅ ПромОборудование создан');
    
    const industryProducts1 = [
      {
        supplier_id: industry1.id,
        name: 'Сварочный аппарат инверторный',
        description: 'Инверторный сварочный аппарат 250А. Для профессионального использования.',
        price: '18500.00',
        currency: 'RUB',
        min_order: 'от 1 штуки',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=300&fit=crop"]',
        sku: 'WELDER-INV-250A',
        category: 'Промышленность',
        is_active: true
      },
      {
        supplier_id: industry1.id,
        name: 'Генератор дизельный 10кВт',
        description: 'Дизельный генератор мощностью 10кВт. Автозапуск, шумоизоляция.',
        price: '185000.00',
        currency: 'RUB',
        min_order: 'от 1 штуки',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1566932769119-7a1fb6d7ce23?w=400&h=300&fit=crop"]',
        sku: 'GENERATOR-D10KW',
        category: 'Промышленность',
        is_active: true
      }
    ];

    await supabase.from('catalog_verified_products').insert(industryProducts1);
    console.log(`  📦 Добавлено ${industryProducts1.length} товаров`);
  }

  // ========== ДОМ И БЫТ ==========
  console.log('\n🏠 КАТЕГОРИЯ: Дом и быт');
  
  const homeSupplier1 = {
    name: 'ДомашнийУют',
    company_name: 'ДомашнийУют ИП',
    category: 'Дом и быт',
    country: 'Россия',
    city: 'Санкт-Петербург',
    description: 'Товары для дома и уюта. Посуда, текстиль, декор, мебель.',
    contact_email: 'order@dom-uyut.ru',
    contact_phone: '+7 (812) 345-67-89',
    website: 'https://dom-uyut.ru',
    logo_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    rating: 4.8,
    reviews_count: 203,
    payment_methods: ['bank_transfer', 'card', 'p2p'],
    bank_accounts: [{
      bank_name: 'Райффайзенбанк',
      account_number: '40702810300000678901',
      bic: '044030861',
      correspondent_account: '30101810100000000861'
    }],
    p2p_cards: [{
      bank: 'Сбербанк',
      card_number: '4276 **** **** 8901',
      holder_name: 'ELENA DOMOVA'
    }],
    crypto_wallets: null,
    is_active: true
  };

  const { data: home1, error: homeErr1 } = await supabase
    .from('catalog_verified_suppliers')
    .insert([homeSupplier1])
    .select()
    .single();

  if (homeErr1) {
    console.error('❌ Ошибка создания ДомашнийУют:', homeErr1);
  } else {
    console.log('✅ ДомашнийУют создан');
    
    const homeProducts1 = [
      {
        supplier_id: home1.id,
        name: 'Набор посуды 24 предмета',
        description: 'Столовый сервиз на 6 персон. Фарфор, классический дизайн.',
        price: '8500.00',
        currency: 'RUB',
        min_order: 'от 1 набора',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1550583724-853781e3abab?w=400&h=300&fit=crop"]',
        sku: 'DISHES-SET-24PC',
        category: 'Дом и быт',
        is_active: true
      },
      {
        supplier_id: home1.id,
        name: 'Плед шерстяной 150x200',
        description: 'Теплый плед из натуральной шерсти. Размер 150x200 см.',
        price: '3200.00',
        currency: 'RUB',
        min_order: 'от 3 штук',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1573912886716-99d620f5a562?w=400&h=300&fit=crop"]',
        sku: 'BLANKET-WOOL-150',
        category: 'Дом и быт',
        is_active: true
      }
    ];

    await supabase.from('catalog_verified_products').insert(homeProducts1);
    console.log(`  📦 Добавлено ${homeProducts1.length} товаров`);
  }

  // ========== ЗДОРОВЬЕ И МЕДИЦИНА ==========
  console.log('\n⚕️ КАТЕГОРИЯ: Здоровье и медицина');
  
  const healthSupplier1 = {
    name: 'МедТехника',
    company_name: 'МедТехника ООО',
    category: 'Здоровье и медицина',
    country: 'Россия',
    city: 'Новосибирск',
    description: 'Медицинское оборудование и расходные материалы для клиник.',
    contact_email: 'sales@medtehnika.ru',
    contact_phone: '+7 (383) 456-78-90',
    website: 'https://medtehnika.ru',
    logo_url: 'https://images.unsplash.com/photo-1559328101-7e588fc74610?w=200&h=200&fit=crop',
    rating: 4.9,
    reviews_count: 98,
    payment_methods: ['bank_transfer', 'crypto'],
    bank_accounts: [{
      bank_name: 'Промсвязьбанк',
      account_number: '40702810400000789012',
      bic: '044525555',
      correspondent_account: '30101810400000000555'
    }],
    crypto_wallets: [{
      currency: 'ETH',
      network: 'ERC20',
      address: '0xMedTehnika123456789abcdef0123456789abcd'
    }],
    p2p_cards: null,
    is_active: true
  };

  const { data: health1, error: healthErr1 } = await supabase
    .from('catalog_verified_suppliers')
    .insert([healthSupplier1])
    .select()
    .single();

  if (healthErr1) {
    console.error('❌ Ошибка создания МедТехника:', healthErr1);
  } else {
    console.log('✅ МедТехника создан');
    
    const healthProducts1 = [
      {
        supplier_id: health1.id,
        name: 'Тонометр автоматический',
        description: 'Автоматический тонометр с манжетой на плечо. Память на 90 измерений.',
        price: '3800.00',
        currency: 'RUB',
        min_order: 'от 5 штук',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop"]',
        sku: 'TONOMETER-AUTO-90',
        category: 'Здоровье и медицина',
        is_active: true
      },
      {
        supplier_id: health1.id,
        name: 'Маски медицинские 3-слойные',
        description: 'Медицинские маски трехслойные с фильтром. Упаковка 50 штук.',
        price: '450.00',
        currency: 'RUB',
        min_order: 'от 10 упаковок',
        in_stock: true,
        images: '["https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=400&h=300&fit=crop"]',
        sku: 'MASK-MED-3L-50',
        category: 'Здоровье и медицина',
        is_active: true
      }
    ];

    await supabase.from('catalog_verified_products').insert(healthProducts1);
    console.log(`  📦 Добавлено ${healthProducts1.length} товаров`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ СОЗДАНИЕ ЗАВЕРШЕНО УСПЕШНО!');
  console.log('='.repeat(60));
  console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:');
  console.log('🍎 Продукты питания: 1 поставщик, 3 товара');
  console.log('🏗️ Строительство: 1 поставщик, 4 товара');
  console.log('👕 Текстиль и одежда: 1 поставщик, 3 товара');
  console.log('🏭 Промышленность: 1 поставщик, 2 товара');
  console.log('🏠 Дом и быт: 1 поставщик, 2 товара');
  console.log('⚕️ Здоровье и медицина: 1 поставщик, 2 товара');
  console.log('\n🎯 Все поставщики имеют:');
  console.log('  ✅ Логотипы');
  console.log('  ✅ Полные реквизиты для автозаполнения');
  console.log('  ✅ Товары с изображениями');
  console.log('  ✅ Все данные для Steps 4-5');
  console.log('\n🚀 Теперь модальный каталог покажет товары во всех категориях!');
}

createAllCategorySuppliers().catch(console.error);