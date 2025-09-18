# 📷 Функциональность отправки изображений в Telegram

## ✅ **Что реализовано:**

### **1. Сохранение файлов в Supabase Storage**
- ✅ Файлы изображений товаров сохраняются в bucket `project-images`
- ✅ Файлы сертификатов товаров сохраняются в bucket `project-images`
- ✅ Юридические документы сохраняются в bucket `project-images`
- ✅ Генерируются публичные URL для всех файлов
- ✅ Файлы сохраняются в структурированных папках: `accreditation/{application_id}/products/{product_index}/images/`

### **2. Обновление API для получения файлов**
- ✅ API `/api/telegram/get-accreditation-files` возвращает URL файлов
- ✅ Поддержка различных типов файлов: `product_images`, `product_certificates`, `documents`
- ✅ Метаданные файлов включают `public_url` для прямого доступа

### **3. Отправка изображений в Telegram**
- ✅ Добавлен метод `sendPhoto` в `ChatBotService`
- ✅ Добавлен метод `sendPhoto` в `TelegramService`
- ✅ Обработчики в webhook отправляют реальные изображения
- ✅ Fallback на ссылки, если отправка изображения не удается

### **4. Обработчики в Telegram webhook**
- ✅ `accredit_product_images_{id}_{productIndex}` - отправка изображений товара
- ✅ `accredit_product_certs_{id}_{productIndex}` - отправка сертификатов товара
- ✅ Автоматическая отправка изображений при нажатии кнопок
- ✅ Подробная информация о файлах с размерами и типами

## 🔧 **Техническая реализация:**

### **Структура файлов в Supabase Storage:**
```
project-images/
├── accreditation/
│   ├── {application_id}/
│   │   ├── products/
│   │   │   ├── 0/
│   │   │   │   ├── images/
│   │   │   │   │   └── {timestamp}_{filename}
│   │   │   │   └── certificates/
│   │   │   │       └── {timestamp}_{filename}
│   │   │   └── 1/
│   │   │       ├── images/
│   │   │       └── certificates/
│   │   └── legal/
│   │       └── {timestamp}_{filename}
```

### **API Endpoints:**
- `POST /api/catalog/submit-accreditation` - создание заявки с сохранением файлов
- `GET /api/telegram/get-accreditation-files` - получение файлов с URL
- `POST /api/telegram-chat-webhook` - обработка callback'ов для отправки изображений

### **Telegram Bot Commands:**
- `/accredit_view {id}` - просмотр заявки
- Кнопки "📦 Товары" → "📷 [товар] (изображения)" → отправка изображений
- Кнопки "📦 Товары" → "📋 [товар] (сертификаты)" → отправка сертификатов

## 📱 **Как протестировать:**

### **1. Создайте заявку с файлами:**
```bash
# Используйте веб-интерфейс или API с FormData
POST /api/catalog/submit-accreditation
Content-Type: multipart/form-data

supplier_id: "86cc190d-0c80-463b-b0df-39a25b22365f"
supplier_type: "profile"
profile_data: {...}
products: [...]
legal_confirmation: {...}
product_0_image_0: [файл изображения]
product_0_cert_0: [файл сертификата]
```

### **2. Протестируйте в Telegram:**
```
1. Откройте @get2b_chathub_bot
2. Выполните: /accredit_view {application_id}
3. Нажмите "📦 Товары"
4. Нажмите "📷 [товар] (изображения)"
5. Должны появиться реальные изображения!
```

### **3. Проверьте API:**
```bash
# Получить файлы заявки
curl "http://localhost:3000/api/telegram/get-accreditation-files?applicationId={id}&type=product_images&productIndex=0"

# Результат должен содержать public_url
{
  "success": true,
  "data": {
    "images": [
      {
        "name": "image.jpg",
        "size": 1024,
        "type": "image/jpeg",
        "public_url": "https://..."
      }
    ]
  }
}
```

## 🎯 **Результат:**

Теперь менеджеры могут:
- ✅ **Видеть реальные изображения** товаров прямо в Telegram
- ✅ **Просматривать сертификаты** в виде изображений
- ✅ **Получать детальную информацию** о файлах (размер, тип)
- ✅ **Работать полностью в Telegram** без веб-интерфейса
- ✅ **Навигировать между разными уровнями** информации

## 🚨 **Важные моменты:**

### **Ограничения:**
- Файлы сохраняются только при отправке через FormData (с файлами)
- Максимальный размер файла зависит от настроек Supabase
- Поддерживаются форматы: PNG, JPG, PDF, DOC, DOCX

### **Безопасность:**
- Файлы сохраняются в публичном bucket с ограниченным доступом
- URL файлов генерируются автоматически
- RLS политики контролируют доступ к данным

### **Производительность:**
- Файлы загружаются асинхронно
- Используется кэширование для быстрого доступа
- Оптимизированная структура папок

---

**Статус:** ✅ Реализовано и готово к тестированию  
**Дата:** 2025-07-25  
**Версия:** 1.0 