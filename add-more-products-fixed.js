const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMoreProducts() {
  console.log('🛠️ Добавляем больше товаров в разные категории...');

  // 1. Найдем поставщика ТехноКомплект
  const { data: electronicSupplier } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .eq('name', 'ТехноКомплект')
    .single();

  if (!electronicSupplier) {
    console.error('❌ Не найден поставщик ТехноКомплект');
    return;
  }

  console.log('✅ Найден поставщик:', electronicSupplier.name);

  // 2. Добавим товары в категорию "Дом и быт"
  const homeProducts = [
    {
      supplier_id: electronicSupplier.id,
      name: 'Умная розетка Xiaomi',
      description: 'Wi-Fi розетка с управлением через смартфон. Поддержка голосовых помощников.',
      price: '890.00',
      currency: 'RUB',
      min_order: 'от 10 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]',
      sku: 'XM-SOCKET-WIFI',
      category: 'Дом и быт',
      is_active: true
    },
    {
      supplier_id: electronicSupplier.id,
      name: 'LED лампа умная Philips',
      description: 'Умная лампа E27 с изменением цвета и яркости. Управление по Wi-Fi.',
      price: '1250.00',
      currency: 'RUB',
      min_order: 'от 5 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=400&h=300&fit=crop"]',
      sku: 'PH-LED-SMART',
      category: 'Дом и быт',
      is_active: true
    },
    {
      supplier_id: electronicSupplier.id,
      name: 'Робот-пылесос Roborock',
      description: 'Робот-пылесос с влажной уборкой. Лазерная навигация, управление через приложение.',
      price: '32000.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=400&h=300&fit=crop"]',
      sku: 'RB-VACUUM-S7',
      category: 'Дом и быт',
      is_active: true
    },
    {
      supplier_id: electronicSupplier.id,
      name: 'Очиститель воздуха Dyson',
      description: 'Очиститель воздуха с HEPA фильтром. Удаление аллергенов и запахов.',
      price: '28500.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=300&fit=crop"]',
      sku: 'DY-PURIFIER',
      category: 'Дом и быт',
      is_active: true
    }
  ];

  const { data: homeProductsData, error: homeProductsError } = await supabase
    .from('catalog_verified_products')
    .insert(homeProducts)
    .select();

  if (homeProductsError) {
    console.error('❌ Ошибка добавления товаров для дома:', homeProductsError);
  } else {
    console.log(`✅ Добавлено ${homeProductsData.length} товаров в категорию "Дом и быт"`);
  }

  // 3. Добавим товары в категорию "Здоровье и медицина"
  const medicalProducts = [
    {
      supplier_id: electronicSupplier.id,
      name: 'Термометр бесконтактный',
      description: 'Инфракрасный термометр для измерения температуры тела. Быстрое и точное измерение.',
      price: '2200.00',
      currency: 'RUB',
      min_order: 'от 5 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=400&h=300&fit=crop"]',
      sku: 'THERM-IR-01',
      category: 'Здоровье и медицина',
      is_active: true
    },
    {
      supplier_id: electronicSupplier.id,
      name: 'Пульсоксиметр портативный',
      description: 'Измерение уровня кислорода в крови и пульса. Цифровой дисплей.',
      price: '1800.00',
      currency: 'RUB',
      min_order: 'от 10 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=300&fit=crop"]',
      sku: 'PULSE-OX-01',
      category: 'Здоровье и медицина',
      is_active: true
    },
    {
      supplier_id: electronicSupplier.id,
      name: 'Тонометр автоматический',
      description: 'Автоматический измеритель артериального давления. Память на 90 измерений.',
      price: '3500.00',
      currency: 'RUB',
      min_order: 'от 5 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop"]',
      sku: 'BP-AUTO-01',
      category: 'Здоровье и медицина',
      is_active: true
    }
  ];

  const { data: medProductsData, error: medProductsError } = await supabase
    .from('catalog_verified_products')
    .insert(medicalProducts)
    .select();

  if (medProductsError) {
    console.error('❌ Ошибка добавления медицинских товаров:', medProductsError);
  } else {
    console.log(`✅ Добавлено ${medProductsData.length} товаров в категорию "Здоровье и медицина"`);
  }

  // 4. Добавим товары в категорию "Продукты питания"
  const foodProducts = [
    {
      supplier_id: electronicSupplier.id,
      name: 'Кофемашина De`Longhi',
      description: 'Автоматическая кофемашина с капучинатором. 15 видов напитков.',
      price: '45000.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop"]',
      sku: 'DL-COFFEE-AUTO',
      category: 'Продукты питания',
      is_active: true
    },
    {
      supplier_id: electronicSupplier.id,
      name: 'Блендер KitchenAid',
      description: 'Мощный стационарный блендер 1400 Вт. Измельчение льда и твердых продуктов.',
      price: '18500.00',
      currency: 'RUB',
      min_order: 'от 1 шт',
      in_stock: true,
      images: '["https://images.unsplash.com/photo-1556909114-4f6e3ba2b1a6?w=400&h=300&fit=crop"]',
      sku: 'KA-BLENDER-1400',
      category: 'Продукты питания',
      is_active: true
    }
  ];

  const { data: foodProductsData, error: foodProductsError } = await supabase
    .from('catalog_verified_products')
    .insert(foodProducts)
    .select();

  if (foodProductsError) {
    console.error('❌ Ошибка добавления товаров питания:', foodProductsError);
  } else {
    console.log(`✅ Добавлено ${foodProductsData.length} товаров в категорию "Продукты питания"`);
  }

  console.log('\n📊 Итого добавлено новых товаров:');
  console.log('- 4 товара в категории "Дом и быт"');
  console.log('- 3 товара в категории "Здоровье и медицина"');
  console.log('- 2 товара в категории "Продукты питания"');
  console.log('\n✨ Готово! Проверьте обновленные счетчики в каталоге.');
}

addMoreProducts().catch(console.error);