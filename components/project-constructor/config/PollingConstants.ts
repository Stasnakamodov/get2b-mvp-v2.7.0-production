// Константы для интервалов polling в атомарном конструкторе

export const POLLING_INTERVALS = {
  // Интервал проверки статуса менеджера (4 секунды)
  MANAGER_STATUS_CHECK: 4000,

  // Интервал проверки статуса чека (4 секунды)
  RECEIPT_STATUS_CHECK: 4000,

  // Интервал проверки чека от менеджера (5 секунд)
  MANAGER_RECEIPT_CHECK: 5000,

  // Общий интервал проверки статуса проекта (4 секунды)
  PROJECT_STATUS_CHECK: 4000
} as const

// Константы для таймаутов
export const TIMEOUTS = {
  // Таймаут для автоскрытия уведомлений (10 секунд)
  AUTO_HIDE_NOTIFICATION: 10000
} as const

// Типы для TypeScript
export type PollingInterval = typeof POLLING_INTERVALS[keyof typeof POLLING_INTERVALS]
export type TimeoutValue = typeof TIMEOUTS[keyof typeof TIMEOUTS]