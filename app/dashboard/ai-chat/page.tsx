"use client"

// 🔥 FORCED UPDATE v2.0 - TIMESTAMP: 1734525000000
// 🚀 AI CHAT WITH BOTHUB API INTEGRATION

import React, { useState, useRef, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Bot,
  Building2,
  Send, 
  Paperclip,
  Smile,
  MessageSquare,
  ArrowRight,
  Calendar,
  DollarSign,
  Trash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import { useChatRooms } from "@/hooks/useChatRooms"
import { useChat } from "@/hooks/useChat"
// import { useChatRoomsPolling } from "@/hooks/useChatRoomsPolling" // ОТКЛЮЧЕН для исправления ошибок

// Импортируем типы из lib
import type { ChatMessage, ChatRoom } from '@/lib/types/chat'

// 🚀 МЕМОИЗИРОВАННЫЙ компонент комнаты для предотвращения ненужных перерендеров
const ChatRoomItem = memo(({ 
  room, 
  isSelected, 
  onSelect, 
  onDelete 
}: {
  room: any;
  isSelected: boolean;
  onSelect: (room: any) => void;
  onDelete: (room: any, e: React.MouseEvent) => void;
}) => {
  // 🎯 СТАБИЛЬНЫЕ KEYS: учитываем содержимое для предотвращения ненужных перерендеров
  const stableKey = room.id 
    ? `room-${room.id}-${room.name}-${room.unread_count}-${room.last_message_content?.substring(0, 20) || 'empty'}`
    : `temp-room-${Date.now()}`;

  return (
    <div
      key={stableKey}
      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border
                ${isSelected 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
      onClick={() => onSelect(room)}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                      ${room.room_type === 'ai' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'}`}>
          {room.room_type === 'ai' ? (
            <Bot className="w-5 h-5" />
          ) : (
            <Building2 className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate text-sm">{room.name}</h3>
            <div className="flex items-center space-x-1">
              {room.unread_count > 0 && (
                <Badge variant="destructive" className="px-1.5 py-0.5 text-xs">
                  {room.unread_count}
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => onDelete(room, e)}
                    className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Удалить комнату</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {room.last_message_content 
              ? room.last_message_content.replace(/[🎯💡📋💰🌍⚖️📊❓•]/g, '').substring(0, 50) + (room.last_message_content.length > 50 ? '...' : '')
              : "Нет сообщений"
            }
          </p>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Глубокое сравнение для предотвращения ненужных перерендеров
  return (
    prevProps.room.id === nextProps.room.id &&
    prevProps.room.name === nextProps.room.name &&
    prevProps.room.unread_count === nextProps.room.unread_count &&
    prevProps.room.last_message_content === nextProps.room.last_message_content &&
    prevProps.isSelected === nextProps.isSelected
  );
});

interface Project {
  id: string
  name: string
  status: string
  amount: number
  currency: string
  created_at: string
  displayInfo?: string
}

// Функция для получения текста статуса
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'draft': '📝 Черновик',
    'active': '🚀 В работе', 
    'pending': '⏳ Ожидает',
    'completed': '✅ Завершен',
    'cancelled': '❌ Отменен'
  };
  return statusMap[status] || '📋 Новый';
};

// AI подсказки
const AI_SHORTCUTS = [
  { key: '1', title: 'Поиск поставщиков', prompt: 'Помогите найти поставщиков для моего проекта. Опишите требования и я найду подходящие компании.' },
  { key: '2', title: 'Анализ предложений', prompt: 'Проанализируйте полученные коммерческие предложения и дайте рекомендации по выбору поставщика.' },
  { key: '3', title: 'Переговоры', prompt: 'Подготовьте стратегию переговоров с поставщиком. Какие вопросы задать и на что обратить внимание?' },
  { key: '4', title: 'Контракт', prompt: 'Помогите составить договор с поставщиком. Какие условия включить для защиты интересов?' },
]

// Модальное окно создания комнаты
interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateAI: () => void
  onCreateProject: (projectId: string) => void
  onQuickAIPrompt: (prompt: string) => void
  projects: Project[]
  isCreatingRoom: boolean
}

function CreateRoomModal({ isOpen, onClose, onCreateAI, onCreateProject, onQuickAIPrompt, projects, isCreatingRoom }: CreateRoomModalProps) {
  const [selectedProject, setSelectedProject] = useState<string>('')

  const handleCreateProject = () => {
    if (selectedProject) {
      onCreateProject(selectedProject)
      setSelectedProject('')
      onClose()
    }
  }

  const handleCreateAI = () => {
    onCreateAI()
    onClose()
  }

  const handleQuickPrompt = (prompt: string) => {
    onQuickAIPrompt(prompt)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Мы всегда рядом! 🤝</DialogTitle>
          <div className="text-base text-gray-700 mt-3 leading-relaxed">
            <p className="mb-2">
              <span className="font-semibold text-blue-600">Не оставляем вас один на один с вопросами!</span> 
              Каждый проект — это живое общение с реальными людьми.
            </p>
            <p>
              Выберите, как удобнее получать поддержку: мгновенные ответы от AI или персональное ведение менеджера. 
              <span className="text-green-600 font-medium">Мы здесь для вашего успеха! ✨</span>
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* AI чат */}
          <div className="border border-blue-200 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-blue-200 text-sm font-medium bg-blue-600 text-white px-3 py-1 rounded-full">
              24/7 онлайн ⚡
            </div>
            <div className="flex items-start space-x-6 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-2xl text-gray-900 mb-2">AI Эксперт Get2B 🧠</h3>
                <p className="text-base text-gray-700 mb-3">
                  <span className="font-semibold">Ваш личный консультант</span> — знает каждую деталь о закупках, документах, платежах
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-blue-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Отвечает мгновенно, даже ночью
                  </div>
                  <div className="flex items-center text-sm text-blue-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Помогает с документами и расчетами
                  </div>
                  <div className="flex items-center text-sm text-blue-700">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Объясняет сложные вопросы простыми словами
                  </div>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleCreateAI}
              disabled={isCreatingRoom}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg py-4 font-semibold shadow-lg disabled:opacity-50"
            >
              {isCreatingRoom ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Создаем комнату...</span>
                </div>
              ) : (
                "💬 Начать общение с AI"
              )}
            </Button>
          </div>

          {/* Проектные чаты */}
          <div className="border border-green-200 rounded-xl p-8 bg-gradient-to-br from-green-50 to-green-100 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-green-200 text-sm font-medium bg-green-600 text-white px-3 py-1 rounded-full">
              Персонально 👤
            </div>
            <div className="flex items-start space-x-6 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-2xl text-gray-900 mb-2">Персональный менеджер 👨‍💼</h3>
                <p className="text-base text-gray-700 mb-3">
                  <span className="font-semibold">Живой человек ведет ваш проект</span> — контролирует каждый этап, решает проблемы
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Отчеты о прогрессе каждые 2-3 дня
                  </div>
                  <div className="flex items-center text-sm text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Решение нестандартных ситуаций
                  </div>
                  <div className="flex items-center text-sm text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Прямая связь по WhatsApp/Telegram
                  </div>
                </div>
              </div>
            </div>
            
            {projects.length > 0 ? (
              <div className="space-y-4">
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full p-4 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Выберите проект</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} — {project.amount ? `${(project.amount / 1000).toFixed(0)}к ${project.currency}` : getStatusText(project.status)}
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={handleCreateProject}
                  disabled={!selectedProject || isCreatingRoom}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg py-4 font-semibold shadow-lg disabled:opacity-50"
                >
                  {isCreatingRoom ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Создаем комнату...</span>
                    </div>
                  ) : (
                    "🤝 Связаться с менеджером"
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-base text-gray-600 mb-3">
                  📋 Пока нет активных проектов
                </p>
                <p className="text-sm text-gray-500">
                  Создайте первый проект, и мы сразу назначим вам персонального менеджера!
                </p>
              </div>
            )}
          </div>

          {/* Быстрые промпты */}
          <div className="border border-purple-200 rounded-xl p-8 bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="text-center mb-6">
              <h3 className="font-bold text-2xl text-gray-900 mb-2">🚀 Популярные вопросы</h3>
              <p className="text-base text-gray-600">
                Нажмите на любой — AI сразу даст развернутый ответ с примерами!
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {AI_SHORTCUTS.map((shortcut) => (
                <Button
                  key={shortcut.key}
                  variant="outline"
                  onClick={() => handleQuickPrompt(shortcut.prompt)}
                  className="text-left justify-start h-auto p-5 text-base hover:bg-white hover:shadow-md border-purple-200 hover:border-purple-300 transition-all duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <span className="font-bold text-xl text-purple-600 min-w-[24px]">{shortcut.key}</span>
                    <div>
                      <div className="font-medium text-gray-900 leading-tight">{shortcut.title}</div>
                      <div className="text-sm text-gray-500 mt-1">Кликните для ответа</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-purple-600 font-medium">
                💡 Или просто напишите свой вопрос — AI поймет и поможет!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ChatHubPage() {
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userJustSentMessage, setUserJustSentMessage] = useState(false) // 🚫 Флаг для контроля автоскролла
  const [isRoomSwitching, setIsRoomSwitching] = useState(false) // 🔄 Флаг переключения комнат
  const [isCreatingRoom, setIsCreatingRoom] = useState(false) // 🚫 Флаг для предотвращения дублирования создания комнат
  // 🔥 НОВЫЙ флаг для предотвращения race condition
  const [isManuallySelectingRoom, setIsManuallySelectingRoom] = useState(false)
  // 🛡️ НОВАЯ защита от повторных отправок
  const [lastSentMessage, setLastSentMessage] = useState<string>("")
  const [lastSentTime, setLastSentTime] = useState<number>(0)
  // 🚀 НОВОЕ: плавные loading состояния
  const [isUpdatingRooms, setIsUpdatingRooms] = useState(false)
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false)
  const sendingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const roomSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { rooms, isLoading: roomsLoading, createRoom, deleteRoom, loadRooms } = useChatRooms(userId || undefined)
  
  // 🚀 ОПТИМИЗИРОВАННАЯ обертка для loadRooms с индикатором
  const loadRoomsWithIndicator = useCallback(async () => {
    if (isUpdatingRooms) return; // Предотвращаем множественные обновления
    
    setIsUpdatingRooms(true);
    setShowUpdateIndicator(true);
    
    try {
      await loadRooms();
      
      // Показываем индикатор минимум 500мс для плавности
      setTimeout(() => {
        setShowUpdateIndicator(false);
      }, 500);
      
    } catch (error) {
      console.error('❌ Ошибка обновления комнат:', error);
      setShowUpdateIndicator(false);
    } finally {
      setTimeout(() => {
        setIsUpdatingRooms(false);
      }, 700); // Небольшая задержка для предотвращения частых обновлений
    }
  }, [loadRooms, isUpdatingRooms]);
  // 🔧 ИСПРАВЛЕНИЕ: useChat только для выбранной комнаты + отключаем polling при переключении
  const { messages, isLoading: messagesLoading, sendMessage, sendMessageWithAI, isSending } = useChat(
    selectedRoom?.id, 
    userId || undefined
  )

  // 🔄 УЛЬТРА-СТАБИЛЬНОЕ переключение комнат БЕЗ телепортации
  const handleRoomSelect = useCallback((room: any, immediate: boolean = false) => {
    if (selectedRoom?.id === room.id) {
      console.log("🚫 Попытка переключения на ту же комнату:", room.name);
      return;
    }
    
    console.log("🔄 ПЕРЕКЛЮЧЕНИЕ КОМНАТЫ:", {
      from: selectedRoom?.name || 'нет',
      to: room.name,
      immediate
    });
    
    // 🛑 СРАЗУ отменяем все таймеры
    if (roomSwitchTimeoutRef.current) {
      clearTimeout(roomSwitchTimeoutRef.current);
      roomSwitchTimeoutRef.current = null;
    }
    
    // 🚫 КРИТИЧЕСКАЯ БЛОКИРОВКА всех автоматических действий
    setIsManuallySelectingRoom(true);
    setIsRoomSwitching(true); // Показываем индикатор переключения
    
    // 🚀 ДВУХЭТАПНОЕ переключение для устранения телепортации
    setTimeout(() => {
      setSelectedRoom(room);
      setIsRoomSwitching(false);
      
      // Разблокируем через увеличенное время для полной стабильности
      setTimeout(() => {
        setIsManuallySelectingRoom(false);
        console.log("✅ Комната переключена и разблокирована:", room.name);
      }, 800); // Увеличенное время блокировки
      
    }, 100); // Небольшая задержка для стабильности
    
  }, [selectedRoom?.id]);

  // Очистка всех таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (roomSwitchTimeoutRef.current) {
        clearTimeout(roomSwitchTimeoutRef.current);
        roomSwitchTimeoutRef.current = null;
      }
      if (sendingTimeoutRef.current) {
        clearTimeout(sendingTimeoutRef.current);
        sendingTimeoutRef.current = null;
      }
    };
  }, []);

  // 🚀 ОПТИМИЗИРОВАННОЕ обновление комнат с debounce и кешированием
  useEffect(() => {
    if (!userId) return;

    let focusDebounceTimer: NodeJS.Timeout | null = null;
    let lastFocusUpdate = 0;
    const FOCUS_DEBOUNCE_TIME = 3000; // 3 секунды между обновлениями при фокусе

    // Умное обновление при фокусе с debounce
    const handleFocus = () => {
      const now = Date.now();
      
      // Проверяем не было ли недавно обновления
      if (now - lastFocusUpdate < FOCUS_DEBOUNCE_TIME) {
        console.log('🚫 Блокировка частых обновлений при фокусе');
        return;
      }

      if (focusDebounceTimer) {
        clearTimeout(focusDebounceTimer);
      }

             focusDebounceTimer = setTimeout(() => {
         console.log('🔄 Window focused - умное обновление комнат');
         loadRoomsWithIndicator();
         lastFocusUpdate = Date.now();
       }, 1000); // 1 секунда задержки для стабильности
    };

    window.addEventListener('focus', handleFocus);
    
    // 🆕 НОВОЕ: Очень редкое обновление в фоне (2 минуты)
    const interval = setInterval(() => {
             if (!document.hidden && Date.now() - lastFocusUpdate > 120000) { // Только если давно не обновлялось
         console.log('🔄 Фоновое обновление комнат');
         loadRoomsWithIndicator();
       }
    }, 120000); // 2 минуты

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
      if (focusDebounceTimer) {
        clearTimeout(focusDebounceTimer);
      }
    };  
  }, [userId, loadRoomsWithIndicator]);

  // Фильтрованные комнаты
  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 🔧 ИСПРАВЛЕННЫЙ АВТОСКРОЛЛ - БЕЗ ТЕЛЕПОРТАЦИИ
  useEffect(() => {
    // Автоскролл при новых сообщениях или когда пользователь отправил сообщение
    if (messages.length === 0) return;

    console.log('📜 Автоскролл:', { messageCount: messages.length, userJustSent: userJustSentMessage });
    
    // Простой и стабильный скролл
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        setUserJustSentMessage(false);
        console.log('✅ Автоскролл завершен');
      }
    };

    // Небольшая задержка для стабильности
    setTimeout(scrollToBottom, 100);
  }, [messages.length, userJustSentMessage]) // Возвращаем messages в зависимости!

  // Получаем текущего пользователя и его проекты
  useEffect(() => {
    const fetchUserAndProjects = async () => {
      try {
        console.log("🔍 Получение пользователя...");
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error("❌ Ошибка получения пользователя:", userError);
          return;
        }

        if (user) {
          setUserId(user.id);
          console.log("✅ Пользователь получен:", user.id);
          
          // Упрощенная загрузка проектов без inner join
          try {
            const { data: projectsData, error: projectsError } = await supabase
              .from('projects')
              .select('id, name, status, amount, currency, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (projectsError) {
              console.warn("⚠️ Проекты не загружены:", projectsError.message);
              setProjects([]); // Устанавливаем пустой массив при ошибке
            } else if (projectsData) {
              const transformedProjects = projectsData.map(project => ({
                id: project.id,
                name: project.name,
                status: project.status || 'draft',
                amount: project.amount || 0,
                currency: project.currency || 'RUB',
                created_at: project.created_at,
                // Добавляем полезное описание проекта
                displayInfo: project.amount 
                  ? `${(project.amount / 1000).toFixed(0)}к ${project.currency || 'RUB'}`
                  : getStatusText(project.status || 'draft')
              }));
              setProjects(transformedProjects);
              console.log("✅ Проекты загружены:", transformedProjects.length);
            }
          } catch (projectError) {
            console.warn("⚠️ Ошибка загрузки проектов, устанавливаем пустой список:", projectError);
            setProjects([]);
          }
        }
      } catch (error) {
        console.error("💥 Неожиданная ошибка:", error);
      }
    };

    fetchUserAndProjects();
  }, []);

  // ОТКЛЮЧАЮ автоматическое создание AI комнат - УБИРАЕТ ДУБЛИКАТЫ
  // useEffect(() => {
  //   const ensureAIRoomExists = async () => {
  //     if (!userId || !rooms || roomsLoading) return;
      
  //     // Проверяем есть ли уже AI комнаты
  //     const hasAIRoom = rooms.some(room => room.room_type === 'ai');
      
  //     if (!hasAIRoom) {
  //       console.log("🤖 Создаем AI комнату при первом входе...");
  //       try {
  //         await createRoom({
  //           user_id: userId,
  //           room_type: 'ai',
  //           name: 'AI Помощник',
  //           description: 'Умный ассистент для закупок'
  //         });
  //         console.log("✅ AI комната создана");
  //       } catch (error) {
  //         console.error("❌ Ошибка создания AI комнаты:", error);
  //       }
  //     }
  //   };

  //   ensureAIRoomExists();
  // }, [userId, rooms, roomsLoading, createRoom]);

  // 🛡️ БЕЗОПАСНЫЙ автовыбор ТОЛЬКО при первой загрузке комнат (НЕ при создании новых)
  const [initialRoomsLoaded, setInitialRoomsLoaded] = useState(false);
  
  useEffect(() => {
    console.log("🔍 Auto-select effect triggered:", {
      roomsCount: rooms.length,
      selectedRoom: selectedRoom?.id,
      initialLoaded: initialRoomsLoaded,
      isCreating: isCreatingRoom,
      isManuallySelecting: isManuallySelectingRoom
    });
    
    // 🎯 ИСПРАВЛЕНИЕ: Более строгие условия для автовыбора
    if (rooms.length > 0 && 
        !selectedRoom && 
        !initialRoomsLoaded && 
        !isCreatingRoom && 
        !isManuallySelectingRoom &&
        !roomsLoading // ⚡ НЕ выбираем комнату пока идет загрузка
    ) {
      console.log("🎯 БЕЗОПАСНЫЙ автовыбор первой комнаты:", rooms[0].name);
      
      // 🚫 Блокируем повторные срабатывания
      setIsManuallySelectingRoom(true);
      setSelectedRoom(rooms[0]);
      setInitialRoomsLoaded(true);
      
      // Разблокируем через время
      setTimeout(() => {
        setIsManuallySelectingRoom(false);
      }, 500); // Увеличил время блокировки
    }
  }, [rooms.length, selectedRoom, initialRoomsLoaded, isCreatingRoom, isManuallySelectingRoom, roomsLoading]); // Добавил roomsLoading

  // Быстрое тестирование чата
  const handleQuickTest = async () => {
    if (!selectedRoom) return;
    
    const testMessage = "ТЕСТ! Быстрая проверка чата";
    setMessage(testMessage);
    
    // Отправляем тестовое сообщение
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Обработчик отправки сообщений с защитой от дублирования
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || !selectedRoom || !userId) return

    const messageToSend = message.trim();
    const currentTime = Date.now();
    
    // 🛡️ ЗАЩИТА ОТ ПОВТОРНЫХ ОТПРАВОК - debouncing 2 секунды
    const DEBOUNCE_TIME = 2000; // 2 секунды
    if (
      messageToSend === lastSentMessage && 
      currentTime - lastSentTime < DEBOUNCE_TIME
    ) {
      console.log('🚫 Блокировка дублированной отправки:', messageToSend);
      return;
    }
    
    // 🛡️ ЗАЩИТА ОТ БЫСТРЫХ КЛИКОВ - очищаем предыдущий таймер
    if (sendingTimeoutRef.current) {
      clearTimeout(sendingTimeoutRef.current);
      sendingTimeoutRef.current = null;
    }
    
    try {
      console.log('📤 Отправка сообщения с защитой:', messageToSend);
      
      // Сохраняем информацию о последней отправке
      setLastSentMessage(messageToSend);
      setLastSentTime(currentTime);
      
      // КРИТИЧНО: Очищаем поле ввода СРАЗУ перед отправкой
      setMessage('');
      
      // 🚀 РАЗРЕШАЕМ автоскролл только когда пользователь отправляет сообщение
      setUserJustSentMessage(true);
      
      if (selectedRoom.room_type === 'ai') {
        // AI комната - отправляем через AI API
        await sendMessageWithAI(messageToSend);
      } else {
        // Обычная комната - обычное сообщение
        await sendMessage(messageToSend);
      }
      
      // 🚀 Устанавливаем таймер для сброса защиты
      sendingTimeoutRef.current = setTimeout(() => {
        setLastSentMessage("");
        setLastSentTime(0);
        console.log('✅ Сброс защиты от дублирования');
      }, DEBOUNCE_TIME);
      
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      // Если ошибка - возвращаем сообщение обратно и сбрасываем защиту
      setMessage(messageToSend);
      setLastSentMessage("");
      setLastSentTime(0);
    }
  }, [message, selectedRoom, userId, sendMessage, sendMessageWithAI, lastSentMessage, lastSentTime]);

  // Создание AI комнаты - УЛЬТРА-ОПТИМИЗИРОВАННАЯ ВЕРСИЯ БЕЗ RACE CONDITION
  const handleCreateAIRoom = useCallback(async () => {
    if (!userId || isCreatingRoom) {
      console.log("🚫 Создание AI комнаты заблокировано");
      return;
    }
    
    setIsCreatingRoom(true);
    setIsManuallySelectingRoom(true); // 🔒 Блокируем автовыбор
    
    try {
      console.log("🤖 Создание AI комнаты...");
      
      const newRoom = await createRoom({
        user_id: userId,
        room_type: 'ai',
        name: 'AI Ассистент',
        description: 'Умный помощник для закупок'
      });
      
      console.log("✅ AI комната создана:", newRoom.name);
      
      // 🚀 МГНОВЕННОЕ переключение БЕЗ конфликтов (используем immediate=true)
      handleRoomSelect(newRoom, true);
      
    } catch (error) {
      console.error('❌ Ошибка создания AI комнаты:', error);
      setIsManuallySelectingRoom(false); // Разблокируем при ошибке
    } finally {
      setIsCreatingRoom(false);
    }
  }, [userId, createRoom, isCreatingRoom, handleRoomSelect]);

  // Создание проектной комнаты - УЛЬТРА-ОПТИМИЗИРОВАННАЯ ВЕРСИЯ БЕЗ RACE CONDITION
  const handleCreateProjectRoom = useCallback(async (projectId: string) => {
    if (!userId || isCreatingRoom) {
      console.log("🚫 Создание проектной комнаты заблокировано");
      return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    setIsCreatingRoom(true);
    setIsManuallySelectingRoom(true); // 🔒 Блокируем автовыбор
    
    try {
      console.log("🏗️ Создание проектной комнаты...");
      
      const newRoom = await createRoom({
        user_id: userId,
        room_type: 'project',
        name: `Проект: ${project.name}`,
        description: `Обсуждение проекта ${project.name}`,
        project_id: projectId
      });
      
      console.log("✅ Проектная комната создана:", newRoom.name);
      
      // 🚀 МГНОВЕННОЕ переключение БЕЗ конфликтов (используем immediate=true)
      handleRoomSelect(newRoom, true);
      
    } catch (error) {
      console.error('❌ Ошибка создания проектной комнаты:', error);
      setIsManuallySelectingRoom(false); // Разблокируем при ошибке
    } finally {
      setIsCreatingRoom(false);
    }
  }, [userId, projects, createRoom, isCreatingRoom, handleRoomSelect]);

  // Удаление комнаты
  const handleDeleteRoom = async (room: ChatRoom, event: React.MouseEvent) => {
    event.stopPropagation(); // Предотвращаем выбор комнаты
    
    if (!userId) return;
    
    if (confirm(`Удалить комнату "${room.name}"? Все сообщения будут потеряны.`)) {
      try {
        await deleteRoom(room.id);
        
        // Если удаляемая комната была выбрана, сбрасываем выбор
        if (selectedRoom?.id === room.id) {
          setSelectedRoom(null);
        }
        
        // УБИРАЕМ forceUpdateKey - хук useChatRooms сам обновит список
        console.log("✅ Комната удалена:", room.name);
      } catch (error) {
        console.error('❌ Ошибка удаления комнаты:', error);
        alert('Ошибка удаления комнаты');
      }
    }
  };

  // Быстрые промпты для AI - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ БЕЗ RACE CONDITION
  const handleQuickAIPrompt = useCallback(async (prompt: string) => {
    if (!selectedRoom || selectedRoom.room_type !== 'ai') {
      // Создаем новую AI комнату если текущая не AI
      if (isCreatingRoom) {
        console.log("🚫 Уже создаем комнату - быстрый промпт отклонен");
        return;
      }
      
      setIsCreatingRoom(true);
      setIsManuallySelectingRoom(true); // 🔒 Блокируем автовыбор
      
      try {
        const newRoom = await createRoom({
          user_id: userId!,
          room_type: 'ai',
          name: 'AI Помощник',
          description: 'Быстрый запрос к AI'
        });
        
        // 🚀 МГНОВЕННОЕ переключение и отправка сообщения
        handleRoomSelect(newRoom, true);
        
        setMessage(prompt);
        setUserJustSentMessage(true);
        
        // Небольшая задержка только для отправки сообщения
        setTimeout(() => handleSendMessage(), 200);
        
      } catch (error) {
        console.error('❌ Ошибка создания AI комнаты:', error);
        setIsManuallySelectingRoom(false); // Разблокируем при ошибке
      } finally {
        setIsCreatingRoom(false);
      }
    } else {
      setMessage(prompt);
      setUserJustSentMessage(true);
      setTimeout(() => handleSendMessage(), 100);
    }
  }, [selectedRoom, userId, createRoom, handleSendMessage, isCreatingRoom, handleRoomSelect]);

  // Загрузка
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {/* Основной контент - используем всю высоту экрана */}
      <div className="flex h-screen bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Боковая панель с комнатами */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
            {/* Поиск и фильтры */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">Чат-комнаты</h2>
                  {/* 🚀 ИНДИКАТОР ОБНОВЛЕНИЯ */}
                  {showUpdateIndicator && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                      <span className="text-xs">Обновление...</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleQuickTest}
                        className="h-8 w-8 bg-green-50 hover:bg-green-100 border-green-200"
                      >
                        <Bot className="w-4 h-4 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Быстрый тест</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCreateModal(true)}
                        className="h-8 w-8"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Создать комнату</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              {/* Поиск */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Поиск комнат..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            {/* Список комнат */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {roomsLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={`room-skeleton-${i}`} className="h-14 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                                  ) : (
                    <div className="space-y-1">
                      {filteredRooms.map((room, index) => (
                        <ChatRoomItem
                          key={room.id || `temp-room-${index}`}
                          room={room}
                          isSelected={selectedRoom?.id === room.id}
                          onSelect={(room) => handleRoomSelect(room, false)}
                          onDelete={handleDeleteRoom}
                        />
                      ))}
                    </div>
                )}
              </div>
            </ScrollArea>
        </div>

        {/* Основная область чата */}
        {selectedRoom ? (
          <div className="flex-1 flex flex-col">
            {/* Заголовок чата */}
            <div className="border-b border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                ${selectedRoom.room_type === 'ai' 
                                  ? 'bg-blue-100 text-blue-600' 
                                  : 'bg-green-100 text-green-600'}`}>
                    {selectedRoom.room_type === 'ai' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">{selectedRoom.name}</h2>
                    <p className="text-xs text-gray-500">
                      {selectedRoom.room_type === 'ai' ? 'AI Ассистент' : 'Менеджер Get2B'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Активен
                  </Badge>
                </div>
              </div>
              
              {/* Горячие клавиши для AI */}
              {selectedRoom.room_type === 'ai' && (
                <div className="mt-3 flex space-x-2 overflow-x-auto">
                  {AI_SHORTCUTS.map((shortcut, index) => (
                    <Button
                      key={`ai-shortcut-${shortcut.key}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAIPrompt(shortcut.prompt)}
                      className="flex items-center space-x-2 whitespace-nowrap hover:bg-blue-50 hover:border-blue-300"
                    >
                      <span>{shortcut.key}</span>
                      <span>{shortcut.title}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Сообщения */}
            <ScrollArea className="flex-1 p-6">
              {/* Индикатор переключения комнат */}
              {isRoomSwitching && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-10">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Переключение комнаты...</span>
                  </div>
                </div>
              )}
              
              <div className={`space-y-4 ${isRoomSwitching ? 'opacity-50' : 'opacity-100'} transition-opacity duration-200`}>
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={`msg-skeleton-${i}`} className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                          <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div>
                    {/* 🚨 ЗАЩИТА ОТ ТЕЛЕПОРТАЦИИ: Показываем сообщения только если они из текущей комнаты */}
                    {messages
                      .filter(msg => !selectedRoom || msg.room_id === selectedRoom.id) // Фильтруем по комнате
                      .map((msg, index) => {
                        // 🚀 СТАБИЛЬНЫЕ KEYS для сообщений: учитываем содержимое
                        const msgStableKey = msg.id 
                          ? `msg-${msg.id}-${msg.content.substring(0, 20)}-${msg.created_at}`
                          : `temp-msg-${index}-${Date.now()}`;
                        
                        return (
                          <div
                            key={msgStableKey}
                            className={`flex space-x-3 mb-4 ${msg.sender_type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                          >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={msg.sender_type === 'ai' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}>
                              {msg.sender_type === 'ai' ? <Bot className="w-4 h-4" /> : msg.sender_name?.[0] || "П"}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-3xl ${msg.sender_type === 'user' ? 'flex flex-col items-end' : ''}`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {msg.sender_type === 'ai' ? "AI Ассистент" : msg.sender_name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className={`rounded-lg px-3 py-2 text-sm ${
                              msg.sender_type === 'ai'
                                ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                                : msg.sender_type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="whitespace-pre-line">{
                                // 🧹 УБИРАЕМ MARKDOWN РАЗМЕТКУ из AI сообщений
                                msg.sender_type === 'ai' 
                                  ? msg.content
                                      .replace(/\*\*(.*?)\*\*/g, '$1') // **текст** → текст
                                      .replace(/\*(.*?)\*/g, '$1')     // *текст* → текст
                                      .replace(/`(.*?)`/g, '$1')       // `код` → код
                                      .replace(/#{1,6}\s*(.*?)$/gm, '$1') // # заголовок → заголовок
                                  : msg.content
                              }</p>
                            </div>
                          </div>
                        </div>
                          );
                        })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Начните диалог</h3>
                      <p className="text-gray-500">Отправьте первое сообщение</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Поле ввода */}
            <div className="border-t border-gray-200 p-6 bg-white">
              {/* 🛡️ Индикатор отправки сообщения */}
              {isSending && (
                <div className="mb-3 flex items-center justify-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Отправляем сообщение...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Напишите сообщение..."
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={1}
                    style={{ minHeight: '38px', maxHeight: '100px' }}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-gray-100">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-gray-100">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    !message.trim() || 
                    isSending || 
                    (message.trim() === lastSentMessage && Date.now() - lastSentTime < 2000)
                  }
                  className="px-4 h-9"
                  title={
                    isSending 
                      ? "Отправляется..." 
                        : "Отправить сообщение"
                  }
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Выберите комнату</h2>
              <p className="text-gray-500 mb-4">
                Выберите существующую комнату или создайте новую
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Создать комнату
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Модальное окно создания комнаты */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateAI={handleCreateAIRoom}
        onCreateProject={handleCreateProjectRoom}
        onQuickAIPrompt={handleQuickAIPrompt}
        projects={projects}
        isCreatingRoom={isCreatingRoom}
      />
    </TooltipProvider>
  )

  // 🧹 CLEANUP при unmount - очищаем все таймауты и флаги для предотвращения memory leaks
  useEffect(() => {
    return () => {
      if (roomSwitchTimeoutRef.current) {
        clearTimeout(roomSwitchTimeoutRef.current);
        roomSwitchTimeoutRef.current = null;
      }
    };
  }, []);
}