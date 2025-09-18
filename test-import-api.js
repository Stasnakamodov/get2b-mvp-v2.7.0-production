// Тестирование API импорта поставщиков
// Используем для отладки проблем с товарами

const testImportAPI = async () => {
  console.log('🧪 [TEST] Начинаем тест API импорта поставщиков');
  
  // Тестовые данные - используем Shenzhou International
  const testSupplierId = '55b015f5-5b83-4b88-9e7c-8a28ec70887e'; // ID из SQL файла
  const testURL = 'http://localhost:3002/api/catalog/import-supplier';
  
  // Получаем токен из localStorage (в браузере)
  if (typeof window === 'undefined') {
    console.log('❌ [TEST] Этот скрипт должен выполняться в браузере');
    return;
  }
  
  const token = localStorage.getItem('token') || localStorage.getItem('supabase.auth.token');
  console.log('🔐 [TEST] Токен найден:', token ? 'ДА' : 'НЕТ');
  
  if (!token) {
    console.log('❌ [TEST] Токен не найден в localStorage');
    return;
  }
  
  try {
    console.log('🚀 [TEST] Отправляем POST запрос к API...');
    
    const response = await fetch(testURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        verified_supplier_id: testSupplierId
      })
    });
    
    console.log('📡 [TEST] Ответ получен. Status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 [TEST] Raw response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ [TEST] Parsed response:', responseData);
    } catch (e) {
      console.log('⚠️ [TEST] Не удалось распарсить JSON:', e.message);
      return;
    }
    
    if (response.ok) {
      console.log('🎉 [TEST] Импорт успешен!');
      console.log('📦 [TEST] Импортировано товаров:', responseData.imported_products_count || 0);
    } else {
      console.log('❌ [TEST] Ошибка импорта:', responseData.error);
    }
    
  } catch (error) {
    console.log('💥 [TEST] Критическая ошибка:', error.message);
  }
};

// Проверяем данные в базе
const checkSupplierData = async () => {
  console.log('🔍 [CHECK] Проверяем данные поставщика в базе...');
  
  const checkURL = 'http://localhost:3002/api/catalog/suppliers/verified';
  
  try {
    const response = await fetch(checkURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📊 [CHECK] Найдено поставщиков:', data?.length || 0);
    
    const shenzhou = data?.find(s => s.name?.includes('Shenzhou'));
    if (shenzhou) {
      console.log('✅ [CHECK] Shenzhou International найден:', shenzhou);
    } else {
      console.log('❌ [CHECK] Shenzhou International НЕ найден');
    }
    
  } catch (error) {
    console.log('💥 [CHECK] Ошибка проверки:', error.message);
  }
};

// Экспорт для использования в консоли браузера
if (typeof window !== 'undefined') {
  window.testImportAPI = testImportAPI;
  window.checkSupplierData = checkSupplierData;
  console.log('✅ Функции testImportAPI() и checkSupplierData() доступны в консоли браузера');
}

// Автозапуск проверки данных
checkSupplierData();