# Playwright + Stealth: Решение проблемы парсинга защищенных маркетплейсов

## Проблема

Маркетплейсы (Ozon, Wildberries, AliExpress) используют мощную anti-bot защиту:
- **Cloudflare** - блокирует headless браузеры
- **Anti-bot системы** - определяют автоматизацию по множеству признаков
- **Rate limiting** - блокируют частые запросы с одного IP

## Реализованное решение

### 1. Установленные пакеты

```bash
npm install playwright-extra puppeteer-extra-plugin-stealth --legacy-peer-deps
```

### 2. Обновленный PlaywrightParserService

**Ключевые улучшения:**

✅ **Playwright-extra + Stealth плагин**
- Автоматическая подмена всех browser fingerprints
- Обход webdriver detection
- Эмуляция реального браузера

✅ **Anti-detection техники**
- Рандомизированные viewports (5 вариантов)
- Рандомизированные User-Agents (5 вариантов)
- Случайные задержки (имитация человека)
- Движения мыши (5-10 случайных перемещений)
- Реалистичный скроллинг (несколько шагов вверх-вниз)

✅ **Расширенные browser настройки**
- Geolocation (Москва)
- Timezone (Europe/Moscow)
- Locale (ru-RU)
- Battery API (эмуляция батареи)
- Chrome runtime объекты
- Реалистичные HTTP заголовки

### 3. Использование

```typescript
import { getPlaywrightParserService } from '@/lib/services/PlaywrightParserService'

const parser = getPlaywrightParserService()
const result = await parser.parseWithPlaywright('https://www.ozon.ru/product/...')

console.log(result.title) // Название товара
console.log(result.description) // Описание
console.log(result.imageUrl) // Изображение
```

## Текущие ограничения

### Почему Ozon все еще блокирует?

**Проблема:** Timeout при загрузке страницы
**Причины:**
1. Cloudflare Challenge требует выполнения JavaScript в течение 5-10 секунд
2. Headless режим все еще детектируется (даже со Stealth)
3. IP адрес может быть в blacklist (если много запросов)

## Альтернативные решения

### 🎯 Решение 1: Headless = "new" (Рекомендуется попробовать первым)

Chrome/Chromium имеют новый headless режим, который сложнее детектировать:

```typescript
browser = await chromium.launch({
  headless: 'new', // Вместо true
  // ... остальные настройки
})
```

**Преимущества:**
- Бесплатно
- Работает локально
- Лучше обходит детектирование

**Недостатки:**
- Не гарантирует 100% успех
- Все еще может быть заблокирован

### 🎯 Решение 2: Residential Proxies

Использовать прокси с реальными IP адресами:

```typescript
const context = await browser.newContext({
  proxy: {
    server: 'http://proxy.example.com:8080',
    username: 'user',
    password: 'pass'
  },
  // ... остальные настройки
})
```

**Сервисы:**
- **Bright Data** (ex-Luminati) - $500+/мес
- **SmartProxy** - $75+/мес
- **Oxylabs** - $300+/мес

**Преимущества:**
- Реальные IP адреса пользователей
- Высокий success rate (95%+)

**Недостатки:**
- Дорого
- Требует регистрации

### 🎯 Решение 3: ScraperAPI / Browserless.io (Рекомендуется)

Облачные сервисы для обхода anti-bot защиты:

#### ScraperAPI

```typescript
// Вместо прямого запроса к Ozon
const scrapedUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${encodeURIComponent(ozonUrl)}`

const response = await fetch(scrapedUrl)
const html = await response.text()

// Парсим HTML через HtmlParserService
const parser = getHtmlParserService()
const result = await parser.parseHtml(html, ozonUrl)
```

**Цены:**
- 1,000 запросов/мес - **$49**
- 10,000 запросов/мес - **$149**
- 100,000 запросов/мес - **$499**

**Преимущества:**
- Автоматический обход Cloudflare
- Резидентные прокси включены
- 99.9% uptime
- JavaScript rendering

#### Browserless.io

```typescript
const browserWSEndpoint = 'wss://chrome.browserless.io?token=YOUR_TOKEN'

const browser = await chromium.connect(browserWSEndpoint)
const page = await browser.newPage()
await page.goto(ozonUrl)
// ... парсинг
```

**Цены:**
- 6 часов/мес - **$29**
- 60 часов/мес - **$99**
- Unlimited - **$299**

**Преимущества:**
- Облачный Chrome без headless детектирования
- WebSocket подключение
- Auto-scaling
- Stealth режим встроен

### 🎯 Решение 4: Гибридный подход (Оптимальное)

**Стратегия:**

1. **Ozon/Wildberries** (сильная защита) → ScraperAPI
2. **AliExpress** (средняя защита) → Playwright + Stealth + Headless="new"
3. **Yandex Market/Sber** (слабая защита) → Обычный Playwright

```typescript
async parseWithPlaywright(url: string): Promise<ParsedProductMetadata> {
  const marketplace = this.detectMarketplace(url)

  // Для Ozon/WB используем ScraperAPI
  if (marketplace === 'ozon' || marketplace === 'wildberries') {
    return this.parseWithScraperAPI(url)
  }

  // Для остальных - Playwright + Stealth
  return this.parseWithStealthPlaywright(url)
}
```

### 🎯 Решение 5: Ручное копирование HTML (Текущий fallback)

Сохранить текущий UX с ручным копированием HTML для самых защищенных сайтов:

```typescript
try {
  // Пробуем автоматически
  result = await parser.parseWithPlaywright(url)
} catch (error) {
  // Показываем UI с инструкцией для копирования HTML
  showManualHtmlCopyInstructions()
}
```

## Рекомендуемый план действий

### Шаг 1: Попробовать headless="new" (5 минут)

```typescript
browser = await chromium.launch({
  headless: 'new', // Изменить на 'new'
  // ... остальное
})
```

### Шаг 2: Если не помогло - ScraperAPI (30 минут)

1. Регистрация: https://www.scraperapi.com/
2. Получить API ключ (1000 бесплатных запросов)
3. Добавить в `.env.local`:
   ```
   SCRAPER_API_KEY=your_key_here
   ```
4. Создать `ScraperApiService.ts`:
   ```typescript
   export class ScraperApiService {
     async fetchWithScraperApi(url: string): Promise<string> {
       const apiUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true`
       const response = await fetch(apiUrl)
       return response.text()
     }
   }
   ```

### Шаг 3: Интеграция с UrlParserService

```typescript
// Для Ozon - пробуем ScraperAPI
if (url.includes('ozon.ru') && process.env.SCRAPER_API_KEY) {
  const html = await scraperApiService.fetchWithScraperApi(url)
  return htmlParserService.parseHtml(html, url)
}

// Для остальных - Playwright + Stealth
return playwrightParserService.parseWithPlaywright(url)
```

## Тестирование

```bash
# Тест 1: Headless="new"
node scripts/test-playwright-parser.js

# Тест 2: ScraperAPI (после настройки)
node scripts/test-scraper-api.js
```

## Итоговая архитектура

```
┌─────────────────┐
│   User Input    │
│   (Product URL) │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  UrlParserService   │
│  Определяет стратегию│
└────────┬────────────┘
         │
         ├─────────────────┬─────────────────┬──────────────────┐
         │                 │                 │                  │
         ▼                 ▼                 ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ScraperAPI     │  │ Playwright   │  │ HTML Parser  │  │ Browser Ext  │
│ (Ozon/WB)      │  │ + Stealth    │  │ (Fallback)   │  │ (Manual)     │
│ $49/мес        │  │ (AliExpress) │  │ Бесплатно    │  │ Бесплатно    │
└────────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
         │                 │                 │                  │
         └─────────────────┴─────────────────┴──────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │ Parsed Metadata  │
                          │ (title, desc...) │
                          └──────────────────┘
```

## Выводы

1. **Stealth плагин установлен и работает** ✅
2. **Anti-detection техники реализованы** ✅
3. **Ozon все еще блокирует** ⚠️ (ожидаемо)
4. **Решение:** ScraperAPI ($49/мес) или headless="new" (бесплатно)

## Следующие шаги

- [ ] Попробовать `headless: 'new'`
- [ ] Протестировать на AliExpress (может работать)
- [ ] Зарегистрироваться на ScraperAPI (1000 бесплатных запросов)
- [ ] Реализовать гибридную стратегию
- [ ] Добавить graceful fallback на ручное копирование HTML
