// Скрипт для проверки товаров в оранжевой комнате
// Выполнить в браузере на http://localhost:3002

console.log('🔍 [CHECK] Проверяем товары в оранжевой комнате...');

async function checkOrangeRoomProducts() {
  try {
    // Получаем всех аккредитованных поставщиков
    const suppliersResponse = await fetch('/api/catalog/verified-suppliers');
    const suppliers = await suppliersResponse.json();
    
    console.log('📋 [CHECK] Найдено аккредитованных поставщиков:', suppliers.length);
    
    // Ищем Medtronic Medical
    const medtronic = suppliers.find(s => s.name.includes('Medtronic') || s.company_name.includes('Medtronic'));
    if (medtronic) {
      console.log('🏥 [CHECK] Medtronic найден:', medtronic);
      console.log('🆔 [CHECK] ID Medtronic:', medtronic.id);
      
      // Проверяем товары этого поставщика через прямой запрос
      const productsResponse = await fetch(`/api/supabase-direct?table=catalog_verified_products&supplier_id=${medtronic.id}`);
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        console.log('📦 [CHECK] Товары Medtronic в catalog_verified_products:', products.length);
        if (products.length > 0) {
          console.log('📦 [CHECK] Примеры товаров:', products.slice(0, 3).map(p => p.name));
        }
      } else {
        console.log('❌ [CHECK] Ошибка получения товаров через API');
      }
    } else {
      console.log('❌ [CHECK] Medtronic Medical не найден');
    }
    
    // Ищем Shenzhou International
    const shenzhou = suppliers.find(s => s.name.includes('Shenzhou') || s.company_name.includes('Shenzhou'));
    if (shenzhou) {
      console.log('🧵 [CHECK] Shenzhou найден:', shenzhou);
      console.log('🆔 [CHECK] ID Shenzhou:', shenzhou.id);
    } else {
      console.log('❌ [CHECK] Shenzhou International не найден');
    }
    
    // Показываем всех поставщиков с количеством товаров
    console.log('📊 [CHECK] Все аккредитованные поставщики:');
    suppliers.forEach(supplier => {
      console.log(`- ${supplier.name} (${supplier.company_name}) - ID: ${supplier.id}`);
    });
    
  } catch (error) {
    console.error('💥 [CHECK] Ошибка:', error);
  }
}

// Запускаем проверку
checkOrangeRoomProducts();

// Делаем функции доступными в консоли
window.checkOrangeRoomProducts = checkOrangeRoomProducts;