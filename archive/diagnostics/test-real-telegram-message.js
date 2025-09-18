// Тест с реальными данными из Telegram

const testRealTelegramMessage = async () => {
  // Симулируем РЕАЛЬНОЕ сообщение от менеджера
  const telegramUpdate = {
    message: {
      message_id: 456,
      from: {
        id: 987654321,
        first_name: "Менеджер Get2B",
        username: "manager_get2b"
      },
      chat: {
        id: 987654321,
        type: "private"
      },
      text: "Привет! Проект в работе. Ожидаем поставки через 2 недели.",
      reply_to_message: {
        text: "💬 НОВОЕ СООБЩЕНИЕ В ЧАТЕ\n\n🆔 Проект: b7f63bf3-3cfa-4b2c-8a42-ee7b19c53c2d\n📋 Название: ловыдрадлгфтыуолатфгыя\n🏢 Компания: Игрик Иванов\n👤 От кого: Вы\n\n💬 Сообщение:\n\"xt nfv\"\n\n❗ Ответьте на это сообщение, чтобы отправить ответ клиенту в чат."
      }
    }
  };

  try {
    console.log('🤖 Отправляем РЕАЛЬНОЕ сообщение от менеджера...');
    console.log('📦 Данные:', JSON.stringify(telegramUpdate, null, 2));
    
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
      console.log('✅ Telegram webhook сработал!');
      
      // Проверяем появилось ли сообщение в чате
      console.log('\n🔍 Проверяем сообщения в чате...');
      
      const checkResponse = await fetch('http://localhost:3000/api/chat/messages?room_id=1570961b-ca64-4de4-8170-a7ef99b2ae5b&limit=3');
      const checkData = await checkResponse.json();
      
      console.log('📋 Последние сообщения:');
      checkData.messages?.forEach(msg => {
        console.log(`- ${msg.sender_type}: "${msg.content}" (${msg.sender_name})`);
      });
      
    } else {
      console.log('❌ Ошибка:', result);
    }
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error);
  }
};

testRealTelegramMessage(); 