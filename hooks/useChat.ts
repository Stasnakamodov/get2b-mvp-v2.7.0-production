import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChatMessage, 
  ChatRoom,
  SendMessageRequest,
  AIResponseRequest,
  MessageSenderType,
  PaginationOptions
} from '@/lib/types/chat';
import { useChatPolling } from './useChatPolling';

// Основной хук для работы с чатом
export function useChat(roomId?: string, userId?: string) {
  // Состояние сообщений
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Пагинация
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // 🗄️ КЭШ сообщений по комнатам - ВОССТАНОВЛЕНО из коммита 1a0fff2
  const messagesCache = useRef<Record<string, ChatMessage[]>>({});
  // Реф для предотвращения дублирования запросов
  const loadingRef = useRef(false);
  
  // 🚫 БЛОКИРАТОР polling после отправки сообщения - ПЕРЕМЕЩЕН НАВЕРХ для правильной инициализации
  const recentlySentRef = useRef<Set<string>>(new Set());

  // Функция загрузки сообщений
  const loadMessages = useCallback(async (options?: PaginationOptions & { quiet?: boolean }) => {
    if (!roomId || loadingRef.current) return;

    // 🛡️ ПРОСТАЯ ВАЛИДАЦИЯ ID - только проверяем что это не пустая строка
    if (typeof roomId !== 'string' || roomId.trim().length === 0) {
      console.warn('❌ useChat: Invalid roomId:', roomId);
      return;
    }

    try {
      loadingRef.current = true;
      // 🔧 Только показываем loading если не тихий режим
      if (!options?.quiet) {
        setIsLoading(true);
      }

      const params = new URLSearchParams({
        room_id: roomId,
        limit: String(options?.limit || limit),
        offset: String(options?.offset || offset)
      });

      console.log('📡 useChat: Fetching messages from:', `/api/chat/messages?${params}`);
      const response = await fetch(`/api/chat/messages?${params}`);
      
      // 🛡️ ПРОВЕРКА ОТВЕТА СЕРВЕРА
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 useChat: Received data:', { success: data.success, count: data.messages?.length });

      if (data.success) {
        if (options?.offset === 0) {
          // 🛡️ ДЕДУПЛИЦИРОВАНИЕ при новой загрузке
          const uniqueMessages = data.messages.filter((msg: ChatMessage, index: number, arr: ChatMessage[]) => 
            arr.findIndex((m: ChatMessage) => m.id === msg.id) === index
          );
          
          // 🗄️ СОХРАНЯЕМ В КЭШ - ВОССТАНОВЛЕНО из коммита 1a0fff2
          if (roomId) {
            messagesCache.current[roomId] = uniqueMessages;
            console.log(`💾 Сохранили ${uniqueMessages.length} сообщений в кэш для комнаты ${roomId}`);
          }
          
          setMessages(uniqueMessages);
          console.log('✅ useChat: Messages loaded successfully:', uniqueMessages?.length, 
                      uniqueMessages.length !== data.messages.length ? `(${data.messages.length - uniqueMessages.length} дублей удалено)` : '');
        } else {
          // 🛡️ ДЕДУПЛИЦИРОВАНИЕ при дозагрузке
          setMessages(prev => {
            const combined = [...data.messages, ...prev];
            const uniqueMessages = combined.filter((msg: ChatMessage, index: number, arr: ChatMessage[]) => 
              arr.findIndex((m: ChatMessage) => m.id === msg.id) === index
            );
            
            // 🗄️ ОБНОВЛЯЕМ КЭШ - ВОССТАНОВЛЕНО из коммита 1a0fff2
            if (roomId) {
              messagesCache.current[roomId] = uniqueMessages;
            }
            
            return uniqueMessages;
          });
        }

        // Обновляем пагинацию
        setOffset((options?.offset || 0) + data.messages.length);
        setHasMore(data.messages.length === (options?.limit || limit));
      } else {
        console.error('❌ useChat: Failed to load messages:', data.error);
      }
    } catch (error) {
      // 🛡️ ДЕТАЛЬНАЯ ОБРАБОТКА ОШИБОК
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('🌐 useChat: Сетевая ошибка при загрузке сообщений:', error.message);
        // Не показываем пользователю - это может быть временная проблема
      } else if (error instanceof Error && error.message.includes('HTTP')) {
        console.error('🚫 useChat: Ошибка сервера при загрузке:', error.message);
      } else {
        console.error('💥 useChat: Неизвестная ошибка загрузки:', error);
      }
    } finally {
      // 🔧 Только сбрасываем loading если не тихий режим
      if (!options?.quiet) {
        setIsLoading(false);
      }
      loadingRef.current = false;
    }
  }, [roomId, limit, offset]);

  // Функция отправки сообщения
  const sendMessage = useCallback(async (
    content: string, 
    options?: {
      message_type?: 'text' | 'file' | 'image';
      file_url?: string;
      file_name?: string;
      file_size?: number;
      reply_to_message_id?: string;
    }
  ) => {
    if (!roomId || !content.trim() || !userId) return null;

    try {
      setIsSending(true);

      const messageData: SendMessageRequest = {
        room_id: roomId,
        content: content.trim(),
        sender_type: 'user',
        sender_user_id: userId,
        sender_name: 'Вы', // TODO: Получать из профиля пользователя
        ...options
      };

      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      console.log('📡 API Response:', { status: response.status, data });

      if (data.success) {
        // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: Убираем блокировку polling 
        // Теперь polling отвечает за добавление ВСЕХ сообщений включая отправленные
        // recentlySentRef.current.add(data.message.id);
        // console.log('📤 Отмечаем сообщение как отправленное:', data.message.id);
        
        // Убираем из блокировки через 10 секунд (2 цикла polling)
        // setTimeout(() => {
        //   recentlySentRef.current.delete(data.message.id);
        //   console.log('🔓 Разблокировали сообщение:', data.message.id);
        // }, 10000);
        
        // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: НЕ добавляем сообщение сразу в состояние
        // Позволяем polling'у обработать новое сообщение естественным образом
        console.log('✅ Message sent successfully, waiting for polling update:', data.message.id);
        
        // 🗄️ ОБНОВЛЯЕМ КЭШ при отправке сообщения - ВОССТАНОВЛЕНО из коммита 1a0fff2
        // Но НЕ обновляем состояние messages
        // if (roomId) {
        //   messagesCache.current[roomId] = updated;
        // }
        
        return data.message;
      } else {
        console.error('❌ API returned error:', {
          error: data.error,
          details: data.details,
          status: response.status
        });
        // Показываем ошибку пользователю
        alert(`Ошибка отправки сообщения: ${data.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    } finally {
      setIsSending(false);
    }
  }, [roomId, userId]);

  // 🗑️ УДАЛЕНО: requestAIResponse теперь встроен в sendMessageWithAI

  // Функция отправки сообщения + автоматический AI ответ
  const sendMessageWithAI = useCallback(async (
    content: string,
    aiContext?: string
  ) => {
    // 🚫 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: AI API создает оба сообщения сам
    // НЕ вызываем sendMessage отдельно, иначе получается дубликат пользовательского сообщения
    console.log('🤖 Отправляем в AI API (без предварительного sendMessage):', content);
    
    if (!roomId || !content.trim() || !userId) return null;

    try {
      setIsSending(true);

      const requestData: AIResponseRequest = {
        room_id: roomId,
        user_message: content.trim(),
        ai_context: aiContext || 'general',
        user_id: userId
      };

      const response = await fetch('/api/chat/ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ для AI сообщений: Убираем блокировку и немедленное добавление
        // 🔄 ЗАМЕНЯЕМ временную блокировку на реальные ID
        // recentlySentRef.current.delete(`temp-user-${contentHash}`);
        // recentlySentRef.current.delete(`temp-ai-${contentHash}`);
        
        // recentlySentRef.current.add(data.user_message.id);
        // recentlySentRef.current.add(data.ai_message.id);
        // console.log('🔄 Заменили превентивную блокировку на реальные ID:', { user: data.user_message.id, ai: data.ai_message.id });
        
        // Убираем из блокировки через 10 секунд
        // setTimeout(() => {
        //   recentlySentRef.current.delete(data.user_message.id);
        //   recentlySentRef.current.delete(data.ai_message.id);
        //   console.log('🔓 Разблокировали AI сообщения:', { user: data.user_message.id, ai: data.ai_message.id });
        // }, 10000);
        
        // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: НЕ добавляем сообщения сразу в состояние
        // Позволяем polling'у обработать новые сообщения естественным образом
        console.log('✅ AI диалог создан, waiting for polling update:', { userMsg: data.user_message.id, aiMsg: data.ai_message.id });
        
        // 🔥 ДОБАВЛЯЕМ ОБА сообщения в состояние СРАЗУ
        // setMessages(prev => {
        //   const updated = [...prev, data.user_message, data.ai_message];
          
        //   // 🗄️ ОБНОВЛЯЕМ КЭШ
        //   if (roomId) {
        //     messagesCache.current[roomId] = updated;
        //   }
          
        //   return updated;
        // });
        
        return {
          userMessage: data.user_message,
          aiMessage: data.ai_message
        };
      } else {
        console.error('Failed to get AI response:', data.error);
        // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: Убираем превентивную блокировку при ошибке
        // Убираем превентивную блокировку при ошибке
        // recentlySentRef.current.delete(`temp-user-${contentHash}`);
        // recentlySentRef.current.delete(`temp-ai-${contentHash}`);
        return null;
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: Убираем превентивную блокировку при ошибке
      // Убираем превентивную блокировку при ошибке
      // const contentHash = content.trim().substring(0, 50);
      // recentlySentRef.current.delete(`temp-user-${contentHash}`);
      // recentlySentRef.current.delete(`temp-ai-${contentHash}`);
      return null;
    } finally {
      setIsSending(false);
    }
  }, [roomId, userId]);

  // Функция загрузки старых сообщений (для пагинации)
  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMessages({ limit, offset });
    }
  }, [hasMore, isLoading, loadMessages, limit, offset]);

  // Функция обновления статуса прочитанности
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!roomId || messageIds.length === 0) return;

    try {
      // TODO: Реализовать API для пометки сообщений как прочитанных
      // Пока просто обновляем локальное состояние
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, is_read: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [roomId]);

  // Сброс состояния при изменении комнаты - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const resetChat = useCallback(() => {
    console.log('🔄 resetChat: Сбрасываем состояние чата');
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    setIsLoading(false);
    setIsTyping(false);
    setIsSending(false);
    
    // 🧹 ОЧИЩАЕМ ВСЮ блокировку недавно отправленных сообщений при смене комнаты
    recentlySentRef.current.clear();
    console.log('🧹 Очищена ВСЯ блокировка отправленных сообщений (включая превентивную)');
  }, []);

  // Real-time обновления через polling
  // 🔧 ИСПРАВЛЕНО: включаем polling только для активных комнат с защитой
  const { forceUpdate: forcePollingUpdate } = useChatPolling({
    roomId,
    onNewMessage: (newMessage) => {
      // 🛡️ Дополнительная защита от конфликтов при загрузке
      if (loadingRef.current) {
        console.log('⏳ Пропускаем polling обновление - идет загрузка');
        return;
      }
      
      // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: Убираем ВСЮ блокировку polling
      // Теперь polling отвечает за добавление ВСЕХ сообщений
      // if (recentlySentRef.current.has(newMessage.id)) {
      //   console.log('🚫 Пропускаем дублирующее сообщение из polling (по ID):', newMessage.id);
      //   return;
      // }
      
      // 🚫 ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: Проверяем превентивную блокировку по содержимому
      // const contentHash = newMessage.content.substring(0, 50);
      // const tempUserKey = `temp-user-${contentHash}`;
      // const tempAiKey = `temp-ai-${contentHash}`;
      
      // if (recentlySentRef.current.has(tempUserKey) || recentlySentRef.current.has(tempAiKey)) {
      //   console.log('🚫 Пропускаем сообщение из polling (превентивная блокировка):', contentHash);
      //   return;
      // }
      
      setMessages(prev => {
        // 🔍 Проверка существования сообщения
        const exists = prev.some(msg => {
          const isDuplicate = msg.id === newMessage.id;
          if (isDuplicate) {
            console.log('🔍 Найдено существующее сообщение:', { existingId: msg.id, newId: newMessage.id });
          }
          return isDuplicate;
        });
        
        if (!exists) {
          console.log('✅ Добавляем новое сообщение через polling:', newMessage.id);
          const updated = [...prev, newMessage];
          
          // 🗄️ ОБНОВЛЯЕМ КЭШ при получении нового сообщения через polling - ВОССТАНОВЛЕНО
          if (roomId) {
            messagesCache.current[roomId] = updated;
          }
          
          return updated;
        } else {
          console.log('🚫 Сообщение уже существует, пропускаем:', newMessage.id);
          return prev;
        }
      });
    },
    onMessagesUpdate: (updatedMessages) => {
      // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: Упрощаем логику обновления
      // Убираем проверку загрузки - polling теперь управляет всем
      // if (loadingRef.current) {
      //   console.log('⏳ Пропускаем массовое обновление - идет загрузка');
      //   return;
      // }
      
      // 🛡️ ДЕДУПЛИЦИРОВАНИЕ сообщений по ID перед обновлением состояния
      const uniqueMessages = updatedMessages.filter((msg: ChatMessage, index: number, arr: ChatMessage[]) => 
        arr.findIndex((m: ChatMessage) => m.id === msg.id) === index
      );
      console.log(`🔄 Обновление сообщений: ${updatedMessages.length} → ${uniqueMessages.length} (удалено ${updatedMessages.length - uniqueMessages.length} дублей)`);
      
      // 🗄️ ОБНОВЛЯЕМ КЭШ при полном обновлении сообщений - ВОССТАНОВЛЕНО
      if (roomId) {
        messagesCache.current[roomId] = uniqueMessages;
      }
      
      setMessages(uniqueMessages);
    },
    enabled: !!roomId && !isLoading && !isSending, // 🔧 НЕ включаем polling при отправке сообщений
    pollingInterval: 8000 // 🔧 8 секунд - уменьшаем нагрузку на сервер
  });

  // 🗄️ ЗАГРУЗКА сообщений при изменении комнаты С КЭШЕМ - ВОССТАНОВЛЕНО из коммита 1a0fff2
  useEffect(() => {
    if (roomId) {
      console.log('🔄 useChat: Loading messages for room:', roomId);
      
      // 🔧 ИСПРАВЛЕНИЕ ДУБЛИРОВАНИЯ: Убираем очистку блокировки
      // recentlySentRef.current.clear();
      // console.log('🧹 Очищена ВСЯ блокировка (включая превентивную) при смене комнаты:', roomId);
      
      // 🚀 УПРОЩЕННАЯ ЛОГИКА БЕЗ RACE CONDITION
      const cachedMessages = messagesCache.current[roomId];
      if (cachedMessages && cachedMessages.length > 0) {
        console.log(`💾 Быстрая загрузка ${cachedMessages.length} сообщений из кэша для комнаты ${roomId}`);
        setMessages(cachedMessages);
        // 🛑 УБИРАЕМ "тихую" загрузку - она создает race conditions
        // setTimeout(() => {
        //   loadMessages({ limit, offset: 0, quiet: true });
        // }, 1000);
      } else {
        console.log('📡 Кэш пуст, загружаем с сервера для комнаты:', roomId);
        resetChat();
        loadMessages({ limit, offset: 0 });
      }
    } else {
      console.log('⚠️ useChat: No roomId provided');
      resetChat();
    }
  }, [roomId, loadMessages, resetChat, limit]);

  // Возвращаем состояние и функции
  return {
    // Состояние
    messages,
    isLoading,
    isTyping,
    isSending,
    hasMore,

    // Функции
    sendMessage,
    sendMessageWithAI,
    loadMoreMessages,
    markAsRead,
    resetChat,
    
    // Утилиты
    refreshMessages: () => loadMessages({ limit, offset: 0 }),
    forceUpdate: forcePollingUpdate,
  };
}