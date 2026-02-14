/**
 * Константы и конфигурация для каталога поставщиков
 * Извлечено из монолитного файла page.tsx при рефакторинге на FSD архитектуру
 */

import {
  Building,
  Phone,
  Users,
  CheckCircle,
  Package,
  Zap
} from 'lucide-react'

// ========================================
// 🎯 КОНФИГУРАЦИЯ ПАГИНАЦИИ
// ========================================

export const PRODUCTS_PER_PAGE = 8
export const SUPPLIERS_PER_PAGE = 12

// ========================================
// 🎯 ШАГИ СОЗДАНИЯ ПОСТАВЩИКА
// ========================================

export const SUPPLIER_FORM_STEPS = [
  {
    id: 1,
    title: 'ОСНОВНАЯ',
    description: 'Информация',
    icon: Building
  },
  {
    id: 2,
    title: 'КОНТАКТЫ',
    description: 'Связь',
    icon: Phone
  },
  {
    id: 3,
    title: 'ПРОФИЛЬ',
    description: 'Бизнес',
    icon: Users
  },
  {
    id: 4,
    title: 'СЕРТИФИКАЦИИ',
    description: 'Документы',
    icon: CheckCircle
  },
  {
    id: 5,
    title: 'ТОВАРЫ',
    description: 'Каталог',
    icon: Package
  },
  {
    id: 6,
    title: 'РЕКВИЗИТЫ',
    description: 'Платежи',
    icon: Zap
  },
  {
    id: 7,
    title: 'ПРЕВЬЮ',
    description: 'Финал',
    icon: CheckCircle
  }
]

// ========================================
// 🎯 ТИПЫ КОМНАТ КАТАЛОГА
// ========================================

export const ROOM_TYPES = {
  ORANGE: {
    type: 'orange' as const,
    name: 'Оранжевая комната',
    icon: '🟠',
    description: 'Аккредитованные поставщики',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    apiType: 'verified' as const
  },
  BLUE: {
    type: 'blue' as const,
    name: 'Синяя комната',
    icon: '🔵',
    description: 'Пользовательские поставщики',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    apiType: 'user' as const
  }
} as const

// ========================================
// 🎯 ЗНАЧЕНИЯ ПО УМОЛЧАНИЮ
// ========================================

export const DEFAULT_SUPPLIER_FORM_DATA = {
  // Шаг 1: Основная информация
  name: '',
  company_name: '',
  category: 'Электроника',
  country: 'Китай',
  city: '',
  description: '',
  logo_url: '',

  // Шаг 2: Контактная информация
  email: '',
  phone: '',
  website: '',
  contact_person: '',

  // Шаг 3: Бизнес-профиль
  min_order: '',
  response_time: '',
  employees: '',
  established: '',
  certifications: [] as string[],
  specialties: [] as string[],

  // Шаг 4: Товары и каталог
  products: [] as any[],

  // Шаг 5: Платежи и реквизиты
  payment_methods: [] as string[],
  payment_method: '',
  bank_name: '',
  bank_account: '',
  swift_code: '',
  bank_address: '',
  payment_terms: '',
  currency: 'USD',
  card_bank: '',
  card_number: '',
  card_holder: '',
  crypto_network: '',
  crypto_address: ''
}

export const DEFAULT_PRODUCT_FORM_DATA = {
  name: '',
  description: '',
  price: '',
  currency: 'USD',
  min_order: '',
  sku: '',
  in_stock: true,
  images: [] as string[]
}

// ========================================
// 🎯 РЕЖИМЫ ОТОБРАЖЕНИЯ
// ========================================

export const CATALOG_MODES = {
  SUPPLIERS: 'suppliers' as const,
  CATEGORIES: 'categories' as const
}

export const VIEW_MODES = {
  GRID: 'grid' as const,
  LIST: 'list' as const
}

// ========================================
// 🎯 ВКЛАДКИ МОДАЛЬНОГО ОКНА
// ========================================

export const SUPPLIER_MODAL_TABS = {
  INFO: 'info' as const,
  PRODUCTS: 'products' as const,
  MANAGEMENT: 'management' as const
}

// ========================================
// 🎯 СТРАНЫ ДЛЯ ВЫБОРА
// ========================================

export const COUNTRIES = [
  'Китай',
  'Россия',
  'США',
  'Германия',
  'Турция',
  'Индия',
  'Вьетнам',
  'Корея',
  'Япония',
  'Италия',
  'Франция',
  'Великобритания',
  'Испания',
  'Польша',
  'Чехия'
]

// ========================================
// 🎯 ВАЛЮТЫ
// ========================================

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'RUB', symbol: '₽', name: 'Рубль' },
  { code: 'CNY', symbol: '¥', name: 'Юань' },
  { code: 'GBP', symbol: '£', name: 'Фунт' }
]

export const DEFAULT_CURRENCY = 'USD'

// ========================================
// 🎯 СПОСОБЫ ОПЛАТЫ
// ========================================

export const PAYMENT_METHODS = [
  { id: 'bank_transfer', name: 'Банковский перевод', icon: '🏦' },
  { id: 'card', name: 'P2P оплата картой', icon: '💳' },
  { id: 'crypto', name: 'Криптовалюта', icon: '₿' },
  { id: 'cash', name: 'Наличные', icon: '💵' },
  { id: 'lc', name: 'Аккредитив', icon: '📄' }
]

// ========================================
// 🎯 СЕТИ КРИПТОВАЛЮТ
// ========================================

export const CRYPTO_NETWORKS = [
  'USDT TRC20',
  'USDT ERC20',
  'Bitcoin',
  'Ethereum',
  'BNB Chain',
  'Polygon'
]

// ========================================
// 🎯 API ENDPOINTS
// ========================================

export const API_ENDPOINTS = {
  USER_SUPPLIERS: '/api/catalog/user-suppliers',
  VERIFIED_SUPPLIERS: '/api/catalog/suppliers?verified=true',
  CATEGORIES: '/api/catalog/categories',
  PRODUCTS: '/api/catalog/products',
  RECOMMENDATIONS: '/api/catalog/recommendations',
  SUBCATEGORIES: (categoryId: string) => `/api/catalog/categories/${categoryId}/subcategories`
}

// ========================================
// 🎯 ВРЕМЕНА ОТВЕТА
// ========================================

export const RESPONSE_TIMES = [
  '< 1 час',
  '1-2 часа',
  '2-4 часа',
  '4-8 часов',
  '8-24 часа',
  '1-3 дня',
  '> 3 дней'
]

// ========================================
// 🎯 КОЛИЧЕСТВО СОТРУДНИКОВ
// ========================================

export const EMPLOYEE_RANGES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000-5000',
  '> 5000'
]

// ========================================
// 🎯 МИНИМАЛЬНЫЕ ЗАКАЗЫ
// ========================================

export const MIN_ORDER_RANGES = [
  '< $100',
  '$100-500',
  '$500-1,000',
  '$1,000-5,000',
  '$5,000-10,000',
  '$10,000-50,000',
  '> $50,000'
]

// ========================================
// 🎯 УТИЛИТЫ
// ========================================

/**
 * Конвертация чисел в римские цифры
 */
export const toRoman = (num: number): string => {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return romans[num - 1] || String(num)
}

/**
 * Форматирование цены
 */
export const formatPrice = (price: string | number, currency: string = 'USD'): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    RUB: '₽',
    CNY: '¥',
    GBP: '£'
  }

  const symbol = currencySymbols[currency] || currency
  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g, '')) : price

  if (isNaN(numPrice)) return `${symbol}0`

  return `${symbol}${numPrice.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`
}

/**
 * Форматирование даты
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Получение инициалов из имени
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Проверка валидности email
 */
export const isValidEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email)
}

/**
 * Проверка валидности URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// ========================================
// 🎯 СООБЩЕНИЯ ОБ ОШИБКАХ
// ========================================

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Это поле обязательно для заполнения',
  INVALID_EMAIL: 'Некорректный email адрес',
  INVALID_URL: 'Некорректный URL',
  INVALID_PHONE: 'Некорректный номер телефона',
  MIN_LENGTH: (min: number) => `Минимальная длина ${min} символов`,
  MAX_LENGTH: (max: number) => `Максимальная длина ${max} символов`,
  MIN_VALUE: (min: number) => `Минимальное значение ${min}`,
  MAX_VALUE: (max: number) => `Максимальное значение ${max}`,
  NETWORK_ERROR: 'Ошибка сети. Попробуйте позже',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
  NOT_FOUND: 'Данные не найдены',
  UNAUTHORIZED: 'Необходима авторизация',
  FORBIDDEN: 'Доступ запрещен'
}

// ========================================
// 🎯 СООБЩЕНИЯ ОБ УСПЕХЕ
// ========================================

export const SUCCESS_MESSAGES = {
  SUPPLIER_CREATED: 'Поставщик успешно создан',
  SUPPLIER_UPDATED: 'Поставщик успешно обновлен',
  SUPPLIER_DELETED: 'Поставщик успешно удален',
  PRODUCT_ADDED: 'Товар успешно добавлен',
  PRODUCT_UPDATED: 'Товар успешно обновлен',
  PRODUCT_DELETED: 'Товар успешно удален',
  CART_ADDED: 'Товар добавлен в корзину',
  CART_CLEARED: 'Корзина очищена',
  PROJECT_STARTED: 'Проект успешно создан',
  DATA_IMPORTED: 'Данные успешно импортированы'
}