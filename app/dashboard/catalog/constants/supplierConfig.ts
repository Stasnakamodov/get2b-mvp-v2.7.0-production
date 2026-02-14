/**
 * Конфигурация для работы с поставщиками
 * Вынесено из page.tsx (строки 807-824)
 * Безопасно для выноса - статические данные
 */

import { Building, Phone, Users, CheckCircle, Package, Zap, type LucideIcon } from 'lucide-react'

export interface SupplierStep {
  id: number
  title: string
  description: string
  icon: LucideIcon
}

// Структура шагов для SupplierTimeline
export const SUPPLIER_STEPS: SupplierStep[] = [
  { id: 1, title: 'ОСНОВНАЯ', description: 'Информация', icon: Building },
  { id: 2, title: 'КОНТАКТЫ', description: 'Связь', icon: Phone },
  { id: 3, title: 'ПРОФИЛЬ', description: 'Бизнес', icon: Users },
  { id: 4, title: 'СЕРТИФИКАЦИИ', description: 'Документы', icon: CheckCircle },
  { id: 5, title: 'ТОВАРЫ', description: 'Каталог', icon: Package },
  { id: 6, title: 'РЕКВИЗИТЫ', description: 'Платежи', icon: Zap },
  { id: 7, title: 'ПРЕВЬЮ', description: 'Финал', icon: CheckCircle }
]

// Вспомогательная функция для римских цифр
export const toRoman = (num: number): string => {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return romans[num - 1] || String(num)
}

// Типы комнат/каталогов
export const ROOM_TYPES = {
  ORANGE: 'orange' as const,
  BLUE: 'blue' as const
} as const

export type RoomType = typeof ROOM_TYPES[keyof typeof ROOM_TYPES]

// Конфигурация комнат
export const ROOM_CONFIG = {
  [ROOM_TYPES.ORANGE]: {
    name: 'Аккредитованные поставщики',
    icon: '🟠',
    description: 'Проверенные поставщики с гарантиями',
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-900'
  },
  [ROOM_TYPES.BLUE]: {
    name: 'Персональные поставщики',
    icon: '🔵',
    description: 'Ваши личные поставщики',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-900'
  }
}

// Режимы каталога
export const CATALOG_MODES = {
  SUPPLIERS: 'suppliers' as const,
  CATEGORIES: 'categories' as const
} as const

export type CatalogMode = typeof CATALOG_MODES[keyof typeof CATALOG_MODES]

// Конфигурация пагинации
export const PAGINATION_CONFIG = {
  PRODUCTS_PER_PAGE: 8,
  SUPPLIERS_PER_PAGE: 10,
  INITIAL_PAGE: 1
}

// Конфигурация валидации форм
export const VALIDATION_RULES = {
  SUPPLIER_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Zа-яА-Я0-9\s\-\.]+$/,
    MESSAGE: 'Название должно содержать от 2 до 100 символов'
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Введите корректный email'
  },
  PHONE: {
    PATTERN: /^[\+]?[0-9\s\-\(\)]+$/,
    MIN_LENGTH: 10,
    MESSAGE: 'Введите корректный номер телефона'
  },
  WEBSITE: {
    PATTERN: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    MESSAGE: 'Введите корректный URL'
  },
  MIN_ORDER: {
    MIN: 1,
    MAX: 1000000,
    MESSAGE: 'Минимальный заказ должен быть от 1 до 1,000,000'
  }
}

// Статусы загрузки
export const LOADING_STATES = {
  IDLE: 'idle' as const,
  LOADING: 'loading' as const,
  SUCCESS: 'success' as const,
  ERROR: 'error' as const
} as const

export type LoadingState = typeof LOADING_STATES[keyof typeof LOADING_STATES]

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  VALIDATION_ERROR: 'Проверьте правильность заполнения полей.',
  AUTH_ERROR: 'Ошибка авторизации. Войдите в систему.',
  NOT_FOUND: 'Данные не найдены.',
  PERMISSION_DENIED: 'Недостаточно прав для выполнения операции.',
  SUPPLIER_LOCK: 'Можно добавлять товары только от одного поставщика.',
  EMPTY_CART: 'Корзина пуста. Добавьте товары для создания проекта.'
}

// Сообщения успеха
export const SUCCESS_MESSAGES = {
  SUPPLIER_CREATED: 'Поставщик успешно создан',
  SUPPLIER_UPDATED: 'Данные поставщика обновлены',
  SUPPLIER_DELETED: 'Поставщик удален',
  PRODUCT_ADDED: 'Товар добавлен в корзину',
  PRODUCT_REMOVED: 'Товар удален из корзины',
  PROJECT_CREATED: 'Проект успешно создан',
  DATA_LOADED: 'Данные загружены',
  FORM_SAVED: 'Форма сохранена'
}