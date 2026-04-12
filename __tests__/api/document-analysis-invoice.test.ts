/**
 * @jest-environment node
 *
 * Smoke-тесты POST /api/document-analysis для documentType='invoice'.
 *
 * Используем node-окружение вместо дефолтного jsdom — иначе Next.js 15's NextRequest
 * падает на отсутствии глобального Request в jsdom.
 *
 * Мокаем YandexVisionService и YandexGPTService, чтобы не ходить в реальный Cloud.
 */

import { NextRequest } from 'next/server'
import { YandexGPTUnavailableError } from '@/lib/services/YandexGPTService'

const mockExtractTextFromDocument = jest.fn()
const mockParseInvoiceText = jest.fn()

jest.mock('@/lib/services/YandexVisionService', () => ({
  getYandexVisionService: () => ({
    extractTextFromDocument: mockExtractTextFromDocument,
  }),
}))

jest.mock('@/lib/services/YandexGPTService', () => {
  const actual = jest.requireActual('@/lib/services/YandexGPTService')
  return {
    ...actual,
    getYandexGPTService: () => ({
      parseInvoiceText: mockParseInvoiceText,
    }),
  }
})

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/document-analysis', {
    method: 'POST',
    body: JSON.stringify(body),
  })

describe('POST /api/document-analysis (invoice)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('возвращает распарсенный инвойс при успешной работе YandexGPT', async () => {
    mockExtractTextFromDocument.mockResolvedValue('Invoice text with items')
    mockParseInvoiceText.mockResolvedValue({
      items: [
        { name: 'Товар A', quantity: 2, price: 100, total: 200 },
        { name: 'Товар B', quantity: 1, price: 50, total: 50 },
      ],
      invoiceInfo: {
        number: 'INV-1',
        currency: 'USD',
        totalAmount: '250.00',
      },
      bankInfo: {
        bankName: 'TEST BANK',
        accountNumber: '123456',
      },
    })

    const { POST } = await import('@/app/api/document-analysis/route')
    const response = await POST(
      makeRequest({
        fileUrl: 'https://example.com/invoice.pdf',
        fileType: 'application/pdf',
        documentType: 'invoice',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.suggestions.items).toHaveLength(2)
    expect(data.suggestions.invoiceInfo.number).toBe('INV-1')
    expect(data.suggestions.bankInfo.bankName).toBe('TEST BANK')
    expect(data.llmUnavailable).toBeUndefined()
    expect(data.llmError).toBeUndefined()
  })

  it('помечает ответ llmUnavailable + llmError=unavailable при YandexGPTUnavailableError', async () => {
    mockExtractTextFromDocument.mockResolvedValue('Invoice text')
    mockParseInvoiceText.mockRejectedValue(new YandexGPTUnavailableError())

    const { POST } = await import('@/app/api/document-analysis/route')
    const response = await POST(
      makeRequest({
        fileUrl: 'https://example.com/invoice.pdf',
        fileType: 'application/pdf',
        documentType: 'invoice',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.llmUnavailable).toBe(true)
    expect(data.llmError).toBe('unavailable')
    expect(data.suggestions.items).toEqual([])
    // Регистрируем что `llmUnavailable` не попал внутрь suggestions — это meta-поле, не бизнес-данные
    expect(data.suggestions.llmUnavailable).toBeUndefined()
  })

  it('помечает ответ llmUnavailable + llmError=failed при произвольной ошибке YandexGPT', async () => {
    mockExtractTextFromDocument.mockResolvedValue('Invoice text')
    mockParseInvoiceText.mockRejectedValue(new Error('YandexGPT API error: 500'))

    const { POST } = await import('@/app/api/document-analysis/route')
    const response = await POST(
      makeRequest({
        fileUrl: 'https://example.com/invoice.pdf',
        fileType: 'application/pdf',
        documentType: 'invoice',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.llmUnavailable).toBe(true)
    expect(data.llmError).toBe('failed')
    expect(data.suggestions.items).toEqual([])
  })

  it('использует XLSX-парсер и НЕ вызывает YandexGPT для XLSX-текста', async () => {
    mockExtractTextFromDocument.mockResolvedValue(
      '=== ЛИСТ: Sheet1 ===\n' +
        'INV: TEST-123\n' +
        'Product description | Quantity | Price | Total\n' +
        'Коленвал стальной | 5 | 200.00 | 1000.00\n' +
        'Total: 1000.00\n'
    )

    const { POST } = await import('@/app/api/document-analysis/route')
    const response = await POST(
      makeRequest({
        fileUrl: 'https://example.com/invoice.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        documentType: 'invoice',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockParseInvoiceText).not.toHaveBeenCalled()
    expect(data.suggestions.invoiceInfo.number).toBe('TEST-123')
    expect(data.suggestions.items.length).toBeGreaterThanOrEqual(1)
    expect(data.llmUnavailable).toBeUndefined()
  })

  it('возвращает 400 при отсутствии fileUrl', async () => {
    const { POST } = await import('@/app/api/document-analysis/route')
    const response = await POST(
      makeRequest({
        fileType: 'application/pdf',
        documentType: 'invoice',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('fileUrl и fileType обязательны')
  })

  it('возвращает success=false, если Vision не извлёк текст из документа', async () => {
    mockExtractTextFromDocument.mockResolvedValue('   ')

    const { POST } = await import('@/app/api/document-analysis/route')
    const response = await POST(
      makeRequest({
        fileUrl: 'https://example.com/empty.pdf',
        fileType: 'application/pdf',
        documentType: 'invoice',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(false)
    expect(mockParseInvoiceText).not.toHaveBeenCalled()
  })
})
