import { useState, useEffect, useCallback } from 'react';
import {
  ChatRoom,
  ChatRoomWithStats,
  CreateRoomRequest,
  UpdateRoomRequest,
  ChatFilters,
  ChatRoomType
} from '@/lib/types/chat';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

// Хук для работы с комнатами чата (БЕЗОПАСНАЯ ВЕРСИЯ)
export function useChatRooms(userId?: string) {
  // Состояние комнат
  const [rooms, setRooms] = useState<ChatRoomWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Фильтры
  const [filters, setFilters] = useState<ChatFilters>({});

  // Функция загрузки комнат - УЛЬТРА-БЕЗОПАСНАЯ ВЕРСИЯ
  const loadRooms = useCallback(async () => {
    if (!userId) {
      return;
    }

    
    try {
      setIsLoading(true);
      setError(null);


      const params = new URLSearchParams({
        user_id: userId
      });

      // БЕЗОПАСНЫЙ запрос с таймаутом
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд

      const response = await fetch(`/api/chat/rooms?${params}`, {
        signal: controller.signal,
        headers: getAuthHeaders()
      });
      
      clearTimeout(timeoutId);


      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // БЕЗОПАСНОЕ преобразование в ChatRoomWithStats
        const safeRooms = (data.rooms || []).map((room: any) => ({
          ...room,
          unread_count: room.unread_count || 0,
          participants: room.participants || [],
          assigned_managers: room.assigned_managers || [],
          stats: room.stats || {
            total_messages: 0,
            user_messages: 0,
            ai_messages: 0,
            manager_messages: 0
          }
        }));

        setRooms(safeRooms);
      } else {
        const errorMsg = data.error || 'Failed to load rooms';
        setError(errorMsg);
        console.error('❌ API returned error:', errorMsg);
        
        // FALLBACK: устанавливаем пустой массив
        setRooms([]);
      }
    } catch (error: any) {
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timeout' 
        : `Error loading rooms: ${String(error)}`;
      
      setError(errorMessage);
      console.error('💥 loadRooms error:', errorMessage);
      
      // FALLBACK: устанавливаем пустой массив при ошибке
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters]);

  // Функция создания новой комнаты - БЕЗОПАСНАЯ ВЕРСИЯ
  const createRoom = useCallback(async (roomRequest: CreateRoomRequest) => {
    if (!userId || !roomRequest.name?.trim()) {
      throw new Error('User ID and room name are required');
    }

    try {
      setIsCreating(true);
      setError(null);

      const roomData: CreateRoomRequest = {
        user_id: userId,
        name: roomRequest.name.trim(),
        room_type: roomRequest.room_type || 'ai',
        project_id: roomRequest.room_type === 'project' ? roomRequest.project_id : undefined,
        description: roomRequest.description || (roomRequest.room_type === 'ai' ? `AI комната: ${roomRequest.name.trim()}` : `Комната проекта: ${roomRequest.name.trim()}`)
      };


      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // БЕЗОПАСНОЕ создание ChatRoomWithStats
        const newRoomWithStats: ChatRoomWithStats = {
          ...data.room,
          unread_count: 0,
          participants: [],
          assigned_managers: [],
          stats: {
            total_messages: 0,
            user_messages: 0,
            ai_messages: 0,
            manager_messages: 0
          }
        };

        // 🚀 ОПТИМИЗИРОВАННОЕ добавление комнаты БЕЗ лишних перерендеров
        setRooms(prev => {
          // Проверяем что комната еще не добавлена (защита от дублирования)
          const exists = prev.some(room => room.id === newRoomWithStats.id);
          if (exists) {
            return prev;
          }
          return [newRoomWithStats, ...prev];
        });
        return data.room;
      } else {
        const errorMsg = data.error || 'Failed to create room';
        setError(errorMsg);
        console.error('❌ Failed to create room:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      setError(errorMessage);
      console.error('❌ Error creating room:', errorMessage);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [userId]);

  // Функция обновления комнаты
  const updateRoom = useCallback(async (
    roomId: string,
    updates: UpdateRoomRequest
  ) => {
    if (!roomId) return null;

    try {
      setError(null);

      const response = await fetch(`/api/chat/room/${roomId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (data.success) {
        // Обновляем комнату в списке
        setRooms(prev => 
          prev.map(room => 
            room.id === roomId 
              ? { ...room, ...data.room }
              : room
          )
        );
        return data.room;
      } else {
        setError(data.error || 'Failed to update room');
        console.error('Failed to update room:', data.error);
        return null;
      }
    } catch (error) {
      const errorMessage = 'Error updating room: ' + String(error);
      setError(errorMessage);
      console.error(errorMessage);
      return null;
    }
  }, []);

  // Функция архивирования AI комнаты
  const archiveRoom = useCallback(async (roomId: string) => {
    return await updateRoom(roomId, { is_archived: true, is_active: false });
  }, [updateRoom]);

  // Функция восстановления комнаты из архива
  const restoreRoom = useCallback(async (roomId: string) => {
    return await updateRoom(roomId, { is_archived: false, is_active: true });
  }, [updateRoom]);

  // Функция получения конкретной комнаты
  const getRoom = useCallback(async (roomId: string) => {
    if (!roomId) return null;

    try {
      const response = await fetch(`/api/chat/room/${roomId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (data.success) {
        return data.room;
      } else {
        console.error('Failed to get room:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  }, []);

  // Функция обновления количества непрочитанных сообщений
  const updateUnreadCount = useCallback((roomId: string, count: number) => {
    setRooms(prev => 
      prev.map(room => 
        room.id === roomId 
          ? { ...room, unread_count: count }
          : room
      )
    );
  }, []);

  // Функция увеличения счетчика непрочитанных
  const incrementUnreadCount = useCallback((roomId: string) => {
    setRooms(prev => 
      prev.map(room => 
        room.id === roomId 
          ? { ...room, unread_count: room.unread_count + 1 }
          : room
      )
    );
  }, []);

  // Функция сброса счетчика непрочитанных
  const resetUnreadCount = useCallback((roomId: string) => {
    updateUnreadCount(roomId, 0);
  }, [updateUnreadCount]);

  // Функции фильтрации
  const setRoomTypeFilter = useCallback((roomType?: ChatRoomType) => {
    setFilters(prev => ({ ...prev, room_type: roomType }));
  }, []);

  const setActiveFilter = useCallback((isActive?: boolean) => {
    setFilters(prev => ({ ...prev, is_active: isActive }));
  }, []);

  const setUnreadFilter = useCallback((hasUnread?: boolean) => {
    setFilters(prev => ({ ...prev, has_unread: hasUnread }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Вычисляемые значения
  const aiRooms = rooms.filter(room => room.room_type === 'ai');
  const projectRooms = rooms.filter(room => room.room_type === 'project');
  const activeRooms = rooms.filter(room => room.is_active && !room.is_archived);
  const archivedRooms = rooms.filter(room => room.is_archived);
  const roomsWithUnread = rooms.filter(room => room.unread_count > 0);
  const totalUnreadCount = rooms.reduce((sum, room) => sum + room.unread_count, 0);

  // БЕЗОПАСНАЯ загрузка комнат при изменении пользователя
  useEffect(() => {
    if (userId) {
      // Задержка для предотвращения множественных вызовов
      const timeoutId = setTimeout(() => {
        loadRooms();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [userId]);

  // Функция удаления комнаты - БЕЗОПАСНАЯ ВЕРСИЯ
  const deleteRoom = useCallback(async (roomId: string) => {
    if (!userId || !roomId) {
      throw new Error('User ID and Room ID are required');
    }

    setIsLoading(true);
    setError(null);

    try {

      const params = new URLSearchParams({
        room_id: roomId,
        user_id: userId
      });

      const response = await fetch(`/api/chat/rooms?${params}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete room');
      }

      // Удаляем комнату из локального состояния
      setRooms(prev => prev.filter(room => room.id !== roomId));

      
      return data.deletedRoom;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room';
      console.error('❌ Error deleting room:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Возвращаем состояние и функции
  return {
    // Состояние
    rooms,
    isLoading,
    isCreating,
    error,

    // Фильтрованные списки
    aiRooms,
    projectRooms,
    activeRooms,
    archivedRooms,
    roomsWithUnread,

    // Статистика
    totalUnreadCount,
    roomsCount: rooms.length,
    aiRoomsCount: aiRooms.length,
    projectRoomsCount: projectRooms.length,

    // Функции управления комнатами
    loadRooms,
    createRoom,
    deleteRoom,
    updateRoom,
    archiveRoom,
    restoreRoom,
    getRoom,

    // Функции работы с непрочитанными
    updateUnreadCount,
    incrementUnreadCount,
    resetUnreadCount,

    // Функции фильтрации
    setRoomTypeFilter,
    setActiveFilter,
    setUnreadFilter,
    clearFilters,
    filters,

    // Утилиты
    refreshRooms: loadRooms,
    clearError: () => setError(null),
  };
} 