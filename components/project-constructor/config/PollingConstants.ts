// Константы для интервалов polling в атомарном конструкторе
// ВАЖНО: Интервалы увеличены для снижения нагрузки на сервер
// При 10 пользователях: ~18 запросов/мин вместо ~27 запросов/мин

export const POLLING_INTERVALS = {
  // Интервал проверки статуса менеджера (10 секунд)
  MANAGER_STATUS_CHECK: 10000,

  // Интервал проверки статуса чека (10 секунд)
  RECEIPT_STATUS_CHECK: 10000,

  // Интервал проверки чека от менеджера (15 секунд)
  MANAGER_RECEIPT_CHECK: 15000,

  // Общий интервал проверки статуса проекта (10 секунд)
  PROJECT_STATUS_CHECK: 10000
} as const

// Константы для таймаутов
export const TIMEOUTS = {
  // Таймаут для автоскрытия уведомлений (10 секунд)
  AUTO_HIDE_NOTIFICATION: 10000
} as const

// Типы для TypeScript
export type PollingInterval = typeof POLLING_INTERVALS[keyof typeof POLLING_INTERVALS]
export type TimeoutValue = typeof TIMEOUTS[keyof typeof TIMEOUTS]