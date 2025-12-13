/**
 * API слой для работы с умными рекомендациями через Supabase и REST API
 * Извлечено из монолитного supabaseApi.ts при рефакторинге на FSD архитектуру
 */

import { supabase } from '@/lib/supabaseClient'
import type { SmartRecommendation } from '../model/types'

// ========================================
// 🎯 УМНЫЕ РЕКОМЕНДАЦИИ
// ========================================

/**
 * Загрузка умных рекомендаций
 */
export const fetchRecommendations = async (
  userId?: string,
  limit: number = 10
): Promise<SmartRecommendation[]> => {
  console.log('🧠 [API] Загрузка умных рекомендаций...')

  try {
    let currentUserId = userId

    // Если userId не передан, получаем текущего пользователя
    if (!currentUserId) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user?.id) {
        throw new Error('Не удалось получить ID пользователя')
      }
      currentUserId = userData.user.id
    }

    const response = await fetch(
      `/api/catalog/recommendations?user_id=${currentUserId}&limit=${limit}`
    )
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки рекомендаций')
    }

    if (data.success && data.recommendations) {
      console.log('✅ [API] Загружено рекомендаций:', data.recommendations.length)
      return data.recommendations
    } else {
      console.warn('⚠️ [API] Нет рекомендаций')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки рекомендаций:', error)
    return []
  }
}
