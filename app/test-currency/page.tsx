'use client';

import { useState, useEffect } from 'react';

interface CurrencyRate {
  code: string;
  name: string;
  value: number;
  nominal: number;
  previous?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface CurrencyRatesResponse {
  date: string;
  rates: Record<string, CurrencyRate>;
  source: 'cbr' | 'cache' | 'fallback';
  updated_at: string;
}

export default function TestCurrencyPage() {
  const [rates, setRates] = useState<CurrencyRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [conversionResult, setConversionResult] = useState<any>(null);

  // Загрузка курсов валют
  const fetchRates = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const url = `/api/currency/rates${forceRefresh ? '?refresh=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setRates(data);
      console.log('📊 Получены курсы:', data);
    } catch (error) {
      console.error('❌ Ошибка получения курсов:', error);
    } finally {
      setLoading(false);
    }
  };

  // Тест AI ответа с курсами
  const testAIResponse = async () => {
    try {
      const response = await fetch('/api/chat/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'какие курсы валют?',
          context: 'general'
        })
      });
      
      const data = await response.json();
      setAiResponse(data.content || JSON.stringify(data, null, 2));
      console.log('🤖 AI ответ:', data);
    } catch (error) {
      console.error('❌ Ошибка AI ответа:', error);
      setAiResponse('Ошибка получения AI ответа');
    }
  };

  // Тест конвертации валют
  const testConversion = async () => {
    try {
      const response = await fetch('/api/currency/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1000,
          from: 'USD',
          to: 'RUB'
        })
      });
      
      const data = await response.json();
      setConversionResult(data.conversion);
      console.log('💱 Конвертация:', data);
    } catch (error) {
      console.error('❌ Ошибка конвертации:', error);
    }
  };

  // Загружаем курсы при монтировании
  useEffect(() => {
    fetchRates();
  }, []);

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '▲';
      case 'down': return '▼';
      default: return '→';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💱 Тестирование валютного API
          </h1>
          <p className="text-gray-600">
            Интеграция с ЦБ РФ для платформы Get2B
          </p>
        </div>

        {/* Кнопки управления */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => fetchRates(false)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳ Загрузка...' : '📊 Получить курсы'}
          </button>
          
          <button
            onClick={() => fetchRates(true)}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            🔄 Принудительное обновление
          </button>

          <button
            onClick={testAIResponse}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            🤖 Тест AI ответа
          </button>

          <button
            onClick={testConversion}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            💱 Тест конвертации
          </button>
        </div>

        {/* Курсы валют */}
        {rates && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                📈 Курсы валют ЦБ РФ
              </h2>
              <div className="text-right">
                <div className="text-sm text-gray-500">Источник: {rates.source}</div>
                <div className="text-sm text-gray-500">Дата: {rates.date}</div>
                <div className="text-sm text-gray-500">
                  Обновлено: {new Date(rates.updated_at).toLocaleString('ru-RU')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(rates.rates).map(([code, rate]) => {
                const formattedRate = (rate.value / rate.nominal).toFixed(4);
                const currencyFlags: Record<string, string> = {
                  'USD': '🇺🇸', 'EUR': '🇪🇺', 'CNY': '🇨🇳', 'TRY': '🇹🇷', 'AED': '🇦🇪'
                };
                
                return (
                  <div key={code} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{currencyFlags[code] || '💱'}</span>
                        <div>
                          <div className="font-bold text-lg">{code}</div>
                          <div className="text-sm text-gray-600 truncate">
                            {rate.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold">
                          {formattedRate} ₽
                        </div>
                        <div className={`text-sm ${getTrendColor(rate.trend)}`}>
                          {getTrendIcon(rate.trend)} 
                          {rate.previous ? 
                            ((rate.value / rate.nominal - rate.previous / rate.nominal) * 100).toFixed(2) + '%'
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Ответ */}
        {aiResponse && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🤖 AI Ответ с курсами валют
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
            </div>
          </div>
        )}

        {/* Результат конвертации */}
        {conversionResult && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              💱 Результат конвертации
            </h2>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-lg">
                <strong>1000 USD</strong> = <strong className="text-green-600">
                  {conversionResult.amount?.toLocaleString('ru-RU')} ₽
                </strong>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Курс: 1 USD = {conversionResult.rate?.toFixed(4)} ₽
              </div>
            </div>
          </div>
        )}

        {/* Статистика API */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 Статистика интеграции
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-blue-600 font-bold">Источник данных</div>
              <div className="text-lg">cbr-xml-daily.ru</div>
              <div className="text-sm text-gray-600">+ fallback ЦБ РФ</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-green-600 font-bold">Кеширование</div>
              <div className="text-lg">1 час</div>
              <div className="text-sm text-gray-600">с принудительным обновлением</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-purple-600 font-bold">Валюты Get2B</div>
              <div className="text-lg">5 валют</div>
              <div className="text-sm text-gray-600">USD, EUR, CNY, TRY, AED</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
} 