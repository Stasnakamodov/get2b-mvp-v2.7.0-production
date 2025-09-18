import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [API] Показываем все таблицы чата...");

    const chatTables = [
      // АКТИВНЫЕ ТАБЛИЦЫ (НЕ УДАЛЯТЬ!)
      'chat_rooms',
      'chat_messages',
      
      // СТАРЫЕ ТАБЛИЦЫ (МОЖНО УДАЛИТЬ)
      'chats',
      'messages', 
      'rooms',
      'chat_old',
      'messages_old',
      'rooms_old',
      'chat_temp',
      'messages_temp',
      'rooms_temp',
      'chat_backup',
      'messages_backup',
      'rooms_backup',
      'chat_archive',
      'messages_archive',
      'rooms_archive',
      'chat_legacy',
      'messages_legacy',
      'rooms_legacy',
      'chat_deprecated',
      'messages_deprecated',
      'rooms_deprecated'
    ];

    const analysis: any = {
      activeTables: [],
      oldTables: [],
      summary: {}
    };

    for (const tableName of chatTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          const tableInfo = {
            name: tableName,
            exists: true,
            recordCount: count,
            status: '',
            recommendation: ''
          };

          // Определяем статус и рекомендации
          if (tableName === 'chat_rooms' || tableName === 'chat_messages') {
            tableInfo.status = 'ACTIVE';
            tableInfo.recommendation = 'НЕ УДАЛЯТЬ - используется в системе';
            analysis.activeTables.push(tableInfo);
          } else {
            tableInfo.status = 'OLD';
            if (count === 0) {
              tableInfo.recommendation = 'БЕЗОПАСНО УДАЛИТЬ - нет данных';
            } else {
              tableInfo.recommendation = `УДАЛИТЬ ПОСЛЕ БЭКАПА - ${count} записей`;
            }
            analysis.oldTables.push(tableInfo);
          }
        }
      } catch (err) {
        // Таблица не существует
        const tableInfo = {
          name: tableName,
          exists: false,
          recordCount: 0,
          status: 'NOT_EXISTS',
          recommendation: 'Таблица не существует'
        };
        analysis.oldTables.push(tableInfo);
      }
    }

    // Итоговая сводка
    analysis.summary = {
      totalTables: chatTables.length,
      activeTables: analysis.activeTables.length,
      oldTables: analysis.oldTables.length,
      tablesWithData: analysis.oldTables.filter((t: any) => t.recordCount > 0).length,
      safeToDelete: analysis.oldTables.filter((t: any) => t.recordCount === 0).length,
      needBackup: analysis.oldTables.filter((t: any) => t.recordCount > 0).length,
      analysisDate: new Date().toISOString()
    };

    console.log("✅ [API] Анализ таблиц чата завершен");
    console.log("📊 [API] Сводка:", analysis.summary);

    return NextResponse.json({
      success: true,
      analysis,
      message: "Анализ таблиц чата завершен"
    });

  } catch (error) {
    console.error("❌ [API] Критическая ошибка при анализе таблиц чата:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 