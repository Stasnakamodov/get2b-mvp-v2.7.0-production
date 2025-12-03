/**
 * API слой для загрузки файлов и проверки подключения к Supabase
 * Извлечено из монолитного supabaseApi.ts при рефакторинге на FSD архитектуру
 */

import { supabase } from '@/lib/supabaseClient'

// ========================================
// 🎯 ЗАГРУЗКА ИЗОБРАЖЕНИЙ
// ========================================

/**
 * Загрузка изображения на сервер
 */
export const uploadImage = async (
  file: File,
  folder: 'suppliers' | 'products' = 'products'
): Promise<string | null> => {
  console.log('📤 [API] Загрузка изображения:', file.name)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Нет активной сессии')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success && data.url) {
      console.log('✅ [API] Изображение загружено:', data.url)
      return data.url
    } else {
      throw new Error(data.error || 'Неизвестная ошибка')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки изображения:', error)
    return null
  }
}

// ========================================
// 🎯 ПРОВЕРКА ПОДКЛЮЧЕНИЯ
// ========================================

/**
 * Проверка подключения к Supabase
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[SUPABASE CONNECTION ERROR]', error)
      return false
    }

    console.log('✅ [SUPABASE] Подключение активно')
    return true
  } catch (err) {
    console.error('[SUPABASE IMPORT ERROR]', err)
    return false
  }
}
