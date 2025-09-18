# 🧠 АРХИТЕКТУРА УМНОГО КАТАЛОГА
## Каталог как живая экосистема, которая учится и помогает

---

## 🎯 **КОНЦЕПЦИЯ**

Каталог поставщиков не просто хранилище данных, а **УМНАЯ СИСТЕМА**, которая:

- 📚 **Накапливает опыт** от каждого завершенного проекта
- 🧠 **Анализирует паттерны** успешных взаимодействий
- 💡 **Предлагает рекомендации** для новых проектов
- 🚀 **Автоматизирует** выбор поставщиков и товаров
- 📈 **Оптимизирует** процесс создания проектов

---

## 🏗️ **АРХИТЕКТУРА ДАННЫХ**

### **1. Основные таблицы (УЖЕ ЕСТЬ)**
```sql
-- 🧡 Аккредитованные поставщики Get2B
catalog_verified_suppliers {
  id, name, category, country, rating, projects_count, ...
}

-- 🔵 Личные поставщики пользователей
catalog_user_suppliers {
  id, user_id, name, category, 
  total_projects, successful_projects, cancelled_projects,
  last_project_date, total_spent, user_rating, ...
}

-- 📋 Проекты с привязкой к поставщикам
projects {
  id, user_id, supplier_id, supplier_type,
  status, amount, category, created_at, ...
}
```

### **2. Новые таблицы для УМНОГО АНАЛИЗА**

#### **🧠 Таблица паттернов успеха**
```sql
CREATE TABLE supplier_success_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  supplier_id uuid NOT NULL,
  supplier_type text NOT NULL, -- 'user' | 'verified'
  
  -- Паттерны успеха
  category text NOT NULL,
  avg_project_amount decimal(12,2),
  success_rate decimal(5,2), -- процент успешных проектов
  avg_completion_time interval,
  preferred_payment_methods jsonb,
  
  -- Контекст использования
  typical_project_size text, -- 'small' | 'medium' | 'large'
  seasonal_patterns jsonb, -- когда чаще используется
  product_categories jsonb, -- какие товары заказывались
  
  -- Метрики качества
  communication_rating decimal(3,2),
  delivery_rating decimal(3,2),
  quality_rating decimal(3,2),
  
  -- Временные метки
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

#### **📊 Таблица истории товаров**
```sql
CREATE TABLE project_product_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  supplier_id uuid NOT NULL,
  supplier_type text NOT NULL,
  
  -- Данные товара
  product_name text NOT NULL,
  product_category text NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(12,2),
  total_price decimal(12,2),
  
  -- Результат
  was_successful boolean,
  delivery_time interval,
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  
  -- Метаданные
  specifications jsonb,
  notes text,
  
  created_at timestamptz DEFAULT now()
);
```

#### **💡 Таблица рекомендаций**
```sql
CREATE TABLE smart_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  
  -- Контекст рекомендации
  recommendation_type text NOT NULL, -- 'supplier' | 'product' | 'category'
  context_data jsonb NOT NULL, -- данные о текущем проекте
  
  -- Рекомендация
  recommended_supplier_id uuid,
  recommended_supplier_type text,
  confidence_score decimal(3,2), -- уверенность в рекомендации (0-1)
  reasoning jsonb, -- почему рекомендуем
  
  -- Результат
  was_accepted boolean,
  user_feedback integer CHECK (user_feedback >= 1 AND user_feedback <= 5),
  
  created_at timestamptz DEFAULT now()
);
```

---

## 🔄 **АЛГОРИТМЫ ОБУЧЕНИЯ**

### **1. Функция анализа паттернов успеха**
```sql
CREATE OR REPLACE FUNCTION analyze_supplier_patterns(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Обновляем паттерны для каждого поставщика пользователя
  INSERT INTO supplier_success_patterns (
    user_id, supplier_id, supplier_type, category,
    avg_project_amount, success_rate, avg_completion_time,
    communication_rating, delivery_rating, quality_rating
  )
  SELECT 
    p.user_id,
    p.supplier_id,
    p.supplier_type,
    s.category,
    AVG(p.amount) as avg_project_amount,
    (COUNT(*) FILTER (WHERE p.status = 'completed')::decimal / COUNT(*) * 100) as success_rate,
    AVG(p.updated_at - p.created_at) FILTER (WHERE p.status = 'completed') as avg_completion_time,
    AVG(COALESCE(s.user_rating, 3)) as communication_rating,
    AVG(COALESCE(s.user_rating, 3)) as delivery_rating,
    AVG(COALESCE(s.user_rating, 3)) as quality_rating
  FROM projects p
  JOIN catalog_user_suppliers s ON p.supplier_id = s.id AND p.supplier_type = 'user'
  WHERE p.user_id = target_user_id
    AND p.created_at > now() - interval '1 year' -- анализируем последний год
  GROUP BY p.user_id, p.supplier_id, p.supplier_type, s.category
  ON CONFLICT (user_id, supplier_id, supplier_type, category) 
  DO UPDATE SET
    avg_project_amount = EXCLUDED.avg_project_amount,
    success_rate = EXCLUDED.success_rate,
    avg_completion_time = EXCLUDED.avg_completion_time,
    last_updated = now();
END;
$$ LANGUAGE plpgsql;
```

### **2. Функция умных рекомендаций**
```sql
CREATE OR REPLACE FUNCTION get_smart_supplier_recommendations(
  target_user_id uuid,
  project_category text DEFAULT NULL,
  project_budget decimal DEFAULT NULL
)
RETURNS TABLE (
  supplier_id uuid,
  supplier_type text,
  supplier_name text,
  confidence_score decimal,
  reasoning jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH user_patterns AS (
    -- Анализируем паттерны пользователя
    SELECT 
      sp.supplier_id,
      sp.supplier_type,
      sp.success_rate,
      sp.avg_project_amount,
      sp.communication_rating,
      CASE 
        WHEN project_category IS NULL OR sp.category = project_category THEN 1.0
        ELSE 0.5
      END as category_match,
      CASE 
        WHEN project_budget IS NULL THEN 1.0
        WHEN project_budget BETWEEN sp.avg_project_amount * 0.5 AND sp.avg_project_amount * 2 THEN 1.0
        ELSE 0.7
      END as budget_match
    FROM supplier_success_patterns sp
    WHERE sp.user_id = target_user_id
  ),
  scored_suppliers AS (
    SELECT 
      up.supplier_id,
      up.supplier_type,
      CASE 
        WHEN up.supplier_type = 'user' THEN us.name
        ELSE vs.name
      END as name,
      (
        (up.success_rate / 100 * 0.4) + -- 40% вес успешности
        (up.communication_rating / 5 * 0.3) + -- 30% вес коммуникации
        (up.category_match * 0.2) + -- 20% вес соответствия категории
        (up.budget_match * 0.1) -- 10% вес соответствия бюджету
      ) as confidence,
      jsonb_build_object(
        'success_rate', up.success_rate,
        'avg_amount', up.avg_project_amount,
        'communication_rating', up.communication_rating,
        'category_match', up.category_match,
        'budget_match', up.budget_match,
        'reasoning', CASE 
          WHEN up.success_rate > 80 THEN 'Высокий процент успешных проектов'
          WHEN up.communication_rating > 4 THEN 'Отличная коммуникация'
          ELSE 'Проверенный партнер'
        END
      ) as reasoning
    FROM user_patterns up
    LEFT JOIN catalog_user_suppliers us ON up.supplier_id = us.id AND up.supplier_type = 'user'
    LEFT JOIN catalog_verified_suppliers vs ON up.supplier_id = vs.id AND up.supplier_type = 'verified'
  )
  SELECT 
    ss.supplier_id,
    ss.supplier_type,
    ss.name,
    ss.confidence,
    ss.reasoning
  FROM scored_suppliers ss
  WHERE ss.confidence > 0.3 -- минимальный порог уверенности
  ORDER BY ss.confidence DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 **ИНТЕГРАЦИЯ С 7-ШАГОВЫМ ПРОЦЕССОМ**

### **Step 1: Умный выбор компании**
```typescript
// Предлагаем поставщиков на основе истории
const getSmartSupplierSuggestions = async (userId: string, category?: string) => {
  const { data } = await supabase.rpc('get_smart_supplier_recommendations', {
    target_user_id: userId,
    project_category: category
  });
  
  return data?.map(rec => ({
    id: rec.supplier_id,
    type: rec.supplier_type,
    name: rec.supplier_name,
    confidence: rec.confidence_score,
    reasoning: rec.reasoning,
    badge: rec.confidence_score > 0.8 ? 'Рекомендуем' : 'Проверенный'
  }));
};
```

### **Step 2: Умная спецификация**
```typescript
// Предлагаем товары на основе истории заказов
const getProductSuggestions = async (userId: string, supplierId: string) => {
  const { data } = await supabase
    .from('project_product_history')
    .select('product_name, product_category, avg(unit_price) as avg_price')
    .eq('user_id', userId)
    .eq('supplier_id', supplierId)
    .eq('was_successful', true)
    .group('product_name, product_category')
    .order('count', { ascending: false })
    .limit(10);
    
  return data;
};
```

### **Автоматическое обучение после завершения проекта**
```typescript
// Триггер после завершения проекта
const onProjectCompleted = async (projectId: string) => {
  // 1. Обновляем статистику поставщика
  await updateSupplierStats(projectId);
  
  // 2. Анализируем паттерны успеха
  await supabase.rpc('analyze_supplier_patterns', {
    target_user_id: project.user_id
  });
  
  // 3. Сохраняем историю товаров
  await saveProductHistory(projectId);
  
  // 4. Генерируем рекомендации для будущих проектов
  await generateFutureRecommendations(project.user_id);
};
```

---

## 📊 **АНАЛИТИКА И МЕТРИКИ**

### **Dashboard для пользователя**
```sql
-- Топ поставщики по успешности
SELECT 
  s.name,
  sp.success_rate,
  sp.avg_project_amount,
  sp.communication_rating,
  'Рекомендуем' as badge
FROM supplier_success_patterns sp
JOIN catalog_user_suppliers s ON sp.supplier_id = s.id
WHERE sp.user_id = 'current-user' 
  AND sp.success_rate > 80
ORDER BY sp.success_rate DESC;

-- Категории с лучшими результатами
SELECT 
  category,
  AVG(success_rate) as avg_success_rate,
  COUNT(*) as suppliers_count,
  SUM(avg_project_amount) as total_spent
FROM supplier_success_patterns
WHERE user_id = 'current-user'
GROUP BY category
ORDER BY avg_success_rate DESC;
```

### **Система обратной связи**
```sql
-- Пользователь оценивает рекомендацию
UPDATE smart_recommendations 
SET 
  was_accepted = true,
  user_feedback = 5
WHERE id = 'recommendation-id';

-- Система учится на фидбеке
-- Если рекомендация была принята и проект успешен - увеличиваем вес алгоритма
-- Если отклонена - корректируем параметры
```

---

## 🎯 **РЕЗУЛЬТАТ**

### **Что получает пользователь:**
- 🎯 **Персонализированные рекомендации** поставщиков
- 📊 **Аналитику** по своим проектам и партнерам
- 🚀 **Ускоренное создание** новых проектов
- 💡 **Умные подсказки** на каждом шаге
- 📈 **Постоянное улучшение** качества рекомендаций

### **Что получает система:**
- 🧠 **Самообучение** на каждом проекте
- 📚 **Накопление опыта** всех пользователей
- 🔄 **Автоматическая оптимизация** процессов
- 📊 **Ценные данные** для развития платформы

---

## 🚀 **ПЛАН ВНЕДРЕНИЯ**

### **Этап 1: Базовая аналитика (1 неделя)**
- Создать таблицы для хранения паттернов
- Написать функции анализа истории
- Добавить базовые рекомендации

### **Этап 2: Умные рекомендации (2 недели)**
- Интегрировать рекомендации в Step 1
- Добавить предложения товаров в Step 2
- Создать систему обратной связи

### **Этап 3: Машинное обучение (1 месяц)**
- Внедрить продвинутые алгоритмы
- Добавить предиктивную аналитику
- Создать персональный AI-помощник

---

**💡 ИТОГ: Каталог превращается из статического справочника в УМНОГО ПАРТНЕРА, который помогает принимать лучшие решения на основе накопленного опыта!** 