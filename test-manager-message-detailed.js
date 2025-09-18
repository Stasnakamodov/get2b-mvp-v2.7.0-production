require('dotenv').config({ path: '.env.local' });

async function testManagerMessageDetailed() {
  console.log('🧪 ДЕТАЛЬНОЕ тестирование сообщения от менеджера...\n');
  
  const projectId = '1570961b-ca64-4de4-8170-a7ef99b2ae5b';
  const testMessage = `Тестовое сообщение ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
  
  console.log('📋 Параметры теста:');
  console.log(`   - Проект ID: ${projectId}`);
  console.log(`   - Сообщение: "${testMessage}"`);
  console.log(`   - Telegram Chat ID: ${process.env.TELEGRAM_CHAT_ID}\n`);
  
  // Имитируем webhook payload от Telegram
  const webhookPayload = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: 987654321,
        is_bot: false,
        first_name: "Тестовый",
        last_name: "Менеджер",
        username: "test_manager"
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
        text: `🆔 Проект: ${projectId}`
      }
    }
  };

  console.log('📤 Отправляю webhook payload...');
  
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
    
    if (response.status === 200) {
      console.log('\n🔍 Проверяю, появилось ли сообщение в API...');
      
      // Ждем немного и проверяем API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const apiResponse = await fetch(`http://localhost:3000/api/chat/messages?room_id=${projectId}&limit=3`);
      const apiData = await apiResponse.json();
      
      console.log('📊 Последние сообщения из API:');
      if (apiData.messages && apiData.messages.length > 0) {
        apiData.messages.forEach((msg, i) => {
          console.log(`   ${i + 1}. "${msg.content}" - ${msg.sender_name} (${msg.sender_type}) [${msg.created_at}]`);
        });
        
        // Проверяем, есть ли наше тестовое сообщение
        const testMessageFound = apiData.messages.some(msg => 
          msg.content === testMessage && 
          msg.sender_type === 'manager'
        );
        
        if (testMessageFound) {
          console.log('\n🎉 УСПЕХ! Тестовое сообщение найдено в API!');
        } else {
          console.log('\n❌ ПРОБЛЕМА: Тестовое сообщение НЕ найдено в API');
        }
      } else {
        console.log('   (нет сообщений)');
        console.log('\n❌ ПРОБЛЕМА: API не вернул сообщения');
      }
    } else {
      console.log('\n❌ Webhook вернул ошибку');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
  }
}

testManagerMessageDetailed(); 