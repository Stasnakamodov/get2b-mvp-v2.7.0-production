import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/shared/lib/logger";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {

    const tables: any = {
      all: [],
      chatRelated: [],
      messageRelated: [],
      roomRelated: [],
      oldRelated: [],
      summary: {}
    };

    // Попробуем получить таблицы через прямые запросы к известным таблицам
    const knownTables = [
      // Основные таблицы проекта
      'projects', 'project_specifications', 'specifications',
      'client_profiles', 'supplier_profiles',
      
      // Каталог
      'catalog_verified_suppliers', 'catalog_user_suppliers',
      'catalog_verified_products', 'catalog_user_products',
      
      // Чат
      'chat_rooms', 'chat_messages',
      
      // Возможные старые таблицы чата
      'chats', 'messages', 'rooms',
      'chat_old', 'messages_old', 'rooms_old',
      'chat_temp', 'messages_temp', 'rooms_temp',
      'chat_backup', 'messages_backup', 'rooms_backup',
      'chat_archive', 'messages_archive', 'rooms_archive',
      'chat_legacy', 'messages_legacy', 'rooms_legacy',
      'chat_deprecated', 'messages_deprecated', 'rooms_deprecated',
      
      // Другие возможные таблицы
      'supplier_drafts', 'project_templates',
      'project_requisites', 'user_notifications'
    ];

    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          tables.all.push({
            name: tableName,
            exists: true,
            recordCount: count
          });

          // Категоризация
          if (tableName.toLowerCase().includes('chat')) {
            tables.chatRelated.push(tableName);
          }
          if (tableName.toLowerCase().includes('message')) {
            tables.messageRelated.push(tableName);
          }
          if (tableName.toLowerCase().includes('room')) {
            tables.roomRelated.push(tableName);
          }
          if (tableName.toLowerCase().includes('old') || 
              tableName.toLowerCase().includes('temp') ||
              tableName.toLowerCase().includes('backup') ||
              tableName.toLowerCase().includes('archive') ||
              tableName.toLowerCase().includes('legacy') ||
              tableName.toLowerCase().includes('deprecated')) {
            tables.oldRelated.push(tableName);
          }
        }
      } catch (err) {
        // Таблица не существует
        tables.all.push({
          name: tableName,
          exists: false,
          recordCount: 0
        });
      }
    }

    // Итоговая сводка
    tables.summary = {
      totalChecked: tables.all.length,
      existingTables: tables.all.filter((t: any) => t.exists).length,
      nonExistingTables: tables.all.filter((t: any) => !t.exists).length,
      chatRelatedTables: tables.chatRelated.length,
      messageRelatedTables: tables.messageRelated.length,
      roomRelatedTables: tables.roomRelated.length,
      oldRelatedTables: tables.oldRelated.length,
      analysisDate: new Date().toISOString()
    };


    return NextResponse.json({
      success: true,
      tables,
      message: "Список всех таблиц получен"
    });

  } catch (error) {
    logger.error("❌ [API] Критическая ошибка при получении таблиц:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 