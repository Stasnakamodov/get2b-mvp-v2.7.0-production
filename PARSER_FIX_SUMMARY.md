# ✅ ПАРСЕР ИСПРАВЛЕН - ГОТОВ К ПЕРЕИМПОРТУ

## Дата: 2025-11-27 18:15

---

## ЧТО БЫЛО ИСПРАВЛЕНО

### 1. Расширен поиск изображений в галереях
**Файл:** `lib/services/PlaywrightParserService.ts` (строки 231-249)

Добавлена функция `getProductImage()` которая ищет изображения в галереях товаров:

```typescript
// Wildberries
const wbGallery = document.querySelector('.slide__content img')?.getAttribute('src')
const wbGallery2 = document.querySelector('.product-gallery img')?.getAttribute('src')

// Ozon
const ozonGallery = document.querySelector('[data-widget="webGallery"] img')?.getAttribute('src')

// Яндекс.Маркет
const yandexGallery = document.querySelector('[data-auto="productMediaGallery"] img')?.getAttribute('src')

// AliExpress
const aliGallery = document.querySelector('.images-view-item img')?.getAttribute('src')
```

### 2. Изменен приоритет источников изображений
**До:** `og:image` (баннер) → DOM (галерея)
**После:** DOM (галерея) → `og:image`

**Строки 275-295:**
```typescript
// Приоритет 1: DOM изображение (из галереи товара) ✅
if (domData.imageUrl) {
  const isValid = await this.validateImage(page, domData.imageUrl)
  if (isValid) validatedImageUrl = domData.imageUrl
}

// Приоритет 2: og:image (только если DOM не подошло)
if (!validatedImageUrl && ogData.imageUrl) {
  const isValid = await this.validateImage(page, ogData.imageUrl)
  if (isValid) validatedImageUrl = ogData.imageUrl
}
```

### 3. Добавлена валидация изображений
**Строки 361-424:** Метод `validateImage()`

**Правила валидации:**
- ❌ Отклоняет изображения < 400x400 пикселей (логотипы, иконки)
- ❌ Отклоняет пропорции > 3:1 или < 1:3 (баннеры типа 519x56px)
- ✅ Пропускает только реальные фотографии товаров

```typescript
const MIN_SIZE = 400
const MAX_ASPECT_RATIO = 3

if (width < MIN_SIZE || height < MIN_SIZE) return false
if (aspectRatio > MAX_ASPECT_RATIO || aspectRatio < (1 / MAX_ASPECT_RATIO)) return false
```

---

## ПРОБЛЕМА КОТОРУЮ РЕШИЛИ

### ДО ИСПРАВЛЕНИЯ:

**90% товаров (9 из 10)** содержали ИДЕНТИЧНЫЙ рекламный баннер:
- Размер: **519 x 56 пикселей**
- Содержимое: Баннер Wildberries "Скидки до 50%"
- MD5: `7eba1736f479c2087701dbbbbed08e5a`

### ПОСЛЕ ИСПРАВЛЕНИЯ:

Парсер теперь:
1. ✅ Ищет изображения в галерее товара (не в meta тегах)
2. ✅ Проверяет размеры (минимум 400x400px)
3. ✅ Проверяет пропорции (отсекает баннеры)
4. ✅ Загружает РЕАЛЬНЫЕ фотографии товаров

---

## СОЗДАННЫЕ СКРИПТЫ

### 1. Тест исправленного парсера
**Файл:** `scripts/test-fixed-parser.js`

Тестирует парсер на одном товаре Wildberries, проверяет что изображение:
- Загружено в Storage
- Имеет правильный размер (> 30 KB)

### 2. Скрипт переимпорта 9 товаров
**Файл:** `scripts/reimport-9-products-with-correct-images.js`

Автоматически:
1. Удаляет дубликат iPhone
2. Удаляет 9 товаров с баннерами
3. Переимпортирует их с правильными изображениями
4. Проверяет что новые изображения корректны

---

## КАК ЗАПУСТИТЬ ПЕРЕИМПОРТ

### Подготовка:

1. **Убедитесь что dev сервер запущен:**
   ```bash
   npm run dev
   ```

2. **Установите переменные окружения:**
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="ваш_ключ"
   export SCRAPER_API_KEY="105ded8cfad1c108ac9fa7987ce0b03c"
   ```

### Запуск:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg" \
SCRAPER_API_KEY="105ded8cfad1c108ac9fa7987ce0b03c" \
node scripts/reimport-9-products-with-correct-images.js
```

### Процесс:

Скрипт будет:
1. Удалять по одному старому товару
2. Парсить страницу через ScraperAPI
3. Импортировать с исправленным парсером
4. Проверять что изображение корректное
5. Делать паузу 5 секунд между товарами

**Общее время:** ~5-7 минут для 9 товаров

---

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После переимпорта:

### В каталоге должно быть:

- ✅ **32 товара** с реальными фотографиями
- ✅ Размеры изображений > 400x400px
- ✅ Все изображения в Supabase Storage
- ❌ Баннеры удалены

### Примеры правильных товаров:

1. **Honor X8a** - фото смартфона
2. **Acer Aspire 3** - фото ноутбука
3. **Samsung Galaxy S23** - фото смартфона
4. **Lenovo IdeaPad 3** - фото ноутбука
5. **MSI Modern 15** - фото ноутбука
6. **Samsung Galaxy Buds2 Pro** - фото наушников
7. **JBL Tune 520BT** - фото наушников
8. **Колье ОптимаБизнес** - фото украшения
9. **Масло эфирное Розмарин** - фото бутылочки

---

## ПРОБЛЕМНЫЕ ТОВАРЫ (БУДУТ УДАЛЕНЫ)

### ID товаров с баннерами:

```javascript
'839338bc-948e-4b55-8f11-02c4c89295c4', // Honor X8a
'aa1b1a5a-6395-4d94-83ec-b7abeead3ff6', // Acer Aspire 3
'3252fdee-3fc3-4543-91e6-99c283739603', // Samsung Galaxy S23
'cf1dcc3c-6289-4a35-a957-26e91fc4048d', // Lenovo IdeaPad 3
'1c54babc-fb62-4b1e-8343-7e6ecd701049', // MSI Modern 15
'c858910a-364c-45b1-bc4a-e2a8bb22480a', // Samsung Galaxy Buds2 Pro
'310a29a0-8259-456d-919a-dd8def18b6d1', // JBL Tune 520BT
'c12e4da5-10d7-4fa3-b5c2-a49895c371d7', // Колье ОптимаБизнес
'5f57a371-29d5-4d53-89a7-098b10c0d69c'  // Масло эфирное Розмарин
```

### ID дубликата (будет удален):

```javascript
'9057f171-d62c-4c4e-a386-85fba2c37ca2' // iPhone 15 Pro Max (дубликат)
```

---

## ПОСЛЕ ПЕРЕИМПОРТА

### Проверьте в UI:

1. Откройте категорию "Тестовые товары"
2. Должны быть 32 товара
3. Все товары должны иметь РЕАЛЬНЫЕ фотографии (не баннеры!)
4. Изображения должны загружаться быстро

### Проверьте в базе:

```sql
SELECT
  name,
  CASE
    WHEN images::text LIKE '%supabase%' THEN 'Storage'
    ELSE 'External'
  END as image_source
FROM catalog_verified_products
WHERE category = 'ТЕСТОВАЯ'
ORDER BY name;
```

**Результат:** Все 32 товара должны иметь `image_source = 'Storage'`

---

## ФАЙЛЫ ОТЧЕТОВ

Агент создал детальные отчеты:
- `IMAGE_STORAGE_CRITICAL_ISSUE_REPORT.md` - полный технический отчет о проблеме
- `IMAGE_PARSING_FIX_SOLUTION.md` - решение с примерами кода
- `IMAGE_ISSUE_SUMMARY.txt` - краткая визуальная сводка

---

## ИТОГО

✅ Парсер исправлен
✅ Валидация добавлена
✅ Скрипты готовы
⏳ Готов к переимпорту

**СЛЕДУЮЩИЙ ШАГ:** Запустить `reimport-9-products-with-correct-images.js`
