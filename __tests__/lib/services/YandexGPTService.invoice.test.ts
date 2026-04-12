/**
 * Unit-тесты YandexGPTService.parseInvoiceText
 *
 * Мокаем global.fetch — тесты не ходят в реальный Yandex Cloud.
 */

import { YandexGPTService, YandexGPTUnavailableError } from '@/lib/services/YandexGPTService'

describe('YandexGPTService.parseInvoiceText', () => {
  const originalFetch = global.fetch
  const originalApiKey = process.env.YANDEX_VISION_API_KEY
  const originalGptKey = process.env.YANDEX_GPT_API_KEY
  const originalFolderId = process.env.YANDEX_FOLDER_ID

  beforeEach(() => {
    process.env.YANDEX_VISION_API_KEY = 'test-api-key'
    process.env.YANDEX_FOLDER_ID = 'test-folder-id'
    delete process.env.YANDEX_GPT_API_KEY
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env.YANDEX_VISION_API_KEY = originalApiKey
    process.env.YANDEX_GPT_API_KEY = originalGptKey
    process.env.YANDEX_FOLDER_ID = originalFolderId
    jest.clearAllMocks()
  })

  const mockFetchWith = (gptText: string, ok = true, status = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok,
      status,
      text: jest.fn().mockResolvedValue(ok ? '' : 'error body'),
      json: jest.fn().mockResolvedValue({
        result: {
          alternatives: [{ message: { text: gptText } }],
        },
      }),
    }) as unknown as typeof fetch
  }

  it('парсит чистый JSON-ответ с товарами, invoiceInfo и bankInfo', async () => {
    mockFetchWith(
      JSON.stringify({
        items: [
          { name: 'Тормозной диск Brembo', quantity: 4, price: 250.5, total: 1002, code: 'BR-001', unit: 'шт' },
          { name: 'Масло моторное', quantity: 2, price: 30, total: 60 },
        ],
        invoiceInfo: {
          number: 'INV-2025-001',
          date: '2025-04-12',
          seller: 'Gamma Trading Co., Ltd',
          totalAmount: '1062.00',
          currency: 'USD',
        },
        bankInfo: {
          bankName: 'BANK OF CHINA',
          accountNumber: '397475795838',
          swift: 'BKCHCNBJ92B',
          recipientName: 'ZHEJIANG GAMMA TRADING CO., LTD',
        },
      })
    )

    const service = new YandexGPTService()
    const result = await service.parseInvoiceText('Invoice text')

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({
      name: 'Тормозной диск Brembo',
      quantity: 4,
      price: 250.5,
      total: 1002,
      code: 'BR-001',
      unit: 'шт',
    })
    // второй item без code/unit — опциональные поля пропускаются
    expect(result.items[1]).toEqual({
      name: 'Масло моторное',
      quantity: 2,
      price: 30,
      total: 60,
    })
    expect(result.invoiceInfo.number).toBe('INV-2025-001')
    expect(result.invoiceInfo.currency).toBe('USD')
    expect(result.bankInfo?.swift).toBe('BKCHCNBJ92B')
  })

  it('парсит JSON обёрнутый в markdown ```json```', async () => {
    mockFetchWith(
      '```json\n' +
        JSON.stringify({
          items: [{ name: 'Товар', quantity: 1, price: 100, total: 100 }],
          invoiceInfo: { number: 'INV-42' },
        }) +
        '\n```'
    )

    const service = new YandexGPTService()
    const result = await service.parseInvoiceText('Invoice text')

    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Товар')
    expect(result.invoiceInfo.number).toBe('INV-42')
  })

  it('вычисляет total как quantity × price, если total не указан', async () => {
    mockFetchWith(
      JSON.stringify({
        items: [{ name: 'Карандаш', quantity: 10, price: 5 }],
        invoiceInfo: {},
      })
    )

    const service = new YandexGPTService()
    const result = await service.parseInvoiceText('Invoice text')

    expect(result.items[0].total).toBe(50)
  })

  it('фильтрует items с пустым name', async () => {
    mockFetchWith(
      JSON.stringify({
        items: [
          { name: '', quantity: 1, price: 10, total: 10 },
          { name: '   ', quantity: 1, price: 10, total: 10 },
          { name: 'Реальный товар', quantity: 1, price: 10, total: 10 },
        ],
        invoiceInfo: {},
      })
    )

    const service = new YandexGPTService()
    const result = await service.parseInvoiceText('Invoice text')

    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Реальный товар')
  })

  it('возвращает пустой ParsedInvoice при мусорном ответе без JSON', async () => {
    mockFetchWith('Какой-то мусор без валидного JSON')

    const service = new YandexGPTService()
    const result = await service.parseInvoiceText('Invoice text')

    expect(result).toEqual({ items: [], invoiceInfo: {} })
  })

  it('возвращает пустой ParsedInvoice при битом JSON', async () => {
    mockFetchWith('{ items: [not valid json }')

    const service = new YandexGPTService()
    const result = await service.parseInvoiceText('Invoice text')

    expect(result).toEqual({ items: [], invoiceInfo: {} })
  })

  it('бросает YandexGPTUnavailableError, если ключи не настроены', async () => {
    delete process.env.YANDEX_VISION_API_KEY
    delete process.env.YANDEX_FOLDER_ID

    const service = new YandexGPTService()
    await expect(service.parseInvoiceText('Invoice text')).rejects.toBeInstanceOf(
      YandexGPTUnavailableError
    )
  })

  it('пробрасывает обычный Error при 4xx/5xx от API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'),
      json: jest.fn(),
    }) as unknown as typeof fetch

    const service = new YandexGPTService()
    await expect(service.parseInvoiceText('Invoice text')).rejects.toThrow(
      /YandexGPT API error: 401/
    )
  })

  it('возвращает пустой ParsedInvoice для пустой OCR-строки без HTTP-запроса', async () => {
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as unknown as typeof fetch

    const service = new YandexGPTService()
    const result = await service.parseInvoiceText('   ')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result).toEqual({ items: [], invoiceInfo: {} })
  })
})
