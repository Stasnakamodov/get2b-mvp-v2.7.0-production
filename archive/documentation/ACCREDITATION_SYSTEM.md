# 🌟 Система аккредитации поставщиков Get2B

## 📋 Обзор

Система аккредитации позволяет поставщикам из **зеленых профилей** подавать заявки на попадание в **оранжевый каталог** (проверенные поставщики для всех пользователей).

## 🎯 Цель

Расширение каталога Get2B для поиска контрагентов путем модерации и верификации поставщиков.

---

## 🔄 Процесс аккредитации

### 1. **Подача заявки**
- Поставщик нажимает кнопку **⭐ аккредитации** в своем профиле
- Система проверяет обязательные поля
- Создается заявка в таблице `accreditation_applications`
- Статус поставщика меняется на `pending`

### 2. **Модерация менеджером**
- Менеджер получает уведомление (Telegram)
- Проверяет данные поставщика
- Принимает решение: `approved` / `rejected`

### 3. **Результат**
- **При одобрении:** поставщик остается в профилях И добавляется в оранжевый каталог
- **При отклонении:** возможность подать заявку повторно

---

## 🎨 UI компоненты

### Кнопка аккредитации
```tsx
⭐ Звездочка между кнопками редактирования и удаления
- Цвет меняется в зависимости от статуса
- Tooltip показывает текущий статус
```

### Статусы аккредитации
| Статус | Бейдж | Описание |
|--------|-------|----------|
| `none` | — | Не подавал заявку |
| `pending` | ⏳ Заявка подана | Ожидает проверки |
| `in_review` | 🔍 На проверке | Менеджер рассматривает |
| `approved` | ✅ Аккредитован | Одобрен, в каталоге |
| `rejected` | ❌ Отклонена | Можно подать повторно |

---

## 🗄️ Структура данных

### Таблица `accreditation_applications`
```sql
CREATE TABLE accreditation_applications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  supplier_id uuid NOT NULL,
  supplier_type text CHECK (supplier_type IN ('profile', 'catalog')),
  supplier_name text NOT NULL,
  company_name text NOT NULL,
  category text NOT NULL,
  country text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected')),
  application_data jsonb NOT NULL,
  manager_notes text,
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  verified_supplier_id uuid,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Обновления в `supplier_profiles`
```sql
ALTER TABLE supplier_profiles 
ADD COLUMN accreditation_status text CHECK (...),
ADD COLUMN accreditation_application_id uuid REFERENCES accreditation_applications(id);
```

---

## 🚀 API Endpoints

### `POST /api/catalog/submit-accreditation`
Подача заявки на аккредитацию

**Тело запроса:**
```json
{
  "supplier_id": "uuid",
  "supplier_type": "profile",
  "is_resubmission": false
}
```

**Ответ:**
```json
{
  "message": "Заявка на аккредитацию успешно подана",
  "application_id": "uuid",
  "status": "pending"
}
```

---

## ✅ Требования для аккредитации

### Обязательные поля:
- ✅ Название поставщика
- ✅ Название компании  
- ✅ Категория
- ✅ Страна
- ✅ Контактный email
- ✅ Контактный телефон

### Рекомендуемые:
- 📄 Сертификации
- 📦 Товары
- 🏭 Полный бизнес-профиль (все 7 шагов)

---

## 🔔 Интеграции

### Telegram уведомления
- При подаче заявки → уведомление менеджеру
- Endpoint: `/api/telegram/send-accreditation-request`

### Будущие интеграции
- Email уведомления
- Панель управления для менеджеров
- Аналитика и отчеты

---

## 📊 Статистика и мониторинг

### Метрики
- Количество поданных заявок
- Время обработки заявок
- Процент одобренных заявок
- Качество аккредитованных поставщиков

### Логирование
```
🌟 [API] Подача заявки на аккредитацию
✅ [API] Заявка на аккредитацию создана
⚠️ [API] Ошибка отправки уведомления в Telegram
```

---

## 🛠️ Техническая реализация

### Компоненты
- `app/dashboard/profile/page.tsx` - UI кнопки и статусов
- `app/api/catalog/submit-accreditation/route.ts` - API обработки
- `create-accreditation-applications-table.sql` - миграция БД

### Зависимости
- Supabase (база данных)
- Lucide React (иконки)
- Next.js API Routes

---

## 🔮 Планы развития

### Фаза 2:
- Панель управления для менеджеров
- Автоматическая проверка некоторых критериев
- Интеграция с внешними сервисами верификации

### Фаза 3:
- Система рейтингов аккредитованных поставщиков
- Дифференцированная аккредитация по уровням
- API для партнеров

---

*Создано: Январь 2025*  
*Статус: ✅ Готово к тестированию* 