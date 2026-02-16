# Задача: Редизайн каталога товаров GET2B

## Проект
B2B-платформа GET2B (Next.js 15 + App Router + Supabase + TailwindCSS + shadcn/ui).
Прод: https://get-2-b.ru, каталог: /dashboard/catalog

## Проблема
Каталог товаров выглядит «дёшево» и обрезается снизу. Конкретные баги:

1. **Контент обрезается снизу** — контейнер `h-[calc(100vh-64px)]` + `overflow-hidden` на вложенных div блокируют скролл. Вторая строка карточек обрезана, нижняя часть (цена, кнопка) не видна.
2. **Нет скролла у сетки товаров** — `overflow-hidden` на `flex-1 flex overflow-hidden` (строка 330) и `flex-1 flex flex-col overflow-hidden p-4` (строка 357) в page.tsx не дают скроллить.
3. **Карточки выглядят неаккуратно** — нет единообразной высоты, нет hover-эффектов тени, нет визуального «воздуха».
4. **Сайдбар категорий** — плоский, без стиля, категории без hover-состояний.
5. **Коллекции (чипы)** — бледные, не привлекают внимание.
6. **Нет «возбуждающего» дизайна** — хочется маркетплейс-уровень: Ozon / Wildberries / AliExpress визуальный уровень.

## Что нужно сделать

### Критический фикс (сначала!)
В файле `app/dashboard/catalog/page.tsx`:
- Строка 221: `h-[calc(100vh-64px)]` → убрать фиксированную высоту или заменить на `min-h-[calc(100vh-64px)]`
- Строка 330: `overflow-hidden` → `overflow-auto` или убрать
- Строка 357: `overflow-hidden` → убрать, скролл должен быть на уровне сетки (CatalogGrid уже имеет `overflow-auto`)

### Дизайн карточек (ProductCard.tsx)
Текущее: карточки с `aspect-[4/3]` картинкой, оранжевые кнопки, базовый стиль.
Хочется:
- Мягкие тени, плавные hover-анимации (scale, тень увеличивается)
- Компактная но информативная карточка
- Цена крупно и заметно
- Кнопка «В проект» стильная, не плоский блок
- Бейджи «В наличии» / «Топ» — более аккуратные с backdrop-blur
- Wishlist-сердечко с анимацией

### Сайдбар (CatalogSidebar.tsx)
- Красивые hover-состояния на категориях
- Активная категория — выделена чётко (не просто фоном)
- Иконки категорий крупнее и контрастнее
- Счётчики товаров — аккуратные бейджи
- Возможно sticky позиция при скролле

### Хедер каталога (CatalogHeader.tsx)
- Поиск — красивый инпут с иконкой, плавная анимация фокуса
- Фильтры — стильные дропдауны вместо плоских кнопок
- Переключение вида (сетка/список) — аккуратные иконки

### Общая страница (page.tsx)
- Убрать серый фон `bg-gray-50`, сделать чище — `bg-white` или лёгкий градиент
- Убрать «зонирование» (резкие границы между блоками)
- Плавные переходы между секциями
- Коллекционные чипы — визуально привлекательные (градиенты, иконки)

## Ключевые файлы

```
app/dashboard/catalog/page.tsx                    — Главная страница каталога (500+ строк)
app/dashboard/catalog/components/ProductCard.tsx   — Карточка товара (grid + list виды)
app/dashboard/catalog/components/ProductModal.tsx  — Модалка товара
app/dashboard/catalog/components/CatalogGrid.tsx   — CSS-сетка + IntersectionObserver
app/dashboard/catalog/components/CatalogSidebar.tsx — Сайдбар с категориями
app/dashboard/catalog/components/CatalogHeader.tsx  — Шапка: поиск, фильтры, сортировка
app/dashboard/catalog/components/FilterTags.tsx     — Теги активных фильтров
app/dashboard/catalog/components/WishlistSheet.tsx  — Панель избранного
app/dashboard/catalog/components/ProductCardSkeleton.tsx — Скелетон загрузки
app/dashboard/layout.tsx                           — Layout дашборда (сайдбар навигации)
lib/catalog/types.ts                               — Типы: CatalogProduct, CatalogFilters, etc.
lib/catalog/utils.ts                               — Утилиты: formatPrice, getProductImage, etc.
lib/catalog/constants.ts                           — Константы: категории, сортировки, лимиты
```

## Стек
- Next.js 15.2.4 (App Router)
- TailwindCSS 3
- shadcn/ui (Button, Card, Badge, Dialog, Sheet, Breadcrumb, etc.)
- lucide-react (иконки)
- @tanstack/react-query (запросы)
- next/image (картинки)

## Референсы дизайна
Ориентироваться на: Ozon.ru (карточки), Wildberries (сетка), AliExpress (фильтры). Современный маркетплейс с чистым, «дорогим» ощущением. Оранжевый — основной акцентный цвет бренда.

## Ограничения
- НЕ менять логику фильтрации/поиска/пагинации — только визуал
- НЕ менять API-роуты и хуки — только компоненты
- Сохранить всю функциональность: корзина, вишлист, фасетные счётчики, коллекции, бесконечный скролл
- `npm run build` должен проходить без ошибок
- После изменений задеплоить: `ssh root@45.150.8.168 'pm2 stop godplis && cd /var/www/godplis && git pull origin main && npm install --legacy-peer-deps && NODE_OPTIONS="--max-old-space-size=1536" npm run build && pm2 restart godplis && pm2 save'`
