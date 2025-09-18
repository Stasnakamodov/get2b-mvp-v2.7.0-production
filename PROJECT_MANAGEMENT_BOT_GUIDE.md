# 🚀 GET2B PROJECT MANAGEMENT BOT GUIDE

## 📋 **ОГЛАВЛЕНИЕ**
1. [🎯 Обзор системы](#обзор-системы)
2. [⚙️ Настройка окружения](#настройка-окружения)
3. [🔄 Жизненный цикл проекта](#жизненный-цикл-проекта)
4. [🤖 Управление через Telegram Bot](#управление-через-telegram-bot)
5. [📊 Мониторинг и отчеты](#мониторинг-и-отчеты)
6. [🆘 Troubleshooting](#troubleshooting)

---

## 🎯 **ОБЗОР СИСТЕМЫ**

### **Архитектура проектов GET2B**
GET2B использует **7-шаговую систему** управления B2B проектами с полной интеграцией Telegram для менеджеров.

### **Ключевые компоненты:**
- 📱 **Next.js Web App** - клиентский интерфейс
- 🗄️ **Supabase Database** - хранение данных
- 🤖 **Telegram Bot** `@Get2b_bot` - управление менеджерами
- 🌐 **Ngrok Tunneling** - локальная разработка
- 📄 **OCR Processing** - анализ документов

---

## ⚙️ **НАСТРОЙКА ОКРУЖЕНИЯ**

### **1. Переменные окружения**
```bash
# 🤖 TELEGRAM BOT НАСТРОЙКИ
TELEGRAM_BOT_TOKEN="7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ"
TELEGRAM_CHAT_ID="6725753966"

# 🗄️ SUPABASE НАСТРОЙКИ
NEXT_PUBLIC_SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 🌐 NGROK НАСТРОЙКИ (для разработки)
NGROK_WEBHOOK_URL="https://your-ngrok-url.ngrok.io"
```

### **2. Запуск системы**
```bash
# Шаг 1: Запуск Next.js сервера
npm run dev

# Шаг 2: Настройка ngrok (новый терминал)
ngrok http 3000

# Шаг 3: Настройка webhook бота
curl -X POST "https://api.telegram.org/bot{BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-ngrok-url.ngrok.io/api/telegram-webhook"}'
```

### **3. Проверка подключения**
```bash
# Проверка webhook
curl "https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo"

# Тест отправки сообщения
curl -X POST "http://localhost:3000/api/telegram/send-message" \
  -H "Content-Type: application/json" \
  -d '{"text": "Система запущена! 🚀"}'
```

---

## 🔄 **ЖИЗНЕННЫЙ ЦИКЛ ПРОЕКТА**

### **STEP 1: Создание компании**
```
Статус: draft
Что происходит: Клиент заполняет данные компании
Действия менеджера: Проверка корректности данных
```

### **STEP 2: Загрузка спецификации и инвойса**
```
Статус: in_progress → waiting_approval
Что происходит: Клиент загружает документы
Уведомление: "📄 Новый проект требует одобрения"
Действия менеджера: Одобрить/Отклонить через кнопки в Telegram
```

### **STEP 3: Ожидание оплаты от клиента**
```
Статус: waiting_receipt
Что происходит: Клиент загружает чек об оплате
Уведомление: "💰 Получен чек от клиента"
Действия менеджера: Одобрить/Отклонить чек
```

### **STEP 4: Выбор метода оплаты поставщику**
```
Статус: receipt_approved → filling_requisites
Что происходит: Выбор банк/крипто/P2P оплаты
Действия менеджера: Проверка реквизитов поставщика
```

### **STEP 5: Заполнение реквизитов**
```
Статус: filling_requisites
Что происходит: Заполнение банковских/крипто данных
Действия менеджера: Валидация реквизитов
```

### **STEP 6: Загрузка чека менеджером**
```
Статус: waiting_manager_receipt → in_work
Что происходит: Менеджер загружает чек об оплате поставщику
Как загрузить: Reply на сообщение в Telegram с файлом
```

### **STEP 7: Подтверждение получения товара**
```
Статус: waiting_client_confirmation → completed
Что происходит: Клиент подтверждает получение товара
Уведомление: "✅ Проект завершен успешно"
```

---

## 🤖 **УПРАВЛЕНИЕ ЧЕРЕЗ TELEGRAM BOT**

### **🔥 КРИТИЧЕСКИ ВАЖНО:**
Бот должен быть настроен на правильный webhook:
```
✅ ПРАВИЛЬНО: /api/telegram-webhook
❌ НЕПРАВИЛЬНО: /api/telegram-manager-webhook
```

### **📱 Типы уведомлений**

#### **1. Новый проект создан**
```
🆕 Новый проект создан или обновлён!

Номер проекта: 1023ff09-9a29-4916-850a-ccaff97df9bb
Пользователь: user@example.com
Название проекта: ООО ПРИМЕР

Данные компании:
- Название: ООО ПРИМЕР
- ИНН: 1234567890
- КПП: 123456001
```

#### **2. Запрос на одобрение**
```
📋 ПРОЕКТ ТРЕБУЕТ ОДОБРЕНИЯ

🆔 ID: abc-123-def
📊 Название: ООО ТЕСТ
💰 Сумма: 150,000 RUB
🏭 Поставщик: China Supplier Ltd

[Одобрить] [Отклонить]
```

#### **3. Загрузка чека клиентом**
```
💰 ПОЛУЧЕН ЧЕК ОТ КЛИЕНТА

🆔 Проект: abc-123-def
📄 Файл: client_receipt.jpg
⏰ Время: 13:45 15/09/2025

[Одобрить чек] [Отклонить чек]
```

#### **4. Запрос загрузки чека менеджером**
```
📤 Загрузка чека для проекта abc-123-def

Пожалуйста, отправьте чек (фото или файл)
в ответ на это сообщение.

💡 Как загрузить: Reply на это сообщение + прикрепить файл
```

### **⚡ Интерактивные кнопки**

#### **Основные действия:**
- `✅ Одобрить` - одобряет проект и переводит на следующий этап
- `❌ Отклонить` - отклоняет и возвращает клиенту на доработку
- `📤 Загрузить чек` - открывает диалог загрузки файла
- `🔍 Детали` - показывает полную информацию о проекте

#### **Атомарный конструктор:**
- `approve_atomic_` - одобрение атомарного конструктора
- `reject_atomic_` - отклонение атомарного конструктора
- `request_changes_atomic_` - запрос изменений

#### **Работа с чеками:**
- `approve_receipt_` - одобрение чека оплаты
- `reject_receipt_` - отклонение чека
- `approve_client_receipt_` - одобрение чека от клиента

---

## 📊 **МОНИТОРИНГ И ОТЧЕТЫ**

### **🗄️ Проверка статусов в базе данных**
```sql
-- Все активные проекты
SELECT id, name, status, current_step, created_at
FROM projects
WHERE status != 'completed'
ORDER BY created_at DESC;

-- Проекты требующие внимания менеджера
SELECT id, name, status, current_step
FROM projects
WHERE status IN (
  'waiting_approval',
  'waiting_receipt',
  'waiting_manager_receipt'
)
ORDER BY current_step;

-- Статистика по этапам
SELECT status, current_step, COUNT(*) as count
FROM projects
GROUP BY status, current_step
ORDER BY current_step;
```

### **📈 API для получения статистики**
```bash
# Статистика проектов
curl "http://localhost:3000/api/debug-projects"

# Проверка полей проекта
curl "http://localhost:3000/api/check-project-fields"

# Анализ спецификаций
curl "http://localhost:3000/api/analyze-project-specifications"
```

### **🔍 Отладка webhook'ов**
```bash
# Проверка логов сервера
tail -f .next/trace

# Проверка ngrok трафика
ngrok http 3000 --log=stdout

# Тест webhook'а
curl -X POST "https://your-ngrok-url.ngrok.io/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{"callback_query": {"id": "test", "data": "approve_test-project-id"}}'
```

---

## 🆘 **TROUBLESHOOTING**

### **❌ Проблема: "Бот не апрувит сделки"**
```bash
# 1. Проверить webhook URL
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"

# 2. Исправить webhook если неправильный
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d '{"url": "https://your-ngrok.ngrok.io/api/telegram-webhook"}'

# 3. Проверить логи сервера
grep "telegram" logs/server.log
```

### **❌ Проблема: "Кнопки не реагируют"**
```bash
# 1. Проверить callback_query обработку
grep "callback_query" logs/server.log

# 2. Проверить формат callback_data
# Должно быть: approve_1023ff09-9a29-4916-850a-ccaff97df9bb
# НЕ должно быть: approve_deal 1023ff09

# 3. Проверить статус проекта в БД
psql -c "SELECT status FROM projects WHERE id='project-id';"
```

### **❌ Проблема: "Файлы не загружаются"**
```bash
# 1. Проверить права доступа Supabase Storage
# 2. Проверить webhook обработку message с photo/document
# 3. Проверить reply_to_message связь

grep "reply_to_message" logs/server.log
```

### **❌ Проблема: "Uведомления не приходят"**
```bash
# 1. Проверить TELEGRAM_CHAT_ID в .env
echo $TELEGRAM_CHAT_ID

# 2. Проверить что бот добавлен в чат
curl "https://api.telegram.org/bot{TOKEN}/getChat?chat_id={CHAT_ID}"

# 3. Тест отправки
curl -X POST "http://localhost:3000/api/telegram/send-message" \
  -d '{"text": "Test message"}'
```

### **🔧 Быстрые исправления**

#### **Перезапуск webhook:**
```bash
# Выключить webhook
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" -d '{"url": ""}'

# Включить webhook
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d '{"url": "https://your-ngrok.ngrok.io/api/telegram-webhook"}'
```

#### **Очистка pending updates:**
```bash
# Получить updates
curl "https://api.telegram.org/bot{TOKEN}/getUpdates"

# Очистить очередь
curl "https://api.telegram.org/bot{TOKEN}/getUpdates?offset=-1"
```

#### **Перевод проекта на следующий этап вручную:**
```sql
-- Одобрить проект
UPDATE projects
SET status = 'waiting_receipt', current_step = 3
WHERE id = 'project-id';

-- Одобрить чек
UPDATE projects
SET status = 'receipt_approved', current_step = 4
WHERE id = 'project-id';
```

---

## 🎯 **БЫСТРЫЙ СТАРТ**

### **Минимальный чеклист для запуска:**

1. ✅ **Запустить сервер:** `npm run dev`
2. ✅ **Запустить ngrok:** `ngrok http 3000`
3. ✅ **Настроить webhook:** `curl webhook setup`
4. ✅ **Проверить переменные:** проверить .env файл
5. ✅ **Тест сообщения:** отправить тестовое уведомление
6. ✅ **Создать тестовый проект:** через веб интерфейс
7. ✅ **Проверить уведомление:** должно прийти в Telegram
8. ✅ **Протестировать кнопки:** нажать Одобрить/Отклонить
9. ✅ **Проверить статус в БД:** статус должен измениться

### **Команды для быстрого старта:**
```bash
# 1. Полная перенастройка
./scripts/setup-bot.sh

# 2. Быстрый тест
curl -X POST "http://localhost:3000/api/telegram/send-project-approval" \
  -H "Content-Type: application/json" \
  -d '{"text": "TEST PROJECT", "projectId": "test-123", "type": "spec"}'

# 3. Проверка результата
psql -c "SELECT * FROM projects WHERE id='test-123';"
```

---

## 📞 **КОНТАКТЫ И ПОДДЕРЖКА**

- 🤖 **Bot Username:** `@Get2b_bot`
- 🆔 **Bot ID:** `7674425495`
- 💬 **Manager Chat ID:** `6725753966`
- 🌐 **Webhook Endpoint:** `/api/telegram-webhook`

**Документация создана:** 13.09.2025
**Версия системы:** v2.3.8
**Статус:** Production Ready ✅

---

*💡 Совет: Добавьте этот файл в закладки и обновляйте при изменении конфигурации!*