// ⚠️ ОБНОВЛЕНО: Теперь использует новый ChatBotService
import { logger } from "@/src/shared/lib/logger";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { db as dbAdmin } from '@/lib/db'
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

// POST: Webhook для чат-бота Get2B ChatHub Assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Обрабатываем callback queries (нажатия кнопок)
    if (body.callback_query) {
      logger.debug('Callback query detected - handling');
      return await handleCallbackQuery(body.callback_query);
    }

    // Проверяем что это сообщение
    if (!body.message) {
      logger.debug('No message in payload - skipping');
      return NextResponse.json({ success: true, message: "No message to process" });
    }

    logger.debug('Message found in payload - processing');

    const message = body.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;
    const userName = message.from.first_name || 'Пользователь';

    logger.debug('📩 Processing chat bot message:', {
      chatId,
      userId,
      textLength: text.length,
      isCommand: text.startsWith('/')
    });

    // Обрабатываем команды
    if (text.startsWith('/')) {
      logger.debug('🔧 Command detected:', text);
      await handleChatBotCommand(chatId, text, userId, userName);
    } else {
      logger.debug('💬 Regular message detected - handling as manager reply');
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
  try {
    const service = getChatBotService();
    const responseText = service.getCommandResponse(command, userName);

    await service.sendMessage(chatId, responseText);
    logger.debug("✅ Команда обработана:", command);
  } catch (error) {
    logger.error('❌ Ошибка обработки команды:', error);
  }
}

// Обработка ответов менеджеров клиентам
async function handleManagerReply(message: any, chatId: number, text: string, userId: number, userName: string) {
  let webChatMessageSaved = false;

  try {
    const replyToMessage = message.reply_to_message;

    let roomId = null;
    let projectId = null;

    if (replyToMessage?.text) {
      // Ищем ID проекта в тексте реплая
      const projectMatch = replyToMessage.text.match(/🆔 Проект: ([a-f0-9-]+)/);

      if (projectMatch) {
        projectId = projectMatch[1];
        logger.debug("Found project ID from reply:", projectId);

        // Ищем комнату чата по проекту
        let room = null;
        let roomError = null;

        try {
          const result = await dbAdmin
            .from('chat_rooms')
            .select('id, name, user_id')
            .eq('project_id', projectId)
            .eq('room_type', 'project')
            .eq('is_active', true)
            .single();

          room = result.data;
          roomError = result.error;
        } catch (dbError) {
          logger.error("Database connection error looking up chat room:", dbError);
          roomError = dbError;
        }

        if (room) {
          roomId = room.id;
          logger.debug("Found chat room:", { roomId, roomName: room.name });
        } else {
          logger.info("No room found for project:", projectId);
          if (roomError) {
            logger.warn("Room query error:", roomError);
          }
        }
      }
    }

    if (roomId) {
      // Отправляем сообщение в веб-чат
      const messageData = {
        room_id: roomId,
        content: text,
        sender_type: 'manager' as const,
        sender_manager_id: String(userId),
        sender_name: userName || 'Менеджер Get2B',
        message_type: 'text' as const
      };

      const { data: newMessage, error } = await dbAdmin
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        logger.error('Database save error for manager reply:', error);
        throw new Error(`Ошибка сохранения: ${error.message}`);
      } else {
        webChatMessageSaved = true;
        logger.info('Manager reply saved to web chat:', {
          messageId: newMessage.id,
          roomId: newMessage.room_id,
        });
      }

      // Безопасная отправка подтверждения в Telegram (не прерываем при ошибке)
      try {
        const service = getChatBotService();
        await service.sendMessage(chatId, `✅ Ваш ответ отправлен клиенту в веб-чат:\n\n"${text}"`);
      } catch (telegramError) {
        logger.warn("Failed to send Telegram confirmation (non-critical):", telegramError);
      }

    } else {
      logger.info("No room found for manager reply - cannot save message");

      try {
        const service = getChatBotService();
        await service.sendMessage(chatId, `❌ Не удалось найти комнату чата для отправки ответа.\n\nОтвечайте только на уведомления о новых сообщениях в чатах проектов.`);
      } catch (telegramError) {
        logger.warn("Failed to send error notification to Telegram:", telegramError);
      }
    }

  } catch (error) {
    logger.error('handleManagerReply error:', error);

    try {
      const service = getChatBotService();
      await service.sendMessage(chatId, `❌ Ошибка отправки ответа: ${error instanceof Error ? error.message : String(error)}`);
    } catch (telegramError) {
      logger.warn("Failed to send error to Telegram:", telegramError);
    }
  }

  if (webChatMessageSaved) {
    logger.info("Manager reply successfully saved to web chat");
  }
}

// Получение статуса чатхаба
async function getChatHubStatus(): Promise<string> {
  try {
    // Получаем статистику из базы данных
    const { data: roomsData, error: roomsError } = await db
      .from('chat_rooms')
      .select('room_type, is_active')
      .eq('is_active', true);

    const { data: messagesData, error: messagesError } = await db
      .from('chat_messages')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: participantsData, error: participantsError } = await db
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
    const { data: projectChats, error } = await db
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
    
    logger.debug("Обработка callback query чат-бота:", data);

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

        logger.info("Быстрый ответ отправлен в чат:", { roomId, replyType });
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

        logger.info("Детали проекта отправлены:", projectId);
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