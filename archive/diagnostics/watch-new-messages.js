// Мониторинг новых сообщений от менеджеров

const watchMessages = async () => {
  console.log('👁️ Мониторинг новых сообщений от менеджеров...');
  console.log('📨 Отправьте сообщение в чат проекта и ответьте через Telegram');
  console.log('🔄 Проверяю каждые 3 секунды...\n');
  
  let lastMessageId = null;
  
  const checkMessages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/chat/messages?room_id=1570961b-ca64-4de4-8170-a7ef99b2ae5b&limit=5');
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const newestMessage = data.messages[0];
        
        // Если это новое сообщение
        if (newestMessage.id !== lastMessageId) {
          lastMessageId = newestMessage.id;
          
          const time = new Date().toLocaleTimeString();
          console.log(`⏰ ${time} - Новое сообщение:`);
          console.log(`   📝 "${newestMessage.content}"`);
          console.log(`   👤 ${newestMessage.sender_name} (${newestMessage.sender_type})`);
          console.log(`   🆔 ${newestMessage.id}`);
          
          if (newestMessage.sender_type === 'manager') {
            console.log('   🎉 ЭТО СООБЩЕНИЕ ОТ МЕНЕДЖЕРА! Telegram интеграция работает!');
          }
          console.log('');
        }
      }
    } catch (error) {
      console.error('❌ Ошибка проверки:', error.message);
    }
  };
  
  // Первоначальная проверка
  await checkMessages();
  
  // Проверяем каждые 3 секунды
  setInterval(checkMessages, 3000);
};

watchMessages(); 