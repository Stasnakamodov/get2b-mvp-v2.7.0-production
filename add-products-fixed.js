const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

async function addProducts() {
  try {
    console.log('🛍️ Добавляем товары с правильной схемой...');
    
    // Получаем всех поставщиков
    const { data: suppliers, error: suppliersError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name, category')
      .eq('is_active', true);
      
    if (suppliersError) {
      console.error('❌ Ошибка получения поставщиков:', suppliersError);
      return;
    }
    
    console.log(`👥 Найдено поставщиков: ${suppliers?.length || 0}`);
    
    // Очищаем старые товары
    console.log('🧹 Очищаем старые товары...');
    const { error: deleteError } = await supabase
      .from('catalog_verified_products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    if (deleteError) {
      console.log('⚠️ Предупреждение при удалении товаров:', deleteError.message);
    } else {
      console.log('✅ Старые товары удалены');
    }
    
    // Создаем товары для каждого поставщика
    let totalProducts = 0;
    
    for (const supplier of suppliers) {
      console.log(`\n📦 Создаем товары для ${supplier.name} (${supplier.category})`);
      
      let products = [];
      
      if (supplier.category === 'Электроника') {
        products = [
          {
            supplier_id: supplier.id,
            name: 'Сервер HP ProLiant DL380 Gen10',
            description: 'Высокопроизводительный сервер для корпоративных решений. 2x Intel Xeon Gold 6226R, 64GB DDR4, 4x 1TB SAS HDD.',
            category: 'Электроника',
            price: 450000,
            currency: 'RUB',
            min_order: 'от 1 шт',
            in_stock: true,
            sku: 'HPE-DL380-G10-001',
            images: JSON.stringify(['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop']),
            is_active: true
          },
          {
            supplier_id: supplier.id,
            name: 'Коммутатор Cisco Catalyst 2960-X',
            description: '24-портовый управляемый коммутатор с поддержкой PoE+. Идеально подходит для офисных сетей.',
            category: 'Электроника',
            price: 85000,
            currency: 'RUB',
            min_order: 'от 1 шт',
            in_stock: true,
            sku: 'CSC-2960X-24PS',
            images: JSON.stringify(['https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=300&fit=crop']),
            is_active: true
          },
          {
            supplier_id: supplier.id,
            name: 'IP-камера Hikvision DS-2CD2143G0-IS',
            description: '4MP купольная камера с ИК-подсветкой и поддержкой H.265+. Встроенный слот для microSD карты.',
            category: 'Электроника',
            price: 12500,
            currency: 'RUB',
            min_order: 'от 10 шт',
            in_stock: true,
            sku: 'HIK-DS2CD2143G0IS',
            images: JSON.stringify(['https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop']),
            is_active: true
          }
        ];
      } else if (supplier.category === 'Автотовары') {
        products = [
          {
            supplier_id: supplier.id,
            name: 'Тормозные колодки Bosch 0 986 494 294',
            description: 'Передние тормозные колодки для BMW 3 серии (E90/E91/E92/E93). Оригинальное качество от производителя.',
            category: 'Автотовары',
            price: 3850,
            currency: 'RUB',
            min_order: 'от 4 шт',
            in_stock: true,
            sku: 'BSH-0986494294',
            images: JSON.stringify(['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop']),
            is_active: true
          },
          {
            supplier_id: supplier.id,
            name: 'Масляный фильтр Mann W 712/75',
            description: 'Масляный фильтр для двигателей BMW N52/N54/N55. Высокое качество фильтрации, увеличенный ресурс.',
            category: 'Автотовары',
            price: 890,
            currency: 'RUB',
            min_order: 'от 10 шт',
            in_stock: true,
            sku: 'MAN-W71275',
            images: JSON.stringify(['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop']),
            is_active: true
          },
          {
            supplier_id: supplier.id,
            name: 'Амортизатор Sachs 312 324',
            description: 'Передний амортизатор для Mercedes-Benz C-Class W204. Газомасляный, с прогрессивной характеристикой.',
            category: 'Автотовары',
            price: 8200,
            currency: 'RUB',
            min_order: 'от 2 шт',
            in_stock: true,
            sku: 'SAC-312324',
            images: JSON.stringify(['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop']),
            is_active: true
          }
        ];
      }
      
      // Добавляем товары для поставщика
      if (products.length > 0) {
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          console.log(`  ${i + 1}/${products.length}: ${product.name}...`);
          
          const { data, error } = await supabase
            .from('catalog_verified_products')
            .insert([product])
            .select();
          
          if (error) {
            console.error(`    ❌ Ошибка: ${error.message}`);
            continue;
          }
          
          console.log(`    ✅ Добавлен`);
          totalProducts++;
        }
      } else {
        console.log(`  ⚠️ Товары для категории ${supplier.category} не определены`);
      }
    }
    
    console.log(`\n🎉 Процесс завершен! Добавлено товаров: ${totalProducts}`);
    
    // Показываем статистику
    const { data: finalProducts, error: finalError } = await supabase
      .from('catalog_verified_products')
      .select(`
        id, name, price, currency,
        catalog_verified_suppliers!inner(name, category)
      `)
      .eq('is_active', true)
      .order('name');
      
    if (!finalError) {
      console.log(`\n📊 Итоговая статистика по товарам:`);
      const byCategory = {};
      finalProducts?.forEach(p => {
        const category = p.catalog_verified_suppliers.category;
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(p);
      });
      
      Object.keys(byCategory).forEach(category => {
        console.log(`\n${category} (${byCategory[category].length} товаров):`);
        byCategory[category].forEach(p => {
          const priceStr = `${p.price} ${p.currency}`;
          console.log(`  - ${p.name} (${priceStr})`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

addProducts();