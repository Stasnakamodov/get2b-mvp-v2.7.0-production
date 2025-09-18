# 🏗️ Архитектура хранения файлов аккредитации

## ❌ Проблемы текущей архитектуры

### 1. Все файлы в одном бакете
- **Проблема:** Картинки, сертификаты и документы в `project-images`
- **Последствия:** Путаница, сложность управления, нарушение принципа разделения ответственности

### 2. Неправильное разделение типов файлов
- **Проблема:** Сертификаты (PDF) в бакете для изображений
- **Последствия:** Сложность поиска, неправильные MIME-типы

### 3. Отсутствие специализированных бакетов
- **Проблема:** Нет отдельных бакетов для разных типов контента
- **Последствия:** Невозможность настройки специфичных политик

## ✅ Правильная архитектура

### 📁 Структура бакетов

#### 🖼️ `project-images` - Только изображения
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

**Типы файлов:** `image/jpeg`, `image/png`, `image/svg+xml`, `image/webp`

#### 📄 `accreditation-certificates` - Сертификаты товаров
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

**Типы файлов:** `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### ⚖️ `accreditation-documents` - Юридические документы
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

**Типы файлов:** `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`

## 🔧 Реализация

### 1. Создание бакетов
```sql
-- Бакет для сертификатов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accreditation-certificates',
  'accreditation-certificates',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Бакет для документов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accreditation-documents',
  'accreditation-documents',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
);
```

### 2. API изменения
```typescript
// Сертификаты товаров
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('accreditation-certificates')
  .upload(fileName, certFile.file, {
    cacheControl: '3600',
    upsert: false
  });

// Юридические документы
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('accreditation-documents')
  .upload(fileName, docFile.file, {
    cacheControl: '3600',
    upsert: false
  });

// Изображения товаров (остается в project-images)
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('project-images')
  .upload(fileName, imageFile.file, {
    cacheControl: '3600',
    upsert: false
  });
```

## 📊 Преимущества новой архитектуры

### 1. Разделение ответственности
- **Изображения:** Оптимизация для веб, сжатие, CDN
- **Сертификаты:** Долгосрочное хранение, архивирование
- **Документы:** Безопасность, шифрование, аудит

### 2. Гибкость настройки
- **Разные политики RLS** для каждого типа файлов
- **Разные лимиты размера** файлов
- **Разные MIME-типы** для каждого бакета

### 3. Простота управления
- **Четкая структура** папок
- **Легкий поиск** файлов по типу
- **Простое резервное копирование**

### 4. Масштабируемость
- **Разные CDN** для разных типов контента
- **Оптимизация под тип** файлов
- **Гибкое управление** кэшированием

## 🚀 Миграция

### 1. Создать новые бакеты
```bash
# Выполнить SQL скрипт
psql -d your_database -f fix-accreditation-storage.sql
```

### 2. Обновить API
```bash
# Обновить код в submit-accreditation/route.ts
# Изменить бакеты для сертификатов и документов
```

### 3. Мигрировать существующие файлы
```sql
-- Создать скрипт миграции существующих файлов
-- Перенести сертификаты из project-images в accreditation-certificates
-- Перенести документы из project-images в accreditation-documents
```

### 4. Обновить фронтенд
```typescript
// Обновить URL для загрузки файлов
// Добавить валидацию типов файлов
// Обновить отображение файлов
```

## 📋 Чек-лист внедрения

- [ ] Создать бакеты `accreditation-certificates` и `accreditation-documents`
- [ ] Настроить политики RLS для новых бакетов
- [ ] Обновить API для использования правильных бакетов
- [ ] Создать миграцию существующих файлов
- [ ] Обновить фронтенд для работы с новой структурой
- [ ] Протестировать загрузку всех типов файлов
- [ ] Обновить документацию
- [ ] Настроить мониторинг и логирование

## 🎯 Результат

После внедрения новой архитектуры:
- ✅ **Четкое разделение** типов файлов
- ✅ **Правильная структура** хранения
- ✅ **Гибкость настройки** для каждого типа
- ✅ **Простота управления** и масштабирования
- ✅ **Соответствие принципам** хорошей архитектуры 