// Simple logger for production/development
const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.env.DEBUG === 'true'

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDev || isDebug) {
      console.log(`ℹ️ [${new Date().toISOString()}]`, message, ...args)
    }
  },

  error: (message: string, ...args: any[]) => {
    console.error(`❌ [${new Date().toISOString()}]`, message, ...args)
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ [${new Date().toISOString()}]`, message, ...args)
  },

  debug: (message: string, ...args: any[]) => {
    if (isDev || isDebug) {
      console.debug(`🐛 [${new Date().toISOString()}]`, message, ...args)
    }
  },

  success: (message: string, ...args: any[]) => {
    if (isDev || isDebug) {
      console.log(`✅ [${new Date().toISOString()}]`, message, ...args)
    }
  }
}