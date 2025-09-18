import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Используем service role key для административных операций
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST() {
  try {
    console.log("🔧 Исправляем RLS политики для chat таблиц...");

    // Отключаем RLS и удаляем проблемные политики
    const steps = [
      // Отключаем RLS
      "ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;",
      "ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;", 
      "ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;",
      
      // Удаляем все политики
      "DROP POLICY IF EXISTS \"Users can view their chat rooms\" ON chat_rooms;",
      "DROP POLICY IF EXISTS \"Users can create chat rooms\" ON chat_rooms;",
      "DROP POLICY IF EXISTS \"Users can view messages in their rooms\" ON chat_messages;",
      "DROP POLICY IF EXISTS \"Users can create messages in their rooms\" ON chat_messages;",
      "DROP POLICY IF EXISTS \"Users can view their participations\" ON chat_participants;",
      "DROP POLICY IF EXISTS \"Users can join chat rooms\" ON chat_participants;",
      
      // Включаем RLS обратно
      "ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;",
      "ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;",
      
      // Создаем простые политики БЕЗ рекурсии
      `CREATE POLICY "chat_rooms_select" ON chat_rooms 
       FOR SELECT USING (
         id IN (
           SELECT room_id FROM chat_participants 
           WHERE user_id = auth.uid()
         )
       );`,
       
      `CREATE POLICY "chat_rooms_insert" ON chat_rooms 
       FOR INSERT WITH CHECK (true);`,
       
      `CREATE POLICY "chat_participants_select" ON chat_participants 
       FOR SELECT USING (user_id = auth.uid());`,
       
      `CREATE POLICY "chat_participants_insert" ON chat_participants 
       FOR INSERT WITH CHECK (true);`,
       
      `CREATE POLICY "chat_messages_select" ON chat_messages 
       FOR SELECT USING (
         room_id IN (
           SELECT room_id FROM chat_participants 
           WHERE user_id = auth.uid()
         )
       );`,
       
      `CREATE POLICY "chat_messages_insert" ON chat_messages 
       FOR INSERT WITH CHECK (
         room_id IN (
           SELECT room_id FROM chat_participants 
           WHERE user_id = auth.uid()
         )
       );`
    ];

    const results = [];
    
    for (const sql of steps) {
      try {
        console.log("Выполняю:", sql.slice(0, 50) + "...");
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
        
        if (error) {
          console.error("Ошибка SQL:", error.message);
          results.push({ sql: sql.slice(0, 50), error: error.message });
        } else {
          results.push({ sql: sql.slice(0, 50), success: true });
        }
      } catch (e) {
        console.error("Исключение:", e);
        results.push({ sql: sql.slice(0, 50), exception: String(e) });
      }
    }

    return NextResponse.json({
      success: true,
      message: "RLS политики обновлены",
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Критическая ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Критическая ошибка исправления RLS",
      details: String(error)
    }, { status: 500 });
  }
} 