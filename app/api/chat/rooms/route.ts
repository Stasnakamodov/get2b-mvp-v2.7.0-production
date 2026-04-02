import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
// GET: Получить комнаты пользователя - УЛЬТРА-БЕЗОПАСНАЯ ВЕРСИЯ
export async function GET(request: NextRequest) {
  try {
    // DEBUG: Chat rooms GET called (logging disabled for performance)
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // ПРОВЕРЯЕМ UUID ФОРМАТ
    if (userId && !isValidUUID(userId)) {
      // Invalid UUID format error
      return NextResponse.json(
        { error: "Invalid user_id format - must be valid UUID" },
        { status: 400 }
      );
    }

    // ПРОСТОЙ ЗАПРОС БЕЗ RLS ПРОВЕРОК
    // Direct query to chat_rooms
    
    let query = db
      .from('chat_rooms')
      .select(`
        id,
        name,
        room_type,
        user_id,
        project_id,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    // Фильтруем по пользователю только если передан ВАЛИДНЫЙ UUID
    if (userId && isValidUUID(userId)) {
      query = query.eq('user_id', userId);
    }

    const { data: rooms, error } = await query;

    if (error) {
      logger.error('❌ DEBUG: Database error:', error);
      return NextResponse.json(
        { error: "Failed to fetch rooms", details: error.message },
        { status: 500 }
      );
    }

    // Rooms fetched successfully

    return NextResponse.json({
      success: true,
      rooms: rooms || [],
      count: rooms?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('💥 DEBUG: Unexpected error in GET /api/chat/rooms:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// POST: Создать новую комнату - УЛЬТРА-БЕЗОПАСНАЯ ВЕРСИЯ
export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    
    const { 
      name, 
      room_type = 'ai',
      user_id,
      project_id 
    } = body;

    if (!name || !user_id) {
      return NextResponse.json(
        { error: "name and user_id are required" },
        { status: 400 }
      );
    }

    // ПРОВЕРЯЕМ UUID ФОРМАТЫ
    if (!isValidUUID(user_id)) {
      return NextResponse.json(
        { error: "Invalid user_id format - must be valid UUID" },
        { status: 400 }
      );
    }

    if (project_id && !isValidUUID(project_id)) {
      return NextResponse.json(
        { error: "Invalid project_id format - must be valid UUID" },
        { status: 400 }
      );
    }

    // 🛡️ ДОПОЛНИТЕЛЬНАЯ проверка на дублирование для проектных комнат
    if (room_type === 'project' && project_id) {
      const { data: existingRoom } = await db
        .from('chat_rooms')
        .select('id, name')
        .eq('user_id', user_id)
        .eq('project_id', project_id)
        .eq('room_type', 'project')
        .eq('is_active', true)
        .single();
      
      if (existingRoom) {
        return NextResponse.json({
          success: true,
          room: existingRoom,
          message: "Room already exists"
        });
      }
    }

    // Создаем комнату с оптимальными параметрами
    const roomData: any = {
      name,
      room_type,
      user_id,
      is_active: true
    };

    if (project_id) {
      roomData.project_id = project_id;
    }


    const { data: newRoom, error } = await db
      .from('chat_rooms')
      .insert(roomData)
      .select()
      .single();

    if (error) {
      logger.error('❌ DEBUG: Error creating room:', error);
      return NextResponse.json(
        { error: "Failed to create room", details: error.message },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      room: newRoom,
      message: "Комната создана успешно"
    });

  } catch (error) {
    logger.error('💥 DEBUG: Unexpected error in POST /api/chat/rooms:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Удалить комнату чата - ИСПРАВЛЕННАЯ ВЕРСИЯ
export async function DELETE(request: NextRequest) {
  try {
    
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room_id');
    const userId = searchParams.get('user_id');


    if (!roomId || !userId) {
      return NextResponse.json(
        { error: "room_id and user_id are required" },
        { status: 400 }
      );
    }

    // ПРОВЕРЯЕМ UUID ФОРМАТЫ
    if (!isValidUUID(roomId) || !isValidUUID(userId)) {
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 }
      );
    }


    // ШАГ 1: Проверяем что комната существует и принадлежит пользователю
    const { data: existingRoom, error: checkError } = await db
      .from('chat_rooms')
      .select('id, name, room_type')
      .eq('id', roomId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingRoom) {
      return NextResponse.json(
        { error: "Room not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }


    // ШАГ 2: Безопасно удаляем сообщения (игнорируем ошибки)
    try {
      const { error: messagesError } = await db
        .from('chat_messages')
        .delete()
        .eq('room_id', roomId);

      if (messagesError) {
        logger.warn('⚠️ DEBUG: Warning deleting messages (non-critical):', messagesError.message);
      } else {
      }
    } catch (msgError) {
      logger.warn('⚠️ DEBUG: Non-critical error deleting messages:', msgError);
    }

    // ШАГ 3: Удаляем комнату 
    const { error: roomError } = await db
      .from('chat_rooms')
      .delete()
      .eq('id', roomId)
      .eq('user_id', userId);

    if (roomError) {
      logger.error('❌ DEBUG: Failed to delete room:', roomError);
      return NextResponse.json(
        { error: "Failed to delete room", details: roomError.message },
        { status: 500 }
      );
    }


    return NextResponse.json({
      success: true,
      message: "Room deleted successfully",
      deletedRoom: existingRoom
    });

  } catch (error) {
    logger.error('💥 DEBUG: Unexpected error in DELETE /api/chat/rooms:', error);
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