# 📦 Простая система категорий товаров

## 🎯 Что сделано

Удалена сложная иерархическая система категорий и создана простая, которая поможет в бизнес-логике.

## 🗃️ Структура БД

### catalog_categories
```sql
- id (uuid, PK)
- key (varchar) - уникальный ключ категории  
- name (varchar) - название категории
- description (text) - описание
- icon (varchar) - эмодзи иконка
- sort_order (integer) - порядок сортировки
- is_active (boolean) - активность
- created_at, updated_at (timestamp)
```

### Связи с товарами
```sql
catalog_verified_products.category_id -> catalog_categories.id
catalog_user_products.category_id -> catalog_categories.id
```

## 🚀 Установка и настройка

### 1. Выполните SQL скрипты по порядку:

```bash
# 1. Удаляем старую систему (если не выполняли)
psql -f final-cleanup-categories.sql

# 2. Добавляем связи с категориями  
psql -f add-category-relations.sql
```

### 2. Базовые категории уже созданы:
- 📱 Электроника
- 🚗 Автотовары  
- 🏭 Промышленность
- 💊 Здоровье и медицина
- 👕 Текстиль и одежда
- 🏗️ Строительство
- 🍎 Продукты питания
- 🏠 Дом и быт

## 📡 API Endpoints

### Получение категорий
```
GET /api/catalog/categories
```
Возвращает все активные категории с счетчиками товаров и поставщиков.

### Создание категории
```
POST /api/catalog/categories
{
  "name": "Новая категория",
  "description": "Описание категории", 
  "icon": "🎯",
  "sort_order": 10
}
```

### Получение товаров по категории
```
GET /api/catalog/simple-products?category_key=electronics
GET /api/catalog/simple-products?category_id=uuid
```

Параметры:
- `category_key` - ключ категории (electronics, automotive, etc.)
- `category_id` - UUID категории
- `limit` - лимит товаров (по умолчанию 50)
- `offset` - смещение для пагинации  
- `search` - поиск по названию/описанию

## 🎨 Компоненты

### SimpleCategorySelector
```tsx
import SimpleCategorySelector from '@/components/catalog/SimpleCategorySelector'

<SimpleCategorySelector
  onCategorySelect={(category) => console.log(category)}
  onClose={() => setShowSelector(false)}
  authToken={token}
/>
```

## 🔧 Добавление товаров с категориями

При создании товаров добавляйте `category_id`:

```typescript
const newProduct = {
  name: "iPhone 15",
  description: "Последняя модель",
  price: "80000",
  currency: "RUB", 
  category_id: "electronics-category-uuid", // ← Важно!
  supplier_id: "supplier-uuid",
  // ... другие поля
}

await supabase
  .from('catalog_user_products')
  .insert(newProduct)
```

## 🧪 Тестирование

```bash
# Тест системы категорий
node test-simple-categories.js
```

## 💡 Бизнес-логика

### Автоматическая категоризация
Создайте функцию для определения категории по названию товара:

```typescript
function detectCategory(productName: string): string | null {
  const keywords = {
    'electronics': ['iphone', 'android', 'компьютер', 'ноутбук'],
    'automotive': ['шины', 'масло', 'фильтр', 'запчасти'],
    'industrial': ['станок', 'оборудование', 'инструмент'],
    // ...
  }
  
  const name = productName.toLowerCase()
  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some(term => name.includes(term))) {
      return category
    }
  }
  
  return null
}
```

### Счетчики и аналитика
API автоматически считает:
- Количество товаров в каждой категории
- Количество поставщиков в каждой категории
- Поддерживает фильтры по комнатам (verified/user)

### Расширение
Легко добавляйте новые категории через API или напрямую в БД:

```sql
INSERT INTO catalog_categories (key, name, description, icon, sort_order, is_active) 
VALUES ('beauty', 'Красота и здоровье', 'Косметика и товары для красоты', '💄', 9, true);
```

## ✅ Готовая к использованию система!

Простая, понятная, масштабируемая система категорий, которая поможет в бизнес-логике, а не усложнит её.