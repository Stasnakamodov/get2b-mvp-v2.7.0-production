# ЗАДАЧА: Кнопка «В проект» в каталоге не работает — полная диагностика

## Проблема
На странице `/dashboard/catalog` кнопки «В проект» на карточках товаров **не реагируют на клик**. Ни toast, ни ошибок в консоли — как будто onClick не привязан.

## Среда
- Продакшн: `get2b.pro/dashboard/catalog`
- Docker-контейнер на VPS (83.220.172.8), НЕ Vercel
- Custom DB wrapper поверх pg.Pool (имитация Supabase API), НЕ настоящий Supabase SDK
- Next.js (App Router)
- Пользователь авторизован (dashboard доступен)

## Что нужно сделать

### 1. Проверь цепочку onClick от кнопки до хука

Кнопка «В проект» рендерится в **двух view-режимах** (grid и list):

**Файл: `app/dashboard/catalog/components/ProductCard.tsx`**
- Строка 43: `handleAddToCart` вызывает `onAddToCart?.(product)`
- `onAddToCart` — **опциональный проп** (строка 16: `onAddToCart?: (product: CatalogProduct) => void`)
- Строки ~130 и ~267: кнопка с текстом «В проект» и `onClick={handleAddToCart}`

**Возможные причины не-работы:**
- `e.stopPropagation()` в строке 44 может мешать если кнопка внутри другого обработчика
- Проверь нет ли **overlay/div** поверх кнопки (например absolute-позиционированный элемент с z-index)
- Проверь нет ли `pointer-events: none` на кнопке или родителе

### 2. Проверь что проп `onAddToCart` реально доходит

Цепочка передачи:

```
app/dashboard/catalog/page.tsx
  ├── строка 201: const handleAddToCart = useCallback((p: CatalogProduct) => addToCart(p, 1), [addToCart])
  ├── строка 480: <CatalogGrid onAddToCart={handleAddToCart} ... />
  │
  └── app/dashboard/catalog/components/CatalogGrid.tsx
        ├── строка 19: onAddToCart: (product: CatalogProduct) => void (обязательный!)
        ├── строка 42: деструктуризация onAddToCart из пропсов
        └── строка 130: <ProductCard onAddToCart={onAddToCart} ... />
```

Проверь что в `CatalogGrid` проп `onAddToCart` **точно передаётся** в каждый `ProductCard`. Возможно есть условный рендер, где он теряется.

### 3. Проверь хук useProductCart

**Файл: `hooks/useProductCart.ts`**

Двойной режим:
- `isAuthenticated` = true → `serverCart.addToCart(product, quantity, variant)`
- `isAuthenticated` = false → localStorage

Строки 126-158: функция `addToCart`. Обрати внимание:
- Строка 127: `if (isAuthenticated)` — проверь что `userId` определён
- `serverCart.addToCart` (строка 128) — просто вызывает `addMutation.mutate()`
- Строка 129-132: toast ДОЛЖЕН показаться даже если mutation ещё pending

**КРИТИЧЕСКИ ВАЖНО:** Если toast НЕ показывается — значит `addToCart` функция вообще НЕ вызывается. Проблема на уровне компонента/пропса, а не API.

### 4. Проверь useServerCart

**Файл: `hooks/useServerCart.ts`**

- Строка 34: `useServerCart(enabled = false)` — `enabled` контролирует React Query
- Строки 21-28: `authHeaders()` получает токен через `db.auth.getSession()`
- `db` тут = `@/lib/db/client` (клиентский), где `auth = authClient` из `lib/auth/client.ts`
- `authClient.getSession()` (строка 171 в lib/auth/client.ts) вызывает `/api/auth/me` для проверки токена
- Токен хранится в `localStorage` ключ `auth-token`

### 5. Проверь CSS — нет ли invisible overlay

Частая причина «кнопка не кликается» — поверх неё лежит невидимый div.

В `ProductCard.tsx`:
- Карточка — это `<Card>` с `cursor-pointer` и `onClick={handleClick}` (открывает модалку)
- Кнопка «В проект» внутри карточки с `e.stopPropagation()`
- Проверь нет ли абсолютно-позиционированных элементов (wishlist кнопка, badge "В наличии") с z-index выше кнопки

**В браузере:**
1. Открой DevTools → Elements
2. Наведи на кнопку «В проект»
3. Проверь что элемент под курсором — действительно `<button>`, а не overlay
4. Правый клик на кнопке → Inspect → проверь computed styles на `pointer-events`

### 6. Проверь нет ли JS-ошибки при инициализации хука

Если `useProductCart()` падает при инициализации (например `db.auth.getUser()` throws), весь компонент может не отрендериться правильно, и коллбэки будут undefined.

**Добавь временный console.log для диагностики:**

В `app/dashboard/catalog/components/ProductCard.tsx`, в функцию `handleAddToCart`:
```tsx
const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('🔴 CART CLICK', { product: product.id, hasCallback: !!onAddToCart })
    onAddToCart?.(product)
}
```

В `app/dashboard/catalog/page.tsx`, в `handleAddToCart`:
```tsx
const handleAddToCart = useCallback((p: CatalogProduct) => {
    console.log('🟢 PAGE handleAddToCart called', p.id)
    addToCart(p, 1)
}, [addToCart])
```

В `hooks/useProductCart.ts`, в `addToCart`:
```tsx
const addToCart = useCallback((product: CatalogProduct, quantity: number = 1, variant?: ProductVariant) => {
    console.log('🟡 useProductCart.addToCart', { productId: product.id, isAuthenticated, quantity })
    // ... rest
```

Задеплой и проверь консоль. Это покажет на каком уровне цепочка обрывается:
- Нет 🔴 → кнопка не кликается (CSS overlay / pointer-events)
- Есть 🔴, нет 🟢 → `onAddToCart` не передан (проп потерялся)
- Есть 🟢, нет 🟡 → `addToCart` из хука не работает
- Есть 🟡 → проблема в serverCart или API

### 7. Ключевые файлы для исследования

| Файл | Что проверить |
|------|---------------|
| `app/dashboard/catalog/page.tsx` | Передача `onAddToCart` в CatalogGrid (строка 480) |
| `app/dashboard/catalog/components/CatalogGrid.tsx` | Передача `onAddToCart` в ProductCard (строка 130) |
| `app/dashboard/catalog/components/ProductCard.tsx` | onClick и CSS кнопки (строки 43-46, 125-135, 260-280) |
| `hooks/useProductCart.ts` | Функция addToCart (строки 126-158) |
| `hooks/useServerCart.ts` | addMutation и authHeaders (строки 21-78) |
| `lib/auth/client.ts` | getSession и getToken (строки 171-212) |
| `app/api/catalog/cart/items/route.ts` | POST handler (строки 31-92) |

### 8. Быстрые тесты в консоли браузера

Открой DevTools Console на странице каталога и выполни:

```js
// Проверка авторизации
localStorage.getItem('auth-token') // Должен быть токен

// Проверка API корзины
fetch('/api/catalog/cart', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth-token') }
}).then(r => r.json()).then(console.log)

// Тест добавления в корзину напрямую
fetch('/api/catalog/cart/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('auth-token')
  },
  body: JSON.stringify({ product_id: 'ВСТАВЬ_ID_ТОВАРА', quantity: 1 })
}).then(r => r.json()).then(console.log)
```

## Ожидаемый результат

Найти точную причину почему кнопка не работает и исправить. Наиболее вероятные причины:
1. **CSS overlay** блокирует клик (80% вероятность для «кнопка вообще не реагирует»)
2. Проп `onAddToCart` теряется где-то в цепочке
3. `useProductCart` падает при инициализации и колбэки = undefined
