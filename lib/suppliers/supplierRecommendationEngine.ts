import type { ParsedInvoice } from '@/lib/services/YandexGPTService'

export type PaymentMethodId = 'bank-transfer' | 'p2p' | 'crypto'

export const PAYMENT_METHOD_IDS: PaymentMethodId[] = ['bank-transfer', 'p2p', 'crypto']

export type RequisiteSource = 'catalog' | 'ocr_invoice' | 'echo'

export type RequisiteCompleteness = 'full' | 'partial'

export interface BankAccountRequisite {
  bank_name: string
  account_number: string
  swift: string
  recipient_name: string
  recipient_address?: string
  currency?: string
}

export interface P2PCardRequisite {
  card_number?: string
  phone?: string
  holder_name?: string
  bank?: string
}

export interface CryptoWalletRequisite {
  address: string
  network?: string
  currency?: string
}

export type RequisiteData =
  | BankAccountRequisite
  | P2PCardRequisite
  | CryptoWalletRequisite

export interface RequisiteEntry {
  source: RequisiteSource
  completeness: RequisiteCompleteness
  missingFields: string[]
  data: RequisiteData
}

export interface MethodRecommendation {
  methodId: PaymentMethodId
  available: boolean
  primarySource: RequisiteSource | null
  bestCompleteness: RequisiteCompleteness | null
  requisites: RequisiteEntry[]
}

export interface SupplierRecommendationResult {
  supplierName: string | null
  methods: Record<PaymentMethodId, MethodRecommendation>
  primarySource: RequisiteSource | null
}

export interface CatalogSupplierInput {
  name?: string
  company_name?: string
  payment_methods?: string[] | null
  bank_accounts?: any[] | null
  p2p_cards?: any[] | null
  crypto_wallets?: any[] | null
}

export interface EchoSupplierInput {
  name?: string
  payment_methods?: string[] | null
  bank_accounts?: any[] | null
  p2p_cards?: any[] | null
  crypto_wallets?: any[] | null
}

export interface BuildInput {
  catalogSupplier?: CatalogSupplierInput | null
  ocrInvoice?: ParsedInvoice | null
  echoSupplier?: EchoSupplierInput | null
}

const SOURCE_PRIORITY: Record<RequisiteSource, number> = {
  catalog: 3,
  ocr_invoice: 2,
  echo: 1,
}

function emptyMethod(methodId: PaymentMethodId): MethodRecommendation {
  return {
    methodId,
    available: false,
    primarySource: null,
    bestCompleteness: null,
    requisites: [],
  }
}

function str(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '')
}

function evaluateBankAccount(raw: any): { data: BankAccountRequisite; missingFields: string[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const bank_name = str(raw.bank_name ?? raw.bankName)
  const account_number = str(raw.account_number ?? raw.accountNumber)
  const swift = str(raw.swift ?? raw.swiftCode)
  const recipient_name = str(raw.recipient_name ?? raw.recipientName ?? raw.holder_name)
  const recipient_address = str(raw.recipient_address ?? raw.recipientAddress)
  const currency = str(raw.currency ?? raw.transferCurrency)

  if (!bank_name && !account_number && !recipient_name) {
    return null
  }

  const data: BankAccountRequisite = {
    bank_name,
    account_number,
    swift,
    recipient_name,
    recipient_address: recipient_address || undefined,
    currency: currency || undefined,
  }

  const missingFields: string[] = []
  if (!bank_name) missingFields.push('bank_name')
  if (!account_number) missingFields.push('account_number')
  if (!swift) missingFields.push('swift')
  if (!recipient_name) missingFields.push('recipient_name')

  return { data, missingFields }
}

function evaluateP2PCard(raw: any): { data: P2PCardRequisite; missingFields: string[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const card_number = str(raw.card_number ?? raw.cardNumber ?? raw.number)
  const phone = str(raw.phone ?? raw.phone_number ?? raw.phoneNumber)
  const holder_name = str(raw.holder_name ?? raw.holderName ?? raw.recipient_name)
  const bank = str(raw.bank ?? raw.bank_name ?? raw.bankName)

  const hasCard = digitsOnly(card_number).length >= 12
  const hasPhone = digitsOnly(phone).length >= 10

  if (!hasCard && !hasPhone) {
    return null
  }

  const data: P2PCardRequisite = {
    card_number: card_number || undefined,
    phone: phone || undefined,
    holder_name: holder_name || undefined,
    bank: bank || undefined,
  }

  const missingFields: string[] = []
  if (!holder_name) missingFields.push('holder_name')

  return { data, missingFields }
}

function evaluateCryptoWallet(raw: any): { data: CryptoWalletRequisite; missingFields: string[] } | null {
  if (!raw || typeof raw !== 'object') return null
  const address = str(raw.address ?? raw.wallet_address ?? raw.walletAddress)
  const network = str(raw.network ?? raw.chain)
  const currency = str(raw.currency ?? raw.coin ?? raw.token)

  if (!address) {
    return null
  }

  const data: CryptoWalletRequisite = {
    address,
    network: network || undefined,
    currency: currency || undefined,
  }

  const missingFields: string[] = []
  if (!network) missingFields.push('network')

  return { data, missingFields }
}

function completenessFor(kind: PaymentMethodId, missingFields: string[]): RequisiteCompleteness {
  if (kind === 'bank-transfer') {
    return missingFields.length === 0 ? 'full' : 'partial'
  }
  if (kind === 'p2p') {
    return 'full'
  }
  return missingFields.length === 0 ? 'full' : 'partial'
}

function collectFromSource(
  source: RequisiteSource,
  supplier: CatalogSupplierInput | EchoSupplierInput | null | undefined,
  target: Record<PaymentMethodId, RequisiteEntry[]>
): void {
  if (!supplier) return

  for (const raw of supplier.bank_accounts ?? []) {
    const evaluated = evaluateBankAccount(raw)
    if (!evaluated) continue
    target['bank-transfer'].push({
      source,
      completeness: completenessFor('bank-transfer', evaluated.missingFields),
      missingFields: evaluated.missingFields,
      data: evaluated.data,
    })
  }

  for (const raw of supplier.p2p_cards ?? []) {
    const evaluated = evaluateP2PCard(raw)
    if (!evaluated) continue
    target['p2p'].push({
      source,
      completeness: completenessFor('p2p', evaluated.missingFields),
      missingFields: evaluated.missingFields,
      data: evaluated.data,
    })
  }

  for (const raw of supplier.crypto_wallets ?? []) {
    const evaluated = evaluateCryptoWallet(raw)
    if (!evaluated) continue
    target['crypto'].push({
      source,
      completeness: completenessFor('crypto', evaluated.missingFields),
      missingFields: evaluated.missingFields,
      data: evaluated.data,
    })
  }
}

function collectFromOcr(
  ocrInvoice: ParsedInvoice | null | undefined,
  target: Record<PaymentMethodId, RequisiteEntry[]>
): string | null {
  if (!ocrInvoice) return null
  const bankInfo = ocrInvoice.bankInfo
  const sellerName = ocrInvoice.invoiceInfo?.seller?.trim() || null

  if (!bankInfo) return sellerName

  const evaluated = evaluateBankAccount({
    bank_name: bankInfo.bankName,
    account_number: bankInfo.accountNumber,
    swift: bankInfo.swift,
    recipient_name: bankInfo.recipientName,
    recipient_address: bankInfo.recipientAddress,
    currency: bankInfo.transferCurrency ?? ocrInvoice.invoiceInfo?.currency,
  })

  if (evaluated) {
    target['bank-transfer'].push({
      source: 'ocr_invoice',
      completeness: completenessFor('bank-transfer', evaluated.missingFields),
      missingFields: evaluated.missingFields,
      data: evaluated.data,
    })
  }

  return sellerName
}

function pickPrimary(requisites: RequisiteEntry[]): {
  source: RequisiteSource | null
  completeness: RequisiteCompleteness | null
} {
  if (requisites.length === 0) return { source: null, completeness: null }
  const best = requisites[0]
  return { source: best.source, completeness: best.completeness }
}

function scoreEntry(entry: RequisiteEntry): number {
  return SOURCE_PRIORITY[entry.source] * 10 + (entry.completeness === 'full' ? 1 : 0)
}

export function buildSupplierRecommendation(input: BuildInput): SupplierRecommendationResult {
  const requisitesByMethod: Record<PaymentMethodId, RequisiteEntry[]> = {
    'bank-transfer': [],
    'p2p': [],
    'crypto': [],
  }

  collectFromSource('catalog', input.catalogSupplier, requisitesByMethod)
  const ocrSellerName = collectFromOcr(input.ocrInvoice, requisitesByMethod)
  collectFromSource('echo', input.echoSupplier, requisitesByMethod)

  const methods: Record<PaymentMethodId, MethodRecommendation> = {
    'bank-transfer': emptyMethod('bank-transfer'),
    'p2p': emptyMethod('p2p'),
    'crypto': emptyMethod('crypto'),
  }

  let overallPrimary: RequisiteSource | null = null
  let overallScore = -1

  for (const methodId of PAYMENT_METHOD_IDS) {
    const requisites = requisitesByMethod[methodId]
    requisites.sort((a, b) => scoreEntry(b) - scoreEntry(a))

    const { source, completeness } = pickPrimary(requisites)
    methods[methodId] = {
      methodId,
      available: requisites.length > 0,
      primarySource: source,
      bestCompleteness: completeness,
      requisites,
    }

    if (requisites.length > 0) {
      const score = scoreEntry(requisites[0])
      if (score > overallScore) {
        overallScore = score
        overallPrimary = requisites[0].source
      }
    }
  }

  const supplierName =
    str(input.catalogSupplier?.name) ||
    str(input.catalogSupplier?.company_name) ||
    ocrSellerName ||
    str(input.echoSupplier?.name) ||
    null

  return {
    supplierName: supplierName || null,
    methods,
    primarySource: overallPrimary,
  }
}
