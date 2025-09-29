// Константы конструктора проектов

/**
 * Конфигурация этапов и шагов
 */
export const STAGE_CONFIG = {
  // Этап 1: Подготовка данных
  STAGE_1_REQUIRED_STEPS: [1, 2, 4, 5] as const,
  STAGE_1_ACTIVE_STEPS: [1, 2, 4, 5] as const,
  STAGE_1_BLOCKED_STEPS: [3, 6, 7] as const,

  // Этап 2: Подготовка инфраструктуры
  STAGE_2_ACTIVE_STEPS: [3, 6, 7] as const,

  // Этап 3: Анимация сделки
  STAGE_3_MONITORING: true
} as const

/**
 * Конфигурация отображения товаров
 */
export const PRODUCT_DISPLAY_CONFIG = {
  PRODUCTS_PER_VIEW: 3,
  MAX_VISIBLE_PRODUCTS: 9,
  PAGINATION_DOTS_THRESHOLD: 2
} as const

/**
 * Конфигурация интервалов опроса
 */
export const POLLING_CONFIG = {
  MANAGER_STATUS_INTERVAL: 4000, // ms
  RECEIPT_STATUS_INTERVAL: 4000, // ms
  MANAGER_RECEIPT_INTERVAL: 5000 // ms
} as const

/**
 * Конфигурация валидации
 */
export const VALIDATION_CONFIG = {
  MIN_ITEMS_PER_STEP: 1,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
} as const

/**
 * UI константы
 */
export const UI_CONFIG = {
  ANIMATION_DURATION: 200, // ms
  TOUCH_SWIPE_THRESHOLD: 50, // px
  NOTIFICATION_AUTO_HIDE: 5000, // ms
  MODAL_Z_INDEX: 1000
} as const

/**
 * Тексты сообщений
 */
export const MESSAGES = {
  SUCCESS: {
    AUTO_FILL: 'Данные автоматически заполнены',
    UPLOAD_COMPLETE: 'Файл успешно загружен',
    STEP_COMPLETED: 'Шаг успешно завершен'
  },
  ERRORS: {
    UPLOAD_FAILED: 'Ошибка загрузки файла',
    VALIDATION_FAILED: 'Проверка данных не пройдена',
    NETWORK_ERROR: 'Ошибка сети'
  },
  INFO: {
    PROCESSING: 'Обработка данных...',
    LOADING: 'Загрузка...',
    WAITING_APPROVAL: 'Ожидание одобрения'
  }
} as const

// Type exports для удобства использования
export type StageRequiredSteps = typeof STAGE_CONFIG.STAGE_1_REQUIRED_STEPS[number]
export type ProductDisplayConfig = typeof PRODUCT_DISPLAY_CONFIG
export type ValidationConfig = typeof VALIDATION_CONFIG