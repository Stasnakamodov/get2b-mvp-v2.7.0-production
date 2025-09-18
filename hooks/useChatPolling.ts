import { useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '@/lib/types/chat';

// 🔧 УЛУЧШЕННАЯ функция дедуплицирования сообщений
function deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>();
  const uniqueMessages: ChatMessage[] = [];
  
  for (const message of messages) {
    // 🎯 Составной ключ: ID + содержимое + время создания для максимальной уникальности
    const compositeKey = `${message.id}-${message.content.substring(0, 50)}-${message.created_at}`;
    
    if (!seen.has(compositeKey)) {
      seen.add(compositeKey);
      uniqueMessages.push(message);
    } else {
      console.log(`🚫 Найден дубликат сообщения: ${message.id} (${message.content.substring(0, 30)}...)`);
    }
  }
  
  // 🗂️ Сортируем по времени создания для правильного порядка
  return uniqueMessages.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

// 🔧 Функция сравнения сообщений для обнаружения новых
function findNewMessages(oldMessages: ChatMessage[], newMessages: ChatMessage[]): ChatMessage[] {
  const oldIds = new Set(oldMessages.map(msg => msg.id));
  return newMessages.filter(msg => !oldIds.has(msg.id));
}

// Хук для real-time обновлений чата через polling
export function useChatPolling({
  roomId,
  onNewMessage,
  onMessagesUpdate,
  enabled = true, // ✅ ВКЛЮЧЕН для real-time обновлений
  pollingInterval = 15000 // 🚀 ОПТИМИЗАЦИЯ: 15 секунд для уменьшения мигания (было 8)
}: {
  roomId?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onMessagesUpdate?: (messages: ChatMessage[]) => void;
  enabled?: boolean;
  pollingInterval?: number;
}) {
  
  const lastMessageIdRef = useRef<string | null>(null);
  const lastMessagesRef = useRef<ChatMessage[]>([]); // 🆕 Кэш предыдущих сообщений
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  
  // 🆕 НОВОЕ: кеш для умного сравнения сообщений
  const lastMessagesHashRef = useRef<string>('');
  const lastUpdateTimeRef = useRef<number>(0);

  // 🆕 Функция создания хеша сообщений для сравнения
  const createMessagesHash = (messages: ChatMessage[]): string => {
    return messages.map(msg => 
      `${msg.id}-${msg.content.substring(0, 30)}-${msg.created_at}`
    ).join('|');
  };

  // Функция polling обновлений
  const pollForUpdates = useCallback(async () => {
    if (!roomId || !enabled || isPollingRef.current) {
      return;
    }

    // 🛡️ ПРОСТАЯ ВАЛИДАЦИЯ ID - только проверяем что это не пустая строка
    if (typeof roomId !== 'string' || roomId.trim().length === 0) {
      console.warn('❌ useChatPolling: Invalid roomId:', roomId);
      return;
    }

    try {
      isPollingRef.current = true;

      const params = new URLSearchParams({
        room_id: roomId,
        limit: '50',
        offset: '0'
      });

      const response = await fetch(`/api/chat/messages?${params}`);
      
      // 🛡️ ПРОВЕРКА ОТВЕТА СЕРВЕРА
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success && data.messages) {
        // 🔧 СНАЧАЛА дедуплицируем полученные сообщения
        const cleanMessages = deduplicateMessages(data.messages);
        
        if (cleanMessages.length > 0) {
          const latestMessage = cleanMessages[cleanMessages.length - 1];
          const newMessagesHash = createMessagesHash(cleanMessages);
          const currentTime = Date.now();
          
          // 🚀 УМНОЕ СРАВНЕНИЕ: обновляем только при реальных изменениях
          if (newMessagesHash !== lastMessagesHashRef.current) {
            // Если это первая загрузка - используем onMessagesUpdate
            if (lastMessagesRef.current.length === 0) {
              console.log('🔄 Первичная загрузка через polling:', cleanMessages.length, 'сообщений');
              if (onMessagesUpdate) {
                onMessagesUpdate(cleanMessages);
              }
              lastMessageIdRef.current = latestMessage.id;
              lastMessagesRef.current = cleanMessages;
              lastMessagesHashRef.current = newMessagesHash;
              lastUpdateTimeRef.current = currentTime;
            } 
            // Ищем новые сообщения путем сравнения массивов
            else {
              const newMessages = findNewMessages(lastMessagesRef.current, cleanMessages);
              
              if (newMessages.length > 0) {
                console.log(`🔔 Обнаружено ${newMessages.length} новых сообщений через polling`);
                
                if (onNewMessage) {
                  // 🚨 Добавляем каждое новое сообщение по очереди
                  newMessages.forEach((msg: ChatMessage) => {
                    console.log(`📨 Добавляем новое сообщение: ${msg.id} (${msg.content.substring(0, 30)}...)`);
                    onNewMessage(msg);
                  });
                }
                
                // Обновляем кэш и последний ID
                lastMessageIdRef.current = latestMessage.id;
                lastMessagesRef.current = cleanMessages;
                lastMessagesHashRef.current = newMessagesHash;
                lastUpdateTimeRef.current = currentTime;
              }
              // Проверяем нужно ли полное обновление (изменения в существующих сообщениях)
              else if (cleanMessages.length !== lastMessagesRef.current.length) {
                console.log('🔄 Полное обновление - изменилось количество сообщений');
                if (onMessagesUpdate) {
                  onMessagesUpdate(cleanMessages);
                }
                lastMessageIdRef.current = latestMessage.id;
                lastMessagesRef.current = cleanMessages;
                lastMessagesHashRef.current = newMessagesHash;
                lastUpdateTimeRef.current = currentTime;
              }
            }
          } else {
            console.log('✅ Сообщения не изменились - пропускаем обновление');
          }
        } else {
          // Если сообщений нет - очищаем список
          if (lastMessagesRef.current.length > 0 && onMessagesUpdate) {
            console.log('🗑️ Polling: комната пуста, очищаем сообщения');
            onMessagesUpdate([]);
          }
          lastMessageIdRef.current = null;
          lastMessagesRef.current = [];
        }
      }
    } catch (error) {
      // 🛡️ ДЕТАЛЬНАЯ ОБРАБОТКА ОШИБОК
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('🌐 useChatPolling: Сетевая ошибка (сервер недоступен):', error.message);
        // Не логируем как критическую ошибку - это может быть временная проблема
      } else if (error instanceof Error && error.message.includes('HTTP')) {
        console.error('🚫 useChatPolling: Ошибка сервера:', error.message);
      } else {
        console.error('💥 useChatPolling: Неизвестная ошибка:', error);
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [roomId, enabled, onNewMessage, onMessagesUpdate]);

  // Запуск polling - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const startPolling = useCallback(() => {
    console.log(`🔄 startPolling для комнаты ${roomId} с интервалом ${pollingInterval}ms`);
    
    // 🛑 КРИТИЧНО: Останавливаем все предыдущие polling
    if (pollingTimeoutRef.current) {
      console.log('🛑 Останавливаем предыдущий polling');
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    // Сбрасываем флаг
    isPollingRef.current = false;

    const poll = async () => {
      console.log(`⏰ Polling tick для комнаты ${roomId}`);
      await pollForUpdates();
      
      // Проверяем что мы все еще должны продолжать polling
      if (enabled && roomId && !isPollingRef.current) {
        console.log(`⏳ Планируем следующий polling через ${pollingInterval}ms`);
        pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
      } else {
        console.log(`🛑 Прекращаем polling: enabled=${enabled}, roomId=${roomId}, isPolling=${isPollingRef.current}`);
      }
    };

    // Первый вызов сразу
    poll();
  }, [pollForUpdates, enabled, roomId, pollingInterval]);

  // Остановка polling - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const stopPolling = useCallback(() => {
    console.log(`🛑 stopPolling для комнаты ${roomId}`);
    
    if (pollingTimeoutRef.current) {
      console.log('🗑️ Очищаем активный таймер polling');
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    // Устанавливаем флаг что polling остановлен
    isPollingRef.current = true; // true означает "уже обрабатывается/остановлен"
    
    console.log('✅ Polling остановлен');
  }, [roomId]);

  // Ручное обновление
  const forceUpdate = useCallback(async () => {
    await pollForUpdates();
  }, [pollForUpdates]);

  // Запуск/остановка polling при изменении параметров - ИСПРАВЛЕННАЯ ВЕРСИЯ
  useEffect(() => {
    console.log(`🔄 useEffect polling: enabled=${enabled}, roomId=${roomId}`);
    
    // ВСЕГДА сначала останавливаем предыдущий polling
    stopPolling();
    
    // Небольшая задержка чтобы убедиться что все очистилось
    const startTimeout = setTimeout(() => {
      if (enabled && roomId) {
        console.log(`▶️ Запускаем polling для новой комнаты: ${roomId}`);
        startPolling();
      } else {
        console.log(`⏸️ Polling отключен: enabled=${enabled}, roomId=${roomId}`);
      }
    }, 100);

    return () => {
      console.log(`🧹 Cleanup polling для комнаты: ${roomId}`);
      clearTimeout(startTimeout);
      stopPolling();
    };
  }, [enabled, roomId, startPolling, stopPolling]);

  // Сброс при изменении комнаты - ИСПРАВЛЕННАЯ ВЕРСИЯ
  useEffect(() => {
    console.log(`🔄 Сброс кэша сообщений для комнаты: ${roomId}`);
    lastMessageIdRef.current = null;
    lastMessagesRef.current = []; // 🆕 Очищаем кэш сообщений
    lastMessagesHashRef.current = ''; // 🚀 НОВОЕ: очищаем хеш для умного сравнения
    lastUpdateTimeRef.current = 0; // 🚀 НОВОЕ: сброс времени обновления
  }, [roomId]);

  // Cleanup при unmount - УСИЛЕННАЯ ВЕРСИЯ
  useEffect(() => {
    return () => {
      console.log('🧹 FINAL cleanup useChatPolling при unmount');
      
      // Очищаем все таймеры и флаги
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      
      isPollingRef.current = true; // Блокируем дальнейший polling
      lastMessageIdRef.current = null;
      lastMessagesRef.current = []; // 🆕 Очищаем кэш сообщений
    };
  }, []);

  return {
    startPolling,
    stopPolling,
    forceUpdate,
    isPolling: isPollingRef.current
  };
} 