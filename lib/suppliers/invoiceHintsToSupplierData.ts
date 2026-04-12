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

export function invoiceHintsToSupplierData(
  suggestions: Suggestions | null | undefined
): InvoiceSupplierHints | null {
  if (!suggestions) return null

  const bankInfo = suggestions.bankInfo
  const invoiceInfo = suggestions.invoiceInfo

  const bankName = bankInfo?.bankName?.trim() || ''
  const accountNumber = bankInfo?.accountNumber?.trim() || ''

  if (!bankName && !accountNumber) return null

  const seller = invoiceInfo?.seller?.trim() || 'Поставщик из инвойса'

  return {
    name: seller,
    company_name: seller,
    payment_methods: ['bank_transfer'],
    bank_accounts: [
      {
        bank_name: bankName,
        account_number: accountNumber,
        swift: bankInfo?.swift?.trim() || '',
        recipient_name: bankInfo?.recipientName?.trim() || '',
        recipient_address: bankInfo?.recipientAddress?.trim() || '',
        currency: (bankInfo?.transferCurrency || invoiceInfo?.currency || '').trim(),
      },
    ],
    p2p_cards: [],
    crypto_wallets: [],
    source: 'ocr_invoice',
  }
}

export function isCatalogSupplierData(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  return data.source === 'catalog' || Boolean(data.id) || data.room_type === 'verified' || data.room_type === 'user'
}
