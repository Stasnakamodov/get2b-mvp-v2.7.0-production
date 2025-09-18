const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addConstructionSupplier() {
  console.log('🏗️ Добавляем поставщика строительных материалов...');

  // 1. Создаем поставщика СтройМаркет
  const supplierData = {
    name: 'СтройМаркет',
    company_name: 'СтройМаркет Поставки ООО',
    category: 'Строительство',
    country: 'Россия',
    city: 'Санкт-Петербург',
    description: 'Крупный поставщик строительных материалов и инструментов. Работаем с 2010 года.',
    logo_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&h=200&fit=crop',
    contact_email: 'zakaz@stroymarket.ru',
    contact_phone: '+7 (812) 567-89-01',
    website: 'https://stroymarket.ru',
    rating: 4.7,
    reviews_count: 128,
    total_projects: 234,
    payment_methods: ['bank_transfer', 'card', 'cash'],
    bank_accounts: [{
      bank_name: 'Сбербанк',
      account_number: '40702810555040001234',
      bic: '044525225',
      correspondent_account: '30101810400000000225'
    }],
    crypto_wallets: [{
      currency: 'USDT',
      network: 'TRC20',
      address: 'TXyZ1234567890ABCDEFGHIJKLMNOPQRStuv'
    }],
    p2p_cards: null,
    is_active: true
  };

  const { data: supplier, error: supplierError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([supplierData])
    .select()
    .single();

  if (supplierError) {
    console.error('❌ Ошибка создания поставщика:', supplierError);
    return;
  }

  console.log('✅ Поставщик создан:', supplier.id, supplier.name);

  // 2. Добавляем товары для СтройМаркет
  const products = [
    {
      supplier_id: supplier.id,
      name: 'Цемент М500 Д0',
      product_name: 'Цемент М500 Д0',
      description: 'Портландцемент марки М500 без добавок. Мешок 50 кг. Идеально для фундаментов и несущих конструкций.',
      price: '450.00',
      currency: 'RUB',
      min_order: 'от 10 мешков',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
      sku: 'CEM-M500-50',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Кирпич красный М150',
      product_name: 'Кирпич красный М150',
      description: 'Полнотелый керамический кирпич. Размер 250x120x65 мм. Морозостойкость F50.',
      price: '12.50',
      currency: 'RUB',
      min_order: 'от 1000 шт',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1564401218689-6a899a5e2e56?w=400&h=300&fit=crop'],
      sku: 'BRICK-M150',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Арматура А500С 12мм',
      product_name: 'Арматура А500С 12мм',
      description: 'Стальная арматура класса А500С, диаметр 12мм. Прутки по 11.7м. ГОСТ 34028-2016.',
      price: '52000.00',
      currency: 'RUB',
      min_order: 'от 1 тонны',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=400&h=300&fit=crop'],
      sku: 'ARM-A500-12',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Гипсокартон Кнауф 12.5мм',
      product_name: 'Гипсокартон Кнауф 12.5мм',
      description: 'ГКЛ стеновой Knauf. Размер листа 2500x1200x12.5 мм. Влагостойкий.',
      price: '340.00',
      currency: 'RUB',
      min_order: 'от 10 листов',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400&h=300&fit=crop'],
      sku: 'GKL-KNAUF-125',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Пеноблок D600 200x300x600',
      product_name: 'Пеноблок D600 200x300x600',
      description: 'Пенобетонный блок плотность D600. Размер 200x300x600 мм. Теплоизоляция и звукоизоляция.',
      price: '145.00',
      currency: 'RUB',
      min_order: 'от 1 поддона',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=400&h=300&fit=crop'],
      sku: 'FOAM-D600',
      category: 'Строительство',
      is_active: true
    },
    {
      supplier_id: supplier.id,
      name: 'Песок строительный',
      product_name: 'Песок строительный',
      description: 'Песок карьерный мытый, фракция 0-5 мм. Для бетонных работ и штукатурки.',
      price: '850.00',
      currency: 'RUB',
      min_order: 'от 5 м³',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=300&fit=crop'],
      sku: 'SAND-05',
      category: 'Строительство',
      is_active: true
    }
  ];

  const { data: productsData, error: productsError } = await supabase
    .from('catalog_verified_products')
    .insert(products)
    .select();

  if (productsError) {
    console.error('❌ Ошибка добавления товаров:', productsError);
    return;
  }

  console.log(`✅ Добавлено ${productsData.length} товаров в категорию Строительство`);

  // 3. Добавим еще поставщика в категорию "Здоровье и медицина"
  console.log('\n🏥 Добавляем поставщика медицинского оборудования...');

  const medSupplierData = {
    name: 'МедТехника',
    company_name: 'МедТехника Групп ООО',
    category: 'Здоровье и медицина',
    country: 'Россия',
    city: 'Екатеринбург',
    description: 'Поставщик медицинского оборудования и расходных материалов для клиник.',
    logo_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
    contact_email: 'info@medtechnika.ru',
    contact_phone: '+7 (343) 234-56-78',
    website: 'https://medtechnika.ru',
    rating: 4.9,
    reviews_count: 67,
    total_projects: 89,
    payment_methods: ['bank_transfer', 'card'],
    bank_accounts: [{
      bank_name: 'ВТБ',
      account_number: '40702810700000012345',
      bic: '044525187',
      correspondent_account: '30101810700000000187'
    }],
    crypto_wallets: null,
    p2p_cards: null,
    is_active: true
  };

  const { data: medSupplier, error: medSupplierError } = await supabase
    .from('catalog_verified_suppliers')
    .insert([medSupplierData])
    .select()
    .single();

  if (medSupplierError) {
    console.error('❌ Ошибка создания медицинского поставщика:', medSupplierError);
    return;
  }

  console.log('✅ Медицинский поставщик создан:', medSupplier.id, medSupplier.name);

  // 4. Товары для МедТехника
  const medProducts = [
    {
      supplier_id: medSupplier.id,
      name: 'Тонометр Omron M3',
      product_name: 'Тонометр Omron M3',
      description: 'Автоматический тонометр с манжетой 22-42 см. Память на 60 измерений.',
      price: '3500.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop'],
      sku: 'TON-OMRON-M3',
      category: 'Здоровье и медицина',
      is_active: true
    },
    {
      supplier_id: medSupplier.id,
      name: 'Пульсоксиметр Choicemmed MD300C2',
      product_name: 'Пульсоксиметр Choicemmed MD300C2',
      description: 'Портативный пульсоксиметр. Измерение SpO2 и пульса. OLED дисплей.',
      price: '1800.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=300&fit=crop'],
      sku: 'PULSE-MD300',
      category: 'Здоровье и медицина',
      is_active: true
    },
    {
      supplier_id: medSupplier.id,
      name: 'Стетоскоп Littmann Classic III',
      product_name: 'Стетоскоп Littmann Classic III',
      description: 'Профессиональный стетоскоп для аускультации. Двусторонняя головка.',
      price: '8900.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1584467735815-f778f274e296?w=400&h=300&fit=crop'],
      sku: 'STET-LITT-3',
      category: 'Здоровье и медицина',
      is_active: true
    },
    {
      supplier_id: medSupplier.id,
      name: 'Термометр бесконтактный Sensitec',
      product_name: 'Термометр бесконтактный Sensitec',
      description: 'Инфракрасный термометр. Измерение за 1 секунду. Память на 32 измерения.',
      price: '2200.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: ['https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=300&fit=crop'],
      sku: 'THERM-SENS-IR',
      category: 'Здоровье и медицина',
      is_active: true
    }
  ];

  const { data: medProductsData, error: medProductsError } = await supabase
    .from('catalog_verified_products')
    .insert(medProducts)
    .select();

  if (medProductsError) {
    console.error('❌ Ошибка добавления медицинских товаров:', medProductsError);
    return;
  }

  console.log(`✅ Добавлено ${medProductsData.length} товаров в категорию Здоровье и медицина`);

  console.log('\n📊 Итого добавлено:');
  console.log('- 2 новых поставщика (СтройМаркет, МедТехника)');
  console.log('- 6 товаров в категории Строительство');
  console.log('- 4 товара в категории Здоровье и медицина');
  console.log('\n✨ Готово! Проверьте счетчики в каталоге.');
}

addConstructionSupplier().catch(console.error);