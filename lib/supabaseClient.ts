import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client initialized successfully

// Создаем клиент с дополнительными опциями для обработки ошибок
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'get2b-mvp'
    }
  }
})

// Функция для проверки доступности Supabase
export const checkSupabaseHealth = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    return { available: true, error: null }
  } catch (err) {
    console.error('[SUPABASE ERROR]', err)
    return { 
      available: false, 
      error: err instanceof Error ? err.message : 'Неизвестная ошибка подключения к Supabase' 
    }
  }
}
