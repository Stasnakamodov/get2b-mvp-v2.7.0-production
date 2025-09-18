// Тестирование импорта Medtronic Medical после добавления товаров
// Выполнить в консоли браузера на http://localhost:3002/dashboard/catalog

console.log('🧪 [TEST] Запуск теста импорта Medtronic Medical');

async function testMedtronicImport() {
  try {
    console.log('1️⃣ [TEST] Проверяем поставщиков в оранжевой комнате...');
    
    // Получаем всех аккредитованных поставщиков
    const suppliersResponse = await fetch('/api/catalog/verified-suppliers');
    const suppliers = await suppliersResponse.json();
    
    console.log('📋 [TEST] Найдено аккредитованных поставщиков:', suppliers.length);
    
    // Ищем Medtronic Medical
    const medtronic = suppliers.find(s => 
      s.name.toLowerCase().includes('medtronic') || 
      s.company_name.toLowerCase().includes('medtronic')
    );
    
    if (!medtronic) {
      console.error('❌ [TEST] Medtronic Medical не найден в оранжевой комнате');
      return false;
    }
    
    console.log('✅ [TEST] Medtronic найден:', {
      id: medtronic.id,
      name: medtronic.name,
      company_name: medtronic.company_name
    });
    
    console.log('2️⃣ [TEST] Проверяем товары Medtronic через прямой API...');
    
    // Проверяем товары через наш диагностический API
    const productsResponse = await fetch(`/api/supabase-direct?table=catalog_verified_products&supplier_id=${medtronic.id}`);
    const products = await productsResponse.json();
    
    console.log(`📦 [TEST] Товары Medtronic в catalog_verified_products:`, products.length);
    
    if (products.length === 0) {
      console.error('❌ [TEST] У Medtronic нет товаров! Нужно выполнить SQL скрипт add-medtronic-products.sql');
      return false;
    }
    
    console.log('📦 [TEST] Найденные товары:', products.map(p => ({
      name: p.name,
      price: p.price,
      currency: p.currency,
      in_stock: p.in_stock
    })));
    
    console.log('3️⃣ [TEST] Тестируем импорт поставщика...');
    
    // Получаем токен авторизации
    const token = localStorage.getItem('supabase.auth.token') || 
                  sessionStorage.getItem('supabase.auth.token') ||
                  localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ [TEST] Токен авторизации не найден');
      return false;
    }
    
    // Выполняем импорт
    const importResponse = await fetch('/api/catalog/import-supplier', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.replace('Bearer ', '')}`
      },
      body: JSON.stringify({
        verified_supplier_id: medtronic.id
      })
    });
    
    const importResult = await importResponse.json();
    
    if (!importResponse.ok) {
      console.error('❌ [TEST] Ошибка импорта:', importResult.error);
      return false;
    }
    
    console.log('✅ [TEST] Импорт успешен!');
    console.log('📊 [TEST] Результат импорта:', {
      message: importResult.message,
      supplier_id: importResult.supplier?.id,
      imported_products_count: importResult.imported_products_count
    });
    
    if (importResult.imported_products_count > 0) {
      console.log('🎉 [TEST] УСПЕХ! Товары были импортированы вместе с поставщиком!');
    } else {
      console.warn('⚠️ [TEST] Поставщик импортирован, но товары не перенеслись');
    }
    
    console.log('4️⃣ [TEST] Проверяем результат в синей комнате...');
    
    // Проверяем появился ли поставщик в синей комнате
    const userSuppliersResponse = await fetch('/api/catalog/user-suppliers', {
      headers: {
        'Authorization': `Bearer ${token.replace('Bearer ', '')}`
      }
    });
    
    if (userSuppliersResponse.ok) {
      const userSuppliers = await userSuppliersResponse.json();
      const importedMedtronic = userSuppliers.find(s => 
        s.source_supplier_id === medtronic.id ||
        s.name.toLowerCase().includes('medtronic')
      );
      
      if (importedMedtronic) {
        console.log('✅ [TEST] Medtronic найден в синей комнате:', {
          id: importedMedtronic.id,
          name: importedMedtronic.name,
          products_count: importedMedtronic.catalog_user_products?.length || 0
        });
        
        if (importedMedtronic.catalog_user_products?.length > 0) {
          console.log('📦 [TEST] Товары в синей комнате:', 
            importedMedtronic.catalog_user_products.map(p => p.name)
          );
        }
      } else {
        console.warn('⚠️ [TEST] Medtronic не найден в синей комнате');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 [TEST] Критическая ошибка:', error);
    return false;
  }
}

// Делаем функцию доступной глобально
window.testMedtronicImport = testMedtronicImport;

// Автозапуск через 2 секунды
setTimeout(() => {
  console.log('🚀 [TEST] Автозапуск теста...');
  testMedtronicImport();
}, 2000);