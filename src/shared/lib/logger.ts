/**
 * Production-safe логгер
 * В production не выводит debug сообщения
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  },

  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '')
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '')
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '')
  }
}