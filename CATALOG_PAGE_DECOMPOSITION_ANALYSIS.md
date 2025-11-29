# ДЕТАЛЬНЫЙ АНАЛИЗ CATALOG PAGE ДЛЯ БЕЗОПАСНОЙ ДЕКОМПОЗИЦИИ

**Дата анализа:** 2025-11-29  
**Файл:** `/Users/user/Desktop/godplisgomvp-forvercel/app/dashboard/catalog/page.tsx`  
**Размер:** 5436 строк, 293.6 KB

---

## 1. АНАЛИЗ СТРУКТУРЫ (ЧТО ЕСТЬ В ФАЙЛЕ)

### Статистика компонента:

```
- Общий размер: 5436 строк (293.6 KB) - КРИТИЧНО БОЛЬШОЙ!
- useState хуков: 53 шт. (норма: 5-10)
- useEffect хуков: 10 шт. (норма: 2-5)
- Функций/хендлеров: 28+ функций
- API вызовов (fetch): 17 вызовов
- Handler функций: 15+ функций
```

### Логические блоки кода:

#### БЛОК 1: Инициализация и состояния (строки 1-715)
- Импорты (строки 1-14)
- 53 useState хука
- Константы и конфигурация (supplierSteps, categories)
- Массивная форма supplierFormData с 30+ полями

#### БЛОК 2: API функции (строки 54-446)
- `loadSuppliersFromAPI()` - загрузка пользовательских поставщиков
- `loadVerifiedSuppliersFromAPI()` - загрузка аккредитованных
- `loadCategoriesFromAPI()` - загрузка категорий
- `loadRecommendations()` - умные рекомендации
- `loadSupplierProducts()` - товары поставщика
- `loadEchoCards()` - эхо карточки
- `importSupplierFromEchoCard()` - импорт из эхо карточки

#### БЛОК 3: useEffect'ы (строки 28-627)
- Проверка Supabase подключения
- Загрузка поставщиков при монтировании
- Обработка URL параметров (категории, подкатегории)
- Загрузка рекомендаций
- Инициализация авторизации
- Корзина (localStorage sync)

#### БЛОК 4: Бизнес-логика (строки 629-1880)
- Валидация форм поставщиков (`validateSupplierStep`)
- Работа с формой поставщика (7 шагов)
- Загрузка изображений и логотипов
- CRUD операции с поставщиками
- Работа с корзиной (add/remove/update)

#### БЛОК 5: Вспомогательные функции (строки 1000-1900)
- `isSupplierInPersonalList()` - проверка дубликатов
- `handleAddSupplierToPersonal()` - импорт поставщика
- `handleLogoUpload()` - загрузка логотипа
- `handleSubmitSupplier()` - сохранение поставщика
- Фильтрация поставщиков

#### БЛОК 6: JSX разметка (строки 2001-5436)
- Header и навигация
- Режим "по поставщикам"
- Режим "по категориям"
- Модальные окна (AddSupplier, EchoCards, Cart, Product)
- Карточки поставщиков (inline JSX компоненты)

---

## 2. БЕЗОПАСНЫЕ ДЛЯ ВЫНОСА МОДУЛИ (0% РИСКА)

### 2.1. Константы и конфигурация
**Файл:** `constants/catalog.constants.ts`

```typescript
// ✅ МОЖНО ВЫНОСИТЬ ПРЯМО СЕЙЧАС
export const productsPerPage = 8
export const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
export const maxImageSize = 5 * 1024 * 1024 // 5MB

export const supplierSteps = [
  { id: 1, title: 'ОСНОВНАЯ', description: 'Информация', icon: Building },
  { id: 2, title: 'КОНТАКТЫ', description: 'Связь', icon: Phone },
  { id: 3, title: 'ПРОФИЛЬ', description: 'Бизнес', icon: Users },
  { id: 4, title: 'СЕРТИФИКАЦИИ', description: 'Документы', icon: CheckCircle },
  { id: 5, title: 'ТОВАРЫ', description: 'Каталог', icon: Package },
  { id: 6, title: 'РЕКВИЗИТЫ', description: 'Платежи', icon: Zap },
  { id: 7, title: 'ПРЕВЬЮ', description: 'Финал', icon: CheckCircle }
]

export const categories = [
  { value: 'all', label: 'ВСЕ КАТЕГОРИИ' },
  { value: 'electronics', label: 'ЭЛЕКТРОНИКА' },
  // ... остальные категории
]
```

**Риск:** 0%  
**Время:** 5 минут

### 2.2. Утилиты
**Файл:** `utils/catalog.utils.ts`

```typescript
// ✅ МОЖНО ВЫНОСИТЬ ПРЯМО СЕЙЧАС
export const toRoman = (num: number): string => {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return romans[num - 1] || String(num)
}

export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}
```

**Риск:** 0%  
**Время:** 5 минут

### 2.3. TypeScript типы и интерфейсы
**Файл:** `types/catalog.types.ts`

```typescript
// ✅ МОЖНО ВЫНОСИТЬ ПРЯМО СЕЙЧАС
export interface Supplier {
  id: string
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description: string
  logo_url?: string
  contact_email: string
  contact_phone: string
  website?: string
  contact_person: string
  min_order: string
  response_time: string
  employees: string
  established: string
  certifications: string[]
  specialties: string[]
  // ... остальные поля
}

export interface Product {
  id: string
  name: string
  price: string
  description: string
  images: string[]
  specifications: {[key: string]: string}
  category: string
  inStock: boolean
  minOrder: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  total_price: number
  supplier_name: string
  supplier_id: string
  images: string[]
  currency: string
}

export interface EchoCard {
  supplier_key: string
  supplier_info: any
  products: any[]
  products_detailed?: any[]
  statistics: {
    total_projects: number
    success_rate: number
    total_spent: number
    products_count: number
  }
  extraction_info: {
    completeness_score: number
    needs_manual_review: boolean
  }
}

export type CatalogMode = 'suppliers' | 'categories'
export type SelectedRoom = 'orange' | 'blue'
export type ModalTab = 'info' | 'products' | 'management'
```

**Риск:** 0%  
**Время:** 10 минут

---

## 3. МОДУЛИ С НИЗКИМ РИСКОМ (ТРЕБУЮТ НЕБОЛЬШОЙ ПОДГОТОВКИ)

### 3.1. Сервисы API
**Файл:** `services/supplierService.ts`

```typescript
// ⚠️ НИЗКИЙ РИСК - нужно передать token/session
export class SupplierService {
  static async loadUserSuppliers(session: any) {
    const response = await fetch('/api/catalog/user-suppliers', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    })
    return response.json()
  }

  static async loadVerifiedSuppliers() {
    const response = await fetch('/api/catalog/verified-suppliers')
    return response.json()
  }

  static async createSupplier(data: any, session: any) {
    const response = await fetch('/api/catalog/user-suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  // ... остальные методы
}
```

**Зависимости:**
- Supabase session (передается как параметр)
- TypeScript типы (уже вынесены)

**Риск:** 15%  
**Время:** 30 минут

### 3.2. Сервис категорий
**Файл:** `services/categoryService.ts`

```typescript
// ⚠️ НИЗКИЙ РИСК
export class CategoryService {
  static async loadCategories() {
    const response = await fetch('/api/catalog/categories')
    return response.json()
  }

  static async loadSubcategories(categoryId: string) {
    const response = await fetch(`/api/catalog/categories/${categoryId}/subcategories`)
    return response.json()
  }
}
```

**Риск:** 10%  
**Время:** 15 минут

### 3.3. Хук корзины
**Файл:** `hooks/useCart.ts`

```typescript
// ⚠️ НИЗКИЙ РИСК - изолированная логика
export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null)
  const [cartLoaded, setCartLoaded] = useState(false)

  // Загрузка из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('catalog_cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
      setCartLoaded(true)
    }
  }, [])

  // Сохранение в localStorage
  useEffect(() => {
    if (cartLoaded && typeof window !== 'undefined') {
      localStorage.setItem('catalog_cart', JSON.stringify(cart))
    }
  }, [cart, cartLoaded])

  const addToCart = (product: any) => { /* ... */ }
  const removeFromCart = (id: string) => { /* ... */ }
  const updateQuantity = (id: string, qty: number) => { /* ... */ }
  const getTotalItems = () => cart.reduce((sum, item) => sum + item.quantity, 0)
  const getTotalPrice = () => cart.reduce((sum, item) => sum + item.total_price, 0)

  return {
    cart,
    activeSupplier,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice
  }
}
```

**Риск:** 10%  
**Время:** 20 минут

### 3.4. Независимые UI компоненты
**Файлы:** `components/SupplierCard.tsx`, `components/ProductCard.tsx`

Эти компоненты уже частично вынесены, но можно улучшить.

**Риск:** 5%  
**Время:** 15 минут каждый

---

## 4. ОПАСНЫЕ УЧАСТКИ (ТЕСНАЯ СВЯЗАННОСТЬ)

### 4.1. Взаимозависимые useState

#### Группа 1: Форма поставщика (ВЫСОКИЙ РИСК)
```typescript
const [supplierFormData, setSupplierFormData] = useState({ /* 30+ полей */ })
const [supplierFormStep, setSupplierFormStep] = useState(1)
const [maxSupplierStep, setMaxSupplierStep] = useState(1)
const [supplierFormErrors, setSupplierFormErrors] = useState<{[key: string]: string}>({})
const [uploadingImages, setUploadingImages] = useState<{[key: string]: boolean}>({})
const [echoCardForImport, setEchoCardForImport] = useState<any>(null)
```

**Проблема:** Эти 6 состояний тесно связаны и используются вместе в валидации, предзаполнении, навигации по шагам.

**Решение:** Создать Context + Reducer
```typescript
// context/SupplierFormContext.tsx
interface SupplierFormState {
  formData: SupplierFormData
  step: number
  maxStep: number
  errors: {[key: string]: string}
  uploadingImages: {[key: string]: boolean}
  echoCard: any | null
}

type SupplierFormAction = 
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ERRORS'; errors: {[key: string]: string} }
  | { type: 'IMPORT_ECHO_CARD'; echoCard: any }
  | { type: 'RESET_FORM' }
```

#### Группа 2: Навигация и модальные окна (СРЕДНИЙ РИСК)
```typescript
const [catalogMode, setCatalogMode] = useState<'suppliers' | 'categories'>('categories')
const [selectedRoom, setSelectedRoom] = useState<'orange' | 'blue'>('orange')
const [selectedCategoryData, setSelectedCategoryData] = useState<any>(null)
const [selectedSubcategoryData, setSelectedSubcategoryData] = useState<any>(null)
const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
const [showEchoCardsModal, setShowEchoCardsModal] = useState(false)
const [showCart, setShowCart] = useState(false)
```

**Проблема:** Состояния связаны через бизнес-логику (при смене комнаты сбрасываются категории).

**Решение:** Создать `useCatalogNavigation` hook или Context

#### Группа 3: Данные поставщиков (НИЗКИЙ РИСК)
```typescript
const [realSuppliers, setRealSuppliers] = useState<any[]>([])
const [verifiedSuppliers, setVerifiedSuppliers] = useState<any[]>([])
const [loadingSuppliers, setLoadingSuppliers] = useState(false)
const [loadingVerified, setLoadingVerified] = useState(false)
```

**Решение:** Hook `useSuppliers(room: 'orange' | 'blue')`

### 4.2. Сложные useEffect с побочными эффектами

#### КРИТИЧНЫЙ useEffect #1: URL параметры (строки 213-320)
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const categoryParam = params.get('category')
  const subcategoryParam = params.get('subcategory')
  const viewParam = params.get('view')

  // ВАРИАНТ 1: Клик на подкатегорию
  if (categoryParam && subcategoryParam && !viewParam) {
    // Ждет загрузки apiCategories через setInterval
    // Делает async запросы
    // Обновляет selectedCategoryData и selectedSubcategoryData
  }

  // ВАРИАНТ 2: Поиск по изображению
  if (categoryParam && viewParam === 'products') {
    // Тоже ждет apiCategories
    // Делает async запросы
    // Обновляет состояния
  }
}, [apiCategories])
```

**ОПАСНОСТИ:**
- Использует `setInterval` для ожидания данных (race condition!)
- Зависит от `apiCategories` (может не загрузиться)
- Делает вложенные async операции
- Обновляет несколько состояний

**НЕЛЬЗЯ ТРОГАТЬ БЕЗ:**
1. Полного понимания flow навигации
2. Тестирования всех сценариев (прямая ссылка, переход из другой страницы)
3. Миграции на правильный паттерн (React Router или Next.js router events)

#### КРИТИЧНЫЙ useEffect #2: Предзаполнение эхо карточки (строки 850-989)
```typescript
useEffect(() => {
  if (echoCardForImport && showAddSupplierModal) {
    // 140 строк логики предзаполнения!
    // Трансформация данных
    // Условная логика (selectedSteps)
    // Множественные console.log
    // setTimeout для финальной проверки
  }
}, [echoCardForImport, showAddSupplierModal])
```

**ОПАСНОСТИ:**
- 140 строк в одном useEffect (антипаттерн!)
- Зависит от двух состояний
- Включает setTimeout (асинхронность)
- Сложная трансформация данных

**РЕШЕНИЕ:** 
Вынести логику трансформации в отдельную функцию, вызывать явно при открытии модалки.

### 4.3. Функции с множественными зависимостями

#### ОПАСНАЯ функция: handleAddSupplierToPersonal (строки 1018-1119)
```typescript
const handleAddSupplierToPersonal = async (catalogSupplier: any) => {
  // Проверяет дубликаты (зависит от realSuppliers)
  // Получает session из Supabase
  // Делает fetch с AbortController
  // Обновляет loadSuppliersFromAPI() (side effect!)
  // Переключает activeMode (side effect!)
  // Показывает alert'ы
  // Управляет loading состоянием
  // Emergency timeout для сброса loading
}
```

**ЗАВИСИМОСТИ:**
- `realSuppliers` (state)
- `setLoading` (state setter)
- `setActiveMode` (state setter)
- `loadSuppliersFromAPI` (функция с side effects)
- Supabase client
- window.location.href (side effect!)

**РИСК ПРИ ВЫНОСЕ:** 95%

#### ОПАСНАЯ функция: handleSubmitSupplier (строки 1183-1380)
**Размер:** 200+ строк!

```typescript
const handleSubmitSupplier = async () => {
  // Трансформирует supplierFormData
  // Делает множественные console.log
  // Получает session
  // POST запрос для поставщика
  // Цикл для добавления товаров (forEach)
  // Логирование успеха/ошибок
  // Обновляет loadSuppliersFromAPI()
  // Сбрасывает форму
  // Закрывает модалки
  // Показывает alert'ы
}
```

**ЗАВИСИМОСТИ:**
- `supplierFormData` (30+ полей)
- `echoCardForImport` (для статистики)
- `setLoading`
- `loadSuppliersFromAPI`
- `resetSupplierForm`
- `setShowAddSupplierModal`
- Supabase client

**РИСК ПРИ ВЫНОСЕ:** 90%

---

## 5. ПЛАН ДЕКОМПОЗИЦИИ (ПОШАГОВЫЙ)

### ✅ ФАЗА 1: Подготовка (0% риска, 1 час)

**Цель:** Вынести безопасные модули без изменения page.tsx

1. **Создать типы** (10 мин)
   ```
   mkdir -p app/dashboard/catalog/types
   touch app/dashboard/catalog/types/catalog.types.ts
   ```

2. **Создать константы** (10 мин)
   ```
   mkdir -p app/dashboard/catalog/constants
   touch app/dashboard/catalog/constants/catalog.constants.ts
   ```

3. **Создать утилиты** (10 мин)
   ```
   mkdir -p app/dashboard/catalog/utils
   touch app/dashboard/catalog/utils/catalog.utils.ts
   ```

4. **Обновить импорты в page.tsx** (30 мин)
   - Заменить inline типы на импорты
   - Заменить inline константы на импорты
   - Проверить компиляцию: `npm run build`

**Проверка:** 
```bash
npm run dev
# Открыть /dashboard/catalog
# Проверить что всё работает как раньше
```

### ✅ ФАЗА 2: Сервисы API (15% риска, 2 часа)

**Цель:** Централизовать API вызовы

1. **Создать сервисы** (60 мин)
   ```
   mkdir -p app/dashboard/catalog/services
   touch app/dashboard/catalog/services/supplierService.ts
   touch app/dashboard/catalog/services/categoryService.ts
   touch app/dashboard/catalog/services/productService.ts
   touch app/dashboard/catalog/services/echoCardService.ts
   ```

2. **Перенести API функции** (40 мин)
   - `loadSuppliersFromAPI` → `SupplierService.loadUserSuppliers`
   - `loadVerifiedSuppliersFromAPI` → `SupplierService.loadVerified`
   - `loadCategoriesFromAPI` → `CategoryService.load`
   - И т.д.

3. **Обновить вызовы в page.tsx** (20 мин)
   ```typescript
   // Было:
   const loadSuppliersFromAPI = async () => { /* ... */ }
   
   // Стало:
   import { SupplierService } from './services/supplierService'
   
   const loadSuppliers = async () => {
     const session = await supabase.auth.getSession()
     const data = await SupplierService.loadUserSuppliers(session)
     setRealSuppliers(data.suppliers)
   }
   ```

**Проверка:**
- Все API вызовы работают
- Загрузка поставщиков работает
- Загрузка категорий работает

### ⚠️ ФАЗА 3: Хуки (20% риска, 3 часа)

**Цель:** Изолировать состояния в переиспользуемые хуки

1. **Создать useCart hook** (45 мин)
   ```
   touch app/dashboard/catalog/hooks/useCart.ts
   ```
   Вынести:
   - `cart`, `setCart`
   - `activeSupplier`, `setActiveSupplier`
   - `addToCart`, `removeFromCart`, `updateCartQuantity`
   - localStorage sync

2. **Создать useSuppliers hook** (60 мин)
   ```
   touch app/dashboard/catalog/hooks/useSuppliers.ts
   ```
   Вынести:
   - `realSuppliers`, `verifiedSuppliers`
   - `loadingSuppliers`, `loadingVerified`
   - `loadSuppliers()`, `loadVerified()`

3. **Создать useCategories hook** (45 мин)
   ```
   touch app/dashboard/catalog/hooks/useCategories.ts
   ```

4. **Обновить page.tsx** (30 мин)
   ```typescript
   const { cart, addToCart, removeFromCart, ... } = useCart()
   const { suppliers, loading, loadSuppliers } = useSuppliers('blue')
   ```

**Проверка:**
- Корзина работает (add/remove/localStorage)
- Загрузка поставщиков работает
- Переключение комнат работает

### 🔴 ФАЗА 4: Форма поставщика (50% риска, 6 часов)

**ВНИМАНИЕ:** Это самый опасный этап!

**Цель:** Вынести гигантскую форму добавления поставщика

1. **Создать Context** (90 мин)
   ```
   mkdir -p app/dashboard/catalog/context
   touch app/dashboard/catalog/context/SupplierFormContext.tsx
   ```

   Создать reducer для управления формой:
   ```typescript
   interface SupplierFormState {
     formData: SupplierFormData
     step: number
     maxStep: number
     errors: Record<string, string>
     uploadingImages: Record<string, boolean>
     echoCard: EchoCard | null
     loading: boolean
   }
   ```

2. **Вынести валидацию** (60 мин)
   ```
   touch app/dashboard/catalog/utils/supplierFormValidation.ts
   ```
   
   Перенести `validateSupplierStep` в отдельный файл.

3. **Разбить форму на компоненты** (120 мин)
   Компоненты уже частично созданы:
   - `AddSupplierStep1.tsx` ✅
   - `AddSupplierStep2.tsx` ✅
   - `AddSupplierStep3.tsx` ✅
   - `AddSupplierStep4.tsx` ✅
   
   Нужно:
   - Подключить к Context
   - Убедиться что валидация работает
   - Протестировать навигацию между шагами

4. **Переписать useEffect предзаполнения** (90 мин)
   
   **КРИТИЧНО!** Этот useEffect (строки 850-989) нужно переписать:
   
   ```typescript
   // Было: useEffect с 140 строками
   useEffect(() => {
     if (echoCardForImport && showAddSupplierModal) {
       // 140 строк...
     }
   }, [echoCardForImport, showAddSupplierModal])
   
   // Стало: Явная функция
   const prefillFromEchoCard = (echoCard: EchoCard) => {
     const transformedData = transformEchoCardToFormData(echoCard)
     dispatch({ type: 'IMPORT_ECHO_CARD', data: transformedData })
   }
   
   // Вызов при открытии модалки:
   const handleImportEchoCard = (echoCard: EchoCard) => {
     resetForm()
     prefillFromEchoCard(echoCard)
     setShowAddSupplierModal(true)
   }
   ```

5. **Тестирование** (60 мин)
   - Создание нового поставщика (все 7 шагов)
   - Редактирование поставщика
   - Импорт из эхо карточки
   - Валидация всех шагов
   - Загрузка изображений
   - Сохранение

**РИСКИ:**
- Может сломаться навигация по шагам
- Может сломаться валидация
- Может сломаться предзаполнение из эхо карточки
- Может сломаться загрузка изображений

**ПЛАН Б:** Если что-то сломается, откатить через git:
```bash
git checkout -- app/dashboard/catalog/page.tsx
```

### 🔴 ФАЗА 5: Модальные окна (30% риска, 4 часа)

**Цель:** Вынести большие модальные окна в отдельные компоненты

1. **Модальное окно эхо карточек** (90 мин)
   ```
   touch app/dashboard/catalog/components/EchoCardsModal.tsx
   ```
   
   Вынести JSX из page.tsx (строки 4900-5277)

2. **Модальное окно корзины** (60 мин)
   ```
   touch app/dashboard/catalog/components/CartModal.tsx
   ```
   
   Вынести JSX (строки 5282-5420)

3. **Модальное окно товара** (45 мин)
   ```
   touch app/dashboard/catalog/components/ProductModal.tsx
   ```

4. **Обновить page.tsx** (45 мин)
   ```typescript
   <EchoCardsModal 
     isOpen={showEchoCardsModal}
     onClose={() => setShowEchoCardsModal(false)}
     echoCards={echoCards}
     onImport={handleImportEchoCard}
   />
   ```

**Проверка:**
- Открытие/закрытие модалок
- Импорт из эхо карточки
- Корзина (добавление, удаление, создание проекта)

### ⚠️ ФАЗА 6: URL навигация (60% риска, 4 часа)

**ОПАСНО!** Этот useEffect (строки 213-320) - бомба замедленного действия.

**Проблема:**
```typescript
useEffect(() => {
  // Использует setInterval для ожидания данных
  const checkAndSelectCategory = setInterval(() => {
    if (apiCategories.length > 0) {
      // ...делает async операции
    }
  }, 100)
  
  setTimeout(() => clearInterval(...), 5000)
}, [apiCategories])
```

**Решение:**
1. **Создать хук useURLParams** (120 мин)
   ```typescript
   const useURLParams = (categories: Category[]) => {
     const searchParams = useSearchParams()
     
     useEffect(() => {
       if (categories.length === 0) return // Ждем загрузки
       
       const categoryParam = searchParams.get('category')
       const subcategoryParam = searchParams.get('subcategory')
       
       if (categoryParam && subcategoryParam) {
         handleCategoryFromURL(categoryParam, subcategoryParam)
       }
     }, [categories, searchParams])
   }
   ```

2. **Убрать setInterval** (60 мин)
   Заменить на условную проверку в useEffect

3. **Протестировать все сценарии** (120 мин)
   - Прямая ссылка с категорией
   - Прямая ссылка с подкатегорией
   - Переход из поиска по изображению
   - Клик по dropdown подкатегории

**РИСК:** 60% - может сломаться навигация из других страниц

### ✅ ФАЗА 7: Финальная оптимизация (10% риска, 2 часа)

**Цель:** Убрать оставшийся inline JSX

1. **Вынести карточки поставщиков** (60 мин)
   Уже есть `SupplierCard.tsx`, убедиться что используется везде

2. **Оптимизировать рендеринг** (30 мин)
   ```typescript
   const MemoizedSupplierCard = React.memo(SupplierCard)
   ```

3. **Добавить React.lazy для модалок** (30 мин)
   ```typescript
   const EchoCardsModal = lazy(() => import('./components/EchoCardsModal'))
   ```

---

## 6. ЦЕЛЕВАЯ АРХИТЕКТУРА

```
/app/dashboard/catalog/
├── page.tsx                      # 🎯 ГЛАВНЫЙ ФАЙЛ (~400 строк)
│   └── Координация всех модулей
│
├── types/
│   └── catalog.types.ts          # ✅ TypeScript интерфейсы
│
├── constants/
│   └── catalog.constants.ts      # ✅ Константы и конфигурация
│
├── utils/
│   ├── catalog.utils.ts          # ✅ Вспомогательные функции
│   └── supplierFormValidation.ts # ⚠️ Валидация формы поставщика
│
├── services/
│   ├── supplierService.ts        # ⚠️ API для поставщиков
│   ├── categoryService.ts        # ⚠️ API для категорий
│   ├── productService.ts         # ⚠️ API для товаров
│   └── echoCardService.ts        # ⚠️ API для эхо карточек
│
├── hooks/
│   ├── useCart.ts                # ⚠️ Логика корзины
│   ├── useSuppliers.ts           # ⚠️ Загрузка поставщиков
│   ├── useCategories.ts          # ⚠️ Загрузка категорий
│   ├── useURLParams.ts           # 🔴 URL навигация (ОПАСНО!)
│   ├── useSupplierDraft.ts       # ✅ УЖЕ СУЩЕСТВУЕТ
│   └── useCatalogOptimization.ts # ✅ УЖЕ СУЩЕСТВУЕТ
│
├── context/
│   ├── SupplierFormContext.tsx   # 🔴 Контекст формы (СЛОЖНО!)
│   └── AddSupplierContext.tsx    # ✅ УЖЕ СУЩЕСТВУЕТ
│
├── components/
│   ├── CatalogHeader.tsx         # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── SupplierCard.tsx          # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── ProductCard.tsx           # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── SupplierGrid.tsx          # ✅ УЖЕ СУЩЕСТВУЕТ
│   │
│   ├── AddSupplierModal.tsx      # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── AddSupplierStepper.tsx    # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── AddSupplierStep1.tsx      # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── AddSupplierStep2.tsx      # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── AddSupplierStep3.tsx      # ✅ УЖЕ СУЩЕСТВУЕТ
│   ├── AddSupplierStep4.tsx      # ✅ УЖЕ СУЩЕСТВУЕТ
│   │
│   ├── EchoCardsModal.tsx        # ⚠️ Нужно вынести
│   ├── CartModal.tsx             # ⚠️ Нужно вынести
│   ├── ProductModal.tsx          # ⚠️ Нужно вынести
│   │
│   ├── AccreditationModal.tsx    # ✅ УЖЕ СУЩЕСТВУЕТ
│   └── TemplateManager.tsx       # ✅ УЖЕ СУЩЕСТВУЕТ
│
└── modals/                       # 🆕 НОВАЯ ПАПКА ДЛЯ МОДАЛОК
    ├── EchoCardsModal.tsx
    ├── CartModal.tsx
    └── ProductModal.tsx
```

**ФИНАЛЬНЫЙ page.tsx (~400 строк):**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Хуки
import { useCart } from './hooks/useCart'
import { useSuppliers } from './hooks/useSuppliers'
import { useCategories } from './hooks/useCategories'
import { useURLParams } from './hooks/useURLParams'

// Компоненты
import { CatalogHeader } from './components/CatalogHeader'
import { SupplierGrid } from './components/SupplierGrid'
import { AddSupplierModal } from './components/AddSupplierModal'
import { EchoCardsModal } from './modals/EchoCardsModal'
import { CartModal } from './modals/CartModal'

// Контексты
import { SupplierFormProvider } from './context/SupplierFormContext'

// Типы
import type { CatalogMode, SelectedRoom } from './types/catalog.types'

export default function CatalogPage() {
  const router = useRouter()
  
  // Навигация
  const [catalogMode, setCatalogMode] = useState<CatalogMode>('categories')
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom>('orange')
  
  // Модальные окна
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showEchoCards, setShowEchoCards] = useState(false)
  
  // Хуки
  const { suppliers, loading, loadSuppliers } = useSuppliers(selectedRoom)
  const { categories } = useCategories()
  const { cart, showCart, setShowCart, addToCart, ... } = useCart()
  
  // URL параметры
  useURLParams(categories)

  return (
    <SupplierFormProvider>
      <div className="min-h-screen bg-background">
        <CatalogHeader 
          suppliersCount={suppliers.length}
          cartCount={cart.length}
          onAddSupplier={() => setShowAddSupplier(true)}
          onShowCart={() => setShowCart(true)}
          onShowEchoCards={() => setShowEchoCards(true)}
        />
        
        {/* Навигация и контент */}
        <div className="max-w-7xl mx-auto px-8 py-12">
          {catalogMode === 'suppliers' ? (
            <SupplierGrid 
              suppliers={suppliers}
              loading={loading}
              room={selectedRoom}
            />
          ) : (
            <CategoryView 
              categories={categories}
              room={selectedRoom}
            />
          )}
        </div>

        {/* Модальные окна */}
        <AddSupplierModal 
          isOpen={showAddSupplier}
          onClose={() => setShowAddSupplier(false)}
        />
        
        <EchoCardsModal 
          isOpen={showEchoCards}
          onClose={() => setShowEchoCards(false)}
        />
        
        <CartModal 
          isOpen={showCart}
          onClose={() => setShowCart(false)}
        />
      </div>
    </SupplierFormProvider>
  )
}
```

---

## 7. ПРЕДУПРЕЖДЕНИЯ О РИСКАХ

### 🔴 КРИТИЧЕСКИЕ РИСКИ

#### 1. Race Conditions в URL навигации
**Проблема:** useEffect с setInterval ждет загрузки `apiCategories`

**Сценарий поломки:**
1. Пользователь переходит по прямой ссылке `/catalog?category=X&subcategory=Y`
2. Категории еще не загрузились
3. setInterval запускается каждые 100мс
4. Категории загружаются через 500мс
5. setInterval срабатывает, находит категорию
6. НО! Если пользователь быстро кликнет на другую категорию, будет conflict

**Как избежать:**
- Использовать один useEffect с проверкой `if (categories.length === 0) return`
- Убрать setInterval
- Добавить флаг `hasProcessedURLParams` чтобы обработать только один раз

#### 2. Предзаполнение формы из эхо карточки
**Проблема:** 140 строк логики в useEffect

**Сценарий поломки:**
1. Пользователь открывает эхо карточку для импорта
2. useEffect запускается и предзаполняет форму
3. Пользователь быстро закрывает модалку
4. НО useEffect еще не закончил (setTimeout внутри!)
5. Состояние обновляется после закрытия модалки
6. При повторном открытии модалки форма в неконсистентном состоянии

**Как избежать:**
- Вынести трансформацию данных в отдельную ЧИСТУЮ функцию
- Вызывать явно при клике на кнопку импорта
- Убрать useEffect
- Использовать useReducer для атомарного обновления всего состояния

#### 3. Множественные setState в async функциях
**Проблема:** Функция `handleAddSupplierToPersonal` обновляет 3 состояния

**Сценарий поломки:**
1. Пользователь кликает "Добавить в личный список"
2. Функция запускается: setLoading(true)
3. Делается fetch запрос (3 секунды)
4. Пользователь закрывает страницу
5. Fetch возвращается, но компонента размонтирована
6. React Warning: "Can't perform a React state update on an unmounted component"

**Как избежать:**
- Использовать AbortController (уже есть!)
- Добавить cleanup в useEffect
- Проверять isMounted перед setState

### ⚠️ СРЕДНИЕ РИСКИ

#### 4. localStorage sync корзины
**Проблема:** 2 useEffect следят за корзиной

```typescript
// useEffect 1: Загрузка из localStorage
useEffect(() => {
  const saved = localStorage.getItem('catalog_cart')
  if (saved) setCart(JSON.parse(saved))
  setCartLoaded(true)
}, [])

// useEffect 2: Сохранение в localStorage
useEffect(() => {
  if (cartLoaded) {
    localStorage.setItem('catalog_cart', JSON.stringify(cart))
  }
}, [cart, cartLoaded])
```

**Проблема:** 
- При первом рендере useEffect 2 срабатывает РАНЬШЕ useEffect 1
- Перезаписывает localStorage пустым массивом
- Затем useEffect 1 загружает данные (но уже поздно!)

**Решение:**
Флаг `cartLoaded` защищает, но лучше использовать `useLayoutEffect` для синхронной загрузки.

#### 5. Фильтрация поставщиков
**Проблема:** Вычисляется на каждом рендере

```typescript
const filteredSuppliers = currentSuppliers.filter(supplier => {
  // Поиск по нескольким полям
  // Фильтрация по категории
})
```

**Риск:** Performance при большом количестве поставщиков (1000+)

**Решение:** 
```typescript
const filteredSuppliers = useMemo(() => 
  currentSuppliers.filter(...),
  [currentSuppliers, searchQuery, selectedCategoryFilter]
)
```

### ⚡ НИЗКИЕ РИСКИ

#### 6. Потеря фокуса при быстрой навигации
Если пользователь быстро переключается между комнатами, может потеряться выбранная категория.

**Решение:** Уже реализовано через `setSelectedCategoryData(null)` при смене комнаты.

#### 7. Memory leaks от незакрытых modals
Модальные окна могут оставаться в DOM после закрытия.

**Решение:** Использовать `<AnimatePresence>` от Framer Motion для правильного unmount.

---

## 8. СКРЫТЫЕ СВЯЗИ (ЧТО МОЖЕТ СЛОМАТЬСЯ)

### Связь 1: Форма поставщика ↔ Эхо карточки
```typescript
// Эти состояния связаны через useEffect:
const [echoCardForImport, setEchoCardForImport] = useState<any>(null)
const [supplierFormData, setSupplierFormData] = useState({ /* ... */ })
const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)

// При изменении echoCardForImport:
useEffect(() => {
  if (echoCardForImport && showAddSupplierModal) {
    setSupplierFormData(/* трансформированные данные */)
  }
}, [echoCardForImport, showAddSupplierModal])
```

**Если вынести форму в Context, нужно:**
1. Передать функцию `importEchoCard` в EchoCardsModal
2. Вызывать ее явно при клике на "ДОЗАПОЛНИТЬ"
3. Убрать useEffect

### Связь 2: Комнаты ↔ Категории
```typescript
// При смене комнаты сбрасываются категории:
onClick={() => {
  setSelectedRoom('orange')
  setSelectedCategoryData(null) // ← связанное состояние
}}
```

**Если вынести в hook, нужно:**
```typescript
const { selectedRoom, setRoom } = useRoom({
  onRoomChange: () => {
    setSelectedCategoryData(null) // callback
  }
})
```

### Связь 3: Корзина ↔ Активный поставщик
```typescript
const [cart, setCart] = useState<any[]>([])
const [activeSupplier, setActiveSupplier] = useState<string | null>(null)

const addToCart = (product: any) => {
  // Проверка: товар от того же поставщика?
  if (activeSupplier && activeSupplier !== product.supplier_name) {
    // Сбросить корзину или показать warning
  }
}
```

**При выносе в hook нужно сохранить эту логику!**

### Связь 4: URL параметры ↔ Загруженные категории
```typescript
// URL обрабатывается ТОЛЬКО после загрузки категорий:
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  
  const checkAndSelectCategory = setInterval(() => {
    if (apiCategories.length > 0) { // ← зависимость
      // обработать URL
    }
  }, 100)
}, [apiCategories])
```

**При выносе нужно:**
- Гарантировать что categories загружены
- Обработать случай когда categories пустые (fallback)
- Убрать setInterval (anti-pattern)

---

## 9. ОЦЕНКА ВРЕМЕНИ И СЛОЖНОСТИ

### Таблица сложности фаз:

| Фаза | Описание | Риск | Время | Навыки | Можно делать постепенно? |
|------|----------|------|-------|--------|--------------------------|
| 1 | Типы, константы, утилиты | 0% | 1 час | Junior | ✅ Да |
| 2 | Сервисы API | 15% | 2 часа | Middle | ✅ Да |
| 3 | Хуки (cart, suppliers) | 20% | 3 часа | Middle | ✅ Да |
| 4 | Форма поставщика | 50% | 6 часов | Senior | ⚠️ Осторожно |
| 5 | Модальные окна | 30% | 4 часа | Middle | ✅ Да |
| 6 | URL навигация | 60% | 4 часа | Senior | ❌ Нет |
| 7 | Оптимизация | 10% | 2 часа | Middle | ✅ Да |

**ИТОГО:** 22 часа (3 рабочих дня)

### Навыки необходимые:

**Junior уровень:**
- TypeScript интерфейсы
- Вынос констант
- Простые утилиты

**Middle уровень:**
- React hooks
- Context API
- Async/await
- localStorage
- API интеграция
- Code splitting

**Senior уровень:**
- useReducer + Context для сложных форм
- Race conditions и их решение
- Performance оптимизация
- Архитектурные решения
- Миграция без breaking changes

---

## 10. СТРАТЕГИЯ ВЫПОЛНЕНИЯ

### Вариант A: Агрессивная декомпозиция (3 дня)
**Когда:** Есть 3 полных дня, можно рискнуть

**День 1:**
- Фаза 1: Типы, константы, утилиты (1 час)
- Фаза 2: Сервисы API (2 часа)
- Фаза 3: Хуки (3 часа)
- Тестирование (1 час)

**День 2:**
- Фаза 4: Форма поставщика (6 часов)
- Тестирование всех сценариев (1 час)

**День 3:**
- Фаза 5: Модальные окна (4 часа)
- Фаза 6: URL навигация (4 часа)
- Фаза 7: Оптимизация (2 часа)
- Финальное тестирование (1 час)

**Риск:** 40%
**Результат:** page.tsx ~400 строк

### Вариант B: Консервативная декомпозиция (2 недели)
**Когда:** Нельзя рисковать, есть production

**Неделя 1:**
- Понедельник: Фаза 1 (типы, константы)
- Вторник: Фаза 2 (сервисы API)
- Среда: Фаза 3 (хуки cart, suppliers)
- Четверг: Тестирование, багфиксы
- Пятница: Code review, деплой

**Неделя 2:**
- Понедельник: Фаза 5 (модальные окна)
- Вторник: Фаза 7 (оптимизация)
- Среда: Тестирование
- Четверг: Фаза 4 (форма поставщика) - половина
- Пятница: Фаза 4 (форма поставщика) - завершение

**Риск:** 10%
**Результат:** page.tsx ~800 строк (но чище!)

### Вариант C: Гибридный (1 неделя)
**Когда:** Золотая середина

**Этапы:**
1. Безопасные модули (Фазы 1-3) - 2 дня
2. Тестирование и стабилизация - 1 день
3. Модальные окна (Фаза 5) - 1 день
4. Оптимизация (Фаза 7) - 1 день

**НЕ ТРОГАЕМ:**
- Форму поставщика (Фаза 4) - оставить как есть
- URL навигацию (Фаза 6) - оставить как есть

**Риск:** 15%
**Результат:** page.tsx ~1200 строк (но модульно!)

---

## 11. ЧЕКЛИСТ ПЕРЕД НАЧАЛОМ

### Подготовка:
- [ ] Создать feature branch: `git checkout -b refactor/catalog-decomposition`
- [ ] Убедиться что есть backup: `git commit -m "checkpoint: before decomposition"`
- [ ] Настроить TypeScript strict mode (если нет)
- [ ] Убедиться что есть ESLint
- [ ] Прочитать этот документ полностью

### Перед каждой фазой:
- [ ] Создать checkpoint commit
- [ ] Написать тесты (если есть тестовое окружение)
- [ ] Понять зависимости модуля
- [ ] Проверить что `npm run build` проходит

### После каждой фазы:
- [ ] `npm run build` - компиляция без ошибок
- [ ] `npm run dev` - приложение запускается
- [ ] Ручное тестирование функциональности
- [ ] Commit изменений: `git commit -m "refactor: phase X completed"`

### Перед merge в main:
- [ ] Все фазы завершены
- [ ] Все тесты проходят
- [ ] Code review пройден
- [ ] Production билд работает
- [ ] Performance не ухудшился

---

## 12. ПЛАН Б (ОТКАТ)

### Если что-то сломалось:

**Уровень 1: Мелкая ошибка**
```bash
# Откатить последний коммит
git reset --soft HEAD~1
# Исправить ошибку
# Повторить коммит
```

**Уровень 2: Фаза провалилась**
```bash
# Откатить все коммиты фазы
git reset --hard <commit_before_phase>
# Или
git revert <commit1> <commit2> <commit3>
```

**Уровень 3: Всё сломалось**
```bash
# Полный откат к началу
git checkout main
git branch -D refactor/catalog-decomposition
# Начать заново с меньшим scope
```

---

## 13. ФИНАЛЬНЫЕ РЕКОМЕНДАЦИИ

### ✅ ДЕЛАТЬ:
1. **Начать с безопасных модулей** (Фазы 1-3)
2. **Коммитить часто** - после каждого успешного шага
3. **Тестировать после каждого изменения**
4. **Использовать TypeScript strict mode**
5. **Документировать изменения** в CHANGELOG.md
6. **Делать code review** перед merge
7. **Измерять performance** до и после

### ❌ НЕ ДЕЛАТЬ:
1. **Менять несколько вещей одновременно**
2. **Удалять код без backup**
3. **Рефакторить без тестов**
4. **Менять логику вместе со структурой**
5. **Игнорировать TypeScript ошибки**
6. **Пропускать тестирование**
7. **Делать force push в main**

### 🎯 ПРИОРИТЕТЫ:

**Высокий приоритет** (делать обязательно):
- Фаза 1: Типы и константы
- Фаза 2: Сервисы API
- Фаза 3: Хуки

**Средний приоритет** (делать желательно):
- Фаза 5: Модальные окна
- Фаза 7: Оптимизация

**Низкий приоритет** (можно отложить):
- Фаза 4: Форма поставщика (работает, не трогать!)
- Фаза 6: URL навигация (работает, но страшно!)

### 🚀 МЕТРИКИ УСПЕХА:

После декомпозиции должно быть:
- ✅ page.tsx < 1000 строк (сейчас 5436)
- ✅ < 20 useState в page.tsx (сейчас 53)
- ✅ < 5 useEffect в page.tsx (сейчас 10)
- ✅ Нет inline JSX компонентов
- ✅ Все типы вынесены
- ✅ Все API вызовы в сервисах
- ✅ TypeScript strict mode без ошибок
- ✅ Performance не хуже
- ✅ Все функции работают как раньше

---

## 14. КОНТРОЛЬНЫЕ ТОЧКИ ТЕСТИРОВАНИЯ

### Тестировать после каждой фазы:

#### После Фазы 1-3:
- [ ] Страница загружается
- [ ] Поставщики отображаются
- [ ] Категории отображаются
- [ ] Поиск работает
- [ ] Фильтры работают
- [ ] Переключение комнат работает

#### После Фазы 4 (форма):
- [ ] Открытие модалки добавления поставщика
- [ ] Навигация по всем 7 шагам
- [ ] Валидация на каждом шаге
- [ ] Загрузка логотипа
- [ ] Добавление товаров
- [ ] Загрузка изображений товаров
- [ ] Сохранение поставщика
- [ ] Импорт из эхо карточки

#### После Фазы 5 (модалки):
- [ ] Открытие эхо карточек
- [ ] Импорт поставщика
- [ ] Открытие корзины
- [ ] Добавление в корзину
- [ ] Удаление из корзины
- [ ] Создание проекта из корзины

#### После Фазы 6 (URL):
- [ ] Прямая ссылка на категорию
- [ ] Прямая ссылка на подкатегорию
- [ ] Переход из поиска по изображению
- [ ] Клик по dropdown подкатегории

---

## ЗАКЛЮЧЕНИЕ

**Текущее состояние:** 5436 строк - монолитный компонент-монстр  
**Целевое состояние:** ~400-800 строк - модульная архитектура  

**Общий риск декомпозиции:** 35-40% (средне-высокий)  
**Рекомендуемая стратегия:** Вариант C (Гибридный, 1 неделя)  

**Критически важно:**
- НЕ менять логику, только структуру
- Тестировать после каждого изменения
- Коммитить часто
- Иметь план отката

**Награда:**
- Чистый код
- Легкая поддержка
- Возможность параллельной работы
- Переиспользуемые модули
- Проще добавлять фичи

Удачи в рефакторинге! 🚀
