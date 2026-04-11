import { logger } from "@/src/shared/lib/logger"
import { db } from "@/lib/db/client"

export interface CatalogSupplierData {
  id: string
  name: string
  company_name?: string
  category?: string
  country?: string
  city?: string
  payment_methods?: string[]
  bank_accounts?: any[]
  crypto_wallets?: any[]
  p2p_cards?: any[]
  room_type: 'verified' | 'user'
}

export type CatalogSupplierType = 'catalog_verified' | 'catalog_user'

const VERIFIED_SELECT_FIELDS =
  'id, name, company_name, category, country, city, payment_methods, bank_accounts, crypto_wallets, p2p_cards'

const USER_SELECT_FIELDS =
  'id, name, company_name, category, country, city, payment_methods, bank_accounts, crypto_wallets, p2p_cards'

/**
 * Загружает полные данные поставщика из каталога по ID.
 * Сначала ищет в catalog_verified_suppliers, затем в catalog_user_suppliers.
 * Возвращает null если поставщик не найден ни в одной из таблиц.
 *
 * Используется:
 *  - Step2SpecificationForm.handleCatalogSelect — при выборе товаров из каталога на Step2
 *  - CartLoader (app/dashboard/create-project/page.tsx) — при flow "корзина → проект"
 */
export async function loadCatalogSupplier(
  supplierId: string
): Promise<CatalogSupplierData | null> {
  if (!supplierId) {
    return null
  }

  // Сначала verified (они приоритетны)
  const { data: verified, error: verifiedError } = await db
    .from('catalog_verified_suppliers')
    .select(VERIFIED_SELECT_FIELDS)
    .eq('id', supplierId)
    .single()

  if (verified && !verifiedError) {
    logger.info('[loadCatalogSupplier] найден в verified:', verified.name)
    return { ...verified, room_type: 'verified' as const }
  }

  // Затем user (пользовательские)
  const { data: user, error: userError } = await db
    .from('catalog_user_suppliers')
    .select(USER_SELECT_FIELDS)
    .eq('id', supplierId)
    .single()

  if (user && !userError) {
    logger.info('[loadCatalogSupplier] найден в user:', user.name)
    return { ...user, room_type: 'user' as const }
  }

  logger.warn('[loadCatalogSupplier] поставщик не найден:', {
    supplierId,
    verifiedError: verifiedError?.message,
    userError: userError?.message,
  })
  return null
}

/**
 * Возвращает тип поставщика для сохранения в колонку projects.supplier_type.
 */
export function getCatalogSupplierType(
  data: Pick<CatalogSupplierData, 'room_type'>
): CatalogSupplierType {
  return data.room_type === 'verified' ? 'catalog_verified' : 'catalog_user'
}

/**
 * Проверяет, заполнены ли у supplierData рекомендации для Step4 (методы оплаты).
 * Используется чтобы не перетирать валидные данные fallback-механизмами.
 */
export function hasSupplierRecommendations(data: any): boolean {
  return Boolean(
    data &&
      Array.isArray(data.payment_methods) &&
      data.payment_methods.length > 0
  )
}
