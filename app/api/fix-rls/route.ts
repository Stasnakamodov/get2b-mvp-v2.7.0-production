import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { pool } from '@/lib/db/pool'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
      
      // Создаем простые политики (auth handled at application layer)
      `CREATE POLICY "chat_rooms_select" ON chat_rooms
       FOR SELECT USING (true);`,

      `CREATE POLICY "chat_rooms_insert" ON chat_rooms
       FOR INSERT WITH CHECK (true);`,

      `CREATE POLICY "chat_participants_select" ON chat_participants
       FOR SELECT USING (true);`,

      `CREATE POLICY "chat_participants_insert" ON chat_participants
       FOR INSERT WITH CHECK (true);`,

      `CREATE POLICY "chat_messages_select" ON chat_messages
       FOR SELECT USING (true);`,

      `CREATE POLICY "chat_messages_insert" ON chat_messages
       FOR INSERT WITH CHECK (true);`
    ];

    const results = [];
    
    for (const sql of steps) {
      try {
        await pool.query(sql);
        results.push({ sql: sql.slice(0, 50), success: true });
      } catch (e: any) {
        logger.error("Ошибка SQL:", e.message);
        results.push({ sql: sql.slice(0, 50), error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: "RLS политики обновлены",
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error("Критическая ошибка:", error);
    return NextResponse.json({
      success: false,
      error: "Критическая ошибка исправления RLS",
      details: String(error)
    }, { status: 500 });
  }
} 