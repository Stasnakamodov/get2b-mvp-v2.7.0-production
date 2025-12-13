import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {

    const analysis: any = {
      allTables: [],
      chatTables: [],
      messageTables: [],
      roomTables: [],
      oldTables: [],
      foreignKeys: [],
      indexes: [],
      data: {},
      summary: {}
    };

    // 1. Получение всех таблиц
    try {
      const { data: allTables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')
        .order('table_name');

      if (!error && allTables) {
        analysis.allTables = allTables.map((table: any) => table.table_name);
      }
    } catch (err) {
      logger.warn("⚠️ Не удалось получить список всех таблиц через Supabase API");
    }

    // 2. Анализ таблиц с "chat" в названии
    const chatRelatedTables = analysis.allTables.filter((name: string) => 
      name.toLowerCase().includes('chat')
    );
    analysis.chatTables = chatRelatedTables;

    // 3. Анализ таблиц с "message" в названии
    const messageRelatedTables = analysis.allTables.filter((name: string) => 
      name.toLowerCase().includes('message')
    );
    analysis.messageTables = messageRelatedTables;

    // 4. Анализ таблиц с "room" в названии
    const roomRelatedTables = analysis.allTables.filter((name: string) => 
      name.toLowerCase().includes('room')
    );
    analysis.roomTables = roomRelatedTables;

    // 5. Поиск потенциально старых таблиц
    const oldTableKeywords = ['old', 'temp', 'backup', 'archive', 'legacy', 'deprecated'];
    const oldTables = analysis.allTables.filter((name: string) => 
      oldTableKeywords.some(keyword => name.toLowerCase().includes(keyword))
    );
    analysis.oldTables = oldTables;

    // 6. Проверка данных в известных таблицах чата
    const knownChatTables = ['chat_rooms', 'chat_messages'];
    
    for (const tableName of knownChatTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          analysis.data[tableName] = count;
        } else {
          analysis.data[tableName] = 'TABLE_NOT_EXISTS';
        }
      } catch (err) {
        analysis.data[tableName] = 'TABLE_NOT_EXISTS';
      }
    }

    // 7. Проверка структуры chat_rooms
    try {
      const { data: roomSample, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .limit(1);

      if (!error && roomSample && roomSample.length > 0) {
        analysis.structures = analysis.structures || {};
        analysis.structures.chat_rooms = Object.keys(roomSample[0]);
      }
    } catch (err) {
      analysis.structures = analysis.structures || {};
      analysis.structures.chat_rooms = 'ERROR';
    }

    // 8. Проверка структуры chat_messages
    try {
      const { data: messageSample, error } = await supabase
        .from('chat_messages')
        .select('*')
        .limit(1);

      if (!error && messageSample && messageSample.length > 0) {
        analysis.structures = analysis.structures || {};
        analysis.structures.chat_messages = Object.keys(messageSample[0]);
      }
    } catch (err) {
      analysis.structures = analysis.structures || {};
      analysis.structures.chat_messages = 'ERROR';
    }

    // 9. Поиск дублирующих таблиц
    const allChatRelated = [
      ...chatRelatedTables,
      ...messageRelatedTables,
      ...roomRelatedTables
    ];
    
    const duplicates = allChatRelated.filter((table: string, index: number) => 
      allChatRelated.indexOf(table) !== index
    );
    
    analysis.duplicates = duplicates;

    // 10. Итоговая сводка
    analysis.summary = {
      totalTables: analysis.allTables.length,
      chatRelatedTables: chatRelatedTables.length,
      messageRelatedTables: messageRelatedTables.length,
      roomRelatedTables: roomRelatedTables.length,
      oldTables: oldTables.length,
      duplicates: duplicates.length,
      activeChatTables: Object.keys(analysis.data).filter(key => 
        analysis.data[key] !== 'TABLE_NOT_EXISTS'
      ).length,
      analysisDate: new Date().toISOString()
    };


    return NextResponse.json({
      success: true,
      analysis,
      message: "Анализ таблиц чата завершен"
    });

  } catch (error) {
    logger.error("❌ [API] Критическая ошибка при анализе таблиц чата:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 