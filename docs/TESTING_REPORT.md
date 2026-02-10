# Отчет по тестированию GET2B Project Constructor

**Дата:** 2026-02-01
**Статус:** Частично выполнено (Supabase недоступен)

---

## КРИТИЧЕСКАЯ ПРОБЛЕМА

### DNS не разрешает Supabase
```
Host ejkhdhexkadecpbjjmsz.supabase.co not found: NXDOMAIN
```

**Возможные причины:**
1. Supabase проект приостановлен (paused) из-за неактивности
2. Проблема с DNS на локальной машине
3. Supabase проект был удален

**Решение:** Проверить статус проекта в [Supabase Dashboard](https://supabase.com/dashboard)

---

## СТАТИЧЕСКИЙ АНАЛИЗ КОДА

### 1. Архитектура конструктора проектов

```
project-constructor/
├── page.tsx                    # Главный компонент (8,367 строк)
├── components/
│   ├── configuration-modes/    # Режимы заполнения
│   │   ├── TemplateSelectionMode.tsx
│   │   ├── ManualFormEntryMode.tsx
│   │   └── UploadOCRMode.tsx
│   ├── modals/                 # Модальные окна
│   │   ├── BlueRoomSupplierModal.tsx
│   │   ├── OrangeRoomSupplierModal.tsx
│   │   ├── PreviewModal.tsx
│   │   └── SummaryModal.tsx
│   └── filled-state/           # Отображение данных
│       ├── Step1CompanyCubes.tsx
│       ├── Step3SpecificationSlider.tsx
│       └── Step5RequisitesDisplay.tsx
└── hooks/
    ├── useTemplateSystem.ts
    ├── useOcrUpload.ts
    └── useManagerPolling.ts
```

### 2. Система приоритетов автозаполнения (AutoFillService)

| Приоритет | Источник | Описание |
|-----------|----------|----------|
| 6 | `manual` | Ручной ввод пользователя |
| 5 | `catalog` | Каталог товаров |
| 5 | `blue_room` | Личные поставщики |
| 5 | `orange_room` | Аккредитованные поставщики |
| 4 | `ocr_suggestion` | OCR предложения |
| 4 | `upload` | Загрузка файлов |
| 3 | `template` | Шаблоны проектов |
| 2 | `profile` | Профили клиентов |
| 1 | `echo` | Данные из прошлых проектов |

**Правило:** `user_choice: true` блокирует перезапись данных

---

## АНАЛИЗ ФОРМ

### CompanyForm (Шаг 1)
- **Обязательные поля:** name, legalName, inn, kpp, ogrn, address, bankName, bankAccount, bik, correspondentAccount, phone
- **Валидация:** Zod схема + кастомная проверка банковских реквизитов
- **Автосохранение:** Дебаунс 500ms в инлайн-режиме

### SpecificationForm (Шаг 2)
- **Обязательные поля:** item_name, quantity, unit, price (для каждого товара)
- **Автопересчет:** total = quantity × price
- **Дефолты:** unit='шт', quantity=1, currency='RUB'

### PaymentMethodForm (Шаг 4)
- **Обязательные поля:** method
- **Автозаполнение:** Поставщик из Шага 2 (3 useEffect!)
- **OCR:** Поддержка предложений из анализа инвойса

### RequisitesForm (Шаг 5)
- **Типы:** bank, p2p, crypto
- **Дефолты:** crypto_name='USDT', crypto_network='TRC20', transferCurrency='USD'
- **Автозаполнение:** supplier из recipientName

---

## BLUE/ORANGE ROOM

### Автозаполняемые шаги при выборе поставщика:

| Шаг | Заполняемые данные |
|-----|-------------------|
| 2 | Товары поставщика, валюта, supplier name |
| 4 | Методы оплаты (bank/p2p/crypto) |
| 5 | Реквизиты (банк, карта, крипто-кошелек) |

### Различия Blue vs Orange Room

| Параметр | Blue Room | Orange Room |
|----------|-----------|-------------|
| Источник | Личные поставщики | Аккредитованные Get2B |
| Авторизация | Bearer Token | Публичный доступ |
| Таблица товаров | `catalog_user_products` | `catalog_verified_products` |
| Структура payment_methods | Nested объект | Массивы (`bank_accounts[]`) |

---

## ЧЕКЛИСТ ТЕСТИРОВАНИЯ

### После восстановления Supabase

#### Шаг 1: Данные клиента
- [ ] MANUAL: Ручной ввод в CompanyForm
- [ ] PROFILE: Из профиля клиента
- [ ] TEMPLATE: Из шаблона проекта
- [ ] UPLOAD/OCR: Загрузка визитки/карточки компании

#### Шаг 2: Спецификация товаров
- [ ] MANUAL: Ручной ввод товаров
- [ ] UPLOAD/OCR: Загрузка инвойса
- [ ] BLUE_ROOM: Выбор личного поставщика
- [ ] ORANGE_ROOM: Выбор аккредитованного поставщика

#### Шаг 4: Метод оплаты
- [ ] MANUAL: Выбор метода вручную
- [ ] CATALOG: Автозаполнение из поставщика

#### Шаг 5: Реквизиты
- [ ] BANK: Банковские реквизиты
- [ ] P2P: Карта для P2P
- [ ] CRYPTO: Крипто-кошелек

#### Полный флоу
- [ ] Stage 1: Заполнить шаги 1, 2, 4, 5 → Отправка на модерацию
- [ ] Stage 2: Одобрение менеджера → Загрузка чека
- [ ] Stage 3: Анимация выполнения → Завершение

---

## КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ

```bash
# Запуск dev сервера
npm run dev

# URL конструктора
open http://localhost:3002/dashboard/project-constructor

# Проверка API (после восстановления Supabase)
curl "http://localhost:3002/api/catalog/products?supplier_type=verified&limit=5"
curl "http://localhost:3002/api/catalog/suppliers?supplier_type=verified"
```

---

## SQL ЗАПРОСЫ ДЛЯ ПРОВЕРКИ ДАННЫХ

```sql
-- Проверить профили клиентов
SELECT id, user_id, company_name, inn FROM user_profiles LIMIT 10;

-- Проверить шаблоны
SELECT id, name, user_id FROM project_templates LIMIT 10;

-- Проверить аккредитованных поставщиков (Orange Room)
SELECT id, name, category, country FROM catalog_verified_suppliers LIMIT 10;

-- Проверить личных поставщиков (Blue Room)
SELECT id, name, user_id, category FROM catalog_user_suppliers LIMIT 10;

-- Количество товаров в каталоге
SELECT COUNT(*) FROM catalog_verified_products WHERE is_active = true;
```

---

## РЕКОМЕНДАЦИИ

1. **Восстановить Supabase** - проверить статус проекта в Dashboard
2. **Проверить данные в БД** - убедиться что есть тестовые поставщики и товары
3. **Протестировать OCR** - загрузить тестовый инвойс для проверки Yandex Vision
4. **Проверить Telegram бот** - для тестирования Stage 2 (модерация менеджером)

---

## ФАЙЛЫ ДЛЯ ИЗУЧЕНИЯ

| Файл | Назначение | Строк |
|------|-----------|-------|
| `app/dashboard/project-constructor/page.tsx` | Главный конструктор | 8,367 |
| `lib/services/AutoFillService.ts` | Система приоритетов | 213 |
| `components/project-constructor/forms/CompanyForm.tsx` | Форма компании | ~300 |
| `components/project-constructor/forms/SpecificationForm.tsx` | Форма товаров | ~400 |
| `hooks/project-constructor/useOcrUpload.ts` | OCR загрузка | ~500 |
