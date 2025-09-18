/**
 * Bot Hub AI Service
 * Интеграция с Bot Hub API для обработки инвойсов через ИИ
 * Согласно официальной документации Bot Hub
 */

interface BotHubAIResponse {
  status: 'success' | 'error';
  ai_response?: string;
  error_message?: string;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  code?: string;
  unit?: string;
}

interface ParsedInvoice {
  items: InvoiceItem[];
  invoiceInfo: {
    number?: string;
    date?: string;
    seller?: string;
    buyer?: string;
    totalAmount?: string;
    currency?: string;
  };
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    swift?: string;
  };
}

export class BotHubAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BOTHUB_API_KEY || '';
    this.baseUrl = 'https://api.bothub.chat'; // Базовый URL Bot Hub API
  }

  /**
   * 🤖 Обрабатывает инвойс через Bot Hub AI API
   */
  async processInvoiceWithAI(ocrText: string, userId: string = 'invoice_parser'): Promise<ParsedInvoice> {
    console.log("🤖 Запуск Bot Hub AI для обработки инвойса...");

    if (!this.apiKey) {
      throw new Error('BOTHUB_API_KEY не найден в переменных окружения');
    }

    // Формируем промпт для обработки инвойса
    const prompt = `
Ты эксперт по обработке инвойсов. Извлеки из этого OCR текста структурированные данные.

ТЕКСТ ИНВОЙСА:
${ocrText}

ТРЕБУЕМЫЙ ФОРМАТ JSON (строго следуй структуре):
{
  "items": [
    {
      "name": "Название товара",
      "quantity": 1,
      "price": 100.00,
      "total": 100.00,
      "code": "ITEM-001",
      "unit": "шт"
    }
  ],
  "invoiceInfo": {
    "number": "INV-2025-001",
    "date": "31/03/2025",
    "seller": "Название компании-продавца",
    "buyer": "Название компании-покупателя",
    "totalAmount": "1000.00",
    "currency": "RMB"
  },
  "bankInfo": {
    "bankName": "Название банка",
    "accountNumber": "1234567890",
    "swift": "BANKCODE"
  }
}

ПРАВИЛА:
1. Извлекай ТОЛЬКО реальные товары/услуги из текста
2. Цены конвертируй в числа (убирай пробелы, запятые)
3. Если данных нет - не придумывай, оставь пустым
4. Отвечай ТОЛЬКО валидным JSON, без комментариев
5. Если товаров нет в тексте - возвращай пустой массив items: []
`;

    try {
      console.log("🔗 Отправляем запрос к Bot Hub AI API...");

      const response = await fetch(`${this.baseUrl}/apiai/process_message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message_content: prompt
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Bot Hub AI API ошибка:", response.status, errorText);
        throw new Error(`Bot Hub AI API error: ${response.status} - ${errorText}`);
      }

      const data: BotHubAIResponse = await response.json();
      console.log("📦 Ответ от Bot Hub AI API:", data);

      if (data.status === 'error') {
        throw new Error(`Bot Hub AI error: ${data.error_message}`);
      }

      if (!data.ai_response) {
        throw new Error('Bot Hub AI не вернул ответ');
      }

      const aiResponse = data.ai_response;
      console.log("🤖 Bot Hub AI ответ:", aiResponse);

      // Парсим JSON ответ от Bot Hub AI
      const parsedResult: ParsedInvoice = JSON.parse(aiResponse);

      console.log("✅ Bot Hub AI парсинг завершен:", {
        itemsFound: parsedResult.items.length,
        hasInvoiceInfo: !!parsedResult.invoiceInfo,
        hasBankInfo: !!parsedResult.bankInfo
      });

      return parsedResult;

    } catch (error) {
      console.error("❌ Ошибка Bot Hub AI парсинга:", error);
      throw error;
    }
  }

  /**
   * 🧪 Тестирует соединение с Bot Hub API
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("🧪 Тестируем соединение с Bot Hub AI...");

      const response = await fetch(`${this.baseUrl}/apiai/process_message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'test_user',
          message_content: 'Test connection'
        }),
      });

      const isConnected = response.ok;
      console.log(`${isConnected ? '✅' : '❌'} Bot Hub AI соединение: ${isConnected ? 'успешно' : 'неудачно'}`);

      return isConnected;

    } catch (error) {
      console.error("❌ Ошибка тестирования Bot Hub AI:", error);
      return false;
    }
  }
}

// Экспорт для использования в API
export const botHubAIService = new BotHubAIService();