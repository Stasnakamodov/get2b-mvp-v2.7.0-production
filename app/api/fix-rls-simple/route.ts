import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST() {
  try {
    console.log("🔧 ВРЕМЕННО отключаем RLS для чат-таблиц...");

    // Простой способ - делаем таблицы публично доступными
    // для всех авторизованных пользователей
    const results = [];

    // Проверяем доступ к таблицам
    const { data: roomsTest, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('id')
      .limit(1);

    if (roomsError) {
      console.log("❌ Ошибка chat_rooms:", roomsError.message);
      results.push({ table: "chat_rooms", error: roomsError.message });
    } else {
      console.log("✅ chat_rooms доступна");
      results.push({ table: "chat_rooms", accessible: true });
    }

    const { data: messagesTest, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);

    if (messagesError) {
      console.log("❌ Ошибка chat_messages:", messagesError.message);
      results.push({ table: "chat_messages", error: messagesError.message });
    } else {
      console.log("✅ chat_messages доступна");
      results.push({ table: "chat_messages", accessible: true });
    }

    const { data: participantsTest, error: participantsError } = await supabase
      .from('chat_participants')
      .select('id')
      .limit(1);

    if (participantsError) {
      console.log("❌ Ошибка chat_participants:", participantsError.message);
      results.push({ table: "chat_participants", error: participantsError.message });
    } else {
      console.log("✅ chat_participants доступна");
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
    console.error("Ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Ошибка проверки таблиц",
      details: String(error)
    }, { status: 500 });
  }
} 