// ⚠️ ОБНОВЛЕНО: Теперь использует новый ChatBotService
import { logger } from "@/src/shared/lib/logger";

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { supabaseService } from "@/lib/supabaseServiceClient";
import { ChatBotService } from "@/lib/telegram/ChatBotService";

// Создаем единственный экземпляр сервиса чат-бота
let chatBotService: ChatBotService | null = null;

function getChatBotService(): ChatBotService {
  if (!chatBotService) {
    try {
      chatBotService = new ChatBotService();
    } catch (error) {
      logger.warn("❌ Не удалось инициализировать ChatBotService:", error);
      throw error;
    }
  }
  return chatBotService;
}

// POST: Webhook для чат-бота Get2B ChatHub Assistant (ИСПРАВЛЕННАЯ ВЕРСИЯ)
export async function POST(request: NextRequest) {
  // Принудительно выводим в консоль что webhook получен
  logger.error('🚨 WEBHOOK CALL DETECTED! Time:', new Date().toISOString());
  
  try {
    const body = await request.json();
    
    logger.error('🤖 WEBHOOK RECEIVED - FULL PAYLOAD:');
    logger.error('====================================');
    logger.error(JSON.stringify(body, null, 2));
    logger.error('====================================');

    // Обрабатываем callback queries (нажатия кнопок)
    if (body.callback_query) {
      logger.info('📞 CALLBACK QUERY detected - handling...');
      return await handleCallbackQuery(body.callback_query);
    }

    // Проверяем что это сообщение
    if (!body.message) {
      logger.info('❌ NO MESSAGE in payload - exiting');
      return NextResponse.json({ success: true, message: "No message to process" });
    }

    logger.info('✅ MESSAGE found in payload - processing...');

    const message = body.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;
    const userName = message.from.first_name || 'Пользователь';

    logger.info('📩 Processing chat bot message:', {
      chatId,
      userId,
      userName,
      text,
      textLength: text.length,
      isCommand: text.startsWith('/')
    });

    // Обрабатываем команды
    if (text.startsWith('/')) {
      logger.info('🔧 COMMAND detected - handling command:', text);
      await handleChatBotCommand(chatId, text, userId, userName);
    } else {
      logger.info('💬 REGULAR MESSAGE detected - handling as manager reply:', text);
      // Обычное сообщение - возможно ответ менеджера клиенту
      await handleManagerReply(message, chatId, text, userId, userName);
    }

    return NextResponse.json({ success: true, message: "Chat bot message processed" });

  } catch (error) {
    logger.error('💥 Chat bot webhook error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// Обработка команд чат-бота
async function handleChatBotCommand(chatId: number, command: string, userId: number, userName: string) {
  logger.info("🔄 ОБНОВЛЕНО: handleChatBotCommand - использует новый ChatBotService");

  try {
    const service = getChatBotService();
    const responseText = service.getCommandResponse(command, userName);
    
    await service.sendMessage(chatId, responseText);
    logger.info("✅ Команда обработана через ChatBotService");
  } catch (error) {
    logger.error('❌ Ошибка обработки команды:', error);
  }
}

// Обработка ответов менеджеров клиентам (ULTRA DEBUG VERSION)
async function handleManagerReply(message: any, chatId: number, text: string, userId: number, userName: string) {
  logger.info("💬 ULTRA DEBUG: handleManagerReply started");
  logger.info("📝 ULTRA DEBUG: Message text:", text);
  logger.info("👤 ULTRA DEBUG: User:", { userId, userName, chatId });
  logger.info("🔍 ULTRA DEBUG: Full message object:", JSON.stringify(message, null, 2));
  
  let webChatMessageSaved = false;
  
  try {
    // Проверяем, есть ли реплай на сообщение о новом чате
    const replyToMessage = message.reply_to_message;
    logger.info("🔍 DEBUG: Reply to message exists:", !!replyToMessage);
    
    if (replyToMessage?.text) {
      logger.info("📄 DEBUG: Reply text:", replyToMessage.text);
    }
    
    let roomId = null;
    let projectId = null;

    if (replyToMessage?.text) {
      // Ищем ID проекта в тексте реплая
      const projectMatch = replyToMessage.text.match(/🆔 Проект: ([a-f0-9-]+)/);
      logger.info("🎯 DEBUG: Project regex match:", projectMatch);
      
      if (projectMatch) {
        projectId = projectMatch[1];
        logger.info("✅ ULTRA DEBUG: Found project ID:", projectId);

        // Ищем комнату чата по проекту
        logger.info("🔍 ULTRA DEBUG: Searching for room with project_id:", projectId);
        
        let room = null;
        let roomError = null;
        
        try {
          const result = await supabaseService
            .from('chat_rooms')
            .select('id, name, user_id')
            .eq('project_id', projectId)
            .eq('room_type', 'project')
            .eq('is_active', true)
            .single();

          room = result.data;
          roomError = result.error;

          logger.info("📦 ULTRA DEBUG: Room query result:", { room, error: roomError });
          logger.info("🌐 ULTRA DEBUG: Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        } catch (dbError) {
          logger.error("💥 ULTRA DEBUG: Database connection error:", dbError);
          roomError = dbError;
        }

        if (room) {
          roomId = room.id;
          logger.info("✅ DEBUG: Found chat room:", { roomId, roomName: room.name, userId: room.user_id });
        } else {
          logger.info("❌ DEBUG: No room found for project:", projectId);
          if (roomError) {
            logger.info("🚨 DEBUG: Room query error:", roomError);
          }
        }
      } else {
        logger.info("❌ DEBUG: No project ID found in reply text");
      }
    } else {
      logger.info("❌ DEBUG: No reply_to_message.text");
    }

    if (roomId) {
      logger.info("💾 DEBUG: Attempting to save message to web chat...");
      
      // 🚀 ОТПРАВЛЯЕМ СООБЩЕНИЕ В ВЕБ-ЧАТ (с улучшенной обработкой ошибок)
      const messageData = {
        room_id: roomId,
        content: text,
        sender_type: 'manager' as const,
        sender_manager_id: String(userId),
        sender_name: userName || 'Менеджер Get2B',
        message_type: 'text' as const
      };
      
      logger.info("💾 DEBUG: Message data to save:", messageData);
      
      const { data: newMessage, error } = await supabaseService
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      logger.info("📊 DEBUG: Database insert result:", { newMessage, error });

      if (error) {
        logger.error('❌ DEBUG: Database save error:', error);
        throw new Error(`Ошибка сохранения: ${error.message}`);
      } else {
        webChatMessageSaved = true;
        logger.info('✅ DEBUG: Message saved successfully:', {
          messageId: newMessage.id,
          roomId: newMessage.room_id,
          content: newMessage.content,
          senderType: newMessage.sender_type
        });
      }

      // 🔧 БЕЗОПАСНАЯ отправка ответа в Telegram (не прерываем при ошибке)
      try {
        const service = getChatBotService();
        await service.sendMessage(chatId, `✅ Ваш ответ отправлен клиенту в веб-чат:\n\n"${text}"`);
        logger.info("✅ DEBUG: Confirmation sent to Telegram");
      } catch (telegramError) {
        logger.warn("⚠️ DEBUG: Failed to send Telegram confirmation (non-critical):", telegramError);
        // НЕ ПРЕРЫВАЕМ выполнение - главное что сообщение сохранено в веб-чат!
      }
      
    } else {
      logger.info("❌ DEBUG: No room found - cannot save message");
      
      // Безопасная отправка уведомления об ошибке
      try {
        const service = getChatBotService();
        await service.sendMessage(chatId, `❌ Не удалось найти комнату чата для отправки ответа.\n\nОтвечайте только на уведомления о новых сообщениях в чатах проектов.`);
      } catch (telegramError) {
        logger.warn("⚠️ DEBUG: Failed to send error to Telegram:", telegramError);
      }
    }
    
  } catch (error) {
    logger.error('❌ DEBUG: handleManagerReply error:', error);
    
    // Безопасная отправка уведомления об ошибке
    try {
      const service = getChatBotService();
      await service.sendMessage(chatId, `❌ Ошибка отправки ответа: ${error instanceof Error ? error.message : String(error)}`);
    } catch (telegramError) {
      logger.warn("⚠️ DEBUG: Failed to send error to Telegram:", telegramError);
    }
  }

  // 🎯 ГЛАВНОЕ: Возвращаем успех если сообщение сохранено в веб-чат
  if (webChatMessageSaved) {
    logger.info("🎉 DEBUG: SUCCESS - Message saved to web chat!");
  } else {
    logger.info("💥 DEBUG: FAILED - Message NOT saved to web chat");
  }
}

// Получение статуса чатхаба
async function getChatHubStatus(): Promise<string> {
  try {
    // Получаем статистику из базы данных
    const { data: roomsData, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('room_type, is_active')
      .eq('is_active', true);

    const { data: messagesData, error: messagesError } = await supabase
      .from('chat_messages')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: participantsData, error: participantsError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('is_active', true);

    const totalRooms = roomsData?.length || 0;
    const aiRooms = roomsData?.filter(r => r.room_type === 'ai').length || 0;
    const projectRooms = roomsData?.filter(r => r.room_type === 'project').length || 0;
    const todayMessages = messagesData?.length || 0;
    const activeParticipants = participantsData?.length || 0;

    return `🏠 Активных комнат: ${totalRooms}
🤖 AI чатов: ${aiRooms}
📋 Проектных чатов: ${projectRooms}
💬 Сообщений за день: ${todayMessages}
👥 Активных участников: ${activeParticipants}`;

  } catch (error) {
    logger.error('Error getting chat status:', error);
    return '⚠️ Ошибка получения статистики';
  }
}

// Получение списка активных проектных чатов
async function getActiveProjectChats(): Promise<string> {
  try {
    const { data: projectChats, error } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        name,
        project_id,
        created_at,
        projects!inner(name, status)
      `)
      .eq('room_type', 'project')
      .eq('is_active', true)
      .limit(10);

    if (error || !projectChats || projectChats.length === 0) {
      return '📭 Нет активных проектных чатов';
    }

    return projectChats.map((chat: any, index: number) => 
      `${index + 1}. **${chat.projects?.name || chat.name}**
   💬 Чат: ${chat.name}
   📊 Статус: ${chat.projects?.status || 'unknown'}
   📅 Создан: ${new Date(chat.created_at).toLocaleDateString('ru-RU')}`
    ).join('\n\n');

  } catch (error) {
    logger.error('Error getting project chats:', error);
    return '⚠️ Ошибка получения списка чатов';
  }
}

// ========================================
// 💬 ОБРАБОТКА ЧАТ-ФУНКЦИЙ (CALLBACK QUERIES)
// ========================================

async function handleCallbackQuery(callbackQuery: any) {
  try {
    const data = callbackQuery.data;
    const service = getChatBotService();
    
    logger.info("💬 Обработка callback query чат-бота:", data);

    // Быстрые ответы в чате
    if (data.startsWith("quick_reply_")) {
      const [, , roomId, replyType] = data.split("_");
      
      try {
        const { handleQuickReply } = await import('@/lib/telegram-chat-integration');
        
        await handleQuickReply({
          roomId,
          replyType: replyType as 'ok' | 'clarify',
          managerName: callbackQuery.from?.first_name || "Менеджер Get2B",
          managerTelegramId: String(callbackQuery.from?.id)
        });

        const responseText = replyType === 'ok' 
          ? "✅ Ответ \"Все в порядке\" отправлен клиенту" 
          : "❓ Ответ \"Нужны уточнения\" отправлен клиенту";
            
        await service.answerCallbackQuery(callbackQuery.id, responseText);

        logger.info("💬 Быстрый ответ отправлен в чат:", { roomId, replyType });
        return NextResponse.json({ 
          ok: true, 
          message: `Quick reply sent to chat ${roomId}` 
        });
      } catch (error: any) {
        logger.error("❌ Chat quick reply error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    // Открыть чат проекта
    if (data.startsWith("open_chat_")) {
      const roomId = data.replace("open_chat_", "");
      
      await service.answerCallbackQuery(
        callbackQuery.id, 
        "💬 Функция открытия чата будет добавлена в будущих версиях", 
        true
      );

      return NextResponse.json({ ok: true, message: "Chat open requested" });
    }

    // Детали проекта
    if (data.startsWith("project_details_")) {
      const projectId = data.replace("project_details_", "");
      
      try {
        const { sendProjectDetailsToTelegram } = await import('@/lib/telegram-chat-integration');
        
        // 🔧 ИСПРАВЛЕНИЕ: Передаем chat_id из callback query
        const chatId = callbackQuery.message?.chat?.id || callbackQuery.from?.id;
        await sendProjectDetailsToTelegram(projectId, chatId);

        await service.answerCallbackQuery(callbackQuery.id, "📋 Детали проекта отправлены");

        logger.info("📋 Детали проекта отправлены:", projectId);
        return NextResponse.json({ 
          ok: true, 
          message: `Project details sent for ${projectId}` 
        });
      } catch (error: any) {
        logger.error("❌ Project details error:", error);
        return NextResponse.json({ ok: false, error: error.message });
      }
    }

    return NextResponse.json({ ok: true, message: "Callback query processed" });
    
  } catch (error: any) {
    logger.error("❌ Callback query error:", error);
    return NextResponse.json({ ok: false, error: error.message });
  }
} 