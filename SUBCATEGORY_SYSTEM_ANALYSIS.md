# АНАЛИЗ СИСТЕМЫ ПОДКАТЕГОРИЙ - КРИТИЧЕСКИЕ ПРОБЛЕМЫ

## ГЛАВНАЯ ПРОБЛЕМА

**Категория "ТЕСТОВАЯ" имеет 111 товаров, но подкатегория "Тестовые товары" показывает 0 товаров.**

## НУМЕРАЦИЯ КРИТИЧЕСКИХ ОБЛАСТЕЙ КОДА

### 1. ОСНОВНАЯ ПРОБЛЕМА: ProductGridByCategory не получает информацию о подкатегории

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/app/dashboard/catalog/page.tsx`
**Строки:** 2255-2262

```typescript
<ProductGridByCategory
  selectedCategory={selectedCategoryData?.name || ''}  // ❌ ПРОБЛЕМА: передаётся только название КАТЕГОРИИ
  token={authToken}
  onAddToCart={addToCart}
  cart={cart}
  selectedRoom={selectedRoom}
  activeSupplier={activeSupplier}
/>
// 🔥 НЕ ПЕРЕДАЁТСЯ: selectedSubcategoryData (когда она выбрана)
```

**Почему это критично:**
- Когда пользователь выбирает подкатегорию, `selectedSubcategoryData` становится не null (строка 576)
- Но ProductGridByCategory не знает об этой подкатегории и всё ещё получает только название категории
- API вызывается с именем категории вместо имени подкатегории

---

### 2. ProductGridByCategory не имеет пропса для подкатегории

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/components/catalog/ProductGridByCategory.tsx`
**Строки:** 62-71 (interface ProductGridByCategoryProps)

```typescript
interface ProductGridByCategoryProps {
  selectedCategory: string;        // ✅ Есть
  token: string;
  onAddToCart: (product: Product) => void;
  cart: CartItem[]
  className?: string;
  selectedRoom?: 'orange' | 'blue';
  activeSupplier?: string | null;
  isProductInCart?: (productId: string) => boolean;
  // ❌ НЕТ: selectedSubcategory или subcategoryId
}
```

**Компонент НЕ получает и НЕ обрабатывает подкатегории.**

---

### 3. API загрузки товаров работает через названия, но логика фильтрации неправильная

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/components/catalog/ProductGridByCategory.tsx`
**Строки:** 126-145

```typescript
const loadProducts = async () => {
  if (!selectedCategory) return

  setIsLoading(true)
  setError(null)

  try {
    const response = await fetch(
      `/api/catalog/products-by-category/${encodeURIComponent(selectedCategory)}?search=${searchQuery || ''}&limit=100`,
      // ❌ ПРОБЛЕМА: всегда использует selectedCategory (название КАТЕГОРИИ)
      // Но когда выбрана подкатегория, нужно отправить selectedSubcategory.name
    );
```

**Почему RPC функция не находит товары:**
- ProductGridByCategory всегда отправляет название КАТЕГОРИИ в API
- Даже если выбрана подкатегория "Тестовые товары", отправляется "ТЕСТОВАЯ"
- Товары в БД хранятся с `subcategory_id`, который связан с подкатегорией

---

### 4. RPC функция ищет товары правильно, но получает неправильное имя

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/supabase/migrations/20251127_fix_rpc_with_subcategory_support.sql`
**Строки:** 55-64 (для verified_products)

```sql
LEFT JOIN catalog_subcategories sub ON p.subcategory_id = sub.id
WHERE
  p.is_active = TRUE
  AND s.is_active = TRUE
  -- 🔥 FIX: Поддержка как категорий так и подкатегорий
  AND (
    category_name IS NULL
    OR p.category = category_name              -- Совпадение с КАТЕГОРИЕЙ
    OR sub.name = category_name                -- Совпадение с ПОДКАТЕГОРИЕЙ
  )
```

**Логика правильная!** Функция способна найти товары по имени подкатегории.
**НО:** ProductGridByCategory никогда не отправляет имя подкатегории.

---

### 5. Структура таблиц в БД

**Таблица `catalog_subcategories`:**
- `id` (UUID) - идентификатор подкатегории
- `category_id` (UUID) - ссылка на категорию
- `name` (text) - название подкатегории (например "Тестовые товары")
- `products_count` - подсчитанное количество товаров

**Таблица `catalog_verified_products`:**
- `id`
- `name`
- `category` (text) - название КАТЕГОРИИ (например "ТЕСТОВАЯ")
- `subcategory_id` (UUID) - ссылка на подкатегорию
- (другие поля)

**Связь работает так:**
```
категория "ТЕСТОВАЯ" (category_id = X)
├─ подкатегория "Тестовые товары" (category_id = X, id = Y)
│  └─ товар (category = "ТЕСТОВАЯ", subcategory_id = Y)  ✅
├─ подкатегория "Смартфоны" (category_id = X, id = Z)
│  └─ товар (category = "ТЕСТОВАЯ", subcategory_id = Z)  ✅
```

---

### 6. Процесс выбора подкатегории

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/app/dashboard/catalog/page.tsx`
**Строки:** 1804-1806

```typescript
const handleSubcategorySelect = (subcategory: any) => {
  setSelectedSubcategoryData(subcategory)  // ✅ Подкатегория сохраняется
}
```

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/app/dashboard/catalog/page.tsx`
**Строки:** 2217-2264

```typescript
: (
  // УРОВЕНЬ 3: Показываем товары выбранной подкатегории
  <div>
    {/* Заголовок показывает правильную подкатегорию */}
    <h2>{selectedSubcategoryData.icon} {selectedSubcategoryData.name}</h2>

    {/* ❌ НО: ProductGridByCategory получает только категорию, не подкатегорию */}
    <ProductGridByCategory
      selectedCategory={selectedCategoryData?.name || ''}
      // ...
    />
  </div>
)
```

---

### 7. SubcategoryList загружает подкатегории правильно

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/components/catalog/SubcategoryList.tsx`
**Строки:** 46-73

```typescript
const loadSubcategories = async () => {
  try {
    setLoading(true)

    // Загружаем из /api/catalog/categories (с вложенными подкатегориями)
    const response = await fetch('/api/catalog/categories')
    const data = await response.json()

    if (data.categories) {
      // Находим текущую категорию и получаем её подкатегории
      const currentCategory = data.categories.find((cat: any) => cat.id === category.id)

      if (currentCategory && currentCategory.subcategories) {
        subs = currentCategory.subcategories  // ✅ Подкатегории загружены правильно
      }
    }

    setSubcategories(subs)
  }
}
```

**Это работает правильно!** SubcategoryList показывает подкатегории с правильными счетчиками товаров.

---

### 8. API /api/catalog/categories загружает подкатегории с подсчётом товаров

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/app/api/catalog/categories/route.ts`
**Строки:** 55-79

```typescript
// Подсчитываем количество товаров для каждой подкатегории
const subcategoriesWithCounts = await Promise.all(
  (subcategories || []).map(async (sub) => {
    const { count, error } = await supabase
      .from("catalog_verified_products")
      .select("*", { count: 'exact', head: true })
      .eq('subcategory_id', sub.id)  // ✅ Ищет товары по подкатегории правильно

    return {
      ...sub,
      products_count: count || 0
    }
  })
)

// Добавляем подкатегории к корневым категориям
categoriesWithSubcategories = rootCategories.map(category => ({
  ...category,
  subcategories: subcategoriesWithCounts?.filter(sub => sub.category_id === category.id) || []
}))
```

**Подсчёт работает правильно!** Это объясняет, почему SubcategoryList показывает правильные счётчики.

---

### 9. API /api/catalog/categories/[id]/subcategories также работает правильно

**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/app/api/catalog/categories/[id]/subcategories/route.ts`
**Строки:** 37-50

```typescript
// Для каждой подкатегории считаем количество товаров
const subcategoriesWithCounts = await Promise.all(
  (subcategories || []).map(async (sub) => {
    const { count } = await supabase
      .from('catalog_verified_products')
      .select('*', { count: 'exact', head: true })
      .eq('subcategory_id', sub.id)  // ✅ Правильно

    return {
      ...sub,
      products_count: count || 0
    }
  })
)
```

---

## РЕЗЮМЕ ПРОБЛЕМ

| Компонент | Файл | Строки | Проблема | Статус |
|-----------|------|--------|----------|--------|
| **ProductGridByCategory** | `ProductGridByCategory.tsx` | 95-104 | Нет пропса для подкатегории | ❌ Критично |
| **loadProducts** | `ProductGridByCategory.tsx` | 126-145 | Всегда отправляет имя категории, не подкатегории | ❌ Критично |
| **Передача в ProductGridByCategory** | `page.tsx` | 2255-2262 | Передаётся только `selectedCategory`, не подкатегория | ❌ Критично |
| **useEffect зависимости** | `ProductGridByCategory.tsx` | 116-118 | Слушает только `selectedCategory`, нужно добавить подкатегорию | ❌ Критично |
| **API /api/catalog/products-by-category** | `[category]/route.ts` | 42-48 | Вызывается с именем категории, должен получать имя подкатегории | ⚠️ Зависит от исправления выше |
| **RPC функция get_products_by_category** | `20251127_...sql` | 8-140 | Логика правильная! | ✅ Работает |
| **Подсчёт в subcategories API** | `categories/route.ts` | 55-79 | Правильно ищет товары по `subcategory_id` | ✅ Работает |
| **SubcategoryList** | `SubcategoryList.tsx` | 46-73 | Показывает подкатегории правильно | ✅ Работает |

---

## ЧТО ПРОИСХОДИТ СЕЙЧАС

1. Пользователь выбирает категорию "ТЕСТОВАЯ" (111 товаров) ✅
2. Видит список подкатегорий ("Тестовые товары", "Смартфоны", и т.д.) с правильными счётчиками ✅
3. Выбирает подкатегорию "Тестовые товары" ✅
4. `selectedSubcategoryData` устанавливается правильно ✅
5. ❌ **НО:** ProductGridByCategory всё ещё получает `selectedCategory="ТЕСТОВАЯ"` вместо подкатегории ❌
6. ❌ API вызывает `/api/catalog/products-by-category/ТЕСТОВАЯ` вместо `/api/catalog/products-by-category/Тестовые товары` ❌
7. ❌ RPC функция ищет товары с `category="ТЕСТОВАЯ" AND sub.name = "ТЕСТОВАЯ"` вместо `sub.name = "Тестовые товары"` ❌
8. ❌ Результат: 0 товаров ❌

---

## ЧТО ДОЛЖНО БЫТЬ

1. ProductGridByCategory должен получить пропс `selectedSubcategory` (с объектом подкатегории)
2. `loadProducts` должна определить, есть ли выбранная подкатегория
3. Если есть подкатегория - отправить `selectedSubcategory.name`
4. Если нет - отправить `selectedCategory` (текущее поведение)
5. RPC функция уже готова обрабатывать оба случая

---

## РЕШЕНИЕ

Нужны изменения в 3 местах:

### Измение 1: ProductGridByCategory.tsx (props)
- Добавить пропс `selectedSubcategory?: any`
- Добавить в useEffect зависимость `selectedSubcategory`

### Изменение 2: ProductGridByCategory.tsx (loadProducts)
- Определить, какое имя использовать (подкатегория или категория)
- Передать правильное имя в API

### Изменение 3: page.tsx (передача props)
- Передать `selectedSubcategoryData` в `ProductGridByCategory`
- Изменить условие логики

---

## ПРОВЕРКА ГИПОТЕЗЫ

Если товары действительно имеют `subcategory_id`, то:
1. Query `SELECT * FROM catalog_verified_products WHERE subcategory_id = <id>` вернёт товары
2. Query `SELECT * FROM catalog_subcategories WHERE category_id = <ТЕСТОВАЯ_id>` вернёт подкатегории
3. Query `SELECT COUNT(*) FROM catalog_verified_products WHERE subcategory_id = <подкатегория_id>` покажет 0, если ProductGridByCategory не отправляет правильное имя подкатегории

