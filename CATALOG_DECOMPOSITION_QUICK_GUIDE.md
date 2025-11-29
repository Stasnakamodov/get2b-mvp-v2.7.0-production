# CATALOG PAGE - КРАТКОЕ РУКОВОДСТВО ПО ДЕКОМПОЗИЦИИ

> **TL;DR:** Файл page.tsx имеет 5436 строк (293KB), 53 useState, 10 useEffect, 17 API вызовов.
> Нужно разбить на модули без потери функциональности.

---

## БЫСТРАЯ ОЦЕНКА

```
📊 Текущее состояние:
├── Размер файла: 5436 строк (293.6 KB) ⛔ КРИТИЧНО!
├── useState хуков: 53 шт.                ⛔ Норма: 5-10
├── useEffect хуков: 10 шт.               ⚠️  Норма: 2-5
├── Функций: 28+ шт.
├── API вызовов: 17 шт.
└── Модальных окон: 4 шт.

🎯 Целевое состояние:
└── page.tsx: 400-800 строк (модульная архитектура)
```

---

## ЧТО МОЖНО ДЕЛАТЬ ПРЯМО СЕЙЧАС (0% риска)

### 1. Вынести типы (10 минут)
```bash
mkdir -p app/dashboard/catalog/types
```

**Создать:** `types/catalog.types.ts`
```typescript
export interface Supplier { /* ... */ }
export interface Product { /* ... */ }
export interface CartItem { /* ... */ }
export type CatalogMode = 'suppliers' | 'categories'
```

### 2. Вынести константы (10 минут)
```bash
mkdir -p app/dashboard/catalog/constants
```

**Создать:** `constants/catalog.constants.ts`
```typescript
export const productsPerPage = 8
export const allowedImageTypes = ['image/jpeg', 'image/png', ...]
export const supplierSteps = [ /* 7 шагов */ ]
```

### 3. Вынести утилиты (10 минут)
```bash
mkdir -p app/dashboard/catalog/utils
```

**Создать:** `utils/catalog.utils.ts`
```typescript
export const toRoman = (num: number): string => { /* ... */ }
export const convertToBase64 = (file: File): Promise<string> => { /* ... */ }
```

**Итого:** 30 минут, 0% риска ✅

---

## ЧТО ТРЕБУЕТ ПОДГОТОВКИ (15-20% риска)

### 4. Создать сервисы API (2 часа)
```bash
mkdir -p app/dashboard/catalog/services
```

**Создать:**
- `services/supplierService.ts` - API для поставщиков
- `services/categoryService.ts` - API для категорий
- `services/productService.ts` - API для товаров
- `services/echoCardService.ts` - API для эхо карточек

**Пример:**
```typescript
export class SupplierService {
  static async loadUserSuppliers(session: any) {
    const response = await fetch('/api/catalog/user-suppliers', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    return response.json()
  }
}
```

### 5. Создать хуки (3 часа)
```bash
mkdir -p app/dashboard/catalog/hooks
```

**Создать:**
- `hooks/useCart.ts` - Логика корзины + localStorage
- `hooks/useSuppliers.ts` - Загрузка поставщиков
- `hooks/useCategories.ts` - Загрузка категорий

**Пример:**
```typescript
export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([])

  // localStorage sync
  useEffect(() => { /* load */ }, [])
  useEffect(() => { /* save */ }, [cart])

  const addToCart = (product) => { /* ... */ }

  return { cart, addToCart, removeFromCart, ... }
}
```

**Итого:** 5 часов, 15-20% риска ⚠️

---

## ЧТО ОПАСНО ТРОГАТЬ (50-60% риска)

### ⛔ НЕ ТРОГАТЬ БЕЗ ПОДГОТОВКИ:

#### 1. Форма поставщика (Фаза 4)
- 6 взаимосвязанных useState
- 140 строк логики в одном useEffect
- Валидация на 7 шагах
- Предзаполнение из эхо карточки

**Риск:** 50% - может сломаться навигация, валидация, импорт

#### 2. URL навигация (Фаза 6)
- useEffect с setInterval (race condition!)
- Зависимость от загрузки категорий
- Обработка 2 сценариев (прямая ссылка, поиск по изображению)

**Риск:** 60% - может сломаться переходы из других страниц

---

## РЕКОМЕНДУЕМЫЙ ПЛАН (1 НЕДЕЛЯ)

### День 1-2: Безопасные модули
- [x] Типы (10 мин)
- [x] Константы (10 мин)
- [x] Утилиты (10 мин)
- [x] Сервисы API (2 часа)
- [x] Тестирование (1 час)

### День 3-4: Хуки и состояния
- [x] useCart hook (45 мин)
- [x] useSuppliers hook (60 мин)
- [x] useCategories hook (45 мин)
- [x] Тестирование (2 часа)

### День 5: Модальные окна
- [x] EchoCardsModal.tsx (90 мин)
- [x] CartModal.tsx (60 мин)
- [x] ProductModal.tsx (45 мин)
- [x] Тестирование (1 час)

### НЕ ТРОГАЕМ (оставляем как есть):
- ❌ Форма поставщика (работает, опасно менять)
- ❌ URL навигация (работает, но с setInterval)

**Результат:** page.tsx уменьшится с 5436 до ~1200 строк
**Риск:** 15%

---

## КРИТИЧЕСКИЕ ТОЧКИ (ЧТО МОЖЕТ СЛОМАТЬСЯ)

### 🔴 Race Condition #1: URL параметры
```typescript
// ПРОБЛЕМА: setInterval ждет загрузки категорий
useEffect(() => {
  const interval = setInterval(() => {
    if (apiCategories.length > 0) {
      // обработка URL
    }
  }, 100)
}, [apiCategories])
```

**Может сломаться:**
- Прямые ссылки на категории
- Переходы из поиска по изображению
- Клики по dropdown подкатегорий

### 🔴 Race Condition #2: Предзаполнение формы
```typescript
// ПРОБЛЕМА: 140 строк в useEffect + setTimeout
useEffect(() => {
  if (echoCardForImport && showAddSupplierModal) {
    // 140 строк трансформации...
    setTimeout(() => { /* проверка */ }, 100)
  }
}, [echoCardForImport, showAddSupplierModal])
```

**Может сломаться:**
- Импорт из эхо карточек
- Предзаполнение товаров с картинками
- Импорт реквизитов поставщика

### ⚠️ Memory Leak: Async функции
```typescript
const handleAddSupplierToPersonal = async (supplier) => {
  setLoading(true)
  // fetch запрос (3 секунды)
  setLoading(false) // ← если компонент размонтирован - warning!
}
```

**Решение:** AbortController (уже есть в коде!)

---

## ЧЕКЛИСТ ПЕРЕД НАЧАЛОМ

### Подготовка
- [ ] Создать ветку: `git checkout -b refactor/catalog-decomposition`
- [ ] Сделать backup: `git commit -m "checkpoint: before decomposition"`
- [ ] Убедиться что `npm run build` проходит
- [ ] Прочитать полный анализ в `CATALOG_PAGE_DECOMPOSITION_ANALYSIS.md`

### Перед каждой фазой
- [ ] Создать checkpoint commit
- [ ] Проверить зависимости модуля
- [ ] Понять что может сломаться

### После каждой фазы
- [ ] `npm run build` - компиляция ✅
- [ ] `npm run dev` - приложение запускается ✅
- [ ] Ручное тестирование функциональности ✅
- [ ] `git commit -m "refactor: phase X completed"`

---

## ЦЕЛЕВАЯ СТРУКТУРА

```
/app/dashboard/catalog/
├── page.tsx (~400-800 строк)     🎯 ГЛАВНЫЙ ФАЙЛ
│
├── types/
│   └── catalog.types.ts          ✅ ВЫНЕСТИ СРАЗУ
│
├── constants/
│   └── catalog.constants.ts      ✅ ВЫНЕСТИ СРАЗУ
│
├── utils/
│   ├── catalog.utils.ts          ✅ ВЫНЕСТИ СРАЗУ
│   └── supplierFormValidation.ts ⚠️  СРЕДНИЙ РИСК
│
├── services/                     ⚠️  НИЗКИЙ РИСК
│   ├── supplierService.ts
│   ├── categoryService.ts
│   ├── productService.ts
│   └── echoCardService.ts
│
├── hooks/                        ⚠️  НИЗКИЙ РИСК
│   ├── useCart.ts
│   ├── useSuppliers.ts
│   └── useCategories.ts
│
├── context/
│   └── SupplierFormContext.tsx   🔴 ВЫСОКИЙ РИСК - НЕ ТРОГАТЬ
│
└── components/
    ├── SupplierCard.tsx          ✅ УЖЕ СУЩЕСТВУЕТ
    ├── ProductCard.tsx           ✅ УЖЕ СУЩЕСТВУЕТ
    ├── EchoCardsModal.tsx        ⚠️  СРЕДНИЙ РИСК
    ├── CartModal.tsx             ⚠️  СРЕДНИЙ РИСК
    └── ProductModal.tsx          ⚠️  СРЕДНИЙ РИСК
```

---

## ФИНАЛЬНЫЙ page.tsx (400 строк)

```typescript
'use client'

import { useState } from 'react'
import { useCart } from './hooks/useCart'
import { useSuppliers } from './hooks/useSuppliers'
import { useCategories } from './hooks/useCategories'
import { CatalogHeader } from './components/CatalogHeader'
import { SupplierGrid } from './components/SupplierGrid'
import { CartModal } from './components/CartModal'
import type { CatalogMode, SelectedRoom } from './types/catalog.types'

export default function CatalogPage() {
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('categories')
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom>('orange')

  const { suppliers, loading } = useSuppliers(selectedRoom)
  const { categories } = useCategories()
  const { cart, showCart, addToCart, ... } = useCart()

  return (
    <div className="min-h-screen">
      <CatalogHeader
        suppliersCount={suppliers.length}
        cartCount={cart.length}
      />

      <SupplierGrid
        suppliers={suppliers}
        loading={loading}
      />

      <CartModal
        isOpen={showCart}
        cart={cart}
      />
    </div>
  )
}
```

---

## МЕТРИКИ УСПЕХА

После декомпозиции:
- ✅ page.tsx < 1000 строк (сейчас 5436)
- ✅ < 20 useState в page.tsx (сейчас 53)
- ✅ < 5 useEffect в page.tsx (сейчас 10)
- ✅ Нет inline JSX компонентов
- ✅ Все типы вынесены
- ✅ Все API вызовы в сервисах
- ✅ Performance не хуже
- ✅ Все функции работают

---

## ПЛАН ОТКАТА

### Если что-то сломалось:

**Мелкая ошибка:**
```bash
git reset --soft HEAD~1  # откатить последний коммит
# исправить ошибку
git commit -m "fix: ..."
```

**Фаза провалилась:**
```bash
git reset --hard <commit_before_phase>  # откатить всю фазу
```

**Всё сломалось:**
```bash
git checkout main
git branch -D refactor/catalog-decomposition
# начать заново с меньшим scope
```

---

## ЧТО ДЕЛАТЬ ДАЛЬШЕ

1. **Прочитать полный анализ:**
   `/Users/user/Desktop/godplisgomvp-forvercel/CATALOG_PAGE_DECOMPOSITION_ANALYSIS.md`

2. **Выбрать стратегию:**
   - Агрессивная (3 дня, 40% риск)
   - Консервативная (2 недели, 10% риск)
   - **Гибридная (1 неделя, 15% риск)** ← РЕКОМЕНДУЕТСЯ

3. **Начать с безопасных модулей:**
   - Типы + константы + утилиты (30 минут)
   - Сервисы API (2 часа)
   - Хуки (3 часа)

4. **Тестировать после каждого изменения!**

---

**Создано:** 2025-11-29
**Полная версия:** CATALOG_PAGE_DECOMPOSITION_ANALYSIS.md
**Автор анализа:** Senior Architect AI Agent
