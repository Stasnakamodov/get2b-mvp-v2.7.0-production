# CATALOG PAGE - ПОШАГОВЫЙ ПЛАН ДЕЙСТВИЙ

> **Статус:** Готов к выполнению
> **Оценка времени:** 1 неделя (гибридный подход)
> **Общий риск:** 15% (приемлемо для production)

---

## ЧТО СДЕЛАНО (АНАЛИЗ)

✅ Проанализирован файл page.tsx (5436 строк, 293.6 KB)
✅ Идентифицированы 53 useState, 10 useEffect, 17 API вызовов
✅ Определены безопасные и опасные участки
✅ Составлен план декомпозиции
✅ Оценены риски каждого этапа
✅ Созданы документы:
   - CATALOG_PAGE_DECOMPOSITION_ANALYSIS.md (полный анализ)
   - CATALOG_DECOMPOSITION_QUICK_GUIDE.md (краткое руководство)
   - CATALOG_DEPENDENCY_DIAGRAM.md (визуальные диаграммы)

---

## ЧТО ДЕЛАТЬ ПРЯМО СЕЙЧАС

### ДЕНЬ 1: Подготовка и безопасные модули (2 часа)

#### Шаг 1: Создать ветку и backup (5 минут)
```bash
cd /Users/user/Desktop/godplisgomvp-forvercel
git status  # проверить что нет незакоммиченных изменений
git checkout -b refactor/catalog-decomposition
git commit --allow-empty -m "checkpoint: начало декомпозиции catalog page"
```

#### Шаг 2: Создать структуру папок (5 минут)
```bash
cd app/dashboard/catalog

# Создать директории
mkdir -p types constants utils services hooks modals

# Проверить структуру
ls -la
```

#### Шаг 3: Вынести типы (15 минут)
```bash
touch types/catalog.types.ts
```

**Скопировать в `types/catalog.types.ts`:**
```typescript
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
  total_projects?: number
  successful_projects?: number
  cancelled_projects?: number
  total_spent?: number
  payment_methods?: {
    bank?: {
      bank_name: string
      account_number: string
      swift_code?: string
    }
    card?: {
      bank: string
      number: string
      holder?: string
    }
    crypto?: {
      network: string
      address: string
    }
  }
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
  supplier_id?: string
  supplier_type?: string
  sku?: string
  currency?: string
  min_order?: string
  in_stock?: boolean
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
  supplier_info: Partial<Supplier>
  products: string[]
  products_detailed?: Array<{
    name: string
    price?: string
    quantity?: string
    image_url?: string
  }>
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
  selectedSteps?: {
    step2_products: boolean
    step4_payment: boolean
    step5_requisites: boolean
  }
}

export type CatalogMode = 'suppliers' | 'categories'
export type SelectedRoom = 'orange' | 'blue'
export type ModalTab = 'info' | 'products' | 'management'

export interface SupplierFormData {
  name: string
  company_name: string
  category: string
  country: string
  city: string
  description: string
  logo_url: string
  email: string
  phone: string
  website: string
  contact_person: string
  min_order: string
  response_time: string
  employees: string
  established: string
  certifications: string[]
  specialties: string[]
  products: Product[]
  payment_methods: string[]
  payment_method: string
  bank_name: string
  bank_account: string
  swift_code: string
  bank_address: string
  payment_terms: string
  currency: string
  card_bank?: string
  card_number?: string
  card_holder?: string
  crypto_network?: string
  crypto_address?: string
}
```

#### Шаг 4: Вынести константы (15 минут)
```bash
touch constants/catalog.constants.ts
```

**Скопировать в `constants/catalog.constants.ts`:**
```typescript
import { Building, Phone, Users, CheckCircle, Package, Zap } from 'lucide-react'

export const productsPerPage = 8

export const allowedImageTypes = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/svg+xml'
]

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
  { value: 'machinery', label: 'ОБОРУДОВАНИЕ' },
  { value: 'textiles', label: 'ТЕКСТИЛЬ' },
  { value: 'construction', label: 'СТРОЙМАТЕРИАЛЫ' },
  { value: 'food', label: 'ПРОДУКТЫ' },
  { value: 'automotive', label: 'АВТОЗАПЧАСТИ' },
  { value: 'chemicals', label: 'ХИМИЯ' },
  { value: 'packaging', label: 'УПАКОВКА' }
]
```

#### Шаг 5: Вынести утилиты (15 минут)
```bash
touch utils/catalog.utils.ts
```

**Скопировать в `utils/catalog.utils.ts`:**
```typescript
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

export const validateEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email)
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return `${currency} ${amount.toLocaleString()}`
}
```

#### Шаг 6: Обновить импорты в page.tsx (20 минут)

В начале файла `page.tsx` добавить:
```typescript
import type { 
  Supplier, 
  Product, 
  CartItem, 
  EchoCard,
  CatalogMode,
  SelectedRoom,
  SupplierFormData
} from './types/catalog.types'

import { 
  productsPerPage,
  allowedImageTypes,
  maxImageSize,
  supplierSteps,
  categories
} from './constants/catalog.constants'

import { 
  toRoman, 
  convertToBase64,
  validateEmail,
  formatCurrency
} from './utils/catalog.utils'
```

Удалить inline определения этих типов и констант из page.tsx.

#### Шаг 7: Тестирование (15 минут)
```bash
# Проверить компиляцию
npm run build

# Если ошибки - исправить импорты
# Если OK - запустить dev server
npm run dev

# Открыть http://localhost:3000/dashboard/catalog
# Проверить что всё работает как раньше
```

#### Шаг 8: Коммит (5 минут)
```bash
git add app/dashboard/catalog/types/
git add app/dashboard/catalog/constants/
git add app/dashboard/catalog/utils/
git add app/dashboard/catalog/page.tsx
git commit -m "refactor(catalog): extract types, constants, and utils

- Created types/catalog.types.ts with all TypeScript interfaces
- Created constants/catalog.constants.ts with configuration
- Created utils/catalog.utils.ts with helper functions
- Updated page.tsx imports

No functional changes, only code organization.
Risk: 0%"
```

---

### ДЕНЬ 2: Сервисы API (3 часа)

#### Шаг 1: Создать сервис поставщиков (60 минут)
```bash
touch services/supplierService.ts
```

**Код `services/supplierService.ts`:**
```typescript
import type { Supplier } from '../types/catalog.types'

export class SupplierService {
  /**
   * Загрузить пользовательских поставщиков
   */
  static async loadUserSuppliers(accessToken: string): Promise<Supplier[]> {
    try {
      const response = await fetch('/api/catalog/user-suppliers', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.suppliers || []
    } catch (error) {
      console.error('Error loading user suppliers:', error)
      return []
    }
  }

  /**
   * Загрузить аккредитованных поставщиков
   */
  static async loadVerifiedSuppliers(): Promise<Supplier[]> {
    try {
      const response = await fetch('/api/catalog/verified-suppliers')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.suppliers || []
    } catch (error) {
      console.error('Error loading verified suppliers:', error)
      return []
    }
  }

  /**
   * Создать нового поставщика
   */
  static async createSupplier(
    supplierData: Partial<Supplier>,
    accessToken: string
  ): Promise<Supplier> {
    const response = await fetch('/api/catalog/user-suppliers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(supplierData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create supplier')
    }
    
    const data = await response.json()
    return data.supplier
  }

  /**
   * Импортировать поставщика из каталога в личный список
   */
  static async importSupplier(
    verifiedSupplierId: string,
    accessToken: string
  ): Promise<Supplier> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch('/api/catalog/import-supplier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ verified_supplier_id: verifiedSupplierId }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import supplier')
      }

      const data = await response.json()
      return data.supplier
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
  }

  /**
   * Загрузить товары поставщика
   */
  static async loadSupplierProducts(
    supplierId: string,
    supplierType: 'user' | 'verified',
    accessToken?: string
  ): Promise<any[]> {
    try {
      const headers: HeadersInit = supplierType === 'user' && accessToken
        ? { 'Authorization': `Bearer ${accessToken}` }
        : {}

      const response = await fetch(
        `/api/catalog/products?supplier_id=${supplierId}&supplier_type=${supplierType}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error('Error loading supplier products:', error)
      return []
    }
  }
}
```

#### Шаг 2: Создать сервис категорий (30 минут)
```bash
touch services/categoryService.ts
```

**Код `services/categoryService.ts`:**
```typescript
export class CategoryService {
  /**
   * Загрузить все категории
   */
  static async loadCategories(): Promise<any[]> {
    try {
      const response = await fetch('/api/catalog/categories')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.categories || []
    } catch (error) {
      console.error('Error loading categories:', error)
      return []
    }
  }

  /**
   * Загрузить подкатегории для категории
   */
  static async loadSubcategories(categoryId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/catalog/categories/${categoryId}/subcategories`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.subcategories || []
    } catch (error) {
      console.error('Error loading subcategories:', error)
      return []
    }
  }
}
```

#### Шаг 3: Создать сервис эхо карточек (30 минут)
```bash
touch services/echoCardService.ts
```

**Код `services/echoCardService.ts`:**
```typescript
import type { EchoCard } from '../types/catalog.types'

export class EchoCardService {
  /**
   * Загрузить эхо карточки пользователя
   */
  static async loadEchoCards(userId: string): Promise<EchoCard[]> {
    try {
      const response = await fetch(`/api/catalog/echo-cards?user_id=${userId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data.echo_cards || []
    } catch (error) {
      console.error('Error loading echo cards:', error)
      return []
    }
  }

  /**
   * Импортировать поставщика из эхо карточки
   */
  static async importFromEchoCard(
    userId: string,
    supplierKey: string,
    supplierData: any,
    products: any[]
  ): Promise<any> {
    const response = await fetch('/api/catalog/echo-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        supplier_key: supplierKey,
        supplier_data: supplierData,
        products: products
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to import from echo card')
    }

    return response.json()
  }
}
```

#### Шаг 4: Обновить page.tsx для использования сервисов (45 минут)

Заменить функции в page.tsx:

```typescript
import { SupplierService } from './services/supplierService'
import { CategoryService } from './services/categoryService'
import { EchoCardService } from './services/echoCardService'

// БЫЛО:
const loadSuppliersFromAPI = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch('/api/catalog/user-suppliers', ...)
  // ... много кода
}

// СТАЛО:
const loadSuppliersFromAPI = async () => {
  setLoadingSuppliers(true)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      const suppliers = await SupplierService.loadUserSuppliers(session.access_token)
      setRealSuppliers(suppliers)
    }
  } catch (error) {
    console.error('Error loading suppliers:', error)
    setRealSuppliers([])
  } finally {
    setLoadingSuppliers(false)
  }
}

// Аналогично для loadVerifiedSuppliersFromAPI, loadCategoriesFromAPI, loadEchoCards
```

#### Шаг 5: Тестирование (15 минут)
```bash
npm run build
npm run dev

# Проверить:
# - Загрузка поставщиков (синяя комната)
# - Загрузка verified поставщиков (оранжевая комната)
# - Загрузка категорий
# - Импорт поставщика из каталога
# - Загрузка товаров поставщика
```

#### Шаг 6: Коммит (5 минут)
```bash
git add app/dashboard/catalog/services/
git add app/dashboard/catalog/page.tsx
git commit -m "refactor(catalog): extract API services

- Created SupplierService for supplier operations
- Created CategoryService for category operations
- Created EchoCardService for echo card operations
- Simplified page.tsx by delegating API calls to services

Risk: 15%"
```

---

### ДЕНЬ 3-4: Хуки (5 часов)

#### Создать useCart hook (90 минут)
```bash
touch hooks/useCart.ts
```

**Код `hooks/useCart.ts`:**
```typescript
import { useState, useEffect } from 'react'
import type { CartItem } from '../types/catalog.types'

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null)
  const [cartLoaded, setCartLoaded] = useState(false)
  const [showCart, setShowCart] = useState(false)

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('catalog_cart')
      const savedSupplier = localStorage.getItem('catalog_active_supplier')

      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch (error) {
          console.error('Error loading cart from localStorage:', error)
        }
      }

      if (savedSupplier) {
        setActiveSupplier(savedSupplier)
      }

      setCartLoaded(true)
    }
  }, [])

  // Сохранение корзины в localStorage
  useEffect(() => {
    if (cartLoaded && typeof window !== 'undefined') {
      localStorage.setItem('catalog_cart', JSON.stringify(cart))
    }
  }, [cart, cartLoaded])

  // Сохранение активного поставщика
  useEffect(() => {
    if (cartLoaded && typeof window !== 'undefined') {
      if (activeSupplier) {
        localStorage.setItem('catalog_active_supplier', activeSupplier)
      } else {
        localStorage.removeItem('catalog_active_supplier')
      }
    }
  }, [activeSupplier, cartLoaded])

  /**
   * Добавить товар в корзину
   */
  const addToCart = (product: any) => {
    // Проверка: товар от того же поставщика?
    if (activeSupplier && activeSupplier !== product.supplier_name) {
      const confirmChange = window.confirm(
        `В корзине уже есть товары от "${activeSupplier}". Хотите начать новый проект с "${product.supplier_name}"?`
      )
      if (!confirmChange) return

      // Очистить корзину и сменить поставщика
      setCart([])
      setActiveSupplier(product.supplier_name)
    } else if (!activeSupplier) {
      setActiveSupplier(product.supplier_name)
    }

    const existingItem = cart.find(item => item.id === product.id)

    if (existingItem) {
      // Увеличить количество
      setCart(cart.map(item =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              total_price: (item.quantity + 1) * item.price
            }
          : item
      ))
    } else {
      // Добавить новый товар
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        quantity: 1,
        total_price: parseFloat(product.price) || 0,
        supplier_name: product.supplier_name || activeSupplier || '',
        supplier_id: product.supplier_id || '',
        images: product.images || [],
        currency: product.currency || 'USD'
      }
      setCart([...cart, newItem])
    }
  }

  /**
   * Удалить товар из корзины
   */
  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.id !== productId)
    setCart(updatedCart)

    // Если корзина пуста, сбросить активного поставщика
    if (updatedCart.length === 0) {
      setActiveSupplier(null)
    }
  }

  /**
   * Обновить количество товара
   */
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item =>
      item.id === productId
        ? {
            ...item,
            quantity,
            total_price: quantity * item.price
          }
        : item
    ))
  }

  /**
   * Очистить корзину
   */
  const clearCart = () => {
    setCart([])
    setActiveSupplier(null)
  }

  /**
   * Получить общее количество товаров
   */
  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  /**
   * Получить общую стоимость
   */
  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0)
  }

  return {
    cart,
    activeSupplier,
    cartLoaded,
    showCart,
    setShowCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice
  }
}
```

#### Создать useSuppliers hook (90 минут)

**Остальные хуки создаются аналогично...**

---

### ДЕНЬ 5: Модальные окна (4 часа)

...продолжение плана...

---

## КРИТЕРИИ ЗАВЕРШЕНИЯ

Работа считается завершенной когда:

- [ ] page.tsx уменьшился с 5436 до < 1200 строк
- [ ] Все типы вынесены в types/
- [ ] Все константы вынесены в constants/
- [ ] Все API вызовы в services/
- [ ] Корзина в хуке useCart
- [ ] npm run build проходит без ошибок
- [ ] TypeScript strict mode без ошибок
- [ ] Все функции работают как раньше
- [ ] Performance не ухудшился
- [ ] Код review пройден

---

## МЕТРИКИ УСПЕХА

**ДО:**
- 5436 строк
- 53 useState
- 10 useEffect
- 293.6 KB

**ПОСЛЕ (целевые показатели):**
- < 1200 строк (78% сокращение)
- < 20 useState (62% сокращение)
- < 5 useEffect (50% сокращение)
- Модульная архитектура
- Переиспользуемые компоненты

---

## ДОПОЛНИТЕЛЬНЫЕ МАТЕРИАЛЫ

1. Полный анализ: `CATALOG_PAGE_DECOMPOSITION_ANALYSIS.md`
2. Быстрый гайд: `CATALOG_DECOMPOSITION_QUICK_GUIDE.md`
3. Диаграммы: `CATALOG_DEPENDENCY_DIAGRAM.md`
4. Этот план: `CATALOG_REFACTORING_ACTION_PLAN.md`

---

**Создано:** 2025-11-29
**Готовность:** 100%
**Можно начинать:** ДА
