// Тест webhook Get2B
const testWebhook = async () => {
  const webhookData = {
    type: "lead",
    data: {
      name: "Тест Тестович",
      email: "test@get2b.com",
      phone: "+7-999-123-45-67", 
      company: "ООО Тест",
      message: "Хочу попробовать Get2B для импорта из Китая",
      source: "website"
    },
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🚀 Отправляем тестовый лид...');
    
    const response = await fetch('http://localhost:3000/api/get2b-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    const result = await response.json();
    
    console.log('📡 Статус:', response.status);
    console.log('📦 Ответ:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Webhook работает!');
    } else {
      console.log('❌ Ошибка:', result);
    }
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error);
  }
};

testWebhook(); 