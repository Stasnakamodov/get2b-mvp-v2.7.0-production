import { useEffect, useRef, useCallback, useState } from 'react';
import { ChatRoomWithStats } from '@/lib/types/chat';

// Хук для real-time обновлений списка комнат с улучшенным error handling
export function useChatRoomsPolling({
  userId,
  onRoomsUpdate,
  enabled = !!userId, // 🔧 ВОССТАНОВЛЕНО: включен для пользователей с защитой
  pollingInterval = 45000 // 🚀 ОПТИМИЗАЦИЯ: 45 секунд для уменьшения мигания (было 25)
}: {
  userId?: string;
  onRoomsUpdate?: (rooms: ChatRoomWithStats[]) => void;
  enabled?: boolean;
  pollingInterval?: number;
}) {
  
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // 🆕 НОВОЕ: кеш для умного сравнения
  const lastRoomsHashRef = useRef<string>('');
  const lastSuccessTimeRef = useRef<number>(0);
  
  // Состояние для отладки
  const [lastError, setLastError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // 🆕 Функция создания хеша для сравнения
  const createRoomsHash = (rooms: ChatRoomWithStats[]): string => {
    return rooms.map(room => 
      `${room.id}-${room.name}-${room.unread_count}-${room.last_message_content?.substring(0, 50) || ''}`
    ).join('|');
  };

  // Функция с retry logic и exponential backoff
  const fetchWithRetry = async (url: string, maxRetries: number = 3): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Polling attempt ${attempt}/${maxRetries} for userId: ${userId}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Увеличил до 30 секунд
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Polling success, rooms: ${data.rooms?.length || 0}`);
        
        // Сброс счетчика при успехе
        retryCountRef.current = 0;
        setLastError(null);
        setIsConnected(true);
        
        return data;
        
      } catch (error) {
        // Специальная обработка AbortError от timeout
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`⏱️ Polling timeout on attempt ${attempt} - это может быть нормально`);
          setLastError('Timeout - сервер медленно отвечает');
          
          // Для timeout не считаем как критическую ошибку если это последняя попытка
          if (attempt === maxRetries) {
            console.log('📡 Timeout на всех попытках, но продолжаем polling...');
            retryCountRef.current = Math.min(retryCountRef.current + 1, 3); // Ограничиваем рост
            setIsConnected(false);
            return { success: false, error: 'timeout' }; // Возвращаем вместо throw
          }
        } else {
          console.warn(`⚠️ Polling attempt ${attempt} failed:`, error);
          setLastError(error instanceof Error ? error.message : 'Unknown error');
          
          if (attempt === maxRetries) {
            setIsConnected(false);
            throw error;
          }
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Макс 5 сек
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  // Улучшенная функция polling
  const pollForRoomsUpdates = useCallback(async () => {
    if (!userId || !enabled || isPollingRef.current) {
      return;
    }

    try {
      isPollingRef.current = true;

      const params = new URLSearchParams({ user_id: userId });
      const url = `/api/chat/rooms?${params}`;
      
      const data = await fetchWithRetry(url, maxRetries);

      // 🚀 УМНОЕ СРАВНЕНИЕ: обновляем только при реальных изменениях
      if (data && data.success && data.rooms && onRoomsUpdate) {
        const newRoomsHash = createRoomsHash(data.rooms);
        const currentTime = Date.now();
        
        // Проверяем изменились ли данные
        if (newRoomsHash !== lastRoomsHashRef.current) {
          console.log('🔄 Обнаружены изменения в комнатах - обновляем');
          onRoomsUpdate(data.rooms);
          lastRoomsHashRef.current = newRoomsHash;
          lastSuccessTimeRef.current = currentTime;
        } else {
          console.log('✅ Комнаты не изменились - пропускаем обновление');
        }
      } else if (data && data.error === 'timeout') {
        // Timeout - не обновляем данные, но и не логируем как ошибку
        console.log('⏱️ Polling timeout - пропускаем обновление');
      }
      
    } catch (error) {
      console.error('💥 All polling attempts failed:', error);
      retryCountRef.current++;
      
      // Если много ошибок подряд - увеличиваем интервал
      if (retryCountRef.current > 5) {
        console.warn('🚨 Too many polling failures, slowing down...');
      }
      
    } finally {
      isPollingRef.current = false;
    }
  }, [userId, enabled, onRoomsUpdate]);

  // Запуск polling с адаптивным интервалом
  const startPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
    }

    const poll = async () => {
      await pollForRoomsUpdates();
      
      if (enabled && userId) {
        // 🧠 АДАПТИВНЫЙ ИНТЕРВАЛ: замедляем при ошибках и неактивности
        let adaptiveInterval = pollingInterval;
        
        // Увеличиваем интервал при ошибках
        if (retryCountRef.current > 5) {
          adaptiveInterval *= 2;
        }
        
        // 🆕 НОВОЕ: замедляем если долго нет изменений (экономим ресурсы)
        const timeSinceLastUpdate = Date.now() - lastSuccessTimeRef.current;
        if (timeSinceLastUpdate > 300000) { // 5 минут без изменений
          adaptiveInterval = Math.min(adaptiveInterval * 1.5, 90000); // Макс 90 секунд
          console.log(`⏳ Замедляем polling до ${adaptiveInterval/1000}с - долго нет активности`);
        }
          
        pollingTimeoutRef.current = setTimeout(poll, adaptiveInterval);
      }
    };

    poll();
  }, [pollForRoomsUpdates, enabled, userId, pollingInterval]);

  // Остановка polling
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  // Ручное обновление
  const forceUpdate = useCallback(async () => {
    await pollForRoomsUpdates();
  }, [pollForRoomsUpdates]);

  // Запуск/остановка polling при изменении параметров
  useEffect(() => {
    if (enabled && userId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [enabled, userId, startPolling, stopPolling]);

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
    forceUpdate,
    isPolling: isPollingRef.current,
    // Дополнительная диагностика
    isConnected,
    lastError,
    retryCount: retryCountRef.current
  };
} 