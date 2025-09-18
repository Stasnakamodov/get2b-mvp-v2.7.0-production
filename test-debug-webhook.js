require('dotenv').config({ path: '.env.local' });

async function testDebugWebhook() {
  console.log('🔍 Тестирую диагностический webhook...\n');
  
  const testMessage = `DEBUG TEST ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
  
  const webhookPayload = {
    update_id: Date.now(),
    message: {
      message_id: Date.now(),
      from: {
        id: 987654321,
        is_bot: false,
        first_name: "Debug",
        last_name: "Test",
        username: "debug_test"
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

  console.log('📤 Отправляю на debug endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/debug-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.json();
    console.log(`✅ Debug webhook ответ (${response.status}):`);
    console.log(JSON.stringify(result, null, 2));
    
    if (result.analysis) {
      console.log('\n📊 АНАЛИЗ:');
      console.log(`   Есть сообщение: ${result.analysis.hasMessage ? '✅' : '❌'}`);
      console.log(`   Текст сообщения: "${result.analysis.messageText}"`);
      console.log(`   Есть reply: ${result.analysis.hasReply ? '✅' : '❌'}`);
      console.log(`   Текст reply: "${result.analysis.replyText || 'НЕТ'}"`);
      console.log(`   Есть ID проекта: ${result.analysis.hasProjectId ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testDebugWebhook(); 