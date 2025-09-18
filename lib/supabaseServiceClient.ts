import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service client initialized successfully

// Создаем клиент с service role ключом для серверных операций
export const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'get2b-webhook-service'
    }
  }
})

// Функция для проверки service клиента
export const checkSupabaseServiceHealth = async () => {
  try {
    // Пробуем простой запрос к базе
    const { data, error } = await supabaseService
      .from('chat_rooms')
      .select('count(*)')
      .limit(1)
    
    return { 
      available: !error, 
      error: error?.message || null,
      canAccessDB: !!data 
    }
  } catch (err) {
    console.error('[SUPABASE SERVICE ERROR]', err)
    return { 
      available: false, 
      error: err instanceof Error ? err.message : 'Неизвестная ошибка service клиента',
      canAccessDB: false
    }
  }
} 