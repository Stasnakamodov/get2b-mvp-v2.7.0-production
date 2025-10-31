/**
 * Сервис для работы с Yandex Foundation Models (YandexGPT)
 * Используется для интеллектуального анализа изображений товаров
 */

export interface ProductAnalysis {
  brand: string | null;
  category: string | null;
  productType: string | null;
  keywords: string[];
  description: string;
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
