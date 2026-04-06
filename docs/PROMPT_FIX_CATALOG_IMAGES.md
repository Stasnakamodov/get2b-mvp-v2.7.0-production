# ПРОМПТ: Починить картинки каталога на проде GET2B

## Что произошло

Новый каталог (604 товара) залит на прод в таблицу `catalog_verified_products`. Товары отображаются, но **все картинки сломаны** — показываются placeholder'ы или broken image.

## Три проблемы

### 1. `getProductImage()` не обрабатывает локальные пути

**Файл:** `lib/catalog/utils.ts`, функция `getProductImage()` (строка 46)

Текущая логика:
```
1. images пустой → placeholder
2. объект с url → url
3. строка начинается с http → url  
4. ВСЁ ОСТАЛЬНОЕ → placeholder  ← сюда попадают локальные пути!
```

Товары в БД имеют пути вида `["/images/products/prod-0091.jpg"]` — это строка, но не начинается с `http`, поэтому всегда возвращается placeholder.

**Фикс:** добавить проверку `startsWith('/')` перед fallback:
```typescript
// Если это локальный путь
if (typeof firstImage === 'string' && firstImage.startsWith('/')) {
  return firstImage
}
```

### 2. Картинок физически нет на VPS

На VPS в `/app/public/images/products/` есть только **12 placeholder SVG**. Нужны **616 JPG файлов** (prod-0001.jpg ... prod-0700+) общим размером **~185 MB**.

Исходники картинок находятся в проекте А-Спецторг:
```
/Users/user/Downloads/code/public/images/products/prod-*.jpg
```

Из 619 уникальных путей в БД — **616 файлов найдены** в А-Спецторг, 3 отсутствуют:
- prod-0588.jpg
- prod-0590.jpg  
- prod-0630.jpg

**Варианты решения:**

**Вариант А — Скопировать на VPS через SCP** (быстро, но 185MB):
```bash
# Создать архив только нужных файлов
cd /Users/user/Downloads/code/public/images/products/
tar czf /tmp/catalog-images.tar.gz prod-*.jpg

# Залить на VPS
scp /tmp/catalog-images.tar.gz root@83.220.172.8:/tmp/

# Распаковать в контейнер
ssh root@83.220.172.8
docker cp /tmp/catalog-images.tar.gz get2b-app:/tmp/
docker exec get2b-app tar xzf /tmp/catalog-images.tar.gz -C /app/public/images/products/
```

**Вариант Б — Добавить в Docker image** (правильно, но требует ребилд):
Скопировать prod-*.jpg в `public/images/products/` в репозитории GET2B, закоммитить, перебилдить Docker.
Минус: +185MB в git-репо (плохо для git, хорошо для воспроизводимости).

**Вариант В — External storage / CDN** (правильно для прода, но больше работы):
Залить картинки на S3/R2/Vercel Blob, обновить URL в БД.

**Рекомендация:** Вариант А для быстрого фикса сейчас + Вариант Б/В позже.

**ВАЖНО:** Docker контейнер при рестарте/ребилде потеряет файлы залитые через Вариант А, если они не часть image. Для устойчивости нужен volume или включение в Docker image.

### 3. 30 товаров со старыми alicdn URL

В `catalog_verified_products` осталось 30 записей с внешними URL вида:
```
https://demo.otcommerce.net/plugin/request/ImagePro?i=aHR0cHM6...
```
Это старые alicdn ссылки из мусорного каталога. Они 404 или медленные.

**Фикс:** Заменить на placeholder или удалить эти товары:
```sql
-- Посмотреть какие товары с alicdn
SELECT id, name FROM catalog_verified_products 
WHERE images::text LIKE '%otcommerce%' OR images::text LIKE '%alicdn%';

-- Заменить на placeholder
UPDATE catalog_verified_products 
SET images = '[]'::jsonb 
WHERE images::text LIKE '%otcommerce%';
```

## Контекст

### Архитектура каталога (две параллельные системы!)

```
ТАБЛИЦЫ В БАЗЕ:
├── catalog_products         ← 604 товара (seed из А-Спецторг), category_id (UUID FK)
├── catalog_categories       ← 54 категории  
├── catalog_suppliers        ← 38 поставщиков
│
├── catalog_verified_products  ← 604 товара (КОПИЯ! из catalog_products), category (TEXT)
├── catalog_verified_suppliers ← 38 поставщиков (КОПИЯ!)
│
├── catalog_user_products      ← 0 (пользовательские товары)
└── catalog_user_suppliers     ← 0 (пользовательские поставщики)
```

**Фронтенд API** (`app/api/catalog/products/route.ts`) читает из `catalog_verified_products` (не catalog_products!).

### Файлы для исправления

```
lib/catalog/utils.ts                           # getProductImage() — добавить поддержку локальных путей
app/dashboard/catalog/components/ProductCard.tsx # Рендерит картинки через next/image
next.config.js                                 # images.remotePatterns — может понадобиться
```

### Подключение к VPS

```
VPS: 83.220.172.8
SSH: root@83.220.172.8
DB: user=get2b, db=get2b, password=6aNUPiKZHlAdwKB4KKzVqlqfL3nDEzV
Docker: get2b-app + get2b-postgres
Путь в контейнере: /app/public/images/products/
Источник картинок: /Users/user/Downloads/code/public/images/products/prod-*.jpg (616 файлов, 185MB)
```

## Чеклист

- [ ] Исправить `getProductImage()` — добавить обработку локальных путей (`startsWith('/')`)
- [ ] Скопировать 616 prod-*.jpg из А-Спецторг на VPS в контейнер get2b-app
- [ ] Для 3 отсутствующих файлов (prod-0588, prod-0590, prod-0630) — подставить placeholder или найти альтернативу
- [ ] Очистить 30 записей с alicdn URL в catalog_verified_products
- [ ] Задеплоить код (если менялся getProductImage) — git push + rebuild Docker
- [ ] Проверить: открыть get2b.pro → Каталог → картинки отображаются
- [ ] Продумать устойчивое решение (Docker volume или включение картинок в image)
