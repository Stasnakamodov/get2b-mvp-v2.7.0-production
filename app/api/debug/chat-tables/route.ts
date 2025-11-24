import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {

    // 1. Проверка подключения
    const { data: connectionTest, error: connectionError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: "Ошибка подключения к Supabase",
        details: connectionError.message
      });
    }


    // 2. Проверка существования таблиц чатов
    const chatTablesCheck = [];
    
    for (const tableName of ['chat_rooms', 'chat_messages', 'chat_participants']) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      chatTablesCheck.push({
        table_name: tableName,
        exists: !error,
        error: error?.message || null
      });
    }


    // 3. Проверка функции get_user_chat_rooms
    let functionCheck = null;
    const testUserId = "00000000-0000-0000-0000-000000000000";
    const { data: functionData, error: functionError } = await supabase
      .rpc('get_user_chat_rooms', { p_user_id: testUserId });

    if (!functionError) {
      functionCheck = "✅ Функция get_user_chat_rooms работает";
    } else {
      functionCheck = `❌ Функция get_user_chat_rooms недоступна: ${functionError.message}`;
    }


    // 4. Пробный запрос к таблице (если существует)
    let roomsTestResult = null;
    const { data: roomsData, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('count')
      .limit(1);

    if (!roomsError) {
      roomsTestResult = "✅ Таблица chat_rooms доступна";
    } else {
      roomsTestResult = `❌ Таблица chat_rooms недоступна: ${roomsError.message}`;
    }


    // 5. Тест создания комнаты (если таблицы есть)
    let createRoomTest = null;
    if (!roomsError) {
      const testUserId = "00000000-0000-0000-0000-000000000000"; // Фиктивный ID для теста
      const { data: createData, error: createError } = await supabase
        .from('chat_rooms')
        .insert([{
          user_id: testUserId,
          room_type: 'ai',
          name: 'Тестовая комната',
          description: 'Тест API'
        }])
        .select()
        .single();

      if (!createError) {
        createRoomTest = "✅ Создание комнат работает";
        // Удаляем тестовую комнату
        await supabase.from('chat_rooms').delete().eq('id', createData.id);
      } else {
        createRoomTest = `❌ Ошибка создания комнат: ${createError.message}`;
      }
    }

    // Подсчет готовности системы
    const tablesExist = chatTablesCheck.filter(t => t.exists).length;
    const allTablesReady = tablesExist === 3;
    const functionWorks = !functionError;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      diagnostics: {
        connection: "✅ Подключение работает",
        tables: chatTablesCheck,
        tables_summary: `${tablesExist}/3 таблиц готово`,
        functions: functionCheck, 
        chat_rooms_access: roomsTestResult,
        create_room_test: createRoomTest,
        system_ready: allTablesReady && functionWorks,
        next_steps: allTablesReady ? 
          "✅ Система готова к работе!" : 
          "❌ Выполните SQL скрипт: create-chathub-tables-simple.sql",
        errors: {
          function_error: functionError?.message,
          rooms_error: roomsError?.message
        }
      }
    });

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    return NextResponse.json({
      success: false,
      error: "Неожиданная ошибка",
      details: String(error),
      timestamp: new Date().toISOString()
    });
  }
} 