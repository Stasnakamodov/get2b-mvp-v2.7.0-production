const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

async function checkDatabaseStructure() {
  try {
    console.log('🔍 ПОЛНАЯ ПРОВЕРКА СТРУКТУРЫ БАЗЫ ДАННЫХ\n');
    
    // 1. Проверяем поставщиков
    console.log('👥 1. ПОСТАВЩИКИ (catalog_verified_suppliers):');
    const { data: verifiedSuppliers, error: suppliersError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name, category, city, is_active')
      .eq('is_active', true)
      .order('name');
      
    if (suppliersError) {
      console.error('❌ Ошибка:', suppliersError);
    } else {
      console.log(`📊 Найдено ${verifiedSuppliers?.length || 0} активных аккредитованных поставщиков:`);
      verifiedSuppliers?.forEach(s => {
        console.log(`  - ${s.name} (${s.category}) - ${s.city} [ID: ${s.id.substring(0, 8)}...]`);
      });
    }
    
    // 2. Проверяем товары аккредитованных поставщиков
    console.log('\n📦 2. ТОВАРЫ АККРЕДИТОВАННЫХ (catalog_verified_products):');
    const { data: verifiedProducts, error: productsError } = await supabase
      .from('catalog_verified_products')
      .select(`
        id, name, price, currency, category, is_active,
        catalog_verified_suppliers!inner(name, category)
      `)
      .eq('is_active', true)
      .order('name');
      
    if (productsError) {
      console.error('❌ Ошибка:', productsError);
    } else {
      console.log(`📊 Найдено ${verifiedProducts?.length || 0} активных товаров:`);
      const bySupplier = {};
      verifiedProducts?.forEach(p => {
        const supplierName = p.catalog_verified_suppliers.name;
        if (!bySupplier[supplierName]) bySupplier[supplierName] = [];
        bySupplier[supplierName].push(p);
      });
      
      Object.keys(bySupplier).forEach(supplierName => {
        console.log(`\n  📋 ${supplierName} (${bySupplier[supplierName].length} товаров):`);
        bySupplier[supplierName].forEach(p => {
          console.log(`    - ${p.name} (${p.price} ${p.currency}) [ID: ${p.id.substring(0, 8)}...]`);
        });
      });
    }
    
    // 3. Проверяем пользовательских поставщиков
    console.log('\n👤 3. ПОЛЬЗОВАТЕЛЬСКИЕ ПОСТАВЩИКИ (catalog_user_suppliers):');
    const { data: userSuppliers, error: userSuppliersError } = await supabase
      .from('catalog_user_suppliers')
      .select('id, name, category, city, user_id, source_type, is_active')
      .eq('is_active', true)
      .order('name')
      .limit(10);
      
    if (userSuppliersError) {
      console.error('❌ Ошибка:', userSuppliersError);
    } else {
      console.log(`📊 Найдено ${userSuppliers?.length || 0} активных пользовательских поставщиков:`);
      userSuppliers?.forEach(s => {
        console.log(`  - ${s.name} (${s.category}) - ${s.city} [${s.source_type}] [ID: ${s.id.substring(0, 8)}...]`);
      });
    }
    
    // 4. Проверяем товары пользователей
    console.log('\n🛍️ 4. ТОВАРЫ ПОЛЬЗОВАТЕЛЕЙ (catalog_user_products):');
    const { data: userProducts, error: userProductsError } = await supabase
      .from('catalog_user_products')
      .select(`
        id, name, price, currency, category, is_active,
        catalog_user_suppliers!inner(name, category)
      `)
      .eq('is_active', true)
      .order('name')
      .limit(10);
      
    if (userProductsError) {
      console.error('❌ Ошибка:', userProductsError);
    } else {
      console.log(`📊 Найдено ${userProducts?.length || 0} активных пользовательских товаров:`);
      userProducts?.forEach(p => {
        console.log(`  - ${p.name} (${p.price} ${p.currency}) от ${p.catalog_user_suppliers.name}`);
      });
    }
    
    // 5. Проверяем категории
    console.log('\n📂 5. КАТЕГОРИИ (catalog_categories):');
    const { data: categories, error: categoriesError } = await supabase
      .from('catalog_categories')
      .select('id, name, key, is_active')
      .eq('is_active', true)
      .order('name');
      
    if (categoriesError) {
      console.error('❌ Ошибка:', categoriesError);
    } else {
      console.log(`📊 Найдено ${categories?.length || 0} активных категорий:`);
      categories?.forEach(c => {
        console.log(`  - ${c.name} (ключ: ${c.key}) [ID: ${c.id}]`);
      });
    }
    
    // 6. ИТОГОВАЯ СТАТИСТИКА
    console.log('\n📈 6. ИТОГОВАЯ СТАТИСТИКА:');
    console.log(`🟠 Аккредитованные поставщики: ${verifiedSuppliers?.length || 0}`);
    console.log(`📦 Товары аккредитованных: ${verifiedProducts?.length || 0}`);
    console.log(`🔵 Пользовательские поставщики: ${userSuppliers?.length || 0}`);
    console.log(`🛍️ Товары пользователей: ${userProducts?.length || 0}`);
    console.log(`📂 Категории: ${categories?.length || 0}`);
    
    // 7. ПРОВЕРКА ДУБЛЕЙ
    console.log('\n🔍 7. ПРОВЕРКА НА ДУБЛИ:');
    
    // Дубли поставщиков по имени
    const supplierNames = {};
    verifiedSuppliers?.forEach(s => {
      if (supplierNames[s.name]) {
        supplierNames[s.name]++;
      } else {
        supplierNames[s.name] = 1;
      }
    });
    
    const duplicateSuppliers = Object.keys(supplierNames).filter(name => supplierNames[name] > 1);
    if (duplicateSuppliers.length > 0) {
      console.log('⚠️ ДУБЛИ ПОСТАВЩИКОВ:');
      duplicateSuppliers.forEach(name => {
        console.log(`  - "${name}" встречается ${supplierNames[name]} раз`);
      });
    } else {
      console.log('✅ Дублей поставщиков не найдено');
    }
    
    // Дубли товаров по имени и поставщику
    const productKeys = {};
    verifiedProducts?.forEach(p => {
      const key = `${p.name}__${p.catalog_verified_suppliers.name}`;
      if (productKeys[key]) {
        productKeys[key]++;
      } else {
        productKeys[key] = 1;
      }
    });
    
    const duplicateProducts = Object.keys(productKeys).filter(key => productKeys[key] > 1);
    if (duplicateProducts.length > 0) {
      console.log('\n⚠️ ДУБЛИ ТОВАРОВ:');
      duplicateProducts.forEach(key => {
        const [productName, supplierName] = key.split('__');
        console.log(`  - "${productName}" от "${supplierName}" встречается ${productKeys[key]} раз`);
      });
    } else {
      console.log('✅ Дублей товаров не найдено');
    }
    
    console.log('\n🎉 ПРОВЕРКА ЗАВЕРШЕНА!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

checkDatabaseStructure();