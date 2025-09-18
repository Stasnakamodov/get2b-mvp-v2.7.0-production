// 💬 ТИПЫ ДЛЯ ЧАТХАБА
// Базовые типы для чат системы Get2B

// ========================================
// 🏠 ТИПЫ КОМНАТ
// ========================================

export type ChatRoomType = 'ai' | 'project';

export interface ChatRoom {
  id: string;
  user_id: string;
  room_type: ChatRoomType;
  name: string;
  project_id?: string;
  ai_context?: string;
  description?: string;
  avatar_url?: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface ChatRoomWithStats extends ChatRoom {
  last_message_content?: string;
  unread_count: number;
  participants: ChatParticipant[];
  assigned_managers: ManagerAssignment[];
  stats: {
    total_messages: number;
    user_messages: number;
    ai_messages: number;
    manager_messages: number;
  };
}

// ========================================
// 💬 ТИПЫ СООБЩЕНИЙ
// ========================================

export type MessageSenderType = 'user' | 'ai' | 'manager' | 'system';
export type MessageType = 'text' | 'file' | 'image' | 'system';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_type: MessageSenderType;
  sender_user_id?: string;
  sender_manager_id?: string;
  sender_name?: string;
  content: string;
  message_type: MessageType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_read: boolean;
  is_delivered: boolean;
  reply_to_message_id?: string;
  ai_confidence?: number;
  ai_context?: any;
  created_at: string;
  edited_at?: string;
}

export interface ChatMessageWithReply extends ChatMessage {
  reply_to?: {
    id: string;
    content: string;
    sender_name?: string;
    created_at: string;
  };
}

// ========================================
// 👥 ТИПЫ УЧАСТНИКОВ
// ========================================

export type ParticipantRole = 'owner' | 'participant' | 'manager' | 'ai';

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id?: string;
  manager_telegram_id?: string;
  manager_name?: string;
  role: ParticipantRole;
  is_active: boolean;
  last_read_message_id?: string;
  last_seen_at: string;
  notifications_enabled: boolean;
  joined_at: string;
  left_at?: string;
}

// ========================================
// 👨‍💼 ТИПЫ МЕНЕДЖЕРОВ
// ========================================

export type ManagerSpecialization = 'logistics' | 'payments' | 'quality' | 'general';
export type AssignmentStatus = 'active' | 'inactive' | 'transferred';
export type AssignmentType = 'auto' | 'manual';

export interface ManagerAssignment {
  id: string;
  project_id: string;
  manager_telegram_id: string;
  manager_name: string;
  manager_specialization?: ManagerSpecialization;
  assignment_status: AssignmentStatus;
  assignment_type: AssignmentType;
  assigned_by?: string;
  assigned_at: string;
  unassigned_at?: string;
  messages_count: number;
  response_time_avg?: string;
}

// ========================================
// 🤖 AI ТИПЫ
// ========================================

export interface AIResponse {
  content: string;
  confidence: number;
  context_type?: string;
  user_context?: any;
}

export interface AIContextData {
  context_type: string;
  user_context: any;
  message_count: number;
}

// ========================================
// 📡 API ТИПЫ
// ========================================

export interface ChatRoomsResponse {
  success: boolean;
  rooms: ChatRoomWithStats[];
  timestamp: string;
}

export interface ChatMessagesResponse {
  success: boolean;
  messages: ChatMessageWithReply[];
  room_id: string;
  count: number;
  timestamp: string;
}

export interface CreateRoomRequest {
  user_id: string;
  name: string;
  room_type?: string;
  ai_context?: string;
  project_id?: string;
  description?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  room: ChatRoom;
  message: string;
}

export interface SendMessageRequest {
  room_id: string;
  content: string;
  sender_type?: MessageSenderType;
  sender_user_id?: string;
  sender_manager_id?: string;
  sender_name?: string;
  message_type?: MessageType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_message_id?: string;
  ai_confidence?: number;
  ai_context?: any;
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
  message_text: string;
}

export interface AIResponseRequest {
  room_id: string;
  user_message: string;
  ai_context?: string;
  user_id?: string;
}

export interface AIResponseResponse {
  success: boolean;
  ai_message: ChatMessage;
  confidence: number;
  context_used: string;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  ai_context?: string;
  is_active?: boolean;
  is_archived?: boolean;
}

export interface UpdateRoomResponse {
  success: boolean;
  room: ChatRoom;
  message: string;
}

// ========================================
// 📱 UI СОСТОЯНИЯ
// ========================================

export interface ChatUIState {
  selectedRoomId?: string;
  isLoading: boolean;
  isTyping: boolean;
  lastSeenMessage?: string;
  onlineStatus: 'online' | 'offline' | 'away';
}

export interface ChatNotification {
  id: string;
  room_id: string;
  message: string;
  type: 'message' | 'manager_joined' | 'system' | 'error';
  timestamp: string;
  is_read: boolean;
}

// ========================================
// 🔧 ХЕЛПЕРЫ И УТИЛИТЫ
// ========================================

export interface ChatError {
  error: string;
  details?: string;
  code?: number;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface ChatFilters {
  room_type?: ChatRoomType;
  is_active?: boolean;
  has_unread?: boolean;
}

// ========================================
// 📊 СТАТИСТИКА И АНАЛИТИКА
// ========================================

export interface ChatStats {
  total_rooms: number;
  ai_rooms: number;
  project_rooms: number;
  total_messages: number;
  active_conversations: number;
  average_response_time: number;
}

export interface MessageStats {
  total_messages: number;
  user_messages: number;
  ai_messages: number;
  manager_messages: number;
  system_messages: number;
}

// ========================================
// 🎯 ДЕФОЛТНЫЕ ЗНАЧЕНИЯ
// ========================================

// Дефолтные значения для создания новых объектов
export const DEFAULT_CHAT_ROOM: Partial<ChatRoom> = {
  is_active: true,
  is_archived: false,
  ai_context: 'general',
};

export const DEFAULT_MESSAGE: Partial<ChatMessage> = {
  message_type: 'text',
  is_read: false,
  is_delivered: true,
  sender_type: 'user',
};

export const DEFAULT_PARTICIPANT: Partial<ChatParticipant> = {
  role: 'participant',
  is_active: true,
  notifications_enabled: true,
}; 