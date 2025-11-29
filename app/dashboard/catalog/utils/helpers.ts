/**
 * Вспомогательные утилитарные функции
 * Вынесено из page.tsx
 * Безопасно для выноса - чистые функции без побочных эффектов
 */

/**
 * Преобразование числа в римские цифры
 * Используется для отображения номеров шагов
 */
export const toRoman = (num: number): string => {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return romans[num - 1] || String(num)
}

/**
 * Безопасная функция для обработки сертификаций
 * Парсит JSON строку сертификаций в массив
 */
export const getCertifications = (certifications: string | null): string[] => {
  if (!certifications) return []
  try {
    const parsed = JSON.parse(certifications)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Форматирование цены
 * Добавляет знак доллара и форматирует число
 */
export const formatPrice = (price: number | string, currency: string = 'USD'): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]/g, '')) : price

  if (isNaN(numPrice)) return '$0.00'

  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    RUB: '₽',
    CNY: '¥'
  }

  const symbol = symbols[currency] || currency
  return `${symbol}${numPrice.toFixed(2)}`
}

/**
 * Безопасное получение значения из вложенного объекта
 * Предотвращает ошибки при обращении к несуществующим свойствам
 */
export const safeGet = (obj: any, path: string, defaultValue: any = null): any => {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return defaultValue
    }
    current = current[key]
  }

  return current ?? defaultValue
}

/**
 * Генерация уникального ID
 * Используется для временных ID новых элементов
 */
export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Дебаунс функция
 * Откладывает выполнение функции до завершения ввода
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Проверка валидности email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Проверка валидности URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    // Попробуем с добавлением протокола
    try {
      new URL(`https://${url}`)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Проверка валидности телефона
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/
  const cleanPhone = phone.replace(/\s|\-|\(|\)/g, '')
  return phoneRegex.test(phone) && cleanPhone.length >= 10
}

/**
 * Форматирование даты
 */
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) return 'Invalid date'

  if (format === 'short') {
    return d.toLocaleDateString('ru-RU')
  } else {
    return d.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * Получение инициалов из имени
 */
export const getInitials = (name: string): string => {
  if (!name) return ''

  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }

  return parts
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Обрезка текста с добавлением многоточия
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Группировка массива по свойству
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Глубокое клонирование объекта
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any

  const clonedObj = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }
  return clonedObj
}

/**
 * Проверка пустоты объекта
 */
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true
  if (typeof obj === 'string') return obj.trim().length === 0
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * Задержка выполнения (для тестирования и анимаций)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Безопасное преобразование в число
 */
export const toNumber = (value: any, defaultValue: number = 0): number => {
  if (value == null) return defaultValue

  const num = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, ''))
    : Number(value)

  return isNaN(num) ? defaultValue : num
}

/**
 * Расчет процентов
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Форматирование размера файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}