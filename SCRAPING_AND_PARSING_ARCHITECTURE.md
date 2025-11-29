# ДЕТАЛЬНЫЙ АНАЛИЗ СИСТЕМЫ СКРАПИНГА И ПАРСИНГА

## АРХИТЕКТУРА СИСТЕМЫ ПАРСИНГА

### 1. СЕРВИСЫ ПАРСИНГА (lib/services/)

#### PlaywrightParserService.ts (520 строк)
**Назначение:** Основной браузерный парсер для защищенных маркетплейсов
**Функциональность:**
- Использует Playwright (вместо Puppeteer - более модерен и надежен)
- Реализует anti-bot обход через:
  - Randomized viewport (1920x1080, 1366x768, 1536x864, 1440x900, 1280x720)
  - Подмена User-Agent (Chrome, Firefox)
  - Injection скрипты (webdriver override, fake plugins, chrome runtime)
  - Эмуляция человеческого поведения (скроллинг, клики, случайные движения мыши)

**Ключевые методы:**
- `parseWithPlaywright(url)` - основной метод парсинга
- `extractMetadata()` - извлечение через accessibility tree + Open Graph + DOM
- `validateImage()` - валидация изображений (минимум 400x400px, отсечка баннеров)
- `simulateHumanBehavior()` - имитация поведения человека
- `detectMarketplace()` - определение маркетплейса по URL

**Поддерживаемые маркетплейсы:**
- Wildberries (селекторы: `.slide__content img`, `.product-gallery img`)
- Ozon (селектор: `[data-widget="webGallery"] img`)
- AliExpress (селектор: `.images-view-item img`)
- Яндекс.Маркет (селектор: `[data-auto="productMediaGallery"] img`)
- СберМегаМаркет

**Недавние изменения (git commit 71d6f16):**
- Убран playwright-extra со Stealth плагином
- Используется обычный Playwright с встроенными настройками anti-detection
- Удалены лишние логи для production build
- Изменена приоритизация источников изображений: DOM галерея > OG

**Проблемы и решения:**
- ❌ Проблема: 90% товаров имели рекламные баннеры вместо фото (519x56px)
- ✅ Решение: Добавлена валидация изображений по размерам и пропорциям
- ✅ Решение: DOM изображения из галереи приоритизированы над OG метатегами

---

#### UrlParserService.ts (410 строк)
**Назначение:** Оркестратор парсинга с fallback стратегией
**Стратегия выбора метода:**
1. Защищенные маркетплейсы (ozon, wildberries, aliexpress, yandex):
   - Сначала пробует Playwright
   - Fallback на Puppeteer (BrowserParserService)
   - Fallback на ScraperAPI
2. Остальные сайты:
   - Сначала попытка Open Graph
   - Fallback на HTML парсинг через cheerio
   - Fallback на браузерный парсинг
   - Fallback на ScraperAPI

**Методы парсинга:**
- `parseProductUrl()` - основной метод с fallback стратегией
- `parseOpenGraph()` - извлечение OG метатегов
- `parseHtml()` - fetch + cheerio парсинг
- `parseWildberries()`, `parseOzon()`, `parseAliExpress()`, `parseYandexMarket()`, `parseGeneric()` - специфичные парсеры

**Определение маркетплейса:**
```
wildberries.ru → 'wildberries'
ozon.ru → 'ozon'
aliexpress → 'aliexpress'
market.yandex.ru → 'yandex'
sbermegamarket.ru → 'sber'
amazon → 'amazon'
```

**Результат:** ParsedProductMetadata объект с полями:
- title, description, price, currency, imageUrl, brand, category, marketplace, originalUrl

---

#### BrowserParserService.ts (243 строка)
**Назначение:** Fallback браузерный парсер с Puppeteer
**Функциональность:**
- Использует Puppeteer для обхода anti-bot
- Аналогичный набор anti-detection техник как Playwright
- Медленнее чем Playwright (используется как fallback)

**Ключевые методы:**
- `parseWithBrowser()` - запуск браузера и извлечение метаданных
- `isPuppeteerAvailable()` - проверка доступности

---

#### ScraperApiService.ts (245 строк)
**Назначение:** Облачный сервис для обхода Cloudflare/anti-bot
**Фича:**
- Использует реальные браузеры в облаке
- Residential прокси (IP настоящих людей)
- Обход Cloudflare challenges и CAPTCHA

**Параметры запроса:**
```
- render: true (JS rendering)
- country_code: 'ru' (Российский IP)
- premium: true/false (Premium residential прокси для сложных маркетплейсов)
- session_number: number (Сохранение cookies)
```

**Стоимость (2025):**
- JS Rendering: 5 кредитов
- Geotargeting (RU): +10 кредитов
- Premium residential: +10 кредитов
- **Итого за запрос Ozon/WB: 25 кредитов (~$0.012 или 1.08₽)**

**Лимиты:**
- Free: 1,000 кредитов/мес (40 запросов Ozon)
- Trial: 5,000 кредитов (200 запросов)
- Hobby: $49/мес (100K кредитов = 4,000 запросов)

**Методы:**
- `fetchPage()` - получить HTML через ScraperAPI
- `checkAccountStatus()` - проверить баланс кредитов
- `getSessionStats()` - статистика использования
- `estimateCredits()` - расчет стоимости запроса

---

#### HtmlParserService.ts (142 строки)
**Назначение:** Парсинг HTML кода предоставленного пользователем
**Обходит защиту потому что:**
- Пользователь сам открывает страницу в браузере
- Копирует HTML код (View Source)
- Система парсит готовый HTML без запросов к маркетплейсу

**Методы:**
- `parseHtmlCode()` - парсинг HTML через cheerio
- `detectMarketplaceFromHtml()` - определение маркетплейса из контента
- `isValidHtml()` - валидация HTML (минимум 100 символов, наличие тегов)

---

#### ClaudeWebFetchService.ts (150+ строк)
**Назначение:** AI парсинг через Claude Web Fetch API
**Функциональность:**
- Использует встроенный Web Fetch инструмент Claude
- AI анализирует контент и извлекает информацию
- Работает с простыми сайтами без Cloudflare

**Ограничения:**
- НЕ обходит Cloudflare/anti-bot
- Нужен fallback на ScraperAPI для защищенных сайтов

**Методы:**
- `parseProductUrl()` - парсинг URL через Claude
- `analyzeHtmlContent()` - анализ HTML контента
- `parseClaudeResponse()` - обработка ответа Claude

---

### 2. ПОДДЕРЖИВАЕМЫЕ МАРКЕТПЛЕЙСЫ

| Маркетплейс | Защита | Парсер | Версия |
|---|---|---|---|
| **Wildberries** | Cloudflare + anti-bot | Playwright/ScraperAPI | ✅ |
| **Ozon** | Cloudflare | Playwright/ScraperAPI | ✅ |
| **AliExpress** | Защита от ботов | Playwright/ScraperAPI | ✅ |
| **Яндекс.Маркет** | Слабая | Playwright/Claude | ✅ |
| **СберМегаМаркет** | Слабая | HTML парсинг | ✅ |
| **Amazon** | Cloudflare | Playwright/ScraperAPI | ✅ (fallback) |
| **Остальные сайты** | Нет | HTTP + cheerio | ✅ |

---

## API ENDPOINTS ДЛЯ ИМПОРТА

### 1. POST /api/catalog/products/parse-and-import
**Назначение:** Одношаговый импорт - парсит товар и сразу сохраняет
**Поток:**
1. Парсинг через UrlParserService (Playwright → Puppeteer → ScraperAPI)
2. Скачивание изображения из парсированного URL
3. Загрузка изображения в Supabase Storage
4. Сохранение в catalog_verified_products

**Request:**
```json
{
  "url": "https://market.yandex.ru/...",
  "category": "Электроника",  // опционально
  "supplier_id": "uuid"  // опционально
}
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "Товар",
    "category": "Электроника",
    "price": 1000,
    "images": ["https://supabase.co/..."]
  },
  "metadata": {
    "title": "...",
    "imageUrl": "...",
    "marketplace": "yandex"
  }
}
```

**Логика:** 
- Автоматически создает default поставщика "Импортированные товары" если supplier_id не указан
- Трансллитерирует имя файла (кириллица → латиница)
- Загружает изображение в папку `imported/`

---

### 2. POST /api/catalog/products/import-from-url
**Назначение:** Импорт уже спарсенного товара
**Поток:**
1. Скачивание изображения
2. Загрузка в Supabase Storage
3. Сохранение в БД

**Request:**
```json
{
  "metadata": {
    "title": "Товар",
    "description": "...",
    "imageUrl": "https://...",
    "price": "1000",
    "currency": "RUB",
    "marketplace": "yandex",
    "originalUrl": "https://..."
  },
  "analysis": {
    "brand": "Apple",
    "category": "Электроника",
    "keywords": ["смартфон", "iPhone"]
  },
  "supplier_id": "uuid"  // опционально
}
```

---

### 3. POST /api/catalog/search-by-url
**Назначение:** Поиск товаров в каталоге по URL или HTML
**Режимы:**
1. URL парсинг (Claude Web Fetch → Playwright)
2. HTML парсинг (пользователь копирует HTML код)
3. Поиск в БД по extracted keywords

**Request:**
```json
{
  "url": "https://market.yandex.ru/...",  // или
  "html": "<html>...</html>"
}
```

**Response:**
```json
{
  "success": true,
  "metadata": { /* extracted from URL/HTML */ },
  "analysis": {
    "brand": "Apple",
    "category": "Электроника",
    "keywords": [...]
  },
  "products": [ /* matching products from DB */ ],
  "productsCount": 3,
  "searchTerms": [...]
}
```

---

## СКРИПТЫ ИМПОРТА И ТЕСТИРОВАНИЯ

### Тестовые скрипты (в scripts/test-*.js):

1. **test-scraper-api.js** (234 строки)
   - Тестирует парсинг Ozon, Wildberries, Яндекс.Маркет через ScraperAPI
   - Проверяет успешность, подсчитывает кредиты
   - Валидирует что Cloudflare пройден

2. **test-playwright-parser.js**
   - Тестирует Playwright парсер на одном товаре

3. **test-import-simple.js** (97 строк)
   - Импортирует тестовый товар через API

4. **test-fixed-parser.js**
   - Проверяет что исправленный парсер загружает нужные изображения

### Скрипты импорта в production (в scripts/):

1. **batch-import-30-products.js** (270+ строк)
   - Импортирует 30 товаров из Яндекс.Маркета в категорию ТЕСТОВАЯ
   - Использует parse-and-import API endpoint
   - Товары: смартфоны, ноутбуки, наушники, планшеты, часы, телевизоры

2. **reimport-9-products-with-correct-images.js**
   - Переимпортирует 9 товаров с исправленным парсером
   - Удаляет старые товары с баннерами
   - Проверяет что новые изображения корректны

3. **import-fresh-products.js**
   - Импортирует новые товары с очисткой старых

4. **create-test-products-manual.js**
   - Ручное создание тестовых товаров в БД

---

## ИНТЕГРАЦИЯ С БАЗОЙ ДАННЫХ

### Основные таблицы:

#### catalog_verified_products
```sql
CREATE TABLE catalog_verified_products (
  id UUID PRIMARY KEY,
  supplier_id UUID REFERENCES catalog_verified_suppliers(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,           -- категория (например "Электроника")
  subcategory_id UUID,     -- ссылка на подкатегорию
  price NUMERIC,
  currency TEXT,
  images JSONB,            -- массив URL изображений
  specifications JSONB,    -- доп. параметры (brand, marketplace, originalUrl)
  is_active BOOLEAN,
  in_stock BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### catalog_verified_suppliers
```sql
CREATE TABLE catalog_verified_suppliers (
  id UUID PRIMARY KEY,
  name TEXT,
  company_name TEXT,
  category TEXT,
  description TEXT,
  country TEXT,
  city TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  is_verified BOOLEAN,
  is_active BOOLEAN
);
```

#### catalog_subcategories
```sql
CREATE TABLE catalog_subcategories (
  id UUID PRIMARY KEY,
  name TEXT,
  category TEXT,
  -- ... другие поля
);
```

---

### RPC функция для получения товаров

#### get_products_by_category
**Назначение:** Получить товары по категории или подкатегории с фильтрацией

**Параметры:**
- `category_name` - название категории или подкатегории
- `user_id_param` - фильтр по пользователю
- `search_query` - текстовый поиск
- `limit_param` - лимит (по умолчанию 50)
- `offset_param` - смещение (по умолчанию 0)

**Недавние исправления (migrate 20251127):**
- ✅ Фиксирован конфликт алиасов CTE (all_products)
- ✅ Добавлена поддержка фильтрации по подкатегориям через LEFT JOIN
- ✅ Добавлено поле `images` в SELECT

**Процесс импорта изображений:**
1. Парсер получает URL изображения с маркетплейса
2. Скачивается blob через fetch()
3. Загружается в Supabase Storage в папку `imported/`
4. Получается публичный URL через getPublicUrl()
5. URL сохраняется в поле images (JSONB array)

**Трансформация имена файла:**
- Кириллица → латиница (транслитерация)
- Спецсимволы → подчеркивания
- Формат: `imported/{timestamp}_{sanitized_name}.{ext}`
- Пример: `imported/1764245612544_smartfon_apple_iphone_15.jpeg`

---

## ВНЕШНИЕ СЕРВИСЫ И КОНФИГУРАЦИЯ

### 1. ScraperAPI (scraperapi.com)
**API Key:** Читается из `SCRAPER_API_KEY` в .env
**Эндпоинт:** `https://api.scraperapi.com`
**Использование:** Fallback для защищенных маркетплейсов

### 2. Claude API (Anthropic)
**API Key:** Читается из `ANTHROPIC_API_KEY` в .env
**Model:** `claude-haiku-4-20250514`
**Tools:** web_fetch_20250910
**Использование:** Парсинг простых сайтов (fallback перед ScraperAPI)

### 3. Supabase Storage
**Bucket:** `product-images`
**Папка:** `imported/` для импортированных товаров
**Policy:** Публичный доступ на чтение
**Использование:** Хранение скачанных изображений товаров

### 4. Supabase Database
**Таблицы:** catalog_verified_products, catalog_verified_suppliers, catalog_subcategories
**RPC функции:** get_products_by_category

---

## ПРОБЛЕМЫ И РЕШЕНИЯ

### Проблема #1: Рекламные баннеры вместо фотографий товаров

**Симптомы:**
- 90% товаров (9 из 10) содержали одинаковый рекламный баннер
- Размер: 519 x 56 пикселей
- MD5 hash: `7eba1736f479c2087701dbbbbed08e5a`
- Содержимое: Баннер Wildberries "Скидки до 50%"

**Причина:**
- Парсер брал ПЕРВЫЙ Open Graph image (`og:image`)
- Wildberries специально ставит рекламный баннер в `og:image` для социальных сетей
- Настоящие фотографии товара находятся в галерее товара (DOM)

**Решение:**
- Добавлена функция `validateImage()` в PlaywrightParserService
- Проверка минимального размера: 400x400px
- Проверка пропорций: отсечка баннеров (не больше 3:1)
- Изменен приоритет источников: DOM (галерея) > OG метатеги

**Статус:** ✅ РЕШЕНО

---

### Проблема #2: RPC функция возвращала только 1 товар вместо 33

**Симптомы:**
- При клике на подкатегорию "Тестовые товары" показывается 1 товар вместо 32

**Причина:**
- Конфликт алиасов в SQL: CTE `all_products` и алиас подзапроса `all_products`
- Это вызывает неправильное поведение функции row_to_json()

**Решение:**
- Изменен алиас подзапроса на `p`
- Добавлена поддержка фильтрации по подкатегориям через LEFT JOIN
- Миграция: `supabase/migrations/20251127_fix_rpc_alias_conflict.sql`

**Статус:** ✅ РЕШЕНО

---

### Проблема #3: Отсутствие поддержки подкатегорий в RPC

**Причина:**
- RPC функция только фильтровала по полю `category`
- 31 импортированный товар имели `subcategory_id = NULL`

**Решение:**
- Добавлен LEFT JOIN с `catalog_subcategories`
- Фильтрация проверяет оба условия: `p.category` И `sub.name`
- SQL миграция обновила всем товарам `subcategory_id`

**Статус:** ✅ РЕШЕНО

---

## НЕДАВНИЕ ИЗМЕНЕНИЯ

### Git commit 71d6f16: "fix: Production build fixes and cleanup"

**Измененные файлы:**
- lib/services/PlaywrightParserService.ts
- lib/services/UrlParserService.ts
- next.config.js
- scripts/test-scraper-api.js

**Изменения в PlaywrightParserService:**
- ❌ Убран playwright-extra со Stealth плагином
- ✅ Используется обычный Playwright с встроенными anti-detection техниками
- ✅ Изменен приоритет источников изображений

**Изменения в UrlParserService:**
- ❌ Удалены лишние логи для production
- ✅ Обновлена фолбек стратегия

**Изменения в next.config.js:**
- ✅ Оптимизация для production build
- ✅ Отключены строгие проверки в dev режиме

---

## СВОДКА АРХИТЕКТУРЫ

```
┌─────────────────────────────────────────────────────┐
│              API Endpoints                          │
├─────────────────────────────────────────────────────┤
│ POST /api/catalog/products/parse-and-import         │
│ POST /api/catalog/products/import-from-url          │
│ POST /api/catalog/search-by-url                     │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│          UrlParserService (оркестратор)            │
├─────────────────────────────────────────────────────┤
│  ├─ Определяет маркетплейс                         │
│  ├─ Выбирает метод парсинга                        │
│  └─ Реализует fallback стратегию                   │
└────┬────┬────┬────┬────┬──────────────────────────┘
     │    │    │    │    │
     │    │    │    │    └─ ScraperAPI
     │    │    │    └─ ClaudeWebFetch
     │    │    └─ BrowserParserService (Puppeteer)
     │    └─ HtmlParserService (Cheerio)
     └─ PlaywrightParserService (Playwright)
              │
     ┌────────▼──────────┐
     │  Маркетплейсы:    │
     ├──────────────────┤
     │ • Wildberries    │
     │ • Ozon           │
     │ • AliExpress     │
     │ • Яндекс.Маркет  │
     │ • СберМегаМаркет │
     │ • Amazon         │
     │ • Прочие сайты   │
     └────────┬─────────┘
              │
     ┌────────▼──────────────────┐
     │  Извлеченные метаданные:  │
     ├──────────────────────────┤
     │ • title                  │
     │ • description            │
     │ • price / currency       │
     │ • imageUrl               │
     │ • brand / category       │
     │ • marketplace            │
     │ • originalUrl            │
     └────────┬──────────────────┘
              │
     ┌────────▼──────────────────────────┐
     │  Обработка изображения:           │
     ├────────────────────────────────────┤
     │ 1. Скачивание из URL               │
     │ 2. Валидация (400x400, пропорции) │
     │ 3. Upload в Supabase Storage       │
     │ 4. Получение публичного URL        │
     └────────┬───────────────────────────┘
              │
     ┌────────▼──────────────────────────┐
     │  Сохранение в БД:                 │
     ├────────────────────────────────────┤
     │ catalog_verified_products          │
     │ ├─ id, name, description           │
     │ ├─ price, currency                 │
     │ ├─ images[] (JSONB)                │
     │ ├─ specifications (JSONB)          │
     │ ├─ category, subcategory_id        │
     │ └─ supplier_id, is_active          │
     └────────┬───────────────────────────┘
              │
     ┌────────▼──────────────────────────┐
     │  RPC функция:                     │
     ├────────────────────────────────────┤
     │ get_products_by_category()         │
     │ • Фильтрация по category           │
     │ • Фильтрация по subcategory        │
     │ • Полнотекстовый поиск            │
     │ • Pagination (limit/offset)        │
     └────────────────────────────────────┘
```

---

## РЕКОМЕНДАЦИИ

### Для улучшения парсинга:

1. **Добавить более специфичные селекторы для каждого маркетплейса**
   - Wildberries имеет свою структуру HTML
   - Ozon использует data-widget аттрибуты
   - Нужны юнит-тесты для каждого маркетплейса

2. **Оптимизировать использование ScraperAPI**
   - Текущий fallback на ScraperAPI слишком дорогой (25 кредитов за запрос)
   - Рассмотреть использование более дешевых способов или кэширование

3. **Добавить мониторинг успешности парсинга**
   - Логировать какой метод успешно использовался
   - Отслеживать время выполнения каждого метода
   - Alerting при частых failures

4. **Кэширование результатов парсинга**
   - Если товар из одного URL уже парсился - переиспользовать результат
   - Кэш с TTL (например 7 дней)

### Для улучшения импорта:

1. **Batch import улучшения**
   - Добавить progress tracking
   - Добавить retry механизм при failures
   - Параллельный импорт (с ограничениями)

2. **Валидация товаров перед сохранением**
   - Проверка на дубликаты по названию + бренду
   - Проверка что цена корректна
   - Проверка что изображение загружено

3. **Систематизация категорий**
   - Автоматическое определение категории через AI
   - Маппинг категорий маркетплейсов к стандартным
