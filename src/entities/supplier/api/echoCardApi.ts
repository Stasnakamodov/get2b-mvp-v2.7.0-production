/**
 * API слой для работы с эхо карточками через Supabase и REST API
 * Извлечено из монолитного supabaseApi.ts при рефакторинге на FSD архитектуру
 */

import { supabase } from '@/lib/supabaseClient'
import type { EchoCard, Supplier } from '../model/types'

// ========================================
// 🎯 РАБОТА С ЭХО КАРТОЧКАМИ
// ========================================

/**
 * Загрузка эхо карточек пользователя
 */
export const fetchEchoCards = async (userId?: string): Promise<EchoCard[]> => {
  console.log('🔮 [API] Загрузка эхо карточек...')

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

    const response = await fetch(`/api/catalog/echo-cards?user_id=${currentUserId}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка загрузки эхо карточек')
    }

    if (data.success && data.echo_cards) {
      console.log('✅ [API] Загружено эхо карточек:', data.echo_cards.length)
      if (data.summary) {
        console.log('📊 [API] Статистика:', data.summary)
      }
      return data.echo_cards
    } else {
      console.warn('⚠️ [API] Нет эхо карточек')
      return []
    }
  } catch (error) {
    console.error('❌ [API] Ошибка загрузки эхо карточек:', error)
    return []
  }
}

/**
 * Импорт поставщика из эхо карточки
 */
export const importSupplierFromEchoCard = async (echoCard: EchoCard): Promise<Supplier | null> => {
  console.log('📥 [API] Импорт поставщика из эхо карточки:', echoCard.supplier_key)

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user?.id) {
      throw new Error('Не удалось получить ID пользователя')
    }

    const requestData = {
      user_id: userData.user.id,
      supplier_key: echoCard.supplier_key,
      supplier_data: echoCard.supplier_info,
      products: echoCard.products || []
    }

    const response = await fetch('/api/catalog/echo-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка импорта поставщика')
    }

    if (data.success && data.supplier) {
      console.log('✅ [API] Поставщик импортирован:', data.supplier.id)
      return data.supplier
    } else {
      throw new Error('Не удалось импортировать поставщика')
    }
  } catch (error) {
    console.error('❌ [API] Ошибка импорта поставщика:', error)
    return null
  }
}
