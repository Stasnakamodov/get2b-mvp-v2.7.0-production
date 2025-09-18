// Тест простого webhook
const testSimpleWebhook = async () => {
  const testData = {
    message: "Hello from test",
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🧪 Тестируем простой webhook...');
    
    const response = await fetch('http://localhost:3000/api/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Статус:', response.status);
    
    const rawText = await response.text();
    console.log('📦 Raw ответ:', rawText);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = JSON.parse(rawText);
      console.log('📋 JSON ответ:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Ошибка:', error);
  }
};

testSimpleWebhook(); 