const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNewSuppliers() {
  console.log('🏗️ Создаем НОВЫХ поставщиков из разных категорий...');

  // 1. Создадим поставщика текстиля (используем категорию как у существующих)
  console.log('\n👔 Создаем поставщика текстиля...');
  const textileSupplier = {
    name: 'ТекстильТорг',
    company_name: 'ТекстильТорг ООО',
    category: 'Текстиль и одежда', // Попробуем эту категорию
    country: 'Россия',
    city: 'Иваново',
    description: 'Поставщик текстильной продукции, спецодежды и тканей. Работаем с 2008 года.',
    contact_email: 'order@textiletorg.ru',
    contact_phone: '+7 (4932) 345-67-89',
    website: 'https://textiletorg.ru',
    rating: 4.5,
    reviews_count: 76,
    payment_methods: ['bank_transfer', 'card'],
    bank_accounts: [{
      bank_name: 'Сбербанк',
      account_number: '40702810300000567890',
      bic: '044525225',
      correspondent_account: '30101810400000000225'
    }],
    is_active: true
  };

  let { data: textileSupp, error: textileError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([textileSupplier])
    .select()
    .single();

  if (textileError) {
    console.log('⚠️ Текстиль не прошел, пробуем категорию "Электроника"...');
    textileSupplier.category = 'Электроника';
    textileSupplier.name = 'ТекстильЭлектро';
    textileSupplier.description = 'Поставщик текстильного оборудования и электронных компонентов для текстильной промышленности.';
    
    const { data: textileSupp2, error: textileError2 } = await supabase
      .from('catalog_verified_suppliers')
      .insert([textileSupplier])
      .select()
      .single();
    
    if (textileError2) {
      console.error('❌ Ошибка создания текстильного поставщика:', textileError2);
      return;
    }
    textileSupp = textileSupp2;
  }

  console.log('✅ Создан поставщик:', textileSupp.name, 'категории', textileSupp.category);

  // Добавим товары для текстильного поставщика
  const textileProducts = [
    {
      supplier_id: textileSupp.id,
      name: 'Спецодежда рабочая',
      description: 'Комплект рабочей одежды: куртка и брюки. Плотная ткань, усиленные швы.',
      price: '2500.00',
      currency: 'RUB',
      min_order: 'от 10 комплектов',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop"]',
      sku: 'WORK-SUIT-01',
      category: 'Текстиль и одежда',
      is_active: true
    },
    {
      supplier_id: textileSupp.id,
      name: 'Ткань хлопок 100%',
      description: 'Натуральная хлопковая ткань плотностью 150 г/м². Ширина рулона 150 см.',
      price: '450.00',
      currency: 'RUB',
      min_order: 'от 50 метров',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1586105251261-72a756497a11?w=400&h=300&fit=crop"]',
      sku: 'COTTON-150',
      category: 'Текстиль и одежда',
      is_active: true
    },
    {
      supplier_id: textileSupp.id,
      name: 'Защитные перчатки',
      description: 'Рабочие перчатки с латексным покрытием. Размеры S-XL.',
      price: '85.00',
      currency: 'RUB',
      min_order: 'от 100 пар',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1588486873914-f4afc34a5c50?w=400&h=300&fit=crop"]',
      sku: 'GLOVES-LATEX',
      category: 'Текстиль и одежда',
      is_active: true
    }
  ];

  const { data: textileProds, error: textileProdError } = await supabase
    .from('catalog_verified_products')
    .insert(textileProducts)
    .select();

  if (textileProdError) {
    console.error('❌ Ошибка товаров текстиль:', textileProdError);
  } else {
    console.log(`✅ Добавлено ${textileProds.length} товаров для текстильного поставщика`);
  }

  // 2. Создадим поставщика стройматериалов
  console.log('\n🏗️ Создаем поставщика стройматериалов...');
  const constructionSupplier = {
    name: 'СтройБаза',
    company_name: 'СтройБаза ООО',
    category: 'Строительство', // Попробуем эту категорию
    country: 'Россия',
    city: 'Краснодар',
    description: 'Поставщик строительных и отделочных материалов. Доставка по ЮФО.',
    contact_email: 'sale@stroybaza.ru',
    contact_phone: '+7 (861) 234-56-78',
    website: 'https://stroybaza.ru',
    rating: 4.6,
    reviews_count: 102,
    payment_methods: ['bank_transfer', 'cash'],
    bank_accounts: [{
      bank_name: 'ВТБ',
      account_number: '40702810800000789012',
      bic: '044525187',
      correspondent_account: '30101810700000000187'
    }],
    is_active: true
  };

  let { data: constructionSupp, error: constructionError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([constructionSupplier])
    .select()
    .single();

  if (constructionError) {
    console.log('⚠️ Строительство не прошло, пробуем категорию "Автотовары"...');
    constructionSupplier.category = 'Автотовары';
    constructionSupplier.name = 'СтройАвто';
    constructionSupplier.description = 'Поставщик строительной техники и автокомплектующих для стройиндустрии.';
    
    const { data: constructionSupp2, error: constructionError2 } = await supabase
      .from('catalog_verified_suppliers')
      .insert([constructionSupplier])
      .select()
      .single();
    
    if (constructionError2) {
      console.error('❌ Ошибка создания строительного поставщика:', constructionError2);
      return;
    }
    constructionSupp = constructionSupp2;
  }

  console.log('✅ Создан поставщик:', constructionSupp.name, 'категории', constructionSupp.category);

  // Добавим товары для строительного поставщика
  const constructionProducts = [
    {
      supplier_id: constructionSupp.id,
      name: 'Цемент М400',
      description: 'Портландцемент марки М400. Мешок 50 кг. Для фундаментных работ.',
      price: '380.00',
      currency: 'RUB',
      min_order: 'от 20 мешков',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]',
      sku: 'CEM-M400',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: constructionSupp.id,
      name: 'Кирпич керамический',
      description: 'Керамический кирпич М100. Размер 250x120x65 мм.',
      price: '18.50',
      currency: 'RUB',
      min_order: 'от 500 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1564401218689-6a899a5e2e56?w=400&h=300&fit=crop"]',
      sku: 'BRICK-CER',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: constructionSupp.id,
      name: 'Песок речной',
      description: 'Песок речной мытый, фракция 0-3 мм. Для бетонных смесей.',
      price: '1200.00',
      currency: 'RUB',
      min_order: 'от 10 м³',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=300&fit=crop"]',
      sku: 'SAND-RIVER',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: constructionSupp.id,
      name: 'Профиль металлический',
      description: 'Профиль для гипсокартона 60x27 мм. Length 3 метра.',
      price: '165.00',
      currency: 'RUB',
      min_order: 'от 50 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&h=300&fit=crop"]',
      sku: 'PROFILE-60',
      category: 'Строительство',
      is_active: true
    }
  ];

  const { data: constructionProds, error: constructionProdError } = await supabase
    .from('catalog_verified_products')
    .insert(constructionProducts)
    .select();

  if (constructionProdError) {
    console.error('❌ Ошибка товаров строительство:', constructionProdError);
  } else {
    console.log(`✅ Добавлено ${constructionProds.length} товаров для строительного поставщика`);
  }

  console.log('\n📊 Итого создано:');
  console.log('- 2 новых поставщика');
  console.log('- 3 товара для текстильного поставщика');
  console.log('- 4 товара для строительного поставщика');
  console.log('\n✨ Готово! Теперь у вас есть поставщики из разных категорий.');
}

createNewSuppliers().catch(console.error);