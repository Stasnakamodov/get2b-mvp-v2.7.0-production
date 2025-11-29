# 🔴 ПРОБЛЕМА: Картинки товаров не отображаются в UI

## Контекст

Работаем над системой импорта товаров в каталог с парсингом маркетплейсов.

**Что было сделано:**
1. ✅ Создан API `/api/catalog/products/import-from-url` для импорта товаров
2. ✅ API скачивает картинки с внешних URL и загружает в Supabase Storage
3. ✅ Картинки успешно загружаются в бакет `product-images`
4. ✅ Товары сохраняются в БД с публичными URL из Storage
5. ✅ Товары отображаются в UI каталога

**Но есть проблема:**
❌ Картинки НЕ загружаются в браузере - показывается серая иконка placeholder

---

## Текущее состояние

### 1. Тестовый товар в БД
```
ID: 4f7dd6a8-1302-42b0-b362-73abeff07511
Название: Смартфон Apple iPhone 15 Pro Max 256GB
Категория: ТЕСТОВАЯ
Подкатегория ID: 731e04c6-875d-492f-a460-e8e248c75e5b
Картинка в БД: https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg
```

### 2. Файл в Storage
```
Бакет: product-images
Путь: imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg
Размер: 1.1 MB
Загружен: ✅ Успешно
```

### 3. UI показывает
- Товар виден в каталоге ✅
- Название, цена, описание - всё ОК ✅
- Картинка НЕ загружается ❌ (серая иконка placeholder)

---

## Возможные причины

### 1. CORS политика Storage
Supabase Storage может блокировать доступ с localhost

### 2. Публичный доступ к бакету
Бакет `product-images` может не иметь публичного доступа

### 3. RLS (Row Level Security) политики
Политики доступа в Supabase могут блокировать анонимный доступ

### 4. CSP (Content Security Policy)
Next.js может блокировать загрузку с Supabase домена

### 5. Неправильный URL
URL может быть сформирован неправильно

---

## Что нужно исправить

### ЗАДАЧА 1: Проверить доступность картинки
```bash
# Попробуй открыть URL напрямую в браузере
https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg

# Или через curl
curl -I "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg"
```

**Ожидаемый результат:** HTTP 200 и изображение загружается

**Если 404 или 403:** Проблема с публичным доступом к бакету

---

### ЗАДАЧА 2: Настроить публичный доступ к бакету

В Supabase Dashboard:

1. Storage → Buckets → `product-images`
2. Settings → Public bucket: **ON** ✅
3. Policies → Добавить политику:
   ```sql
   -- Политика для публичного чтения
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'product-images');
   ```

---

### ЗАДАЧА 3: Проверить CORS в next.config.js

Файл: `/Users/user/Desktop/godplisgomvp-forvercel/next.config.js`

Добавить Supabase домен в `remotePatterns`:

```javascript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'ejkhdhexkadecpbjjmsz.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
    // ... остальные
  ]
}
```

---

### ЗАДАЧА 4: Проверить ProductCard компонент

Файл: `/Users/user/Desktop/godplisgomvp-forvercel/app/dashboard/catalog/components/ProductCard.tsx`

Строка 54-64: Компонент использует `<img>` тег (НЕ Next.js `<Image>`), поэтому `remotePatterns` не применяется.

**Проверь в консоли браузера:**
- Откройте DevTools (F12)
- Вкладка Console
- Найдите ошибки вида:
  ```
  ❌ ОШИБКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ТОВАРА ...
  ```

Это покажет реальную причину (CORS, 404, 403, etc.)

---

### ЗАДАЧА 5: Временный workaround

Если нужно быстро проверить, что всё работает, можно использовать Vercel Blob Storage вместо Supabase Storage:

1. Установить:
   ```bash
   npm install @vercel/blob
   ```

2. Обновить код в `import-from-url/route.ts`:
   ```typescript
   import { put } from '@vercel/blob'

   async function downloadAndUploadImage(imageUrl: string, productName: string) {
     const response = await fetch(imageUrl)
     const blob = await response.blob()

     const fileName = `imported/${Date.now()}_${sanitizedName}.jpeg`
     const blobData = await put(fileName, blob, {
       access: 'public',
       addRandomSuffix: false
     })

     return blobData.url // Vercel Blob URL (точно работает)
   }
   ```

---

## Файлы для проверки

1. **API импорта:**
   `/Users/user/Desktop/godplisgomvp-forvercel/app/api/catalog/products/import-from-url/route.ts`

2. **ProductCard компонент:**
   `/Users/user/Desktop/godplisgomvp-forvercel/app/dashboard/catalog/components/ProductCard.tsx`

3. **Next.js конфиг:**
   `/Users/user/Desktop/godplisgomvp-forvercel/next.config.js`

4. **Тестовый скрипт:**
   `/Users/user/Desktop/godplisgomvp-forvercel/scripts/test-import-with-storage.js`

---

## Проверочные команды

```bash
# 1. Проверить что товар в БД с правильным URL
curl -s 'http://localhost:3000/api/catalog/products?supplier_type=verified&category=ТЕСТОВАЯ' | jq '.products[] | {name, images}'

# 2. Проверить доступность картинки
curl -I "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg"

# 3. Проверить консоль браузера
# Открыть DevTools → Console → Искать ошибки загрузки
```

---

## Ожидаемый результат

После исправления:
- ✅ URL картинки открывается в браузере
- ✅ В UI каталога картинка загружается (НЕ серая иконка)
- ✅ В консоли браузера НЕТ ошибок загрузки изображений

---

## Дополнительная информация

### Supabase проект:
```
Project ID: ejkhdhexkadecpbjjmsz
URL: https://ejkhdhexkadecpbjjmsz.supabase.co
Storage: https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1
```

### Env переменные (.env.local):
```
NEXT_PUBLIC_SUPABASE_URL=https://ejkhdhexkadecpbjjmsz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[есть в .env.local]
```

### Dev сервер:
```bash
npm run dev
# http://localhost:3000
```

---

## Приоритет задач

**КРИТИЧНО:**
1. Проверить доступность URL картинки в браузере/curl
2. Настроить публичный доступ к бакету `product-images`
3. Проверить консоль браузера на ошибки

**ВАЖНО:**
4. Добавить Supabase домен в `next.config.js` (хотя для `<img>` не обязательно)
5. Проверить RLS политики в Supabase

**ОПЦИОНАЛЬНО:**
6. Переключиться на Vercel Blob Storage (если Supabase Storage проблемный)

---

## Скриншот проблемы

UI показывает:
- Товар: "Смартфон Apple iPhone 15 Pro Max 256GB"
- Картинка: Серая иконка placeholder (❌)
- Всё остальное: ОК ✅

**Ожидается:** Настоящая картинка iPhone вместо серой иконки

---

## Вопросы для диагностики

1. Что возвращает curl при проверке URL картинки? (200, 404, 403?)
2. Есть ли ошибки в консоли браузера? (CORS, CSP, 404?)
3. Бакет `product-images` - публичный? (Public bucket = ON?)
4. Есть ли RLS политики, блокирующие доступ?

Ответы на эти вопросы сразу покажут причину проблемы.

---

**НАЧНИ С ЭТОГО:**
```bash
# 1. Проверь доступность картинки
curl -I "https://ejkhdhexkadecpbjjmsz.supabase.co/storage/v1/object/public/product-images/imported/1764245612544_smartfon_apple_iphone_15_pro_max_256gb.jpeg"

# 2. Открой в браузере Console (F12) и посмотри на ошибки
# Перейди на: http://localhost:3000/dashboard/catalog
# Категория: ТЕСТОВАЯ → Тестовые товары
```

Это даст главную информацию для решения проблемы! 🔍
