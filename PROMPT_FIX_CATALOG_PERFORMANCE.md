# ЗАДАЧА: Исправить лаги каталога GET2B

## Контекст проекта
Платформа GET2B (Next.js 15 + Supabase). Каталог товаров — главная страница платформы.
В базе 4862 товара, каталог **тормозит и лагает** при загрузке и навигации.

## Текущая архитектура каталога

Основная страница: `/dashboard/catalog`
Основной компонент: `components/catalog/ProductGridByCategory.tsx` (1126 строк!)
API: `/api/catalog/products-by-category/`, `/api/catalog/simple-products/`
RPC: `get_products_by_category` (Supabase)

Есть **улучшенная версия** `catalog-new/` с виртуализацией — но она НЕ используется как основная.

## ДИАГНОСТИКА: 15 причин лагов (приоритет по критичности)

### CRITICAL

**1. Загрузка 6000 товаров за один запрос**
- Файл: `components/catalog/ProductGridByCategory.tsx:116-117`
- Код: `limit=6000` в URL запроса
- Результат: 10-50MB JSON, блокирует UI на секунды

**2. N+1 запросы для подсчёта товаров по категориям**
- Файл: `app/dashboard/catalog/hooks/useCategories.ts:154-164`
- Цикл `for...of` делает отдельный `SELECT COUNT(*)` для КАЖДОЙ категории
- 9 категорий = 9 отдельных запросов к БД

**3. Нет виртуализации — рендерятся ВСЕ 6000 карточек**
- Файл: `components/catalog/ProductGridByCategory.tsx:754-786`
- `filteredProducts.map(...)` рендерит все товары в DOM
- В `catalog-new` уже есть `@tanstack/react-virtual` — но не используется

### HIGH

**4. Монолит-компонент 1126 строк**
- `ProductGridByCategory.tsx` содержит: UI, fetch, фильтрацию, сортировку, модалки
- Любое изменение state перерисовывает ВСЁ
- Нужно разбить на 5-6 мелких компонентов с React.memo

**5. Нет lazy loading у картинок**
- Файл: `ProductGridByCategory.tsx:854-877`
- Используются сырые `<img>` без `loading="lazy"`
- Все 6000 картинок запрашиваются одновременно

**6. Двойной запрос в simple-products API**
- Файл: `app/api/catalog/simple-products/route.ts:31-101`
- Последовательно запрашивает `catalog_verified_products` И `catalog_user_products`
- Потом объединяет в памяти

### MEDIUM

**7. JSON.parse() изображений на каждом рендере**
- Файл: `ProductGridByCategory.tsx:152-162`
- `typeof product.images === 'string' ? JSON.parse(product.images)` в `.map()`
- Вызывается при каждом рендере для каждого товара

**8. Сортировка 6000 элементов на клиенте**
- Файл: `ProductGridByCategory.tsx:265-357`
- `[...products].sort(...)` с regex для парсинга цен
- Должна быть на стороне БД с индексами

**9. Нет debounce на поисковом инпуте**
- Файл: `ProductGridByCategory.tsx:564`
- `onChange={setSearchQuery}` — каждый символ = новый API запрос
- Нужен debounce 300мс

**10. Framer Motion для мелких анимаций (+40KB)**
- Файл: `ProductGridByCategory.tsx:20, 433-538`
- Тяжёлая библиотека для простых transitions
- Заменить на CSS transitions

**11. Нет кэширования ответов API**
- `simple-products` и другие эндпоинты без Cache-Control
- В `products-paginated` уже есть: `s-maxage=30, stale-while-revalidate=60`

## ЧТО НУЖНО СДЕЛАТЬ

### Вариант А: Быстрый фикс (минимальные изменения)
1. В `ProductGridByCategory.tsx:116` заменить `limit=6000` на `limit=100` + добавить "Load More" кнопку
2. Добавить `loading="lazy"` ко всем `<img>` тегам в каталоге
3. Добавить debounce 300мс на searchQuery
4. Заменить N+1 подсчёт категорий на один SQL запрос
5. Добавить `Cache-Control` на все API каталога

### Вариант Б: Переход на catalog-new (правильный путь)
Уже есть улучшенная версия `app/dashboard/catalog-new/` с:
- `@tanstack/react-virtual` — виртуализация
- `@tanstack/react-query` — кэширование + дедупликация запросов
- Пагинация через `useInfiniteProducts`
- Правильная архитектура компонентов

Нужно:
1. Перенести все фичи из старого каталога в catalog-new (фильтры, сортировка, категории)
2. Заменить роут `/dashboard/catalog` на содержимое `catalog-new`
3. Удалить старый `ProductGridByCategory.tsx`

## КЛЮЧЕВЫЕ ФАЙЛЫ

```
components/catalog/ProductGridByCategory.tsx  — МОНОЛИТ 1126 строк (основной виновник)
app/dashboard/catalog/page.tsx                — страница каталога
app/dashboard/catalog/hooks/useCategories.ts  — N+1 подсчёт категорий
app/dashboard/catalog-new/page.tsx            — УЛУЧШЕННАЯ версия (не используется)
app/dashboard/catalog-new/components/         — компоненты новой версии
app/api/catalog/products-by-category/         — основной API
app/api/catalog/simple-products/route.ts      — альтернативный API
app/api/catalog/products-paginated/route.ts   — пагинированный API (лучший)
```

## ОГРАНИЧЕНИЯ
- Supabase MCP подключён — используй для миграций и SQL
- Не удаляй данные без подтверждения
- Пиши на русском
- Стек: Next.js 15, React 19, TypeScript, Tailwind, Supabase
- 4862 товара в таблице `catalog_verified_products`
- На таблице есть UNIQUE INDEX на (name, supplier_id) и UNIQUE CONSTRAINT на sku

## ФОРМАТ РАБОТЫ
1. Выбери вариант (А или Б) и обоснуй
2. Покажи план изменений
3. Работай пошагово, показывая diff каждого изменения
4. После каждого шага — проверь что билд проходит (`npm run build`)

## МЕТРИКА УСПЕХА
- Каталог загружается за < 2 сек (сейчас 5-10+ сек)
- При скролле нет подвисаний
- При поиске нет задержек
- Фильтрация по категории < 500мс
