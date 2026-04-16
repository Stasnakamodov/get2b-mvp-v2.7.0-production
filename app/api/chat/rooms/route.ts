import { logger } from "@/src/shared/lib/logger"
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pool } from "@/lib/db/pool";
import { getUserFromRequest } from "@/lib/auth";

// GET: Получить комнаты пользователя.
//
// Multi-party: возвращаем комнаты, где пользователь либо owner (`chat_rooms.user_id`),
// либо участник через `chat_participants`. Это нужно, в частности, для листинг-комнат
// (`room_type='listing'`), где owner — автор объявления, а второй участник —
// поставщик, добавленный в `chat_participants` через POST /api/listings/[id]/contact.
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Для listing-комнат подтягиваем:
    //   - listing_title (для шапки «По объявлению: …»)
    //   - other_participant_name/company (другой участник — автор для поставщика,
    //     поставщик для автора) через LATERAL LIMIT 1.
    // Для project/ai-комнат эти поля просто null.
    const result = await pool.query(
      `SELECT cr.id, cr.name, cr.room_type, cr.user_id, cr.project_id,
              cr.listing_id, cr.is_active, cr.created_at, cr.updated_at,
              l.title AS listing_title,
              COALESCE(ot_sp.name, ot_cp.name, ot_u.email) AS other_participant_name,
              COALESCE(ot_sp.company_name, ot_cp.legal_name) AS other_participant_company
         FROM chat_rooms cr
         LEFT JOIN listings l ON l.id = cr.listing_id
         LEFT JOIN LATERAL (
           SELECT cp2.user_id
             FROM chat_participants cp2
            WHERE cp2.room_id = cr.id
              AND cp2.user_id <> $1
              AND cp2.is_active = true
            ORDER BY cp2.joined_at
            LIMIT 1
         ) ot_link ON true
         LEFT JOIN users ot_u ON ot_u.id = ot_link.user_id
         LEFT JOIN supplier_profiles ot_sp
           ON ot_sp.user_id = ot_link.user_id AND ot_sp.is_default = true
         LEFT JOIN client_profiles ot_cp
           ON ot_cp.user_id = ot_link.user_id AND ot_cp.is_default = true
        WHERE cr.is_active = true
          AND (cr.user_id = $1
               OR EXISTS (
                 SELECT 1 FROM chat_participants cps
                  WHERE cps.room_id = cr.id
                    AND cps.user_id = $1
                    AND cps.is_active = true
               ))
        ORDER BY cr.updated_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      rooms: result.rows,
      count: result.rowCount ?? 0,
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

// POST: Создать новую комнату
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json();

    const {
      name,
      room_type = 'ai',
      user_id,
      project_id
    } = body;

    // Используем ID авторизованного пользователя
    const ownerId = user.id

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (project_id && !isValidUUID(project_id)) {
      return NextResponse.json(
        { error: "Invalid project_id format - must be valid UUID" },
        { status: 400 }
      );
    }

    // Проверка на дублирование для проектных комнат
    if (room_type === 'project' && project_id) {
      const { data: existingRoom } = await db
        .from('chat_rooms')
        .select('id, name')
        .eq('user_id', ownerId)
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

    // Создаем комнату
    const roomData: any = {
      name,
      room_type,
      user_id: ownerId,
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

// DELETE: Удалить комнату чата
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('room_id');

    if (!roomId) {
      return NextResponse.json(
        { error: "room_id is required" },
        { status: 400 }
      );
    }

    if (!isValidUUID(roomId)) {
      return NextResponse.json(
        { error: "Invalid UUID format" },
        { status: 400 }
      );
    }

    // Проверяем что комната существует и принадлежит авторизованному пользователю
    const { data: existingRoom, error: checkError } = await db
      .from('chat_rooms')
      .select('id, name, room_type')
      .eq('id', roomId)
      .eq('user_id', user.id)
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
      .eq('user_id', user.id);

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