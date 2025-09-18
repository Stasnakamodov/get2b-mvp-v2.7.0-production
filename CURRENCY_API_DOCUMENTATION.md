# 💱 Валютный API Get2B - Документация

*Интеграция с ЦБ РФ для получения актуальных курсов валют*

---

## 🎯 **Обзор**

Валютный API Get2B предоставляет актуальные курсы валют от Центробанка РФ с системой кеширования, fallback механизмами и интеграцией в AI-ассистент.

### **Основные особенности:**
- 📊 Реальные курсы от ЦБ РФ через `cbr-xml-daily.ru`
- 🕒 Кеширование на 1 час + принудительное обновление
- 🔄 Fallback на резервные курсы при недоступности API
- 💱 Конвертация валют с актуальными курсами
- 🤖 Интеграция в AI-ответы чат-бота
- 📈 Отслеживание трендов (▲▼)

---

## 🛠️ **Архитектура**

### **Компоненты:**
```
📁 lib/services/CurrencyService.ts    - Основной сервис
📁 app/api/currency/rates/route.ts    - REST API эндпоинты
📁 lib/utils/currency.ts              - Утилиты форматирования
📁 app/test-currency/page.tsx         - Тестовая страница
```

### **Поток данных:**
```
ЦБ РФ API → CurrencyService → Кеш → REST API → AI/Frontend
    ↓              ↓            ↓        ↓         ↓
cbr-xml-daily → Singleton → Memory → Routes → Responses
```

---

## 🔌 **API Эндпоинты**

### **GET /api/currency/rates**

Получение актуальных курсов валют Get2B.

**Параметры запроса:**
- `refresh=true` - принудительное обновление кеша
- `currencies=USD,EUR` - фильтр по валютам (опционально)

**Пример запроса:**
```bash
curl "http://localhost:3000/api/currency/rates?refresh=true&currencies=USD,EUR"
```

**Пример ответа:**
```json
{
  "date": "2025-07-23T11:30:00+03:00",
  "rates": {
    "USD": {
      "code": "USD",
      "name": "Доллар США", 
      "value": 78.0882,
      "nominal": 1,
      "previous": 78.3274,
      "trend": "down"
    },
    "EUR": {
      "code": "EUR",
      "name": "Евро",
      "value": 91.7782,
      "nominal": 1, 
      "previous": 91.5138,
      "trend": "up"
    }
  },
  "source": "cbr",
  "updated_at": "2025-07-22T21:31:01.499Z",
  "meta": {
    "cache_duration": "1 hour",
    "last_updated": "2025-07-22T21:31:01.499Z",
    "available_currencies": ["USD", "EUR", "CNY", "TRY", "AED"],
    "api_version": "1.0",
    "get2b_integration": true
  }
}
```

**HTTP заголовки:**
- `Cache-Control: public, max-age=3600`
- `X-Source: cbr|cache|fallback`
- `X-Updated: 2025-07-22T21:31:01.499Z`

### **POST /api/currency/rates**

Конвертация валют с актуальными курсами.

**Тело запроса:**
```json
{
  "amount": 1000,
  "from": "USD", 
  "to": "RUB"
}
```

**Пример ответа:**
```json
{
  "success": true,
  "conversion": {
    "amount": 78088.2,
    "rate": 78.0882,
    "fromCurrency": "USD",
    "toCurrency": "RUB"
  },
  "timestamp": "2025-07-22T21:31:02.961Z"
}
```

---

## 🔧 **CurrencyService API**

### **Основные методы:**

```typescript
// Получение экземпляра (Singleton)
const service = CurrencyService.getInstance();

// Получение курсов
const rates = await service.getRates(forceRefresh?: boolean);

// Конвертация валют
const result = await service.convert(1000, 'USD', 'RUB');

// Форматирование курса
const formatted = service.formatRate('USD', rate);

// Очистка кеша
service.clearCache();
```

### **Интерфейсы:**

```typescript
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
```

---

## 💰 **Валютные утилиты**

### **Форматирование:**

```typescript
import { formatCurrency, formatCurrencyWithFlag } from '@/lib/utils/currency';

// Базовое форматирование
formatCurrency(1000, 'USD'); // "$1,000.00"
formatCurrency(1000, 'RUB'); // "1 000,00 ₽"

// С флагом страны
formatCurrencyWithFlag(1000, 'USD'); // "🇺🇸 $1,000.00"
formatCurrencyWithFlag(1000, 'USD', true); // "🇺🇸 $1,000.00 Доллар США"
```

### **Валидация:**

```typescript
import { isValidCurrency, parseAmount } from '@/lib/utils/currency';

// Валидация валюты
isValidCurrency('USD'); // true
isValidCurrency('XYZ'); // false

// Парсинг суммы
parseAmount('1000 USD'); // { amount: 1000, currency: 'USD' }
parseAmount('1,000.50 $'); // { amount: 1000.5, currency: 'USD' }
```

### **Расчет комиссий Get2B:**

```typescript
import { calculateGet2BFee, getFeeTier } from '@/lib/utils/currency';

// Определение тира
const tier = getFeeTier(2000000, 'RUB'); // 'standard'

// Расчет комиссии
const feeCalc = calculateGet2BFee(1000000, 'RUB', 'standard');
// { fee: 100000, feePercent: 10, totalAmount: 1100000 }
```

---

## 🤖 **AI Интеграция**

### **Автоматические ответы:**

AI-ассистент автоматически использует актуальные курсы при запросах:
- "курсы валют", "какие курсы", "доллар евро"
- Показывает тренды с иконками ▲▼
- Указывает источник данных и время обновления

### **Примеры запросов к AI:**
```
Пользователь: "какие курсы валют сегодня?"
AI: "💱 Актуальные курсы валют от ЦБ РФ:
     🇺🇸 1 USD = 78.0882 ₽ ▼
     🇪🇺 1 EUR = 91.7782 ₽ ▲
     ..."
```

---

## 🧪 **Тестирование**

### **Тестовая страница:**
`/test-currency` - полнофункциональная демонстрация с:
- Визуализацией курсов с трендами
- Тестированием AI ответов
- Конвертацией валют
- Принудительным обновлением

### **Примеры cURL:**

```bash
# Получение всех курсов
curl "http://localhost:3000/api/currency/rates"

# Принудительное обновление
curl "http://localhost:3000/api/currency/rates?refresh=true"

# Фильтр валют
curl "http://localhost:3000/api/currency/rates?currencies=USD,EUR"

# Конвертация
curl -X POST "http://localhost:3000/api/currency/rates" \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"from":"USD","to":"RUB"}'

# AI ответ с курсами
curl -X POST "http://localhost:3000/api/chat/ai-response" \
  -H "Content-Type: application/json" \
  -d '{"message":"курсы валют","context":"general"}'
```

---

## 🔒 **Безопасность и производительность**

### **Ограничения:**
- Кеширование: 1 час (60 минут)
- Таймаут API: 5 секунд
- Поддерживаемые валюты: USD, EUR, CNY, TRY, AED
- Fallback при недоступности ЦБ РФ

### **Мониторинг:**
- Логирование источника данных (`source`: cbr/cache/fallback)
- Timestamp последнего обновления
- HTTP заголовки для отладки

### **Обработка ошибок:**
```typescript
try {
  const rates = await service.getRates();
} catch (error) {
  // Автоматический fallback на резервные курсы
  console.error('Ошибка получения курсов:', error);
}
```

---

## 🚀 **Roadmap**

### **Планируемые улучшения:**
- [ ] Поддержка дополнительных валют
- [ ] WebSocket уведомления о изменении курсов
- [ ] Исторические данные и графики
- [ ] Интеграция с проектами Get2B для автоматической конвертации
- [ ] Уведомления о резких изменениях курсов

### **Интеграция с Get2B:**
- [ ] Автоматическое определение курса при создании проекта
- [ ] Уведомления о выгодных курсах для закупок
- [ ] Аналитика валютных операций в профиле пользователя

---

**📞 Контакты:** Вопросы по API - @get2b-dev-team 