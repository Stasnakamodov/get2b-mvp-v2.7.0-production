// Тестовый скрипт для проверки API аккредитации
const fetch = require('node-fetch');

async function testAccreditationAPI() {
  console.log('🧪 Тестирование API аккредитации...');
  
  try {
    // Тест 1: Проверка доступности endpoint
    console.log('\n1️⃣ Проверка доступности /api/catalog/submit-accreditation...');
    
    const testData = new FormData();
    testData.append('supplier_id', 'test-supplier-id');
    testData.append('supplier_type', 'profile');
    testData.append('profile_data', JSON.stringify({
      name: 'Test Supplier',
      company_name: 'Test Company',
      category: 'Электроника',
      country: 'Китай'
    }));
    testData.append('products', JSON.stringify([
      {
        name: 'Test Product',
        description: 'Test Description',
        category: 'Электроника',
        price: '100',
        currency: 'USD',
        certificates: ['cert1.pdf'],
        images: ['image1.jpg']
      }
    ]));
    testData.append('legal_confirmation', JSON.stringify({
      isLegalEntity: true,
      hasRightToRepresent: true,
      confirmAccuracy: true
    }));

    const response = await fetch('http://localhost:3000/api/catalog/submit-accreditation', {
      method: 'POST',
      body: testData
    });

    console.log('📊 Статус ответа:', response.status);
    console.log('📋 Заголовки:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Тело ответа:', responseText);

    if (response.ok) {
      console.log('✅ API endpoint работает корректно');
    } else {
      console.log('❌ API endpoint вернул ошибку');
    }

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

// Запуск теста
testAccreditationAPI(); 