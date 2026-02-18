# ЗАДАЧА: Починить корзину каталога — товары не добавляются

## Контекст проекта
Next.js 14 App Router + Supabase + React Query + Tailwind CSS + FSD-архитектура.
Каталог товаров с поставщиками (оранжевая комната = verified, синяя = user).
Есть dual-mode корзина: localStorage для анонимных, серверная (Supabase) для авторизованных.

## Проблема
При нажатии кнопки "В корзину" на карточке товара внутри модалки поставщика — товар НЕ добавляется в корзину. Счётчик корзины не обновляется, визуально ничего не происходит.

## Текущее состояние UI
- **SupplierCard** (карточка поставщика на витрине): кнопка "Посмотреть товары" → вызывает `handleCardClick` → открывает модалку поставщика. ЭТО УЖЕ ИСПРАВЛЕНО.
- **SupplierModal** → показывает товары поставщика через `ProductCard` с `showActions={true}` и `onAddToCart`
- **ProductCard** внутри модалки: кнопка "В корзину" → вызывает `onAddToCart(product)` — вот тут товар НЕ добавляется

## Что уже сделано (но не помогло)
1. В `hooks/useServerCart.ts` добавлена функция `authHeaders()` — передаёт Bearer-токен в fetch-запросы к API корзины. Раньше заголовок Authorization вообще не передавался.
2. Добавлена детальная обработка ошибок в `addMutation` — теперь извлекает body.error из ответа.
3. Кнопки SupplierCard переделаны с "Начать проект" (handleStartProject) на "Посмотреть товары" (handleCardClick).

Баг по-прежнему воспроизводится.

## Архитектура корзины — ключевые файлы

### Хуки (клиент):
- **`hooks/useProductCart.ts`** — главный хук корзины, dual-mode:
  - Проверяет `isAuthenticated` через `supabase.auth.getUser()` на клиенте
  - `isAuthenticated` → делегирует ВСЕ операции в `useServerCart` (серверная корзина)
  - anonymous → `localStorage` (ключ из `CART_STORAGE_KEY` = `catalog_storage_key`)
  - При логине — авто-мерж localStorage → сервер
  - **ВАЖНО**: Если `isAuthenticated=true`, local fallback НЕ работает — при ошибке сервера товар пропадает молча
- **`hooks/useServerCart.ts`** — серверная корзина через React Query:
  - GET: `fetch('/api/catalog/cart', { headers })` → `useQuery(['server-cart'])`
  - ADD: `fetch('/api/catalog/cart/items', { method: 'POST', headers, body })` → `useMutation`
  - Все запросы передают `Authorization: Bearer <token>` через `authHeaders()`
  - `authHeaders()` получает токен из `supabase.auth.getSession()` на клиенте

### API-роуты (сервер):
- **`app/api/catalog/cart/route.ts`** — GET (получение корзины через RPC `get_cart_with_products`), DELETE (очистка)
- **`app/api/catalog/cart/items/route.ts`** — POST (добавление), PATCH (обновление кол-ва), DELETE (удаление)
- **`app/api/catalog/cart/merge/route.ts`** — POST (мерж localStorage → сервер при логине)
- Все используют `getAuthUser(request)` — парсит Bearer токен через `supabase.auth.getUser(token)`, fallback `supabase.auth.getUser()`
- **КРИТИЧНО**: API создаёт supabase-клиент с `anon key` (lib/supabaseClient.ts). Вызов `supabase.auth.getUser(token)` валидирует токен и возвращает user, НО не устанавливает сессию на клиенте Supabase. Поэтому все последующие операции (INSERT, SELECT) выполняются от имени anon, а RLS проверяет `auth.uid()` = NULL.

### БД Supabase:
- **`catalog_carts`** — одна корзина на пользователя (user_id UNIQUE), RLS включён
- **`catalog_cart_items`** — элементы корзины (cart_id, product_id, quantity, variant_id), RLS включён
- RLS-политики: `auth.uid() = user_id` для carts, `cart_id IN (SELECT id FROM catalog_carts WHERE user_id = auth.uid())` для items
- RPC `get_cart_with_products` — SECURITY DEFINER (обходит RLS), JOIN cart_items + verified_products + suppliers
- Миграция: `supabase/migrations/20260214_feature3_server_cart.sql`

### UI-компоненты:
- **`src/widgets/catalog-suppliers/ui/ProductCard.tsx`** — карточка товара, кнопка "В корзину"
  - `onAddToCart?: (product: Product) => void`
  - `showActions={true}` нужен чтобы кнопка отображалась
- **`src/features/supplier-modal/ui/SupplierModal.tsx`** — модалка поставщика с товарами
  - Передаёт `onAddToCart={onAddToCart ? handleAddToCart : undefined}` в ProductCard
  - `handleAddToCart` вызывает `onAddToCart(product)`, при false — alert
- **`app/dashboard/catalog/page.tsx`** — главная страница каталога
  - Строка ~675: `onAddToCart={(product: Product) => { addToCart(productToCatalogProduct(product), 1); return true }}`
  - `productToCatalogProduct()` (строка 54-69) — конвертирует FSD `Product` → `CatalogProduct`
  - `addToCart` из `useProductCart()` (строка ~30)
- **`src/widgets/catalog-suppliers/ui/SupplierCard.tsx`** — карточка поставщика на витрине
  - Кнопка "Посмотреть товары" → `handleCardClick` → открывает модалку (исправлено)

### Типы:
- **`src/entities/product/model/types.ts`** — `Product` (FSD): `price: string`, `product_name: string`
- **`lib/catalog/types.ts`** — `CatalogProduct`: `price?: number`, `name: string`
- Конвертация в `productToCatalogProduct`: `price: p.price ? parseFloat(p.price) : undefined`

### Supabase клиент:
- **`lib/supabaseClient.ts`** — `createClient(url, anonKey)` с `persistSession: true`
- Это ОДИН синглтон для клиента и сервера
- На клиенте: сессия есть (localStorage), `auth.uid()` работает
- На сервере (API routes): сессии НЕТ, `auth.uid()` = NULL, RLS блокирует

## ГЛАВНАЯ ПРИЧИНА БАГА (95% вероятность)

### RLS блокирует INSERT в cart таблицы

Цепочка проблемы:
1. `useServerCart` → `fetch('/api/catalog/cart/items', POST)` с Bearer-токеном ✅
2. API route → `getAuthUser(request)` → `supabase.auth.getUser(token)` → получает user ✅
3. API route → `supabase.from('catalog_carts').insert({ user_id: userId })` ❌ БЛОКИРУЕТСЯ RLS
4. Потому что `supabase` клиент создан с `anon key` и БЕЗ сессии пользователя
5. RLS-политика: `auth.uid() = user_id` → `auth.uid()` возвращает NULL → INSERT запрещён
6. API возвращает 500 → mutation падает → товар не добавлен

### Почему другие API роуты работают (suppliers, products)?
- Таблицы `catalog_verified_suppliers` и `catalog_verified_products` скорее всего НЕ имеют RLS (или имеют SELECT-only политику для anon)
- А `catalog_carts` и `catalog_cart_items` имеют строгий RLS на все операции

## Решение

### Вариант A (рекомендуется): Создать авторизованный Supabase-клиент в API роутах корзины

```typescript
// В каждом API-роуте корзины, после получения токена:
import { createClient } from '@supabase/supabase-js'

function createAuthenticatedClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
  )
}

// Использование:
const token = authHeader.substring(7)
const { data: { user }, error } = await supabase.auth.getUser(token)
const authSupabase = createAuthenticatedClient(token)
// Все дальнейшие запросы через authSupabase — RLS будет видеть auth.uid()
```

### Вариант B: Использовать service_role key (обходит RLS)

```typescript
const serviceSupabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
// Все запросы через serviceSupabase обходят RLS
// Но нужна ручная проверка прав доступа
```

### Вариант C: Отключить RLS для cart таблиц и проверять user_id вручную в WHERE

Не рекомендуется — менее безопасно.

## Задачи для нового чата (в порядке выполнения)

1. **Проверить что таблицы существуют** — `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'catalog_cart%'` через Supabase MCP
2. **Проверить RLS** — `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE tablename LIKE 'catalog_cart%'`
3. **Реализовать Вариант A** — создать `createAuthenticatedClient(token)` и использовать его в:
   - `app/api/catalog/cart/route.ts`
   - `app/api/catalog/cart/items/route.ts`
   - `app/api/catalog/cart/merge/route.ts`
4. **Проверить что GET /api/catalog/cart работает** — RPC `get_cart_with_products` использует SECURITY DEFINER, должен работать, но проверить
5. **Добавить визуальный feedback** — toast "Товар добавлен" при успехе, сообщение об ошибке при неудаче
6. **Протестировать полный flow**: открыть модалку поставщика → нажать "В корзину" → проверить счётчик корзины → открыть корзину → убедиться что товар там
