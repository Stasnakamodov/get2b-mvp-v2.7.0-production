/**
 * 💱 СЕРВИС КУРСОВ ВАЛЮТ GET2B
 * Интеграция с ЦБ РФ API для получения актуальных курсов
 */

export interface CurrencyRate {
  code: string;
  name: string;
  value: number;
  nominal: number;
  previous?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface CurrencyRatesResponse {
  date: string;
  rates: Record<string, CurrencyRate>;
  source: 'cbr' | 'cache' | 'fallback';
  updated_at: string;
}

class CurrencyService {
  private static instance: CurrencyService;
  private cache: Map<string, { data: CurrencyRatesResponse; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 час
  private readonly CBR_API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
  private readonly FALLBACK_URL = 'http://www.cbr.ru/scripts/XML_daily.asp';

  // Курсы по умолчанию (fallback)
  private readonly DEFAULT_RATES: Record<string, CurrencyRate> = {
    'USD': { code: 'USD', name: 'Доллар США', value: 92.50, nominal: 1 },
    'EUR': { code: 'EUR', name: 'Евро', value: 101.20, nominal: 1 },
    'CNY': { code: 'CNY', name: 'Китайский юань', value: 12.80, nominal: 1 },
    'TRY': { code: 'TRY', name: 'Турецкая лира', value: 2.85, nominal: 10 },
    'AED': { code: 'AED', name: 'Дирхам ОАЭ', value: 25.20, nominal: 1 },
  };

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  /**
   * 📊 Получить актуальные курсы валют
   */
  async getRates(forceRefresh = false): Promise<CurrencyRatesResponse> {
    const cacheKey = 'current_rates';
    const cached = this.cache.get(cacheKey);

    // Проверяем кеш
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📦 Курсы из кеша');
      return cached.data;
    }

    try {
      console.log('🌐 Запрос курсов от ЦБ РФ...');
      const response = await this.fetchFromCBR();
      
      // Кешируем успешный результат
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('❌ Ошибка получения курсов:', error);
      
      // Возвращаем кешированные данные если есть
      if (cached) {
        console.log('⚠️ Используем устаревший кеш');
        return { ...cached.data, source: 'cache' };
      }

      // Fallback на статичные курсы
      console.log('🔄 Используем резервные курсы');
      return this.getFallbackRates();
    }
  }

  /**
   * 🌐 Получение курсов от ЦБ РФ через cbr-xml-daily
   */
  private async fetchFromCBR(): Promise<CurrencyRatesResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

    try {
      const response = await fetch(this.CBR_API_URL, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Get2B-Platform/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      clearTimeout(timeoutId);

      return this.parseCBRResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 🔧 Парсинг ответа от ЦБ РФ
   */
  private parseCBRResponse(data: any): CurrencyRatesResponse {
    const rates: Record<string, CurrencyRate> = {};

    // Интересующие нас валюты Get2B
    const targetCurrencies = ['USD', 'EUR', 'CNY', 'TRY', 'AED'];

    for (const [code, rateData] of Object.entries(data.Valute || {})) {
      if (targetCurrencies.includes(code)) {
        const rate = rateData as any;
        const current = Number(rate.Value);
        const previous = Number(rate.Previous || current);
        
        rates[code] = {
          code,
          name: rate.Name || `Валюта ${code}`,
          value: current,
          nominal: Number(rate.Nominal || 1),
          previous,
          trend: current > previous ? 'up' : current < previous ? 'down' : 'stable'
        };
      }
    }

    return {
      date: data.Date || new Date().toISOString().split('T')[0],
      rates,
      source: 'cbr',
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 🔄 Резервные курсы при недоступности API
   */
  private getFallbackRates(): CurrencyRatesResponse {
    return {
      date: new Date().toISOString().split('T')[0],
      rates: { ...this.DEFAULT_RATES },
      source: 'fallback',
      updated_at: new Date().toISOString()
    };
  }

  /**
   * 💰 Конвертация валют
   */
  async convert(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string = 'RUB'
  ): Promise<{ amount: number; rate: number; fromCurrency: string; toCurrency: string }> {
    if (fromCurrency === toCurrency) {
      return { amount, rate: 1, fromCurrency, toCurrency };
    }

    const rates = await this.getRates();
    
    if (toCurrency === 'RUB' && rates.rates[fromCurrency]) {
      const rate = rates.rates[fromCurrency];
      const convertedAmount = (amount * rate.value) / rate.nominal;
      
      return {
        amount: Math.round(convertedAmount * 100) / 100,
        rate: rate.value / rate.nominal,
        fromCurrency,
        toCurrency
      };
    }

    throw new Error(`Конвертация ${fromCurrency} → ${toCurrency} не поддерживается`);
  }

  /**
   * 📊 Форматирование курса для отображения
   */
  formatRate(currency: string, rate: CurrencyRate): string {
    const trendIcon = rate.trend === 'up' ? ' ▲' : rate.trend === 'down' ? ' ▼' : '';
    const rateValue = (rate.value / rate.nominal).toFixed(4);
    
    return `${currency} = ${rateValue} ₽${trendIcon}`;
  }

  /**
   * 🧹 Очистка кеша
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Кеш курсов очищен');
  }
}

export default CurrencyService; 