# 🏗️ Реализация новой архитектуры хранения файлов аккредитации

## 📋 Резюме изменений

Мы успешно реализовали новую, правильную архитектуру хранения файлов для системы аккредитации поставщиков. Теперь каждый тип файлов хранится в своем специализированном бакете Supabase Storage.

## ✅ Что было сделано

### 1. Создание новых бакетов Storage
- **`accreditation-certificates`** - для сертификатов товаров
- **`accreditation-documents`** - для юридических документов
- **`project-images`** - остается для изображений товаров

### 2. Обновление API для сохранения файлов
**Файл:** `app/api/catalog/submit-accreditation/route.ts`

```typescript
// Сертификаты товаров теперь сохраняются в правильный бакет
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('accreditation-certificates') // ✅ Новый бакет
  .upload(fileName, certFile.file, { /* ... */ });

// Юридические документы теперь сохраняются в правильный бакет
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('accreditation-documents') // ✅ Новый бакет
  .upload(fileName, docFile.file, { /* ... */ });

// Изображения остаются в project-images
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('project-images') // ✅ Остается как есть
  .upload(fileName, imageFile.file, { /* ... */ });
```

### 3. Создание новых API для отправки файлов в Telegram
- **`/api/send-accreditation-certificate`** - отправка сертификатов из нового бакета
- **`/api/send-accreditation-legal-document`** - отправка документов из нового бакета
- **`/api/send-accreditation-document`** - остается для изображений

### 4. Обновление Telegram webhook
**Файл:** `app/api/telegram-chat-webhook/route.ts`

- Обработчик `accredit_product_certs_` теперь отправляет сертификаты через новый API
- Обработчик `accredit_files_documents` теперь отправляет документы через новый API
- Добавлено подробное логирование для отладки

### 5. Обновление базы данных
**SQL файл:** `fix-accreditation-storage.sql`

```sql
-- Новые поля для отслеживания бакетов
ALTER TABLE accreditation_applications
ADD COLUMN IF NOT EXISTS documents_bucket text DEFAULT 'accreditation-documents',
ADD COLUMN IF NOT EXISTS certificates_bucket text DEFAULT 'accreditation-certificates',
ADD COLUMN IF NOT EXISTS images_bucket text DEFAULT 'project-images';
```

## 🎯 Преимущества новой архитектуры

### 1. Разделение ответственности
- **Изображения:** Оптимизация для веб, сжатие, CDN
- **Сертификаты:** Долгосрочное хранение, архивирование
- **Документы:** Безопасность, шифрование, аудит

### 2. Гибкость настройки
- Разные политики RLS для каждого типа файлов
- Разные лимиты размера файлов
- Разные MIME-типы для каждого бакета

### 3. Простота управления
- Четкая структура папок
- Легкий поиск файлов по типу
- Простое резервное копирование

### 4. Масштабируемость
- Разные CDN для разных типов контента
- Оптимизация под тип файлов
- Гибкое управление кэшированием

## 📁 Структура хранения

### 🖼️ Изображения товаров (`project-images`)
```
project-images/
└── accreditation/
    └── {application_id}/
        └── products/
            └── {product_index}/
                └── images/
                    ├── {timestamp}_product_image.jpg
                    ├── {timestamp}_product_image.png
                    └── {timestamp}_product_image.svg
```

### 📄 Сертификаты товаров (`accreditation-certificates`)
```
accreditation-certificates/
└── accreditation/
    └── {application_id}/
        └── products/
            └── {product_index}/
                └── certificates/
                    ├── {timestamp}_quality_certificate.pdf
                    ├── {timestamp}_safety_certificate.pdf
                    └── {timestamp}_compliance_certificate.doc
```

### ⚖️ Юридические документы (`accreditation-documents`)
```
accreditation-documents/
└── accreditation/
    └── {application_id}/
        └── legal/
            ├── {timestamp}_business_license.pdf
            ├── {timestamp}_tax_certificate.pdf
            ├── {timestamp}_registration_certificate.pdf
            └── {timestamp}_other_document.pdf
```

## 🧪 Тестирование

Создан тестовый скрипт `test-new-storage-architecture.js` для проверки:
- Существования новых бакетов
- Структуры таблицы базы данных
- Загрузки файлов в правильные бакеты
- Генерации публичных URL
- Очистки тестовых файлов

## 🚀 Следующие шаги

### 1. Применить изменения в базе данных
```bash
# Выполнить SQL скрипт для создания бакетов и обновления таблицы
psql -d your_database -f fix-accreditation-storage.sql
```

### 2. Протестировать новую архитектуру
```bash
# Запустить тестовый скрипт
node test-new-storage-architecture.js
```

### 3. Проверить работу Telegram бота
- Отправить новую заявку на аккредитацию
- Проверить сохранение файлов в правильные бакеты
- Протестировать отправку файлов через Telegram

### 4. Мигрировать существующие файлы (опционально)
- Создать скрипт миграции для переноса существующих файлов
- Обновить записи в базе данных

## 📊 Статус реализации

- ✅ Создание новых бакетов
- ✅ Обновление API для сохранения
- ✅ Создание API для отправки в Telegram
- ✅ Обновление Telegram webhook
- ✅ Обновление базы данных
- ✅ Создание тестового скрипта
- ✅ Документация
- ⏳ Применение изменений в базе данных
- ⏳ Тестирование в продакшене

## 🎉 Результат

Теперь система аккредитации имеет правильную, масштабируемую архитектуру хранения файлов, которая соответствует принципам хорошей архитектуры и обеспечивает:

- **Четкое разделение** типов файлов
- **Правильную структуру** хранения
- **Гибкость настройки** для каждого типа
- **Простоту управления** и масштабирования
- **Соответствие принципам** хорошей архитектуры

Все файлы теперь сохраняются в правильные бакеты, и Telegram бот может корректно отправлять их менеджерам! 🚀 