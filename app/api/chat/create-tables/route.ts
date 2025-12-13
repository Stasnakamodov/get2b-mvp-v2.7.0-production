import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
export async function POST(request: NextRequest) {
  try {

    // Попробуем создать тестовую запись в chat_rooms_temp
    const testRoomData = {
      id: '00000000-0000-0000-0000-000000000000',
      user_id: 'test',
      room_type: 'ai',
      name: 'Test Room',
      ai_context: 'general',
      description: 'Test room for table creation',
      is_active: true,
      is_archived: false
    };

    const { data: roomResult, error: roomError } = await supabase
      .from('chat_rooms_temp')
      .upsert(testRoomData)
      .select();

    // Попробуем создать тестовую запись в chat_messages_temp  
    const testMessageData = {
      id: '00000000-0000-0000-0000-000000000001',
      room_id: '00000000-0000-0000-0000-000000000000',
      sender_type: 'system',
      sender_user_id: 'test',
      sender_name: 'System',
      content: 'Test message for table creation',
      message_type: 'text',
      is_read: false
    };

    const { data: messageResult, error: messageError } = await supabase
      .from('chat_messages_temp')
      .upsert(testMessageData)
      .select();

    // Удаляем тестовые данные
    if (!roomError) {
      await supabase
        .from('chat_rooms_temp')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
    }

    if (!messageError) {
      await supabase
        .from('chat_messages_temp')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000001');
    }


    const tablesExist = {
      chat_rooms_temp: !roomError,
      chat_messages_temp: !messageError
    };

    return NextResponse.json({
      success: true,
      message: "Temporary chat tables verified",
      tables_exist: tablesExist,
      errors: {
        rooms: roomError?.message,
        messages: messageError?.message
      }
    });

  } catch (error) {
    logger.error('💥 Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to verify tables", details: String(error) },
      { status: 500 }
    );
  }
} 