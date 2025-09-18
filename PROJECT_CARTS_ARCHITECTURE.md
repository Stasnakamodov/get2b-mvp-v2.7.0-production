# 🛒 Архитектура таблицы корзин для проектов

## Проблема
Сейчас при создании проекта из корзины каталога:
- Данные передаются через URL параметры (ограничение размера)
- Нет связи с поставщиком (только текстовое имя)
- Невозможно автозаполнить реквизиты поставщика
- Обещания в UI не выполняются

## Решение: Таблица `project_carts`

### SQL структура:
```sql
CREATE TABLE project_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Связь с поставщиком
  supplier_id UUID, -- ID поставщика
  supplier_type TEXT CHECK (supplier_type IN ('verified', 'user')), -- тип комнаты
  supplier_name TEXT, -- для отображения
  supplier_data JSONB, -- кэшированные данные поставщика
  
  -- Товары корзины
  cart_items JSONB NOT NULL, -- массив товаров
  total_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Метаданные
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'converted', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  converted_to_project_id UUID REFERENCES projects(id),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

-- Индексы
CREATE INDEX idx_project_carts_user_id ON project_carts(user_id);
CREATE INDEX idx_project_carts_supplier ON project_carts(supplier_id, supplier_type);
CREATE INDEX idx_project_carts_status ON project_carts(status);
```

### Структура cart_items:
```json
{
  "items": [
    {
      "id": "product_id",
      "name": "IP-камера Hikvision",
      "supplier_name": "ТехноКомплект ООО",
      "price": 150.00,
      "quantity": 3,
      "total_price": 450.00,
      "currency": "USD",
      "image_url": "...",
      "sku": "DS-2CD2143G0-IS"
    }
  ]
}
```

### Структура supplier_data (кэшированные данные):
```json
{
  "company_name": "ТехноКомплект ООО",
  "payment_methods": ["bank-transfer", "p2p"],
  "bank_requisites": {
    "bankName": "Сбербанк",
    "accountNumber": "40702810...",
    "swift": "SABRRUMM"
  },
  "contact_info": {
    "email": "info@techno.ru",
    "phone": "+7 495 123-45-67"
  }
}
```

## Интеграция с существующими способами создания проектов

### 1. Из корзины каталога (НОВЫЙ FLOW):
```typescript
// В catalog/page.tsx
const createProjectFromCart = async () => {
  // Сохраняем корзину в БД
  const { data: savedCart } = await supabase
    .from('project_carts')
    .insert({
      user_id: userId,
      supplier_id: activeSupplier?.id,
      supplier_type: selectedRoom === 'orange' ? 'verified' : 'user',
      supplier_name: activeSupplier?.name,
      supplier_data: activeSupplier, // все данные поставщика
      cart_items: { items: cart },
      total_amount: getTotalPrice(),
      currency: 'USD'
    })
    .select()
    .single();
  
  // Переходим с cart_id вместо данных в URL
  router.push(`/dashboard/create-project?from_cart=true&cart_id=${savedCart.id}`);
}
```

### 2. В create-project/page.tsx:
```typescript
// Загрузка из корзины
if (fromCart && cartId) {
  const { data: cartData } = await supabase
    .from('project_carts')
    .select('*')
    .eq('id', cartId)
    .single();
  
  if (cartData) {
    // Шаг 2: Заполняем товары
    setSpecificationItems(cartData.cart_items.items);
    
    // Шаг 4: Автозаполняем способ оплаты
    if (cartData.supplier_data?.payment_methods?.[0]) {
      setPaymentMethod(cartData.supplier_data.payment_methods[0]);
    }
    
    // Шаг 5: Автозаполняем реквизиты
    if (cartData.supplier_data?.bank_requisites) {
      setRequisites(cartData.supplier_data.bank_requisites);
    }
    
    // Помечаем корзину как использованную
    await supabase
      .from('project_carts')
      .update({ status: 'converted', converted_to_project_id: projectId })
      .eq('id', cartId);
  }
}
```

### 3. Обычный стартер (НЕ МЕНЯЕТСЯ):
```typescript
// Работает как раньше
if (!fromCart && !templateId) {
  // Обычный 7-шаговый процесс
}
```

### 4. Атомарный конструктор (НЕ МЕНЯЕТСЯ):
```typescript
// В project-constructor/page.tsx
// Полностью независимый процесс
```

## Преимущества:

1. ✅ **Не ломает существующие процессы** - добавляет новый путь
2. ✅ **Реальное автозаполнение** - есть все данные поставщика
3. ✅ **Нет ограничений URL** - данные в БД
4. ✅ **История корзин** - можно восстановить
5. ✅ **Аналитика** - видно конверсию корзина → проект

## Недостатки и решения:

❌ **Проблема:** Дополнительная таблица в БД
✅ **Решение:** Автоочистка старых корзин через 7 дней

❌ **Проблема:** Дополнительный запрос к БД
✅ **Решение:** Кэширование данных поставщика в корзине

## План внедрения:

1. **Фаза 1:** Создать таблицу `project_carts`
2. **Фаза 2:** Обновить `catalog/page.tsx` для сохранения в БД
3. **Фаза 3:** Обновить `create-project/page.tsx` для загрузки из БД
4. **Фаза 4:** Реализовать автозаполнение шагов 4-5
5. **Фаза 5:** Добавить автоочистку старых корзин

## Альтернатива (если не хотим новую таблицу):

Просто убрать обещания из UI:
- Убрать "Способ оплаты будет предложен автоматически"
- Убрать "Реквизиты будут заполнены из истории"
- Оставить честное "Перейти к созданию проекта"

## Вывод:
Таблица `project_carts` - это правильное архитектурное решение, которое:
- НЕ ломает существующие способы создания проектов
- Добавляет новые возможности для корзины
- Делает систему более гибкой и масштабируемой