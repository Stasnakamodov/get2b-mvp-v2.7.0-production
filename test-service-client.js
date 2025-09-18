require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testServiceClient() {
  console.log('🔧 Тестируем service клиент Supabase...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('🔗 URL:', supabaseUrl);
  console.log('🔑 Service Key (первые 20):', supabaseServiceKey?.substring(0, 20) + '...');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Переменные окружения не загружены!');
    return;
  }
  
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Проверяем доступ к комнате
    console.log('🏠 Проверяю доступ к комнате...');
    const { data: room, error: roomError } = await supabaseService
      .from('chat_rooms')
      .select('id, name, project_id')
      .eq('id', '1570961b-ca64-4de4-8170-a7ef99b2ae5b')
      .single();
    
    if (roomError) {
      console.log('❌ Ошибка поиска комнаты:', roomError);
    } else if (room) {
      console.log('✅ Комната найдена:', room.name, '(', room.project_id, ')');
    } else {
      console.log('❌ Комната не найдена');
    }
    
    // Пробуем сохранить тестовое сообщение
    console.log('\n💾 Пробуем сохранить тестовое сообщение...');
    const testMessage = {
      room_id: '1570961b-ca64-4de4-8170-a7ef99b2ae5b',
      content: `SERVICE TEST ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`,
      sender_type: 'manager',
      sender_manager_id: '987654321',
      sender_name: 'Service Test Manager',
      message_type: 'text'
    };
    
    const { data: newMessage, error: saveError } = await supabaseService
      .from('chat_messages')
      .insert(testMessage)
      .select()
      .single();
    
    if (saveError) {
      console.log('❌ Ошибка сохранения:', saveError);
    } else {
      console.log('✅ Сообщение сохранено! ID:', newMessage.id);
      console.log('📝 Содержание:', newMessage.content);
    }
    
  } catch (error) {
    console.error('💥 Ошибка тестирования:', error);
  }
}

testServiceClient(); 