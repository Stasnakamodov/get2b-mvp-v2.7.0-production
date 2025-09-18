# Исправление блокировки товаров по поставщикам в каталоге

## Проблема
В каталоге товаров не работала блокировка товаров от разных поставщиков. При добавлении товара в корзину, пользователь мог добавить товары от РАЗНЫХ поставщиков, что недопустимо по бизнес-логике.

## Причины проблемы

### 1. Неправильный API endpoint
- **Использовался**: `/api/catalog/products` - возвращает RAW данные из таблицы без информации о поставщиках
- **Нужно использовать**: `/api/catalog/products-by-category/[category]` - возвращает полные данные с JOIN'ом поставщиков

### 2. Отсутствие полей поставщика в БД функции
Функция `get_products_by_category` не возвращала все необходимые поля:
- `supplier_name`
- `supplier_company_name` 
- `supplier_country`, `supplier_city`
- И другие поля поставщика

### 3. Хардкод в компоненте ProductGridByCategory
В компоненте были захардкожены значения:
```typescript
supplier_name: 'Поставщик',
supplier_company_name: 'Компания'
```
Это перезаписывало реальные данные из API.

### 4. Несуществующее поле в проверках
Использовалось несуществующее поле `product.supplier`, которого нет в структуре данных.

## Решение

### 1. Обновлена функция БД
```sql
CREATE OR REPLACE FUNCTION get_products_by_category(...)
RETURNS TABLE (
  -- Добавлены все поля поставщика
  supplier_id UUID,
  supplier_name TEXT,
  supplier_company_name TEXT,
  supplier_category TEXT,
  supplier_country TEXT,
  supplier_city TEXT,
  supplier_email TEXT,
  supplier_phone TEXT,
  supplier_website TEXT,
  supplier_rating NUMERIC,
  supplier_reviews BIGINT,
  supplier_projects INTEGER,
  -- ...остальные поля
)
```

### 2. Исправлен компонент ProductGridByCategory
```typescript
// Было (неправильно):
const response = await fetch(`/api/catalog/products?${searchParams}`)

// Стало (правильно):
const response = await fetch(`/api/catalog/products-by-category/${encodeURIComponent(selectedCategory)}`)
```

### 3. Убран хардкод
```typescript
// Было:
supplier_name: 'Поставщик',
supplier_company_name: 'Компания'

// Стало:
supplier_name: product.supplier_name,
supplier_company_name: product.supplier_company_name
```

### 4. Исправлена логика проверки
```typescript
// Было (с несуществующим полем):
product.supplier_name !== activeSupplier || 
product.supplier !== activeSupplier

// Стало (правильно):
product.supplier_name !== activeSupplier || 
product.supplier_company_name !== activeSupplier
```

## Файлы, которые были изменены

1. **app/dashboard/catalog/page.tsx**
   - Строка 1662: Убрана ссылка на несуществующее поле `product.supplier`
   
2. **components/catalog/ProductGridByCategory.tsx**
   - Строка 141: Изменен API endpoint на `/api/catalog/products-by-category`
   - Строки 205-214: Убран хардкод значений поставщика
   - Строки 222-226: Исправлена фильтрация по activeSupplier
   - Строки 511, 520: Исправлено условие isDisabled

3. **sql/create-catalog-category-view.sql**
   - Обновлена функция `get_products_by_category` для возврата всех полей поставщика

## Важные моменты для будущей разработки

### API Endpoints
- ❌ **НЕ ИСПОЛЬЗОВАТЬ**: `/api/catalog/products` - возвращает сырые данные без JOIN
- ✅ **ИСПОЛЬЗОВАТЬ**: `/api/catalog/products-by-category/[category]` - возвращает полные данные с поставщиками

### Структура данных товара
```typescript
interface Product {
  // Основные поля
  id: string
  product_name: string
  price: string
  
  // Поля поставщика (ВСЕГДА ЕСТЬ)
  supplier_id: string
  supplier_name: string              // Основное имя
  supplier_company_name?: string     // Название компании (приоритет)
  supplier_country?: string
  supplier_city?: string
  
  // НЕ СУЩЕСТВУЕТ
  // supplier: string  ❌ - такого поля НЕТ!
}
```

### Логика определения поставщика
```typescript
// Правильный приоритет:
const supplierName = product.supplier_company_name || product.supplier_name
```

### Проверка блокировки
```typescript
// Проверяем оба поля:
isDisabled = activeSupplier !== null && 
  product.supplier_name !== activeSupplier && 
  product.supplier_company_name !== activeSupplier
```

## Тестирование

1. Откройте каталог товаров
2. Добавьте товар от поставщика "ТехноКомплект"
3. Проверьте, что товары от "МегаТех Электроника" заблокированы (серые кнопки)
4. Удалите товар из корзины
5. Проверьте, что все товары снова доступны

## Результат

✅ Блокировка товаров работает корректно
✅ В корзину можно добавить товары только от одного поставщика
✅ Визуальная индикация заблокированных товаров
✅ Индикатор активного поставщика в интерфейсе