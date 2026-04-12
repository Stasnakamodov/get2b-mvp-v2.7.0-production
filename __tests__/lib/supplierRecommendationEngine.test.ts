/**
 * @jest-environment node
 */

import {
  buildSupplierRecommendation,
  type BuildInput,
  type CatalogSupplierInput,
} from '@/lib/suppliers/supplierRecommendationEngine'
import type { ParsedInvoice } from '@/lib/services/YandexGPTService'

const SHENZHEN_INVOICE: ParsedInvoice = {
  items: [{ name: 'Widget', quantity: 10, price: 5, total: 50 }],
  invoiceInfo: {
    seller: 'Shenzhen Bright Technology Co., Ltd.',
    currency: 'USD',
    totalAmount: '50.00',
  },
  bankInfo: {
    bankName: 'Bank of China, Shenzhen Nanshan Br.',
    accountNumber: '7559 2816 0388',
    swift: 'BKCHCNBJ45A',
    recipientName: 'Shenzhen Bright Technology Co., Ltd.',
    recipientAddress: 'Shenzhen, PRC',
    transferCurrency: 'USD',
  },
}

const PARTIAL_BANK_ONLY_INVOICE: ParsedInvoice = {
  items: [],
  invoiceInfo: { seller: 'Partial Vendor', currency: 'USD' },
  bankInfo: {
    bankName: 'Bank of Partial',
  },
}

const EMPTY_INVOICE: ParsedInvoice = {
  items: [],
  invoiceInfo: {},
}

const CATALOG_WITH_ALL_METHODS_BUT_EMPTY: CatalogSupplierInput = {
  name: 'Marketing Vendor LLC',
  payment_methods: ['bank_transfer', 'p2p', 'crypto'],
  bank_accounts: [],
  p2p_cards: [],
  crypto_wallets: [],
}

const CATALOG_FULL_BANK: CatalogSupplierInput = {
  name: 'Full Bank Catalog LLC',
  payment_methods: ['bank_transfer'],
  bank_accounts: [
    {
      bank_name: 'ACME Bank',
      account_number: '4000000000001234',
      swift: 'ACMEUS33',
      recipient_name: 'Full Bank Catalog LLC',
    },
  ],
  p2p_cards: [],
  crypto_wallets: [],
}

const CATALOG_WITH_P2P: CatalogSupplierInput = {
  name: 'P2P Catalog LLC',
  payment_methods: ['p2p'],
  bank_accounts: [],
  p2p_cards: [
    {
      card_number: '4276 8380 1234 5678',
      holder_name: 'Ivan Ivanov',
      bank: 'Sberbank',
    },
  ],
  crypto_wallets: [],
}

const CATALOG_WITH_CRYPTO_NO_NETWORK: CatalogSupplierInput = {
  name: 'Crypto Catalog LLC',
  payment_methods: ['crypto'],
  bank_accounts: [],
  p2p_cards: [],
  crypto_wallets: [
    {
      address: 'TW3pE8vN2ZbP8XabXXXXXXXXXXXXXXXXXX',
      currency: 'USDT',
    },
  ],
}

describe('buildSupplierRecommendation', () => {
  it('1. Shenzhen bank-only invoice → only bank-transfer available with full completeness', () => {
    const result = buildSupplierRecommendation({ ocrInvoice: SHENZHEN_INVOICE })

    expect(result.methods['bank-transfer'].available).toBe(true)
    expect(result.methods['bank-transfer'].bestCompleteness).toBe('full')
    expect(result.methods['bank-transfer'].primarySource).toBe('ocr_invoice')
    expect(result.methods['p2p'].available).toBe(false)
    expect(result.methods['crypto'].available).toBe(false)
    expect(result.supplierName).toBe('Shenzhen Bright Technology Co., Ltd.')
  })

  it('2. Partial bank info (only bankName) → bank-transfer partial, others false', () => {
    const result = buildSupplierRecommendation({ ocrInvoice: PARTIAL_BANK_ONLY_INVOICE })

    expect(result.methods['bank-transfer'].available).toBe(true)
    expect(result.methods['bank-transfer'].bestCompleteness).toBe('partial')
    expect(result.methods['bank-transfer'].requisites[0].missingFields).toEqual(
      expect.arrayContaining(['account_number', 'swift', 'recipient_name'])
    )
    expect(result.methods['p2p'].available).toBe(false)
    expect(result.methods['crypto'].available).toBe(false)
  })

  it('3. Empty invoice → no methods available', () => {
    const result = buildSupplierRecommendation({ ocrInvoice: EMPTY_INVOICE })

    expect(result.methods['bank-transfer'].available).toBe(false)
    expect(result.methods['p2p'].available).toBe(false)
    expect(result.methods['crypto'].available).toBe(false)
    expect(result.supplierName).toBeNull()
  })

  it('4. Catalog declares all 3 methods but arrays are empty → none available (the real Step4 bug)', () => {
    const result = buildSupplierRecommendation({
      catalogSupplier: CATALOG_WITH_ALL_METHODS_BUT_EMPTY,
    })

    expect(result.methods['bank-transfer'].available).toBe(false)
    expect(result.methods['p2p'].available).toBe(false)
    expect(result.methods['crypto'].available).toBe(false)
    expect(result.supplierName).toBe('Marketing Vendor LLC')
  })

  it('5. Catalog with full bank + OCR bank → catalog wins as primary, OCR still attached', () => {
    const result = buildSupplierRecommendation({
      catalogSupplier: CATALOG_FULL_BANK,
      ocrInvoice: SHENZHEN_INVOICE,
    })

    const bank = result.methods['bank-transfer']
    expect(bank.available).toBe(true)
    expect(bank.requisites.length).toBe(2)
    expect(bank.primarySource).toBe('catalog')
    expect(bank.requisites[0].source).toBe('catalog')
    expect(bank.requisites[1].source).toBe('ocr_invoice')
    expect(result.methods['p2p'].available).toBe(false)
  })

  it('6. Catalog p2p + OCR bank → both available, each from its own source', () => {
    const result = buildSupplierRecommendation({
      catalogSupplier: CATALOG_WITH_P2P,
      ocrInvoice: SHENZHEN_INVOICE,
    })

    expect(result.methods['bank-transfer'].available).toBe(true)
    expect(result.methods['bank-transfer'].primarySource).toBe('ocr_invoice')
    expect(result.methods['bank-transfer'].bestCompleteness).toBe('full')

    expect(result.methods['p2p'].available).toBe(true)
    expect(result.methods['p2p'].primarySource).toBe('catalog')

    expect(result.methods['crypto'].available).toBe(false)
  })

  it('7. Crypto wallet without network → partial completeness', () => {
    const result = buildSupplierRecommendation({
      catalogSupplier: CATALOG_WITH_CRYPTO_NO_NETWORK,
    })

    expect(result.methods['crypto'].available).toBe(true)
    expect(result.methods['crypto'].bestCompleteness).toBe('partial')
    expect(result.methods['crypto'].requisites[0].missingFields).toContain('network')
  })

  it('8. Echo supplier only → methods reflect echo data with echo source priority', () => {
    const result = buildSupplierRecommendation({
      echoSupplier: {
        name: 'Echo Only LLC',
        bank_accounts: [
          {
            bank_name: 'Echo Bank',
            account_number: '9999999999',
            swift: 'ECHOUS33',
            recipient_name: 'Echo Only LLC',
          },
        ],
        p2p_cards: [],
        crypto_wallets: [],
      },
    })

    expect(result.methods['bank-transfer'].available).toBe(true)
    expect(result.methods['bank-transfer'].primarySource).toBe('echo')
    expect(result.methods['bank-transfer'].bestCompleteness).toBe('full')
    expect(result.supplierName).toBe('Echo Only LLC')
  })

  it('9. Catalog beats echo when both have bank data', () => {
    const result: ReturnType<typeof buildSupplierRecommendation> = buildSupplierRecommendation({
      catalogSupplier: CATALOG_FULL_BANK,
      echoSupplier: {
        name: 'Echo LLC',
        bank_accounts: [
          {
            bank_name: 'Echo Bank',
            account_number: '1',
            swift: 'ECHO',
            recipient_name: 'Echo LLC',
          },
        ],
      },
    })

    const bank = result.methods['bank-transfer']
    expect(bank.primarySource).toBe('catalog')
    expect(bank.requisites[0].source).toBe('catalog')
  })

  it('10. P2P with short card number and no phone → not recognized', () => {
    const result = buildSupplierRecommendation({
      catalogSupplier: {
        name: 'Bad P2P',
        payment_methods: ['p2p'],
        p2p_cards: [{ card_number: '1234', holder_name: 'X' }],
      },
    })

    expect(result.methods['p2p'].available).toBe(false)
  })

  it('11. No inputs at all → all methods false, supplierName null', () => {
    const input: BuildInput = {}
    const result = buildSupplierRecommendation(input)

    expect(result.methods['bank-transfer'].available).toBe(false)
    expect(result.methods['p2p'].available).toBe(false)
    expect(result.methods['crypto'].available).toBe(false)
    expect(result.supplierName).toBeNull()
    expect(result.primarySource).toBeNull()
  })
})
