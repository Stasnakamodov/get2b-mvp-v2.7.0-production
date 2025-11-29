# ⚡ ГОТОВЫЕ СНИППЕТЫ ДЛЯ БЫСТРОЙ ОПТИМИЗАЦИИ

## 🔥 КОПИРУЙ И ВСТАВЛЯЙ - МГНОВЕННАЯ ОПТИМИЗАЦИЯ

### 1️⃣ БЫСТРЫЙ ФИКС #1: Мемоизация фильтрации поставщиков

**Файл:** `app/dashboard/catalog/page.tsx`
**Строка:** 1394
**Время внедрения:** 2 минуты

```typescript
// 🔴 УДАЛИТЬ (строки 1394-1411):
const filteredSuppliers = currentSuppliers.filter(supplier => {
  const matchesSearch = searchQuery
    ? (supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       supplier.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : true

  const matchesCategory = selectedCategory
    ? supplier.category === selectedCategory
    : true

  return matchesSearch && matchesCategory
})

// ✅ ВСТАВИТЬ ВМЕСТО:
const filteredSuppliers = useMemo(() => {
  return currentSuppliers.filter(supplier => {
    const matchesSearch = searchQuery
      ? (supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         supplier.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true

    const matchesCategory = selectedCategory
      ? supplier.category === selectedCategory
      : true

    return matchesSearch && matchesCategory
  })
}, [currentSuppliers, searchQuery, selectedCategory])

// И добавить в импорты (строка ~10):
import { useMemo, useCallback, useState, useEffect } from 'react'
```

---

### 2️⃣ БЫСТРЫЙ ФИКС #2: Мемоизация расчетов корзины

**Файл:** `app/dashboard/catalog/page.tsx`
**Строки:** 1872, 1876
**Время внедрения:** 2 минуты

```typescript
// 🔴 УДАЛИТЬ:
const getTotalItems = () => {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

const getTotalPrice = () => {
  return cart.reduce((sum, item) => sum + item.total_price, 0)
}

// ✅ ВСТАВИТЬ ВМЕСТО (после всех useState, примерно строка 1400):
const totalItems = useMemo(() =>
  cart.reduce((sum, item) => sum + item.quantity, 0),
  [cart]
)

const totalPrice = useMemo(() =>
  cart.reduce((sum, item) => sum + item.total_price, 0),
  [cart]
)

// И заменить в JSX:
// Было: {getTotalItems()}
// Стало: {totalItems}

// Было: {getTotalPrice()}
// Стало: {totalPrice}
```

---

### 3️⃣ БЫСТРЫЙ ФИКС #3: Debounce для поиска

**Время внедрения:** 5 минут

```bash
# Сначала установить:
npm install use-debounce
```

```typescript
// В начало файла добавить импорт:
import { useDebouncedCallback } from 'use-debounce'

// Найти обработчик поиска (примерно строка 700-800):
// 🔴 БЫЛО:
<input
  type="text"
  placeholder="Поиск..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="..."
/>

// ✅ ЗАМЕНИТЬ НА:
const [searchInput, setSearchInput] = useState('')

const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    setSearchQuery(value)
  },
  300 // задержка 300мс
)

// В JSX:
<input
  type="text"
  placeholder="Поиск..."
  value={searchInput}
  onChange={(e) => {
    setSearchInput(e.target.value)
    debouncedSearch(e.target.value)
  }}
  className="..."
/>
```

---

### 4️⃣ БЫСТРЫЙ ФИКС #4: Мемоизация обработчиков

**Время внедрения:** 5 минут

```typescript
// Найти все handle функции и обернуть в useCallback

// 🔴 БЫЛО:
const handleAddToCart = (product: Product) => {
  // логика
}

const handleRemoveFromCart = (productId: string) => {
  // логика
}

const handleUpdateQuantity = (productId: string, quantity: number) => {
  // логика
}

// ✅ ЗАМЕНИТЬ НА:
const handleAddToCart = useCallback((product: Product) => {
  // та же логика
}, [cart])

const handleRemoveFromCart = useCallback((productId: string) => {
  // та же логика
}, [cart])

const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
  // та же логика
}, [cart])
```

---

### 5️⃣ БЫСТРЫЙ ФИКС #5: React.memo для ProductGridByCategory

**Файл:** `components/catalog/ProductGridByCategory.tsx`
**Строка:** 95
**Время внедрения:** 1 минута

```typescript
// 🔴 БЫЛО:
export default function ProductGridByCategory({ ... }) {

// ✅ ЗАМЕНИТЬ НА:
export default React.memo(function ProductGridByCategory({ ... }) {
```

---

### 6️⃣ БЫСТРЫЙ ФИКС #6: Lazy Loading модальных окон

**Время внедрения:** 10 минут

```typescript
// В начало файла:
import { lazy, Suspense } from 'react'

// Создать файл: components/catalog/modals/ImportFromCatalogModal.tsx
// Перенести туда код модалки (строки ~3000-3500)

// В page.tsx:
const ImportFromCatalogModal = lazy(() =>
  import('@/components/catalog/modals/ImportFromCatalogModal')
)

// В JSX где используется модалка:
{showImportModal && (
  <Suspense fallback={<div className="animate-pulse">Загрузка...</div>}>
    <ImportFromCatalogModal
      isOpen={showImportModal}
      onClose={() => setShowImportModal(false)}
      // остальные пропсы
    />
  </Suspense>
)}
```

---

### 7️⃣ БЫСТРЫЙ ФИКС #7: Оптимизация map в рендере

**Время внедрения:** 5 минут

```typescript
// 🔴 БЫЛО (в JSX):
{categories.map(category => (
  <div key={category.id}>
    {category.name}
    {/* сложная логика */}
  </div>
))}

// ✅ СОЗДАТЬ ОТДЕЛЬНЫЙ КОМПОНЕНТ:
const CategoryCard = React.memo(({ category }: { category: Category }) => {
  return (
    <div>
      {category.name}
      {/* сложная логика */}
    </div>
  )
})

// И использовать:
{categories.map(category => (
  <CategoryCard key={category.id} category={category} />
))}
```

---

## 🚀 СУПЕР-БЫСТРАЯ ОПТИМИЗАЦИЯ (15 МИНУТ)

### Скопируй этот код в начало CatalogPageClient:

```typescript
// ==================== ОПТИМИЗАЦИИ ====================
import { useMemo, useCallback, memo } from 'react'
import { useDebouncedCallback } from 'use-debounce'

// После всех useState добавить:

// Мемоизация фильтрованных поставщиков
const filteredSuppliers = useMemo(() => {
  if (!currentSuppliers) return []

  return currentSuppliers.filter(supplier => {
    const matchesSearch = searchQuery
      ? (supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         supplier.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true

    const matchesCategory = selectedCategory
      ? supplier.category === selectedCategory
      : true

    return matchesSearch && matchesCategory
  })
}, [currentSuppliers, searchQuery, selectedCategory])

// Мемоизация расчетов корзины
const cartStats = useMemo(() => ({
  totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
  totalPrice: cart.reduce((sum, item) => sum + item.total_price, 0)
}), [cart])

// Мемоизация обработчиков
const handleAddToCart = useCallback((product: Product) => {
  setCart(prev => {
    const exists = prev.find(item => item.id === product.id)
    if (exists) {
      return prev.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    }
    return [...prev, { ...product, quantity: 1 }]
  })
}, [])

const handleRemoveFromCart = useCallback((productId: string) => {
  setCart(prev => prev.filter(item => item.id !== productId))
}, [])

// Debounce для поиска
const debouncedSetSearchQuery = useDebouncedCallback(
  (value: string) => setSearchQuery(value),
  300
)
```

---

## 📊 ПРОВЕРКА РЕЗУЛЬТАТА

### Добавь в начало компонента для измерения:

```typescript
// Измерение производительности
useEffect(() => {
  const start = performance.now()

  return () => {
    const end = performance.now()
    console.log(`⚡ Render time: ${(end - start).toFixed(2)}ms`)
  }
})

// Счетчик рендеров
const renderCount = useRef(0)
renderCount.current++
console.log(`🔄 Render #${renderCount.current}`)
```

### Ожидаемые результаты:
- **До:** Render time: ~500ms, 10+ рендеров при клике
- **После:** Render time: ~100ms, 1-2 рендера при клике

---

## 🎯 ЭКСТРЕННАЯ ОПТИМИЗАЦИЯ (ЕСЛИ СОВСЕМ ТОРМОЗИТ)

```typescript
// ПАНИКА-КОД: вставить в самое начало компонента
const ENABLE_OPTIMIZATIONS = true

// Отключить лишние useEffect
useEffect(() => {
  if (!ENABLE_OPTIMIZATIONS) return
  // оригинальный код
}, [deps])

// Ограничить количество элементов
const MAX_ITEMS = 50
const limitedSuppliers = filteredSuppliers.slice(0, MAX_ITEMS)

// Отложить загрузку некритичных данных
const [delayedLoad, setDelayedLoad] = useState(false)
useEffect(() => {
  const timer = setTimeout(() => setDelayedLoad(true), 1000)
  return () => clearTimeout(timer)
}, [])

// Использовать в JSX:
{delayedLoad && <HeavyComponent />}
```

---

## ✅ КОНТРОЛЬНЫЙ СПИСОК

После применения оптимизаций проверь:

- [ ] Страница загружается < 2 сек
- [ ] Поиск работает без лагов
- [ ] Скролл плавный
- [ ] Модалки открываются быстро
- [ ] Нет ошибок в консоли
- [ ] Функционал не сломан

**Готово! 🎉 Ожидай ускорение в 2-3 раза!**