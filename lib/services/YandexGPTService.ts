/**
 * Сервис для работы с Yandex Foundation Models (YandexGPT)
 * Используется для интеллектуального анализа изображений товаров и парсинга инвойсов
 */

export interface ProductAnalysis {
  brand: string | null;
  category: string | null;
  productType: string | null;
  keywords: string[];
  description: string;
}

export interface ParsedInvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  code?: string;
  unit?: string;
}

export interface ParsedInvoice {
  items: ParsedInvoiceItem[];
  invoiceInfo: {
    number?: string;
    date?: string;
    seller?: string;
    buyer?: string;
    totalAmount?: string;
    currency?: string;
    vat?: string;
  };
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    swift?: string;
    recipientName?: string;
    recipientAddress?: string;
    transferCurrency?: string;
  };
}

export class YandexGPTUnavailableError extends Error {
  constructor(message = 'YandexGPT API не настроен: проверьте YANDEX_VISION_API_KEY (или YANDEX_GPT_API_KEY) и YANDEX_FOLDER_ID') {
    super(message);
    this.name = 'YandexGPTUnavailableError';
  }
}

export class YandexGPTService {
  private apiKey: string;
  private folderId: string;
  private baseUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

  constructor() {
    this.apiKey = process.env.YANDEX_GPT_API_KEY || process.env.YANDEX_VISION_API_KEY || '';
    this.folderId = process.env.YANDEX_FOLDER_ID || '';

    console.log('🤖 YandexGPT: Проверяем переменные окружения...');
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'НЕ НАЙДЕН');
    console.log('📁 Folder ID:', this.folderId ? this.folderId : 'НЕ НАЙДЕН');

    if (!this.apiKey || !this.folderId) {
      console.warn('⚠️ YandexGPT: Используем fallback режим (OCR + Classification)');
    }
  }

  /**
   * Анализирует изображение товара с помощью YandexGPT
   * Возвращает умное описание с ключевыми словами для поиска
   */
  async analyzeProductImage(imageBase64: string, ocrText: string, classificationLabels: string[]): Promise<ProductAnalysis> {
    try {
      // Если нет API ключа, возвращаем базовый анализ
      if (!this.apiKey || !this.folderId) {
        console.log('⚠️ YandexGPT: API недоступен, используем базовый анализ');
        return this.fallbackAnalysis(ocrText, classificationLabels);
      }

      console.log('🤖 YandexGPT: Начинаем умный анализ товара...');
      console.log('📝 Входные данные:', {
        ocrText: ocrText.substring(0, 100),
        labels: classificationLabels
      });

      // Формируем промпт для GPT
      const prompt = this.buildAnalysisPrompt(ocrText, classificationLabels);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Data-Center': 'ru-central1',
        },
        body: JSON.stringify({
          modelUri: `gpt://${this.folderId}/yandexgpt/latest`,
          completionOptions: {
            stream: false,
            temperature: 0.3,
            maxTokens: 1000
          },
          messages: [{
            role: "user",
            text: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ YandexGPT API ошибка:', response.status, errorText);
        return this.fallbackAnalysis(ocrText, classificationLabels);
      }

      const data = await response.json();
      console.log('✅ YandexGPT: Ответ получен');

      // Извлекаем текст ответа
      const gptResponse = data.result?.alternatives?.[0]?.message?.text || '';
      console.log('📄 YandexGPT ответ:', gptResponse);

      // Парсим JSON из ответа
      const analysis = this.parseGPTResponse(gptResponse);

      console.log('🎯 YandexGPT результат:', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ YandexGPT ошибка:', error);
      return this.fallbackAnalysis(ocrText, classificationLabels);
    }
  }

  /**
   * Формирует промпт для анализа товара
   */
  private buildAnalysisPrompt(ocrText: string, labels: string[]): string {
    return `Ты - эксперт по товарам и помогаешь определить товар для поиска в каталоге.

ВХОДНЫЕ ДАННЫЕ:
- Распознанный текст (OCR): "${ocrText || 'текст не найден'}"
- Классификация изображения: ${labels.join(', ') || 'не определено'}

ЗАДАЧА:
Определи товар и дай ключевые слова для поиска в каталоге автозапчастей и промышленных товаров.

ТРЕБОВАНИЯ:
1. Если в тексте есть бренд (Brembo, Bosch, Samsung и т.д.) - обязательно укажи его
2. Определи категорию товара (тормозная система, электроника, инструменты и т.д.)
3. Дай ключевые слова НА РУССКОМ И АНГЛИЙСКОМ языках
4. Добавь синонимы и связанные термины
5. Формат ответа - строго JSON без дополнительного текста

ФОРМАТ ОТВЕТА:
{
  "brand": "название бренда или null",
  "category": "категория товара или null",
  "productType": "тип товара или null",
  "keywords": ["слово1", "слово2", "слово3"],
  "description": "краткое описание товара"
}

ПРИМЕРЫ KEYWORDS:
- Если бренд "Brembo" → ["Brembo", "Брембо", "тормоза", "brake", "суппорт", "тормозная система"]
- Если "Samsung" → ["Samsung", "Самсунг", "электроника", "electronics", "техника"]
- Если инструмент → ["инструмент", "tool", "оборудование", "equipment"]

ОТВЕТ (только JSON, без markdown):`;
  }

  /**
   * Парсит ответ от YandexGPT
   */
  private parseGPTResponse(response: string): ProductAnalysis {
    try {
      // Убираем markdown форматирование если есть
      let cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Пытаемся найти JSON в ответе
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanResponse);

      return {
        brand: parsed.brand || null,
        category: parsed.category || null,
        productType: parsed.productType || null,
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        description: parsed.description || ''
      };
    } catch (error) {
      console.error('❌ Ошибка парсинга GPT ответа:', error);
      console.log('📄 Проблемный ответ:', response);

      // Возвращаем пустой результат
      return {
        brand: null,
        category: null,
        productType: null,
        keywords: [],
        description: response.substring(0, 200)
      };
    }
  }

  /**
   * Анализирует товар по метаданным с маркетплейса (для поиска по URL)
   */
  async analyzeProductFromMetadata(title: string, description: string, marketplace?: string): Promise<ProductAnalysis> {
    try {
      // Если нет API ключа, возвращаем базовый анализ
      if (!this.apiKey || !this.folderId) {
        console.log('⚠️ YandexGPT: API недоступен, используем базовый анализ метаданных');
        return this.fallbackMetadataAnalysis(title, description);
      }

      console.log('🤖 [URL Search] YandexGPT: Анализируем товар с маркетплейса...');
      console.log('📝 Входные данные:', { title, marketplace });

      // Формируем промпт для анализа метаданных
      const prompt = this.buildMetadataAnalysisPrompt(title, description, marketplace);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Data-Center': 'ru-central1',
        },
        body: JSON.stringify({
          modelUri: `gpt://${this.folderId}/yandexgpt/latest`,
          completionOptions: {
            stream: false,
            temperature: 0.3,
            maxTokens: 1000
          },
          messages: [{
            role: "user",
            text: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ YandexGPT API ошибка:', response.status, errorText);
        return this.fallbackMetadataAnalysis(title, description);
      }

      const data = await response.json();
      console.log('✅ [URL Search] YandexGPT: Ответ получен');

      const gptResponse = data.result?.alternatives?.[0]?.message?.text || '';
      const analysis = this.parseGPTResponse(gptResponse);

      console.log('🎯 [URL Search] YandexGPT результат:', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ [URL Search] YandexGPT ошибка:', error);
      return this.fallbackMetadataAnalysis(title, description);
    }
  }

  /**
   * Формирует промпт для анализа товара по метаданным
   */
  private buildMetadataAnalysisPrompt(title: string, description: string, marketplace?: string): string {
    return `Ты - эксперт по товарам и помогаешь найти аналоги товара в каталоге.

ВХОДНЫЕ ДАННЫЕ:
- Название товара: "${title}"
- Описание: "${description.substring(0, 500)}"
${marketplace ? `- Маркетплейс: ${marketplace}` : ''}

ЗАДАЧА:
Проанализируй товар и создай ключевые слова для поиска аналогов в каталоге.

ТРЕБОВАНИЯ:
1. Определи бренд товара (если есть)
2. Определи категорию (Автозапчасти, Электроника, Инструменты, Строительство и т.д.)
3. Извлеки характеристики (цвет, размер, материал, модель)
4. Создай ключевые слова НА РУССКОМ И АНГЛИЙСКОМ
5. Добавь синонимы и связанные термины
6. Формат ответа - строго JSON без дополнительного текста

ФОРМАТ ОТВЕТА:
{
  "brand": "название бренда или null",
  "category": "категория товара",
  "productType": "конкретный тип товара",
  "keywords": ["ключевое1", "ключевое2", "ключевое3", "ключевое4", "ключевое5"],
  "description": "краткое описание для поиска"
}

ПРИМЕРЫ:
1. "Тормозные диски Brembo GT передние" →
{
  "brand": "Brembo",
  "category": "Автозапчасти",
  "productType": "Тормозные диски",
  "keywords": ["Brembo", "Брембо", "тормозные диски", "brake disc", "GT", "передние", "тормоза", "суппорт"],
  "description": "Передние тормозные диски Brembo GT"
}

2. "Перфоратор Bosch GBH 2-28" →
{
  "brand": "Bosch",
  "category": "Инструменты",
  "productType": "Перфоратор",
  "keywords": ["Bosch", "Бош", "перфоратор", "hammer drill", "GBH", "дрель", "электроинструмент"],
  "description": "Перфоратор Bosch GBH 2-28"
}

ОТВЕТ (только JSON, без markdown):`;
  }

  /**
   * Fallback анализ метаданных если YandexGPT недоступен
   */
  private fallbackMetadataAnalysis(title: string, description: string): ProductAnalysis {
    console.log('🔄 [URL Search] Используем базовый анализ метаданных (без GPT)');

    // Извлекаем потенциальный бренд (заглавные слова в начале)
    const words = title.split(/\s+/).filter(w => w.length > 2);
    const capitalizedWords = words.filter(w => /^[A-ZА-Я][a-zа-я]+/.test(w));
    const brand = capitalizedWords[0] || null;

    // Базовые ключевые слова из названия и описания
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const descWords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 10);
    const keywords = [...new Set([...titleWords, ...descWords])];

    return {
      brand,
      category: null,
      productType: null,
      keywords: keywords.slice(0, 10),
      description: title
    };
  }

  /**
   * Парсит OCR-текст инвойса через YandexGPT в структурированный ParsedInvoice.
   *
   * Бросает YandexGPTUnavailableError, если ключи не настроены (caller решает что делать),
   * и пробрасывает обычный Error при 4xx/5xx от API или таймауте.
   */
  async parseInvoiceText(
    ocrText: string,
    options: { timeoutMs?: number } = {}
  ): Promise<ParsedInvoice> {
    if (!this.apiKey || !this.folderId) {
      throw new YandexGPTUnavailableError();
    }

    if (!ocrText || !ocrText.trim()) {
      return { items: [], invoiceInfo: {} };
    }

    const timeoutMs = options.timeoutMs ?? 45_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const prompt = this.buildInvoicePrompt(ocrText);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Api-Key ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Data-Center': 'ru-central1',
        },
        body: JSON.stringify({
          modelUri: `gpt://${this.folderId}/yandexgpt/latest`,
          completionOptions: {
            stream: false,
            temperature: 0.1,
            maxTokens: 2000,
          },
          messages: [{ role: 'user', text: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`YandexGPT API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const gptResponse: string = data?.result?.alternatives?.[0]?.message?.text || '';
      return this.parseInvoiceResponse(gptResponse);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildInvoicePrompt(ocrText: string): string {
    return `Ты — эксперт по обработке инвойсов, коммерческих счетов и proforma-invoice. Извлеки из OCR-текста структурированные данные.

OCR-ТЕКСТ ИНВОЙСА:
"""
${ocrText}
"""

ЗАДАЧА:
Извлеки позиции товаров, информацию об инвойсе и банковские реквизиты получателя.

ПРАВИЛА:
1. Извлекай ТОЛЬКО реальные товары и услуги, присутствующие в тексте. Не выдумывай позиции.
2. Цены (price, total) и количество (quantity) — обычные числа. Убирай пробелы, разделители тысяч, валютные символы.
3. Если в total явно указана цена × количество — сохраняй как указано.
4. Из полей seller/buyer/recipientName убирай префиксы: "| Agent:", "| Buyer:", "| Seller:", "Поставщик:", "Продавец:", "Покупатель:".
5. Из recipientName убирай китайские скобки (账户名称) и английские (Account Name).
6. Если какого-то поля нет в тексте — просто опускай его в ответе, не подставляй null и не выдумывай.
7. Если товаров нет — верни "items": [].
8. Ответ — СТРОГО валидный JSON без markdown-обёрток, без комментариев, без вступительного текста.

ФОРМАТ ОТВЕТА:
{
  "items": [
    {
      "name": "Название товара",
      "quantity": 10,
      "price": 100.5,
      "total": 1005,
      "code": "SKU-001",
      "unit": "шт"
    }
  ],
  "invoiceInfo": {
    "number": "INV-2025-001",
    "date": "2025-04-12",
    "seller": "Gamma Trading Co., Ltd",
    "buyer": "ООО Ромашка",
    "totalAmount": "1005.00",
    "currency": "USD",
    "vat": "167.50"
  },
  "bankInfo": {
    "bankName": "BANK OF CHINA",
    "accountNumber": "397475795838",
    "swift": "BKCHCNBJ92B",
    "recipientName": "ZHEJIANG GAMMA TRADING CO., LTD"
  }
}

ОТВЕТ (только JSON):`;
  }

  private parseInvoiceResponse(response: string): ParsedInvoice {
    if (!response || !response.trim()) {
      return { items: [], invoiceInfo: {} };
    }

    try {
      const clean = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { items: [], invoiceInfo: {} };
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const items: ParsedInvoiceItem[] = Array.isArray(parsed.items)
        ? parsed.items
            .filter((raw: any) => raw && typeof raw.name === 'string' && raw.name.trim().length > 0)
            .map((raw: any): ParsedInvoiceItem => {
              const quantity = Number(raw.quantity) || 0;
              const price = Number(raw.price) || 0;
              const total = raw.total !== undefined && raw.total !== null && !Number.isNaN(Number(raw.total))
                ? Number(raw.total)
                : quantity * price;
              const item: ParsedInvoiceItem = {
                name: String(raw.name).trim(),
                quantity,
                price,
                total,
              };
              if (raw.code !== undefined && raw.code !== null && String(raw.code).trim()) {
                item.code = String(raw.code).trim();
              }
              if (raw.unit !== undefined && raw.unit !== null && String(raw.unit).trim()) {
                item.unit = String(raw.unit).trim();
              }
              return item;
            })
        : [];

      const invoiceInfo =
        parsed.invoiceInfo && typeof parsed.invoiceInfo === 'object' && !Array.isArray(parsed.invoiceInfo)
          ? parsed.invoiceInfo
          : {};

      const bankInfo =
        parsed.bankInfo && typeof parsed.bankInfo === 'object' && !Array.isArray(parsed.bankInfo)
          ? parsed.bankInfo
          : undefined;

      const result: ParsedInvoice = { items, invoiceInfo };
      if (bankInfo) {
        result.bankInfo = bankInfo;
      }
      return result;
    } catch (error) {
      console.error('❌ YandexGPT: не удалось распарсить ответ парсера инвойса:', error);
      return { items: [], invoiceInfo: {} };
    }
  }

  /**
   * Fallback анализ если YandexGPT недоступен
   */
  private fallbackAnalysis(ocrText: string, labels: string[]): ProductAnalysis {
    console.log('🔄 Используем базовый анализ (без GPT)');

    // Извлекаем потенциальный бренд из OCR (слова с заглавной буквы)
    const words = ocrText.split(/\s+/).filter(w => w.length > 2);
    const capitalizedWords = words.filter(w => /^[A-Z][a-z]+/.test(w));
    const brand = capitalizedWords[0] || null;

    // Базовая категоризация по меткам
    let category = null;
    if (labels.some(l => l.includes('brake') || l.includes('automotive'))) {
      category = 'Автозапчасти';
    } else if (labels.some(l => l.includes('electronic') || l.includes('device'))) {
      category = 'Электроника';
    }

    return {
      brand,
      category,
      productType: labels[0] || null,
      keywords: [...words.slice(0, 5), ...labels],
      description: `Товар определен как: ${labels.join(', ')}`
    };
  }
}

// Создаем единственный экземпляр сервиса
let yandexGPTService: YandexGPTService | null = null;

export function getYandexGPTService(): YandexGPTService {
  if (!yandexGPTService) {
    yandexGPTService = new YandexGPTService();
  }
  return yandexGPTService;
}
