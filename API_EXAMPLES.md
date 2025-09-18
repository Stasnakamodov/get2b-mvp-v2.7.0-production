# 📡 GET2B API EXAMPLES FOR PROJECT MANAGEMENT

## 🚀 **TELEGRAM BOT API ENDPOINTS**

### **1. Отправка уведомлений**

#### **Отправить простое сообщение**
```bash
curl -X POST "http://localhost:3000/api/telegram/send-message" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🚀 Новый проект создан!"
  }'
```

#### **Отправить запрос на одобрение проекта**
```bash
curl -X POST "http://localhost:3000/api/telegram/send-project-approval" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Проект требует одобрения",
    "projectId": "1023ff09-9a29-4916-850a-ccaff97df9bb",
    "type": "spec"
  }'
```

#### **Отправить уведомление о загрузке инвойса**
```bash
curl -X POST "http://localhost:3000/api/telegram/send-message" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "📄 Загружен инвойс для проекта 1023ff09-9a29-4916-850a-ccaff97df9bb\n\n💰 Сумма: 1,701,540 RUB\n🏭 Поставщик: ZHEJIANG GAMMA TRADING CO.,LTD\n\nТребуется проверка менеджера."
  }'
```

### **2. Webhook тестирование**

#### **Тест одобрения проекта**
```bash
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_query": {
      "id": "test123",
      "data": "approve_1023ff09-9a29-4916-850a-ccaff97df9bb",
      "from": {"id": 6725753966, "first_name": "Manager"}
    }
  }'
```

#### **Тест отклонения проекта**
```bash
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_query": {
      "id": "test124",
      "data": "reject_1023ff09-9a29-4916-850a-ccaff97df9bb",
      "from": {"id": 6725753966, "first_name": "Manager"}
    }
  }'
```

#### **Тест одобрения чека**
```bash
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_query": {
      "id": "test125",
      "data": "approve_receipt_1023ff09-9a29-4916-850a-ccaff97df9bb",
      "from": {"id": 6725753966, "first_name": "Manager"}
    }
  }'
```

---

## 🗄️ **DATABASE QUERIES**

### **Проверка статусов проектов**
```sql
-- Все активные проекты
SELECT
  id,
  name,
  status,
  current_step,
  created_at::date as created,
  updated_at::date as updated
FROM projects
WHERE status != 'completed'
ORDER BY updated_at DESC;
```

### **Поиск проектов по статусу**
```sql
-- Проекты ожидающие одобрения
SELECT id, name, status, current_step
FROM projects
WHERE status = 'waiting_approval'
ORDER BY created_at;

-- Проекты с загруженными чеками
SELECT id, name, status, receipts
FROM projects
WHERE status = 'waiting_receipt'
AND receipts IS NOT NULL;
```

### **Изменение статуса проекта вручную**
```sql
-- Одобрить проект (перевести на загрузку чека)
UPDATE projects
SET
  status = 'waiting_receipt',
  current_step = 3,
  updated_at = NOW()
WHERE id = '1023ff09-9a29-4916-850a-ccaff97df9bb';

-- Одобрить чек (перевести на выбор оплаты)
UPDATE projects
SET
  status = 'receipt_approved',
  current_step = 4,
  updated_at = NOW()
WHERE id = '1023ff09-9a29-4916-850a-ccaff97df9bb';
```

---

## 🧪 **TESTING SCENARIOS**

### **Сценарий 1: Полный цикл проекта**
```bash
# 1. Создать тестовый проект
curl -X POST "http://localhost:3000/api/constructor/create-project" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовый проект",
    "company_name": "ООО ТЕСТ",
    "inn": "1234567890"
  }'

# 2. Отправить запрос на одобрение
curl -X POST "http://localhost:3000/api/telegram/send-project-approval" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Тестовый проект требует одобрения",
    "projectId": "PROJECT_ID",
    "type": "spec"
  }'

# 3. Одобрить через webhook
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_query": {
      "id": "test_approve",
      "data": "approve_PROJECT_ID"
    }
  }'
```

### **Сценарий 2: Загрузка файла менеджером**
```bash
# 1. Имитация запроса загрузки чека
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "callback_query": {
      "id": "upload_test",
      "data": "upload_supplier_receipt_PROJECT_ID"
    }
  }'

# 2. Имитация загрузки файла (в реальности - через Telegram)
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "message_id": 123,
      "photo": [{"file_id": "test_photo_id", "width": 800, "height": 600}],
      "reply_to_message": {
        "text": "Загрузка чека для проекта PROJECT_ID"
      }
    }
  }'
```

---

## 🔧 **WEBHOOK SETUP**

### **Настройка webhook для локальной разработки**
```bash
# 1. Запустить ngrok
ngrok http 3000

# 2. Получить URL
NGROK_URL="https://abc123.ngrok.io"

# 3. Настроить webhook
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$NGROK_URL/api/telegram-webhook\"}"

# 4. Проверить webhook
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

### **Настройка webhook для продакшена**
```bash
# Замените на ваш домен
PRODUCTION_URL="https://yourdomain.com"

curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$PRODUCTION_URL/api/telegram-webhook\"}"
```

---

## 📊 **MONITORING AND DEBUG**

### **Проверка webhook статуса**
```bash
# Информация о webhook
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq '.'

# Получение обновлений (для отладки)
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates" | jq '.'

# Очистка pending updates
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates?offset=-1"
```

### **Проверка бота**
```bash
# Информация о боте
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" | jq '.'

# Отправка тестового сообщения напрямую
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"$TELEGRAM_CHAT_ID\",
    \"text\": \"🧪 Direct bot test: $(date)\"
  }"
```

### **Логирование**
```bash
# Просмотр логов Next.js
tail -f .next/trace

# Фильтр по Telegram событиям
tail -f logs/server.log | grep -i telegram

# Проверка ngrok запросов
curl http://localhost:4040/api/requests/http | jq '.data[].request'
```

---

## 🎯 **QUICK COMMANDS**

### **Быстрый перезапуск**
```bash
# Выключить webhook
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d '{"url": ""}'

# Включить webhook
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "{\"url\": \"$(curl -s localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')/api/telegram-webhook\"}"
```

### **Отладка конкретного проекта**
```bash
# Получить данные проекта
PROJECT_ID="1023ff09-9a29-4916-850a-ccaff97df9bb"

# Информация из БД
psql -c "SELECT * FROM projects WHERE id='$PROJECT_ID';"

# Отправить уведомление
curl -X POST "http://localhost:3000/api/telegram/send-project-approval" \
  -d "{\"text\": \"Debug project $PROJECT_ID\", \"projectId\": \"$PROJECT_ID\"}"

# Симулировать одобрение
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -d "{\"callback_query\": {\"id\": \"debug\", \"data\": \"approve_$PROJECT_ID\"}}"
```

---

## 📝 **NOTES**

- Все API calls предполагают что сервер запущен на `localhost:3000`
- Замените `PROJECT_ID` на реальные UUID проектов
- Для продакшена замените localhost на ваш домен
- Используйте `jq` для красивого форматирования JSON ответов
- Webhook должен быть доступен из интернета (ngrok для разработки)

**Создано:** 13.09.2025
**Обновлено:** Актуальная версия
**Статус:** Ready to use ✅