require('dotenv').config({ path: '.env.local' });

async function sendTestManagerMessage() {
  console.log('🧪 Тестируем отправку сообщения от менеджера...');
  
  // Имитируем webhook payload от Telegram
  const webhookPayload = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: 987654321,
        is_bot: false,
        first_name: "Менеджер",
        last_name: "Get2B",
        username: "manager_get2b"
      },
      chat: {
        id: parseInt(process.env.TELEGRAM_CHAT_ID),
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: `Привет! Тестовое сообщение от менеджера ${new Date().toLocaleTimeString()}`,
      reply_to_message: {
        message_id: 123,
        from: {
          id: 8195945436,
          is_bot: true,
          first_name: "Get2B ChatBot"
        },
        chat: {
          id: parseInt(process.env.TELEGRAM_CHAT_ID),
          type: "private"
        },
        date: Math.floor(Date.now() / 1000) - 60,
        text: "🆔 Проект: 1570961b-ca64-4de4-8170-a7ef99b2ae5b"
      }
    }
  };

  try {
    console.log('📤 Отправляю webhook payload...');
    const response = await fetch('http://localhost:3000/api/telegram-chat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.text();
    console.log('✅ Ответ от webhook:', response.status, result);
    
    if (response.status === 200) {
      console.log('🎉 Сообщение от менеджера должно появиться в чате!');
    } else {
      console.log('❌ Ошибка при отправке сообщения');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

sendTestManagerMessage(); 