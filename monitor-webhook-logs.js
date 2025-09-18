require('dotenv').config({ path: '.env.local' });

async function sendTestAndMonitorLogs() {
  console.log('🔍 Отправляю тестовое сообщение и мониторю логи...\n');
  
  const testMessage = `MONITOR TEST ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
  
  const webhookPayload = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: 987654321,
        is_bot: false,
        first_name: "Monitor",
        last_name: "Test",
        username: "monitor_test"
      },
      chat: {
        id: parseInt(process.env.TELEGRAM_CHAT_ID),
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: testMessage,
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
        text: `🆔 Проект: 1570961b-ca64-4de4-8170-a7ef99b2ae5b`
      }
    }
  };

  console.log('📤 Отправляю webhook...');
  
  try {
    const response = await fetch('http://localhost:3000/api/telegram-chat-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.text();
    console.log(`✅ Webhook ответ (${response.status}):`, result);
    
    console.log('\n⏳ Ожидаю 3 секунды для обработки...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('💡 ПОСМОТРИТЕ ЛОГИ СЕРВЕРА Next.js для ULTRA DEBUG сообщений!');
    console.log('💡 Они должны содержать детальную информацию о обработке webhook\'а');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

sendTestAndMonitorLogs(); 