import type { ParsedInvoice } from '@/lib/services/YandexGPTService'

export interface InvoiceSupplierHints {
  name: string
  company_name: string
  payment_methods: string[]
  bank_accounts: Array<{
    bank_name: string
    account_number: string
    swift: string
    recipient_name: string
    recipient_address: string
    currency: string
  }>
  p2p_cards: any[]
  crypto_wallets: any[]
  source: 'ocr_invoice'
}

type Suggestions = Partial<ParsedInvoice> & {
  bankInfo?: ParsedInvoice['bankInfo']
  invoiceInfo?: ParsedInvoice['invoiceInfo']
}

/**
 * Строит legacy-shape supplierData из OCR-подсказок инвойса.
 *
 * Важно: `payment_methods` НЕ захардкожен в `['bank_transfer']`. Флаг ставится
 * только если в распознанных реквизитах есть и `bankName`, и `accountNumber` —
 * т.е. движок `supplierRecommendationEngine` сможет собрать хотя бы partial-реквизит.
 * Если из банковского блока есть только одно поле — всё равно сохраняем его в
 * `bank_accounts`, чтобы Step4 увидел это через движок как "partial / Неполные
 * реквизиты", но не рекламировал метод через `payment_methods`.
 */
export function invoiceHintsToSupplierData(
  suggestions: Suggestions | null | undefined
): InvoiceSupplierHints | null {
  if (!suggestions) return null

  const bankInfo = suggestions.bankInfo
  const invoiceInfo = suggestions.invoiceInfo

  const bankName = bankInfo?.bankName?.trim() || ''
  const accountNumber = bankInfo?.accountNumber?.trim() || ''
  const swift = bankInfo?.swift?.trim() || ''
  const recipientName = bankInfo?.recipientName?.trim() || ''
  const recipientAddress = bankInfo?.recipientAddress?.trim() || ''
  const currency = (bankInfo?.transferCurrency || invoiceInfo?.currency || '').trim()

  const hasAnyBankField = Boolean(bankName || accountNumber || recipientName)
  if (!hasAnyBankField) return null

  const seller = invoiceInfo?.seller?.trim() || 'Поставщик из инвойса'

  const hasUsableBankAccount = Boolean(bankName && accountNumber)

  return {
    name: seller,
    company_name: seller,
    payment_methods: hasUsableBankAccount ? ['bank_transfer'] : [],
    bank_accounts: [
      {
        bank_name: bankName,
        account_number: accountNumber,
        swift,
        recipient_name: recipientName,
        recipient_address: recipientAddress,
        currency,
      },
    ],
    p2p_cards: [],
    crypto_wallets: [],
    source: 'ocr_invoice',
  }
}

export function isCatalogSupplierData(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  if (data.source === 'ocr_invoice') return false
  return data.source === 'catalog' || Boolean(data.id) || data.room_type === 'verified' || data.room_type === 'user'
}
