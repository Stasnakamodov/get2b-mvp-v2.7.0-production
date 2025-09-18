// Тест прямого сохранения сообщения от менеджера

const testDirectMessageSave = async () => {
  try {
    console.log('💾 Тестируем прямое сохранение сообщения от менеджера...');
    
    const messageData = {
      room_id: "1570961b-ca64-4de4-8170-a7ef99b2ae5b",
      content: "Тестовое сообщение от менеджера через API",
      sender_type: "manager",
      sender_manager_id: "987654321",
      sender_name: "Менеджер Get2B (Тест)",
      message_type: "text"
    };

    console.log('📦 Данные сообщения:', messageData);
    
    const response = await fetch('http://localhost:3000/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();
    
    console.log('📡 Статус:', response.status);
    console.log('📦 Ответ:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('✅ Сообщение сохранено через API!');
      console.log('🆔 ID сообщения:', result.message?.id);
      
      // Проверяем что сообщение появилось в чате
      console.log('\n🔍 Проверяем появилось ли сообщение...');
      
      const checkResponse = await fetch('http://localhost:3000/api/chat/messages?room_id=1570961b-ca64-4de4-8170-a7ef99b2ae5b&limit=3');
      const checkData = await checkResponse.json();
      
      console.log('📋 Последние сообщения:');
      checkData.messages?.forEach(msg => {
        console.log(`- ${msg.sender_type}: "${msg.content}" (${msg.sender_name}) [${msg.id}]`);
      });
      
    } else {
      console.log('❌ Ошибка сохранения:', result);
    }
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error);
  }
};

testDirectMessageSave(); 