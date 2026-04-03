import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET: Получить сообщения в комнате
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!roomId) {
      // Missing room_id error
      return NextResponse.json(
        { error: "room_id is required" },
        { status: 400 }
      );
    }

    // ПРОВЕРЯЕМ UUID ФОРМАТ
    if (!isValidUUID(roomId)) {
      // Invalid UUID format error
      return NextResponse.json(
        { error: "Invalid room_id format - must be valid UUID" },
        { status: 400 }
      );
    }

    // САМЫЙ ПРОСТОЙ ЗАПРОС БЕЗ ВСЯКИХ ПРОВЕРОК (ИСПРАВЛЕН для менеджеров)
    // Direct query to chat_messages
    
    const { data: messages, error } = await db
      .from('chat_messages')
      .select(`
        id,
        room_id,
        content,
        sender_type,
        sender_name,
        sender_user_id,
        sender_manager_id,
        message_type,
        created_at
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('❌ DEBUG: Database error:', error);
      return NextResponse.json(
        { error: "Failed to fetch messages", details: error.message },
        { status: 500 }
      );
    }

    // Messages fetched successfully

    return NextResponse.json({
      success: true,
      messages: messages || [],
      room_id: roomId,
      count: messages?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('💥 DEBUG: Unexpected error in GET /api/chat/messages:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Отправить сообщение в комнату
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();

    const {
      room_id,
      content,
      sender_type = 'user',
      sender_user_id,
      sender_manager_id,
      sender_name,
      message_type = 'text'
    } = body;

    if (!room_id || !content) {
      return NextResponse.json(
        { error: "room_id and content are required" },
        { status: 400 }
      );
    }

    // Проверяем что sender_user_id совпадает с авторизованным пользователем
    if (sender_type === 'user' && sender_user_id && sender_user_id !== user.id) {
      return NextResponse.json(
        { error: "sender_user_id does not match authenticated user" },
        { status: 403 }
      );
    }

    // ПРОВЕРЯЕМ UUID ФОРМАТЫ
    if (!isValidUUID(room_id)) {
      return NextResponse.json(
        { error: "Invalid room_id format - must be valid UUID" },
        { status: 400 }
      );
    }

    if (sender_user_id && !isValidUUID(sender_user_id)) {
      return NextResponse.json(
        { error: "Invalid sender_user_id format - must be valid UUID" },
        { status: 400 }
      );
    }

    // НЕ ПРОВЕРЯЕМ КОМНАТУ - ПРОСТО СОЗДАЕМ СООБЩЕНИЕ

    // Создаем сообщение НАПРЯМУЮ - ПОДДЕРЖКА МЕНЕДЖЕРОВ
    const messageData: any = {
      room_id,
      content,
      sender_type,
      sender_name: sender_name || (sender_type === 'manager' ? 'Менеджер Get2B' : 'Пользователь'),
      message_type
    };

    // Добавляем sender_user_id из авторизованного пользователя
    if (sender_type === 'user') {
      messageData.sender_user_id = sender_user_id || user.id;
    }

    // 🔧 НОВОЕ: Добавляем поддержку sender_manager_id для менеджеров
    if (sender_type === 'manager' && sender_manager_id) {
      messageData.sender_manager_id = sender_manager_id;
    }


    const { data: newMessage, error } = await db
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      logger.error('❌ DEBUG: Error creating message:', error);
      return NextResponse.json(
        { error: "Failed to send message", details: error.message },
        { status: 500 }
      );
    }


    // 🔔 УВЕДОМЛЕНИЯ МЕНЕДЖЕРАМ для проектных комнат (только для пользователей)
    if (sender_type === 'user') {
      
      try {
        // Получаем информацию о комнате
        const { data: room, error: roomError } = await db
          .from('chat_rooms')
          .select('room_type, project_id, name')
          .eq('id', room_id)
          .single();

        if (room && room.room_type === 'project' && room.project_id) {
          
          // Получаем информацию о проекте
          const { data: project, error: projectError } = await db
            .from('projects')
            .select('name, company_data')
            .eq('id', room.project_id)
            .single();

          // Уведомляем менеджеров через Telegram
          const { notifyManagersAboutNewMessage } = await import('@/lib/telegram-chat-integration');
          
          await notifyManagersAboutNewMessage({
            roomId: room_id,
            projectId: room.project_id,
            userMessage: content,
            userName: sender_name || 'Клиент',
            projectName: project?.name || room.name,
            companyName: project?.company_data?.name || 'Не указана',
            messageId: newMessage.id
          });
          
        } else {
        }
      } catch (notifyError) {
        logger.error('⚠️ DEBUG: Error notifying managers (non-critical):', notifyError);
        // Не блокируем отправку сообщения из-за ошибки уведомлений
      }
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
      message_text: "Сообщение отправлено успешно"
    });

  } catch (error) {
    logger.error('💥 DEBUG: Unexpected error in POST /api/chat/messages:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Функция проверки UUID формата
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
} 