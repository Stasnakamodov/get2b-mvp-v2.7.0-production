# ЗАДАЧА: Настоящие фотографии товаров в каталоге GET2B

## Контекст
- Next.js 15.2.4, self-hosted на VPS 45.150.8.168 через PM2 (НЕ Vercel)
- Домен: get-2-b.ru
- Git: https://github.com/Stasnakamodov/get2b-mvp-v2.7.0-production.git (branch: main)
- Локальный путь: `/Users/user/Desktop/godplisgomvp-forvercel`
- Серверный путь: `/var/www/godplis`
- SSH: `root@45.150.8.168`, пароль: `pJ3nF8nD1koP`
- Деплой: `sshpass -p 'pJ3nF8nD1koP' ssh -o StrictHostKeyChecking=no root@45.150.8.168 'cd /var/www/godplis && git pull origin main && npm install --legacy-peer-deps && NODE_OPTIONS="--max-old-space-size=1024" npm run build && pm2 restart godplis'`
- Supabase: `https://ejkhdhexkadecpbjjmsz.supabase.co` (есть MCP — используй для запросов к БД)

## Проблема
В каталоге 3200+ товаров. НИ У ОДНОГО нет настоящей фотографии.
Сейчас вместо фото — SVG-заглушки с надписью GET2B.
Это НЕ рабочий каталог, а демо-витрина с пустышками.

## Корневые причины (уже установлены)
1. В БД (`catalog_verified_products.images`) хранятся URL вида `https://picsum.photos/seed/iot{N}/600/600`
2. **picsum.photos возвращает HTTP 403 из российских IP** — проверено: `curl -sI "https://picsum.photos/seed/iot3540/600/600"` с сервера → 403
3. В `next.config.js` стоит `unoptimized: true` (т.к. sharp не установлен) — это правильно
4. Код подменяет нерабочие picsum URL на локальные SVG-заглушки — это костыль, не решение

## Что нужно сделать

### ЭТАП 1: Глубокий анализ данных через MCP Supabase

Выполни эти SQL-запросы и выведи результаты:

```sql
-- 1. Сколько товаров и какие домены картинок
SELECT
  SUBSTRING(images[1] FROM '://([^/]+)') AS domain,
  COUNT(*) AS cnt
FROM catalog_verified_products
WHERE images IS NOT NULL AND array_length(images, 1) > 0
GROUP BY domain ORDER BY cnt DESC;

-- 2. Сколько товаров вообще без картинок
SELECT COUNT(*) FROM catalog_verified_products WHERE images IS NULL OR array_length(images, 1) = 0;

-- 3. Примеры URL по каждому домену
SELECT DISTINCT ON (SUBSTRING(images[1] FROM '://([^/]+)'))
  id, name, images[1] as first_image,
  SUBSTRING(images[1] FROM '://([^/]+)') AS domain
FROM catalog_verified_products
WHERE images IS NOT NULL AND array_length(images, 1) > 0;

-- 4. Какие категории товаров есть
SELECT category, COUNT(*) as cnt FROM catalog_verified_products GROUP BY category ORDER BY cnt DESC;

-- 5. Есть ли Supabase Storage bucket для картинок
-- (проверь через Supabase MCP)
```

### ЭТАП 2: Проверка доступности всех доменов картинок с сервера

Для КАЖДОГО уникального домена из п.1 — проверь доступность с сервера:
```bash
ssh root@45.150.8.168 'curl -sL -o /dev/null -w "HTTP %{http_code} Size %{size_download}" "URL" --max-time 10'
```

### ЭТАП 3: Решение — скачать РЕАЛЬНЫЕ фото товаров

Это B2B каталог с товарами типа "Умный датчик температуры Xiaomi", "Робот-пылесос Sonoff" и т.д.
Товарам нужны НАСТОЯЩИЕ фотографии, а не заглушки.

**Варианты (выбрать лучший на основе анализа):**

**Вариант A: Скачать фото с доступных CDN**
Если в БД есть URL с доменов, которые реально отдают картинки (не 403) — оставить их.
Для остальных — найти рабочие источники фото электроники/IoT-устройств.

**Вариант B: Загрузить фото в Supabase Storage**
- Скачать реальные фото товаров (с открытых источников или сгенерировать)
- Загрузить в Supabase Storage bucket `product-images`
- Обновить URL в БД на Supabase Storage URL
- Supabase Storage URL-ы гарантированно работают из РФ

**Вариант C: Использовать CDN который работает из РФ**
- Проверить: placehold.co, loremflickr.com, dummyimage.com, via.placeholder.com
- Выбрать тот что отдаёт 200 с сервера 45.150.8.168
- Массово обновить URL в БД

**Вариант D: Комбинированный**
- Для каждой категории товаров скачать 5-10 реальных фото
- Загрузить в Supabase Storage
- Назначить товарам по категории

### ЭТАП 4: Массовое обновление БД

Через MCP Supabase выполнить UPDATE для ВСЕХ товаров с нерабочими URL:
```sql
UPDATE catalog_verified_products
SET images = ARRAY['новый_рабочий_url']
WHERE images[1] LIKE '%picsum.photos%';
```

### ЭТАП 5: Проверка и очистка кода

- Убрать ВСЕ костыли из `lib/catalog/utils.ts` (функции `isUnreachableUrl`, `getLocalPlaceholder`, `getCleanImages`) — они больше не нужны если URL в БД рабочие
- `getProductImage()` должен просто возвращать `product.images[0]` без подмен
- Убрать SVG-заглушки из `/public/images/products/` — они не нужны
- Оставить `unoptimized: true` в next.config.js — это правильно для PM2

### ЭТАП 6: Деплой и верификация

- Закоммитить, запушить, задеплоить
- Проверить что картинки РЕАЛЬНО грузятся на https://get-2-b.ru/dashboard/catalog
- Проверить DevTools → Network → что img src отдаёт 200 и картинка показывается
- Проверить модалку товара (клик на карточку) — галерея должна работать

## Ключевые файлы
- `next.config.js` — images config
- `lib/catalog/utils.ts` — getProductImage(), getCleanImages() (сейчас с костылями)
- `app/dashboard/catalog-new/components/ProductCard.tsx` — рендеринг картинок (next/image)
- `app/dashboard/catalog-new/components/ProductModal.tsx` — галерея
- `app/dashboard/catalog-new/components/ProductDetail.tsx` — детальная карточка
- `app/dashboard/catalog/components/ProductCard.tsx` — старый каталог
- `hooks/useInfiniteProducts.ts` — загрузка товаров
- `app/api/catalog/products-paginated/route.ts` — API пагинации

## Критерии успеха
1. Открываю https://get-2-b.ru/dashboard/catalog — вижу ФОТОГРАФИИ товаров, не заглушки
2. Фото загружаются быстро (< 2 сек)
3. Работает из российского браузера
4. При клике на карточку — модалка показывает фото
5. Код чистый, без костылей и подмен URL на клиенте
