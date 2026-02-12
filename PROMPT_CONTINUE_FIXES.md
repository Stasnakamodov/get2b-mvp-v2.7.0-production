# ЗАДАЧА: Продолжить исправление каталога GET2B

## КОНТЕКСТ ПРОЕКТА
- **Стек**: Next.js 15, React 19, TypeScript, Tailwind, Supabase, PM2
- **Репо**: https://github.com/Stasnakamodov/get2b-mvp-v2.7.0-production.git
- **Ветка**: main
- **Прод-сервер**: 45.150.8.168, root, Pizda333, путь: `/var/www/godplis`
- **Supabase**: ejkhdhexkadecpbjjmsz.supabase.co (ключи в .env.local)

## ЧТО УЖЕ БЫЛО СДЕЛАНО (предыдущий чат)

### 1. Диагностика данных в Supabase
Запросили реальные данные через REST API:
- **catalog_categories** — 9 категорий (8 рабочих + "Здоровье и медицина" лишняя)
- **catalog_subcategories** — ~40 подкатегорий
- **catalog_verified_products** — 4862 активных товара
- Товары по категориям: Дом и быт(2245), Строительство(856), Электроника(500), Здоровье и красота(481), Автотовары(425), Промышленность(329), Продукты питания(0), Текстиль и одежда(0)

### 2. Критический фикс: фильтр подкатегорий
- В `catalog_verified_products` НЕТ колонки `subcategory` (текст), есть только `subcategory_id` (UUID)
- `products-paginated/route.ts` делал `.eq('subcategory', subcategory)` → исправлено на `.eq('subcategory_id', subcategory)`
- `CatalogSidebar.tsx` передавал `sub.name` → исправлено на `sub.id`
- Хайлайт подкатегории: `selectedSubcategory === sub.name` → `sub.id`

### 3. CatalogHeader
- При смене категории из dropdown теперь очищается subcategory

### 4. Лендинг — фейковые данные
- Было: "10,000+ товаров", "Электроника 2,347", "Мебель 1,892", "Одежда 3,156"
- Стало: "4,800+ товаров", реальные категории с реальными счётчиками из БД
- Исправлено в: CatalogSection.tsx, HeroSection.tsx, data/landing/tutorial.ts

### 5. Статические ассеты
- `public/` был в `.gitignore` — картинки не попадали в git
- Все 20 файлов из public/ принудительно добавлены: категории, маркетплейсы, плейсхолдеры

### 6. Деплой на прод
- Коммиты запушены в main, pull на сервере, npm install + build + pm2 restart
- ВНИМАНИЕ: На сервере OOM при билде — нужно сначала `pm2 stop all`, потом `NODE_OPTIONS="--max-old-space-size=2048" npm run build`

## ЧТО НУЖНО ПРОВЕРИТЬ/ИСПРАВИТЬ

### ВЫСОКИЙ ПРИОРИТЕТ

1. **Проверить что картинки РЕАЛЬНО отображаются на проде**
   - Лендинг: секция каталога — 4 карточки с картинками категорий
   - Лендинг: секция маркетплейсов — SVG логотипы (1688, Alibaba, Taobao, etc.)
   - Если картинки всё ещё не показываются — проверить nginx конфиг, может он не проксирует static files

2. **Проверить фильтрацию по подкатегориям в каталоге**
   - Открыть `/dashboard/catalog` → режим "Категории"
   - Кликнуть категорию (например "Дом и быт") → должны отфильтроваться товары
   - Раскрыть подкатегории → кликнуть подкатегорию → должны отфильтроваться по subcategory_id
   - Если не работает — проверить Network tab, что отправляется в запросе

3. **Ошибка `returnNaN is not defined` в PM2 логах**
   - Старый баг, не связан с нашими изменениями
   - Нужно найти источник: `grep -r "returnNaN" .` и исправить

### СРЕДНИЙ ПРИОРИТЕТ

4. **Nginx конфигурация**
   - Проверить: `cat /etc/nginx/sites-enabled/*` на сервере
   - Убедиться что static files из `/var/www/godplis/public/` отдаются напрямую
   - Проверить что есть `proxy_pass http://localhost:3000`

5. **Category-stats API — категории с 0 товаров**
   - "Продукты питания" и "Текстиль и одежда" показывают 0 товаров — это правда, товаров нет
   - Можно скрыть пустые категории в сайдбаре или импортировать товары

6. **useCatalogCategories.ts маппинг**
   - Сейчас маппит по `name` (DEFAULT_CATEGORIES.name vs API response name)
   - Все 8 категорий совпадают, но если появятся новые — может сломаться
   - Рекомендация: перейти на API-first подход (брать всё из API, только иконки из DEFAULT_CATEGORIES)

## КЛЮЧЕВЫЕ ФАЙЛЫ

```
hooks/useCatalogCategories.ts          — хук маппинга категорий
app/dashboard/catalog-new/components/  — компоненты нового каталога
  CatalogSidebar.tsx                   — сайдбар с деревом категорий
  CatalogHeader.tsx                    — шапка с поиском/фильтрами
  CatalogGrid.tsx                      — виртуализированная сетка
  ProductModal.tsx                     — модалка товара
app/dashboard/catalog/page.tsx         — основная страница каталога (unified)
app/api/catalog/
  categories/route.ts                  — API дерева категорий
  category-stats/route.ts              — API счётчиков по категориям
  products-paginated/route.ts          — API товаров с cursor-пагинацией
lib/catalog/
  constants.ts                         — DEFAULT_CATEGORIES (8 категорий)
  types.ts                             — CatalogCategory, CatalogProduct, etc.
  utils.ts                             — formatPrice, buildCatalogUrl, parseFiltersFromUrl
components/landing/sections/
  CatalogSection.tsx                   — секция каталога на лендинге
  HeroSection.tsx                      — герой-секция лендинга
```

## ДАННЫЕ ДЛЯ ДЕПЛОЯ

```bash
# SSH подключение
sshpass -p 'Pizda333' ssh -o StrictHostKeyChecking=no root@45.150.8.168

# Деплой (ВАЖНО: pm2 stop перед билдом из-за OOM)
cd /var/www/godplis
git pull origin main
npm install --legacy-peer-deps
pm2 stop all
NODE_OPTIONS="--max-old-space-size=2048" npm run build
pm2 restart all

# Проверка
pm2 status
pm2 logs godplis --lines 20 --nostream
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
```

## ДАННЫЕ SUPABASE (для прямых запросов)
```
URL: https://ejkhdhexkadecpbjjmsz.supabase.co
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU
```

Пример запроса:
```bash
curl -s "https://ejkhdhexkadecpbjjmsz.supabase.co/rest/v1/catalog_categories?select=id,key,name&order=name" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```

## ВАЖНО
- `public/` в .gitignore — новые статические файлы нужно добавлять через `git add -f public/...`
- Сервер имеет 3.8GB RAM, 2 CPU — билд может OOM если не остановить pm2
- npm install требует `--legacy-peer-deps`
