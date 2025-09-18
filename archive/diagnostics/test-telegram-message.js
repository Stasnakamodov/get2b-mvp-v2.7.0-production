// Тест отправки сообщения от менеджера через Telegram webhook

const testTelegramMessage = async () => {
  // Симулируем сообщение от менеджера с reply
  const telegramUpdate = {
    message: {
      message_id: 123,
      from: {
        id: 123456789,
        first_name: "Менеджер Тест",
        username: "manager_test"
      },
      chat: {
        id: 123456789,
        type: "private"
      },
      text: "Спасибо за ваш запрос! Мы обработаем его в течение 24 часов.",
      reply_to_message: {
        text: "🆔 Проект: b7f63bf3-3cfa-4b2c-8a42-ee7b19c53c2d\n📝 Новое сообщение в чате проекта"
      }
    }
  };

  try {
    console.log('🤖 Отправляем тестовое сообщение от менеджера...');
    
    const response = await fetch('http://localhost:3000/api/telegram-chat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramUpdate)
    });

    const result = await response.json();
    
    console.log('📡 Статус:', response.status);
    console.log('📦 Ответ:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Telegram webhook работает!');
    } else {
      console.log('❌ Ошибка:', result);
    }
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error);
  }
};

testTelegramMessage(); 