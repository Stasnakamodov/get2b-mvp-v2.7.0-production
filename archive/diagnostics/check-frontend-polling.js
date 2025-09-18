// Проверка загрузки сообщений как это делает фронтенд

const checkFrontendMessages = async () => {
  try {
    console.log('🔍 Проверяем как фронтенд получает сообщения...');
    
    // Тестируем с теми же параметрами что использует фронтенд
    const roomId = '1570961b-ca64-4de4-8170-a7ef99b2ae5b';
    
    console.log('📡 Запрос 1: Свежие сообщения (как polling)');
    const response1 = await fetch(`http://localhost:3000/api/chat/messages?room_id=${roomId}&limit=50&offset=0`);
    const data1 = await response1.json();
    
    console.log('📊 Статус:', response1.status);
    console.log('📊 Всего сообщений:', data1.messages?.length || 0);
    
    if (data1.messages) {
      console.log('\n📋 Последние 5 сообщений (как видит фронтенд):');
      data1.messages.slice(0, 5).forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.sender_type}] "${msg.content}" - ${msg.sender_name} (${msg.created_at})`);
      });
      
      // Считаем сообщения от менеджеров
      const managerMessages = data1.messages.filter(msg => msg.sender_type === 'manager');
      console.log(`\n📊 Сообщений от менеджеров: ${managerMessages.length}`);
      
      if (managerMessages.length > 0) {
        console.log('📋 Сообщения от менеджеров:');
        managerMessages.forEach((msg, index) => {
          console.log(`${index + 1}. "${msg.content}" - ${msg.sender_name} (${msg.created_at})`);
        });
      }
    }
    
    // Проверяем есть ли новые сообщения за последние 10 минут
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    const recentMessages = data1.messages?.filter(msg => 
      new Date(msg.created_at) > tenMinutesAgo
    ) || [];
    
    console.log(`\n📊 Новых сообщений за последние 10 минут: ${recentMessages.length}`);
    
    if (recentMessages.length > 0) {
      console.log('📋 Новые сообщения:');
      recentMessages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.sender_type}] "${msg.content}" - ${msg.sender_name}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Ошибка проверки:', error);
  }
};

checkFrontendMessages(); 