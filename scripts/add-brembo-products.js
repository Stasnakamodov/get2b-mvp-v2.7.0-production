// Скрипт для добавления тестовых товаров Brembo
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addBremboProducts() {
  console.log('🚀 Начинаем добавление товаров Brembo...');

  // Получаем первого активного verified поставщика
  const { data: suppliers, error: supplierError } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .eq('is_active', true)
    .limit(1);

  if (supplierError || !suppliers || suppliers.length === 0) {
    console.error('❌ Не найден активный поставщик:', supplierError);
    console.log('💡 Создаем тестового поставщика...');

    // Создаем тестового поставщика
    const { data: newSupplier, error: createError } = await supabase
      .from('catalog_verified_suppliers')
      .insert([{
        name: 'AutoParts Premium',
        company_name: 'ООО "АвтоПартс Премиум"',
        category: 'Автотовары',
        country: 'Россия',
        city: 'Москва',
        description: 'Официальный дистрибьютор Brembo и других премиум брендов',
        is_active: true,
        contact_email: 'info@autoparts-premium.ru'
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Ошибка создания поставщика:', createError);
      process.exit(1);
    }

    suppliers[0] = newSupplier;
    console.log('✅ Создан поставщик:', newSupplier.name);
  }

  const supplierId = suppliers[0].id;
  console.log('📦 Используем поставщика:', suppliers[0].name, '(', supplierId, ')');

  // Товары Brembo
  const bremboProducts = [
    {
      name: 'Brembo GT тормозная система',
      description: 'Спортивная тормозная система Brembo GT Series с суппортами и перфорированными дисками. Золотые суппорты, высокая производительность. Brake system для авто.',
      category: 'Автотовары',
      price: 150000,
      currency: 'RUB',
      in_stock: true,
      supplier_id: supplierId,
      is_active: true
    },
    {
      name: 'Тормозные диски Brembo перфорированные',
      description: 'Передние тормозные диски Brembo с перфорацией для улучшенного охлаждения. Brake disc для спортивных автомобилей.',
      category: 'Автотовары',
      price: 45000,
      currency: 'RUB',
      in_stock: true,
      supplier_id: supplierId,
      is_active: true
    },
    {
      name: 'Суппорт тормозной Brembo 6-поршневой золотой',
      description: 'Алюминиевый тормозной суппорт Brembo на 6 поршней. Золотое анодирование. Caliper brake для спорткаров.',
      category: 'Автотовары',
      price: 85000,
      currency: 'RUB',
      in_stock: true,
      supplier_id: supplierId,
      is_active: true
    },
    {
      name: 'Brembo тормозные колодки передние',
      description: 'Высокопроизводительные тормозные колодки Brembo для передней оси. Brake pads premium качества.',
      category: 'Автотовары',
      price: 12000,
      currency: 'RUB',
      in_stock: true,
      supplier_id: supplierId,
      is_active: true
    },
    {
      name: 'Brembo тормозная жидкость DOT 4',
      description: 'Оригинальная тормозная жидкость Brembo DOT 4 для высокопроизводительных тормозных систем.',
      category: 'Автотовары',
      price: 1500,
      currency: 'RUB',
      in_stock: true,
      supplier_id: supplierId,
      is_active: true
    }
  ];

  console.log('📝 Добавляем', bremboProducts.length, 'товаров...');

  // Добавляем товары
  const { data: products, error: productsError } = await supabase
    .from('catalog_verified_products')
    .insert(bremboProducts)
    .select();

  if (productsError) {
    console.error('❌ Ошибка добавления товаров:', productsError);
    process.exit(1);
  }

  console.log('✅ Успешно добавлено товаров:', products.length);
  console.log('\n📦 Добавленные товары:');
  products.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} - ${p.price} ${p.currency}`);
  });

  console.log('\n🎉 Готово! Теперь можно тестировать поиск по изображению.');
  process.exit(0);
}

addBremboProducts().catch(err => {
  console.error('💥 Критическая ошибка:', err);
  process.exit(1);
});
