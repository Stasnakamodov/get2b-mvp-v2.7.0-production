require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDatabaseSave() {
  console.log('🗄️ Тестируем прямое сохранение в базу данных...\n');
  
  // Создаем Supabase клиент с service role ключом
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('🔗 Supabase URL:', process.env.SUPABASE_URL);
  console.log('🔑 Service Role Key (первые 10 символов):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...');
  
  const testMessage = {
    room_id: '1570961b-ca64-4de4-8170-a7ef99b2ae5b',
    content: `Тест сохранения ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
    sender_type: 'manager',
    sender_manager_id: '987654321',
    sender_name: 'Тестовый Менеджер',
    message_type: 'text'
  };
  
  console.log('💾 Сохраняю сообщение:', testMessage);
  
  try {
    // Сначала проверим существует ли комната
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('id, name, project_id')
      .eq('id', testMessage.room_id)
      .single();
    
    console.log('🏠 Комната:', room ? `✅ ${room.name} (${room.project_id})` : `❌ Не найдена`);
    if (roomError) {
      console.log('❌ Ошибка поиска комнаты:', roomError);
    }
    
    // Теперь пробуем сохранить сообщение
    const { data: newMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert(testMessage)
      .select()
      .single();
    
    if (saveError) {
      console.log('❌ Ошибка сохранения сообщения:', saveError);
    } else {
      console.log('✅ Сообщение сохранено успешно!');
      console.log('📝 ID сообщения:', newMessage.id);
      console.log('⏰ Время создания:', newMessage.created_at);
    }
    
    // Проверим что сообщение действительно сохранилось
    const { data: savedMessage, error: checkError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('id', newMessage?.id)
      .single();
    
    if (checkError) {
      console.log('❌ Ошибка проверки сохранения:', checkError);
    } else {
      console.log('🔍 Проверка: сообщение найдено в базе ✅');
    }
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error);
  }
}

testDatabaseSave(); 