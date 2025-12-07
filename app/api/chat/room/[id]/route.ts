import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
// GET: Получить информацию о комнате
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const roomId = id;

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Получаем информацию о комнате
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        project:project_id(
          id,
          name,
          status,
          amount,
          currency
        )
      `)
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    // Получаем участников комнаты
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true);

    if (participantsError) {
      logger.error('Error fetching participants:', participantsError);
    }

    // Получаем статистику сообщений
    const { data: messageStats, error: statsError } = await supabase
      .from('chat_messages')
      .select('sender_type')
      .eq('room_id', roomId);

    if (statsError) {
      logger.error('Error fetching message stats:', statsError);
    }

    // Подсчитываем статистику
    const stats = {
      total_messages: messageStats?.length || 0,
      user_messages: messageStats?.filter(m => m.sender_type === 'user').length || 0,
      ai_messages: messageStats?.filter(m => m.sender_type === 'ai').length || 0,
      manager_messages: messageStats?.filter(m => m.sender_type === 'manager').length || 0
    };

    // Получаем менеджеров проекта (если это проектная комната)
    let assignedManagers = [];
    if (room.room_type === 'project' && room.project_id) {
      const { data: managers, error: managersError } = await supabase
        .from('manager_assignments')
        .select('*')
        .eq('project_id', room.project_id)
        .eq('assignment_status', 'active');

      if (!managersError && managers) {
        assignedManagers = managers;
      }
    }

    return NextResponse.json({
      success: true,
      room: {
        ...room,
        participants: participants || [],
        assigned_managers: assignedManagers,
        stats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Unexpected error in GET /api/chat/room/[id]:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// PUT: Обновить настройки комнаты
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const roomId = id;
    const body = await request.json();
    const { name, description, ai_context, is_active, is_archived } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Подготавливаем данные для обновления
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (ai_context !== undefined) updateData.ai_context = ai_context;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_archived !== undefined) updateData.is_archived = is_archived;

    // Обновляем комнату
    const { data: updatedRoom, error } = await supabase
      .from('chat_rooms')
      .update(updateData)
      .eq('id', roomId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating room:', error);
      return NextResponse.json(
        { error: "Failed to update room", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      room: updatedRoom,
      message: "Комната обновлена успешно"
    });

  } catch (error) {
    logger.error('Unexpected error in PUT /api/chat/room/[id]:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Удалить комнату (только AI комнаты)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const roomId = id;

    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Проверяем что это AI комната (проектные комнаты удалять нельзя)
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('room_type')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    if (room.room_type === 'project') {
      return NextResponse.json(
        { error: "Project rooms cannot be deleted" },
        { status: 403 }
      );
    }

    // Помечаем комнату как архивированную вместо удаления
    const { error: updateError } = await supabase
      .from('chat_rooms')
      .update({ 
        is_archived: true, 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (updateError) {
      logger.error('Error archiving room:', updateError);
      return NextResponse.json(
        { error: "Failed to archive room", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "AI комната архивирована успешно"
    });

  } catch (error) {
    logger.error('Unexpected error in DELETE /api/chat/room/[id]:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
} 