// Обновление Telegram webhook с новым ngrok URL

const updateWebhook = async () => {
  try {
    console.log('🔧 Обновляем Telegram webhook...');
    
    // Новый ngrok URL
    const newWebhookUrl = 'https://c9fbbebb430c.ngrok-free.app/api/telegram-chat-webhook';
    
    console.log('📡 Новый URL:', newWebhookUrl);
    
    const response = await fetch('http://localhost:3000/api/telegram/set-chat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: newWebhookUrl
      })
    });

    const result = await response.json();
    
    console.log('📊 Статус:', response.status);
    console.log('📦 Результат:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Webhook успешно обновлен!');
      console.log('🎯 URL:', result.result?.result?.url);
      console.log('📊 Необработанных сообщений будет очищено');
    } else {
      console.log('❌ Ошибка обновления webhook:', result);
    }
    
  } catch (error) {
    console.error('💥 Ошибка:', error);
  }
};

updateWebhook(); 