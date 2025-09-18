/**
 * 🤖 Universal AI Service
 * Поддерживает Bot Hub, OpenAI, Anthropic с автоматическим fallback
 */

import { botHubAIService } from './BotHubAIService';

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

export class UniversalAIService {
  /**
   * 🧠 Процессинг инвойса с автоматическим fallback между AI провайдерами
   */
  async processInvoiceWithAI(ocrText: string, userId: string = 'invoice_parser'): Promise<ParsedInvoice> {
    console.log("🤖 Запуск Universal AI для обработки инвойса...");
    console.log("📄 Длина OCR текста:", ocrText.length);

    // 1. Пробуем Bot Hub AI (если доступен)
    if (process.env.BOTHUB_API_KEY) {
      try {
        console.log("🔗 Пробуем Bot Hub AI...");
        const result = await botHubAIService.processInvoiceWithAI(ocrText, userId);
        console.log("✅ Bot Hub AI успешно обработал инвойс!");
        return result;
      } catch (error) {
        console.log("⚠️ Bot Hub AI недоступен, переходим к OpenAI...");
      }
    }

    // 2. Пробуем OpenAI (если есть ключ)
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("🔗 Пробуем OpenAI API...");
        const result = await this.processWithOpenAI(ocrText);
        console.log("✅ OpenAI успешно обработал инвойс!");
        return result;
      } catch (error) {
        console.log("⚠️ OpenAI недоступен, переходим к Anthropic...");
      }
    }

    // 3. Пробуем Anthropic (если есть ключ)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log("🔗 Пробуем Anthropic API...");
        const result = await this.processWithAnthropic(ocrText);
        console.log("✅ Anthropic успешно обработал инвойс!");
        return result;
      } catch (error) {
        console.log("⚠️ Anthropic недоступен, используем regex fallback...");
      }
    }

    // 4. Fallback на regex парсинг
    console.log("🔄 Все AI провайдеры недоступны, используем regex fallback...");
    return this.processWithRegexFallback(ocrText);
  }

  /**
   * 🟢 OpenAI GPT-4 processing
   */
  private async processWithOpenAI(ocrText: string): Promise<ParsedInvoice> {
    const prompt = this.createInvoicePrompt(ocrText);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    return this.parseAIResponse(aiResponse);
  }

  /**
   * 🔵 Anthropic Claude processing
   */
  private async processWithAnthropic(ocrText: string): Promise<ParsedInvoice> {
    const prompt = this.createInvoicePrompt(ocrText);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text || '';

    return this.parseAIResponse(aiResponse);
  }

  /**
   * 📝 Создание промпта для AI
   */
  private createInvoicePrompt(ocrText: string): string {
    return `
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
    "currency": "RUB"
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
  }

  /**
   * 🔍 Парсинг ответа AI
   */
  private parseAIResponse(aiResponse: string): ParsedInvoice {
    try {
      // Пытаемся извлечь JSON из ответа
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const jsonString = jsonMatch[0];
      const parsed = JSON.parse(jsonString);

      // Валидация структуры
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        invoiceInfo: parsed.invoiceInfo || {},
        bankInfo: parsed.bankInfo || {}
      };
    } catch (error) {
      console.error("❌ Ошибка парсинга AI ответа:", error);
      return this.createEmptyResult();
    }
  }

  /**
   * 🔄 Regex fallback для случаев когда AI недоступен
   */
  private processWithRegexFallback(ocrText: string): ParsedInvoice {
    console.log("🔧 Используем regex fallback для парсинга инвойса...");

    const result: ParsedInvoice = {
      items: [],
      invoiceInfo: {}
    };

    // Простые regex паттерны для основных полей
    const invoiceNumberMatch = ocrText.match(/(?:инвойс|счет|invoice)[\s#№]*([a-z0-9\-_\/]+)/i);
    if (invoiceNumberMatch) {
      result.invoiceInfo.number = invoiceNumberMatch[1];
    }

    const dateMatch = ocrText.match(/(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/);
    if (dateMatch) {
      result.invoiceInfo.date = dateMatch[1];
    }

    const totalMatch = ocrText.match(/(?:итого|всего|total)[\s:]*(\d+[.,]?\d*)/i);
    if (totalMatch) {
      result.invoiceInfo.totalAmount = totalMatch[1].replace(',', '.');
    }

    console.log("✅ Regex fallback завершен:", result);
    return result;
  }

  /**
   * 🏗️ Создание пустого результата
   */
  private createEmptyResult(): ParsedInvoice {
    return {
      items: [],
      invoiceInfo: {},
      bankInfo: {}
    };
  }

  /**
   * 🧪 Тестирование доступности AI провайдеров
   */
  async testAIProviders(): Promise<{
    botHub: boolean;
    openai: boolean;
    anthropic: boolean;
  }> {
    const results = {
      botHub: false,
      openai: false,
      anthropic: false
    };

    // Тест Bot Hub
    if (process.env.BOTHUB_API_KEY) {
      try {
        results.botHub = await botHubAIService.testConnection();
      } catch (error) {
        console.log("Bot Hub недоступен");
      }
    }

    // Тест OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        });
        results.openai = response.ok;
      } catch (error) {
        console.log("OpenAI недоступен");
      }
    }

    // Тест Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        results.anthropic = response.ok;
      } catch (error) {
        console.log("Anthropic недоступен");
      }
    }

    return results;
  }
}

// Экспорт единственного экземпляра
export const universalAIService = new UniversalAIService();