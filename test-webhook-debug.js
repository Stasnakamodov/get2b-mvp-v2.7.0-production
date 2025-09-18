// Отладка webhook Get2B
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

    console.log('📡 Статус:', response.status);
    console.log('📡 Headers:', [...response.headers.entries()]);
    
    // Получаем raw text вместо JSON
    const rawText = await response.text();
    console.log('📦 Raw ответ:', rawText);
    
    // Пытаемся распарсить JSON только если это JSON
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = JSON.parse(rawText);
      console.log('📋 JSON ответ:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error);
  }
};

testWebhook(); 