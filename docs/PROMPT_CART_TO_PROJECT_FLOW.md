# ПРОМПТ: Изучи flow «Корзина → Создание проекта» в GET2B

## Задача

Изучи, как в приложении GET2B реализован полный flow создания проекта из корзины каталога. Разберись в каждом шаге — от добавления товара в корзину до создания проекта с позициями спецификации.

## Архитектура flow (6 этапов)

### 1. Добавление товара в корзину

**Каталог**: `/app/catalog/components/CatalogClient.tsx`  
**Хук**: `hooks/useProductCart.ts`

Двойной режим хранения:
- **Авторизован** → `useServerCart()` → API `/api/catalog/cart/items` → таблицы `catalog_carts` + `catalog_cart_items`
- **Аноним** → localStorage ключ `CART_STORAGE_KEY` из `lib/catalog/constants`
- **При логине** → мерж localStorage в серверную корзину через `/api/catalog/cart/merge`

Структура CartItem:
```typescript
{ product: CatalogProduct, quantity: number, addedAt: Date, variant?: ProductVariant }
```

### 2. Переход к созданию проекта

**Триггер**: кнопка «Создать проект» на странице товара или в корзине  
**Навигация**: `router.push('/dashboard/project-constructor?fromCatalog=true')`  
**Ключевой параметр**: `fromCatalog=true` — сигнал для импорта данных корзины

### 3. Извлечение и трансформация данных корзины

**Хук**: `hooks/useCatalogCartImport.ts` — функция `useCatalogCartImport()`

Источники данных (по приоритету):
1. Серверная корзина: GET `/api/catalog/cart` (RPC `get_cart_with_products`)
2. Fallback: localStorage

Трансформация CartItem → step2Data:
```typescript
{
  supplier: item.product.supplier_name || 'Каталог Get2B',
  currency: item.product.currency || 'RUB',
  items: [{
    name, code, quantity, price, unit, total,
    supplier_name, supplier_id, image_url,
    catalog_product_id, catalog_product_source: 'verified',
    category, subcategory, currency
  }]
}
```

Возвращает:
```typescript
{ cartItems, hasImportedFromCatalog, isLoaded, step2Data, clearCatalogCart, totalAmount, totalItems }
```

### 4. Загрузка в конструктор проекта

**Два пути:**

**Путь A — Project Constructor** (`app/dashboard/project-constructor/page.tsx`):
- `useCatalogCartImport()` детектит `fromCatalog=true`
- Заполняет `manualData[2]` данными из `catalogStep2Data`
- Помечает step 2 config как `'catalog'`
- Показывает toast с резюме импорта
- Очищает корзину каталога

**Путь B — Create Project** (`app/dashboard/create-project/page.tsx`):
- `CartLoader` компонент (строки 970-1062)
- Читает из `sessionStorage.getItem('project_cart')`
- Трансформирует в формат спецификации
- Устанавливает `hasCartItems=true`, `maxStepReached=2`

### 5. Контекст и форма спецификации

**Контекст**: `app/dashboard/create-project/context/CreateProjectContext.tsx`

Ключевые состояния:
```typescript
specificationItems: any[]      // Позиции из корзины
hasCartItems: boolean           // Флаг «пришло из корзины»
currentStep / maxStepReached    // Навигация по шагам
```

**Форма Step 2**: `app/dashboard/create-project/steps/Step2SpecificationForm.tsx`  
Хук: `useProjectSpecification(projectId, role)` — отображает, редактирует, удаляет позиции

### 6. Создание проекта через API

**API**: POST `/api/constructor/create-project/route.ts`

Payload:
```typescript
{
  project_name: string,
  step_data: { 1: companyData, 2: specificationData, 4: paymentData, 5: requisitesData },
  step_configs: { 1: 'manual', 2: 'catalog', ... }
}
```

Создаёт:
- Запись в `projects`
- Записи в `project_specifications` (с сохранением `catalog_product_id`, `supplier_id`, категории)

## Ключевые файлы

| Компонент | Файл |
|-----------|------|
| Корзина (хук) | `hooks/useProductCart.ts` |
| Серверная корзина | `hooks/useServerCart.ts` |
| Импорт корзины → проект | `hooks/useCatalogCartImport.ts` |
| API корзины | `app/api/catalog/cart/` (items, merge, route) |
| Контекст проекта | `app/dashboard/create-project/context/CreateProjectContext.tsx` |
| Форма спецификации | `app/dashboard/create-project/steps/Step2SpecificationForm.tsx` |
| Конструктор проекта | `app/dashboard/project-constructor/page.tsx` |
| Создание проекта (page) | `app/dashboard/create-project/page.tsx` |
| API создания | `app/api/constructor/create-project/route.ts` |
| Каталог (клиент) | `app/catalog/components/CatalogClient.tsx` |

## Хранилища данных

| Слой | Ключ/таблица | Жизненный цикл |
|------|-------------|----------------|
| Supabase | `catalog_carts` + `catalog_cart_items` | Постоянно (серверная корзина) |
| localStorage | `CART_STORAGE_KEY` | До логина или очистки |
| sessionStorage | `project_cart` | Вкладка браузера |
| React Context | `specificationItems` | Компонент |
| Supabase | `project_specifications` | Постоянно (после создания проекта) |

## URL-параметры

- `fromCatalog=true` — триггер импорта из корзины
- `projectId=XXX` — загрузка существующего проекта
- `step=N` — переход на конкретный шаг

## Схема flow

```
Каталог → addToCart() → [Supabase / localStorage]
                              ↓
        router.push('?fromCatalog=true')
                              ↓
        useCatalogCartImport() → трансформация CartItem → step2Data
                              ↓
        Context: setSpecificationItems() + setHasCartItems(true)
                              ↓
        Step2SpecificationForm → редактирование позиций
                              ↓
        POST /api/constructor/create-project → projects + project_specifications
```
