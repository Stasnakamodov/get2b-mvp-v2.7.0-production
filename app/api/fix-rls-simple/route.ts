import { NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { supabase } from "@/lib/supabaseClient";

export async function POST() {
  try {

    // Простой способ - делаем таблицы публично доступными
    // для всех авторизованных пользователей
    const results = [];

    // Проверяем доступ к таблицам
    const { data: roomsTest, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('id')
      .limit(1);

    if (roomsError) {
      results.push({ table: "chat_rooms", error: roomsError.message });
    } else {
      results.push({ table: "chat_rooms", accessible: true });
    }

    const { data: messagesTest, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);

    if (messagesError) {
      results.push({ table: "chat_messages", error: messagesError.message });
    } else {
      results.push({ table: "chat_messages", accessible: true });
    }

    const { data: participantsTest, error: participantsError } = await supabase
      .from('chat_participants')
      .select('id')
      .limit(1);

    if (participantsError) {
      results.push({ table: "chat_participants", error: participantsError.message });
    } else {
      results.push({ table: "chat_participants", accessible: true });
    }

    return NextResponse.json({
      success: true,
      message: "Проверка доступа к таблицам завершена",
      results,
      note: "Нужны админские права для изменения RLS политик",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error("Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Ошибка проверки таблиц",
      details: String(error)
    }, { status: 500 });
  }
} 