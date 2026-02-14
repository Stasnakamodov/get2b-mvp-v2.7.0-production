/**
 * API слой для работы с эхо карточками
 * Маршрут /api/catalog/echo-cards удалён при рефакторинге.
 * Функции сохранены как заглушки для обратной совместимости barrel-экспортов.
 */

import type { EchoCard, Supplier } from '../model/types'

/**
 * Загрузка эхо карточек пользователя
 * (API удалён — возвращает пустой массив)
 */
export const fetchEchoCards = async (_userId?: string): Promise<EchoCard[]> => {
  return []
}

/**
 * Импорт поставщика из эхо карточки
 * (API удалён — возвращает null)
 */
export const importSupplierFromEchoCard = async (_echoCard: EchoCard): Promise<Supplier | null> => {
  return null
}
