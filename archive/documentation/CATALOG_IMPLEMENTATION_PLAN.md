# 🚀 ПЛАН РЕАЛИЗАЦИИ КАТАЛОГА ПОСТАВЩИКОВ

## 🎯 **ТЕКУЩЕЕ СОСТОЯНИЕ**

### ✅ **ЧТО УЖЕ ЕСТЬ:**
- **База данных:** Таблицы `catalog_suppliers` и `catalog_products` созданы ✅
- **UI каталога:** Страница `/dashboard/catalog` работает ✅  
- **Модальное окно:** Добавление поставщика реализовано ✅
- **Архитектура 7 шагов:** Полностью функциональна ✅
- **Telegram интеграция:** Готова для расширения ✅

### 🔍 **ЧТО НУЖНО ДОДЕЛАТЬ:**
- **API эндпоинты** для каталога 🔄
- **Хуки** для работы с данными каталога 🔄
- **Интеграция** каталога с 7 шагами 🔄
- **Система модерации** через Telegram 🔄

---

## 📋 **ФАЗА 1: БАЗА ДАННЫХ И API** (Первоочередная)

### 🗂️ **1.1 Обновление структуры БД**

#### SQL для выполнения в Supabase:
```sql
-- ==========================================
-- ДОБАВЛЕНИЕ ПОЛЕЙ В ТАБЛИЦУ PROJECTS
-- ==========================================

-- Добавить поля для связи с каталогом поставщиков
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES catalog_suppliers(id),
ADD COLUMN IF NOT EXISTS supplier_type text CHECK (supplier_type IN ('catalog', 'personal')),
ADD COLUMN IF NOT EXISTS supplier_data jsonb;

-- Добавить индексы для производительности
CREATE INDEX IF NOT EXISTS idx_projects_supplier_id ON projects(supplier_id);
CREATE INDEX IF NOT EXISTS idx_projects_supplier_type ON projects(supplier_type);

-- ==========================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS)
-- ==========================================

-- Включить RLS для таблиц каталога
ALTER TABLE catalog_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;

-- Политики для catalog_suppliers
DROP POLICY IF EXISTS "Публичное чтение одобренных поставщиков" ON catalog_suppliers;
CREATE POLICY "Публичное чтение одобренных поставщиков" ON catalog_suppliers
  FOR SELECT USING (status = 'approved' AND active = true);

DROP POLICY IF EXISTS "Пользователи могут добавлять поставщиков" ON catalog_suppliers;
CREATE POLICY "Пользователи могут добавлять поставщиков" ON catalog_suppliers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Пользователи могут редактировать свои записи" ON catalog_suppliers;
CREATE POLICY "Пользователи могут редактировать свои записи" ON catalog_suppliers
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для catalog_products
DROP POLICY IF EXISTS "Публичное чтение товаров" ON catalog_products;
CREATE POLICY "Публичное чтение товаров" ON catalog_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM catalog_suppliers 
      WHERE id = catalog_products.supplier_id 
      AND status = 'approved' 
      AND active = true
    )
  );

DROP POLICY IF EXISTS "Владельцы могут управлять товарами" ON catalog_products;
CREATE POLICY "Владельцы могут управлять товарами" ON catalog_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM catalog_suppliers 
      WHERE id = catalog_products.supplier_id 
      AND user_id = auth.uid()
    )
  );
```

### 📡 **1.2 Создание API эндпоинтов**

#### **Файл:** `/app/api/catalog/suppliers/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// GET - Получение списка поставщиков
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const country = searchParams.get('country')
    const verified = searchParams.get('verified')
    
    let query = supabase
      .from('catalog_suppliers')
      .select(`
        *,
        catalog_products (
          id, name, price, currency, in_stock
        )
      `)
      .eq('active', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    
    if (country) {
      query = query.eq('country', country)
    }
    
    if (verified === 'true') {
      query = query.eq('verified', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ [API] Ошибка получения поставщиков:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Поставщики загружены:', data?.length)
    return NextResponse.json({ suppliers: data })
    
  } catch (error) {
    console.error('❌ [API] Критическая ошибка:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Добавление нового поставщика
export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supplierData = await request.json()
    
    // Валидация обязательных полей
    if (!supplierData.name || !supplierData.category || !supplierData.country) {
      return NextResponse.json({ 
        error: 'Отсутствуют обязательные поля: name, category, country' 
      }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('catalog_suppliers')
      .insert([{
        ...supplierData,
        user_id: user.id,
        status: 'pending', // отправить на модерацию
        verified: false,
        active: false
      }])
      .select()
      .single()
    
    if (error) {
      console.error('❌ [API] Ошибка создания поставщика:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Поставщик создан:', data.id)
    
    // Отправить на модерацию в Telegram
    await submitSupplierForModeration(data.id)
    
    return NextResponse.json({ supplier: data })
    
  } catch (error) {
    console.error('❌ [API] Критическая ошибка:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Функция отправки на модерацию
async function submitSupplierForModeration(supplierId: string) {
  try {
    const response = await fetch('/api/telegram/send-supplier-moderation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId })
    })
    
    if (!response.ok) {
      console.warn('⚠️ [API] Не удалось отправить на модерацию в Telegram')
    }
  } catch (error) {
    console.warn('⚠️ [API] Ошибка отправки на модерацию:', error)
  }
}
```

#### **Файл:** `/app/api/catalog/products/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

// GET - Получение товаров поставщика
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplier_id')
    const inStock = searchParams.get('in_stock')
    
    if (!supplierId) {
      return NextResponse.json({ 
        error: 'supplier_id обязателен' 
      }, { status: 400 })
    }
    
    let query = supabase
      .from('catalog_products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
    
    if (inStock === 'true') {
      query = query.eq('in_stock', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('❌ [API] Ошибка получения товаров:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('✅ [API] Товары загружены:', data?.length)
    return NextResponse.json({ products: data })
    
  } catch (error) {
    console.error('❌ [API] Критическая ошибка:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### **Файл:** `/app/api/telegram/send-supplier-moderation/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { sendTelegramMessage } from "@/lib/telegram"

export async function POST(request: NextRequest) {
  try {
    const { supplierId } = await request.json()
    
    if (!supplierId) {
      return NextResponse.json({ error: 'supplierId обязателен' }, { status: 400 })
    }
    
    // Загрузить данные поставщика
    const { data: supplier, error } = await supabase
      .from('catalog_suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()
    
    if (error || !supplier) {
      return NextResponse.json({ error: 'Поставщик не найден' }, { status: 404 })
    }
    
    // Отправить в Telegram
    const message = `🏪 Новый поставщик на модерацию:

📍 ${supplier.name} (${supplier.country})
🏢 ${supplier.company_name || 'Не указано'}
📧 ${supplier.email || 'Не указано'}
📱 ${supplier.phone || 'Не указано'}
🌐 ${supplier.website || 'Не указано'}

📝 Описание: ${supplier.description || 'Не указано'}
💰 Минимальный заказ: ${supplier.min_order || 'Не указано'}
⏱️ Время ответа: ${supplier.response_time || 'Не указано'}`
    
    const result = await sendTelegramMessage({
      text: message,
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Одобрить', callback_data: `approve_supplier_${supplierId}` },
          { text: '❌ Отклонить', callback_data: `reject_supplier_${supplierId}` }
        ]]
      }
    })
    
    console.log('✅ [TELEGRAM] Уведомление о модерации отправлено:', result)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Поставщик отправлен на модерацию' 
    })
    
  } catch (error) {
    console.error('❌ [TELEGRAM] Ошибка отправки на модерацию:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка отправки на модерацию' 
    }, { status: 500 })
  }
}
```

### 🔧 **1.3 Создание хуков**

#### **Файл:** `/hooks/useCatalogSuppliers.ts`
```typescript
import { useState, useEffect } from 'react'
import { CatalogSupplier } from '@/lib/types'

interface UseCatalogSuppliersOptions {
  category?: string
  country?: string
  verified?: boolean
}

export function useCatalogSuppliers(options?: UseCatalogSuppliersOptions) {
  const [suppliers, setSuppliers] = useState<CatalogSupplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchSuppliers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams()
      if (options?.category) queryParams.set('category', options.category)
      if (options?.country) queryParams.set('country', options.country)
      if (options?.verified) queryParams.set('verified', 'true')
      
      const response = await fetch(`/api/catalog/suppliers?${queryParams}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки поставщиков')
      }
      
      setSuppliers(data.suppliers || [])
      console.log('✅ [HOOK] Поставщики загружены:', data.suppliers?.length)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(errorMessage)
      console.error('❌ [HOOK] Ошибка загрузки поставщиков:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchSuppliers()
  }, [options?.category, options?.country, options?.verified])
  
  return { 
    suppliers, 
    loading, 
    error, 
    refetch: fetchSuppliers 
  }
}
```

#### **Файл:** `/hooks/useCatalogProducts.ts`  
```typescript
import { useState, useEffect } from 'react'
import { CatalogProduct } from '@/lib/types'

export function useCatalogProducts(supplierId: string | null) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchProducts = async () => {
    if (!supplierId) {
      setProducts([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const queryParams = new URLSearchParams({
        supplier_id: supplierId,
        in_stock: 'true'
      })
      
      const response = await fetch(`/api/catalog/products?${queryParams}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки товаров')
      }
      
      setProducts(data.products || [])
      console.log('✅ [HOOK] Товары загружены:', data.products?.length)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(errorMessage)
      console.error('❌ [HOOK] Ошибка загрузки товаров:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchProducts()
  }, [supplierId])
  
  return { 
    products, 
    loading, 
    error, 
    refetch: fetchProducts 
  }
}
```

#### **Файл:** `/hooks/useAddSupplier.ts`
```typescript
import { useState } from 'react'
import { CatalogSupplier } from '@/lib/types'

export function useAddSupplier() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const addSupplier = async (supplierData: Partial<CatalogSupplier>) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const response = await fetch('/api/catalog/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка добавления поставщика')
      }
      
      setSuccess(true)
      console.log('✅ [HOOK] Поставщик добавлен:', data.supplier.id)
      
      return data.supplier
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setError(errorMessage)
      console.error('❌ [HOOK] Ошибка добавления поставщика:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  return { 
    addSupplier, 
    loading, 
    error, 
    success 
  }
}
```

---

## 📋 **ФАЗА 2: ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС**

### 🎨 **2.1 Обновление CatalogPage**

#### Интеграция кнопки "Начать проект":
```typescript
// В файле app/dashboard/catalog/page.tsx добавить:

const handleStartProject = (supplier: CatalogSupplier) => {
  // Создать проект и перейти на Step1 с предзаполнением
  router.push(`/dashboard/create-project?supplierId=${supplier.id}&mode=catalog`)
}

// В карточке поставщика заменить кнопку на:
<Button 
  onClick={() => handleStartProject(supplier)}
  className="w-full bg-blue-600 hover:bg-blue-700"
>
  🚀 Начать проект
</Button>
```

### 📝 **2.2 Обновление AddSupplierModal**

#### Интеграция с новым API:
```typescript
// В компоненте AddSupplierModal использовать хук:
const { addSupplier, loading, error, success } = useAddSupplier()

const handleSubmit = async (formData: SupplierFormData) => {
  try {
    await addSupplier(formData)
    // Показать успешное сообщение
    toast.success('Поставщик отправлен на модерацию!')
    onClose()
  } catch (error) {
    // Ошибка уже обработана в хуке
  }
}
```

---

## 📋 **ФАЗА 3: МОДЕРАЦИЯ**

### 📱 **3.1 Telegram интеграция**

#### Обновление webhook для обработки модерации:
```typescript
// В файле app/api/telegram-webhook/route.ts добавить:

if (callback_data.startsWith('approve_supplier_')) {
  const supplierId = callback_data.replace('approve_supplier_', '')
  
  // Одобрить поставщика
  const { error } = await supabase
    .from('catalog_suppliers')
    .update({ 
      status: 'approved', 
      verified: true,
      active: true 
    })
    .eq('id', supplierId)
  
  if (error) {
    await answerCallbackQuery(callback_query.id, 'Ошибка одобрения')
    return
  }
  
  // Уведомить об успешном одобрении
  await editMessageText({
    chat_id: callback_query.message.chat.id,
    message_id: callback_query.message.message_id,
    text: `✅ Поставщик одобрен и добавлен в каталог!`
  })
  
  await answerCallbackQuery(callback_query.id, 'Поставщик одобрен!')
}

if (callback_data.startsWith('reject_supplier_')) {
  const supplierId = callback_data.replace('reject_supplier_', '')
  
  // Отклонить поставщика
  const { error } = await supabase
    .from('catalog_suppliers')
    .update({ 
      status: 'rejected',
      active: false 
    })
    .eq('id', supplierId)
  
  if (error) {
    await answerCallbackQuery(callback_query.id, 'Ошибка отклонения')
    return
  }
  
  // Уведомить об отклонении
  await editMessageText({
    chat_id: callback_query.message.chat.id,
    message_id: callback_query.message.message_id,
    text: `❌ Поставщик отклонен.`
  })
  
  await answerCallbackQuery(callback_query.id, 'Поставщик отклонен')
}
```

---

## 📋 **ФАЗА 4: ИНТЕГРАЦИЯ С 7 ШАГАМИ**

### 🔗 **4.1 Обновление Step1CompanyForm**

#### Предзаполнение данных поставщика:
```typescript
// В Step1CompanyForm.tsx добавить:

useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const supplierId = urlParams.get('supplierId')
  const mode = urlParams.get('mode')
  
  if (supplierId && mode === 'catalog') {
    loadSupplierData(supplierId)
  }
}, [])

const loadSupplierData = async (supplierId: string) => {
  try {
    const response = await fetch(`/api/catalog/suppliers?supplier_id=${supplierId}`)
    const data = await response.json()
    
    if (data.suppliers?.[0]) {
      const supplier = data.suppliers[0]
      
      // Предзаполнить поля
      setCompanyData(prev => ({
        ...prev,
        supplier_name: supplier.name,
        supplier_country: supplier.country,
        supplier_contact: supplier.email,
        supplier_phone: supplier.phone
      }))
      
      // Сохранить связь в проекте
      await updateProject(projectId, {
        supplier_id: supplierId,
        supplier_type: 'catalog',
        supplier_data: supplier
      })
      
      console.log('✅ [STEP1] Данные поставщика загружены:', supplier.name)
    }
  } catch (error) {
    console.error('❌ [STEP1] Ошибка загрузки поставщика:', error)
  }
}
```

### 📋 **4.2 Обновление Step2SpecificationForm**

#### Добавление выбора товаров из каталога:
```typescript
// В Step2SpecificationForm.tsx добавить:

const [productSource, setProductSource] = useState<'manual' | 'catalog'>('manual')
const { products, loading: loadingProducts } = useCatalogProducts(
  projectData.supplier_id && productSource === 'catalog' 
    ? projectData.supplier_id 
    : null
)

const addProductFromCatalog = (product: CatalogProduct) => {
  const specItem = {
    item_name: product.name,
    description: product.description,
    quantity: 1,
    price: product.price,
    currency: product.currency,
    sku: product.sku,
    specifications: product.specifications,
    source: 'catalog',
    catalog_product_id: product.id
  }
  
  addSpecificationItem(specItem)
}

// В JSX добавить переключатель:
{projectData.supplier_type === 'catalog' && (
  <div className="mb-4">
    <div className="flex space-x-4">
      <button
        type="button"
        onClick={() => setProductSource('manual')}
        className={`px-4 py-2 rounded ${
          productSource === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        ✏️ Ручной ввод
      </button>
      <button
        type="button"
        onClick={() => setProductSource('catalog')}
        className={`px-4 py-2 rounded ${
          productSource === 'catalog' ? 'bg-orange-600 text-white' : 'bg-gray-200'
        }`}
      >
        🏪 Из каталога товаров
      </button>
    </div>
  </div>
)}

{productSource === 'catalog' && projectData.supplier_id && (
  <div className="mt-4">
    <h3 className="text-lg font-semibold mb-2">Товары поставщика:</h3>
    {loadingProducts ? (
      <div>Загрузка товаров...</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="border rounded p-4">
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-gray-600">{product.description}</p>
            <p className="font-semibold">{product.price} {product.currency}</p>
            <button
              type="button"
              onClick={() => addProductFromCatalog(product)}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
            >
              ➕ Добавить
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

---

## 🎯 **ПЛАН ВЫПОЛНЕНИЯ**

### **Приоритет 1: ФАЗА 1 (База данных и API)**
1. ✅ Выполнить SQL скрипты в Supabase
2. ✅ Создать папку `/app/api/catalog/`
3. ✅ Создать `/app/api/catalog/suppliers/route.ts`
4. ✅ Создать `/app/api/catalog/products/route.ts`
5. ✅ Создать `/app/api/telegram/send-supplier-moderation/route.ts`
6. ✅ Создать хуки в папке `/hooks/`
7. ✅ Тестировать API через Postman/браузер

### **Приоритет 2: ФАЗА 2 (UI)**
1. ✅ Обновить CatalogPage с кнопкой "Начать проект"
2. ✅ Интегрировать AddSupplierModal с новым API
3. ✅ Тестировать добавление поставщиков

### **Приоритет 3: ФАЗА 3 (Модерация)**
1. ✅ Обновить Telegram webhook
2. ✅ Тестировать модерацию поставщиков
3. ✅ Проверить уведомления

### **Приоритет 4: ФАЗА 4 (Интеграция)**
1. ✅ Обновить Step1CompanyForm
2. ✅ Обновить Step2SpecificationForm  
3. ✅ Тестировать полный flow "Каталог → Проект"
4. ✅ Финальное тестирование

---

## 🚦 **КРИТЕРИИ ГОТОВНОСТИ**

### ✅ **Фаза 1 готова, если:**
- API `/catalog/suppliers` возвращает список поставщиков
- API `/catalog/products` возвращает товары поставщика
- Хуки `useCatalogSuppliers` и `useCatalogProducts` работают
- RLS политики настроены корректно

### ✅ **Фаза 2 готова, если:**
- Кнопка "Начать проект" работает из каталога
- Модальное окно добавления поставщика интегрировано с API
- Поставщики отправляются на модерацию

### ✅ **Фаза 3 готова, если:**
- Telegram уведомления о новых поставщиках работают
- Кнопки "Одобрить"/"Отклонить" в Telegram работают
- Статус поставщиков корректно обновляется

### ✅ **Фаза 4 готова, если:**
- Step1 предзаполняется данными поставщика из каталога
- Step2 может использовать товары поставщика
- Полный flow "Каталог → Проект → Завершение" работает

---

## 🎯 **СЛЕДУЮЩИЕ ШАГИ**

**НАЧИНАЕМ С ФАЗЫ 1!** 🚀

1. **Выполнить SQL скрипты** в Supabase SQL Editor
2. **Создать API эндпоинты** для каталога  
3. **Создать хуки** для работы с данными
4. **Протестировать API** через диагностические запросы

**Готов начать реализацию? Начинаем с SQL скриптов!** 💪 