# 🔔 СИСТЕМА УВЕДОМЛЕНИЙ GET2B

## 📋 **ОБЗОР**

Комплексная система уведомлений поддерживает **4 канала доставки**:
- 📱 **Telegram** - Мгновенные уведомления с интерактивными кнопками
- 🔔 **Push** - Браузерные уведомления (Web Push API)
- 💬 **SMS** - Критичные уведомления через SMS.ru
- ✉️ **Email** - Подробные отчеты (планируется)

## 🎯 **КРИТИЧНЫЕ ЭТАПЫ ПРОЕКТА**

Автоматические уведомления отправляются на этих этапах:

| Статус | Описание | Кому | Каналы |
|--------|----------|------|--------|
| **`waiting_approval`** | Требуется одобрение менеджера | Менеджер | Telegram, SMS |
| **`waiting_receipt`** | Ожидание чека от клиента | Клиент | Telegram, Push, SMS |
| **`receipt_rejected`** | Чек отклонён | Клиент | Telegram, Push, SMS |
| **`waiting_manager_receipt`** | Ожидание чека от менеджера | Менеджер | Telegram, SMS |
| **`waiting_client_confirmation`** | Ожидание подтверждения | Клиент | Telegram, Push |
| **`completed`** | Проект завершён | Все | Telegram, Push |

---

## ⚙️ **НАСТРОЙКА КАНАЛОВ**

### 1. 📱 **TELEGRAM BOT**

Telegram уже настроен! Проверьте переменные окружения:

```bash
# .env.local
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

**Проверка работы:**
```bash
curl -X GET "http://localhost:3000/api/telegram/test-bot"
```

**Функции:**
- ✅ Отправка сообщений с кнопками действий
- ✅ Обработка webhook'ов
- ✅ Интерактивные кнопки (Одобрить/Отклонить)
- ✅ Автоматические уведомления по статусам

---

### 2. 🔔 **PUSH УВЕДОМЛЕНИЯ**

**Установка пакета:**
```bash
npm install web-push @types/web-push
```

**Генерация VAPID ключей:**
```bash
npx web-push generate-vapid-keys
```

**Добавьте в .env.local:**
```bash
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=your_email@domain.com
```

**Клиентская подписка (добавить в layout.tsx):**
```javascript
// Регистрация Service Worker
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      // Подписка на уведомления
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
      })
    })
    .then(subscription => {
      // Сохранить subscription в базе данных
      console.log('Push subscription:', subscription)
    })
}
```

**Создайте public/sw.js:**
```javascript
self.addEventListener('push', event => {
  const data = event.data.json()
  
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    actions: data.actions,
    requireInteraction: data.requireInteraction
  })
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'open_project') {
    clients.openWindow('/dashboard/project/' + event.notification.data.projectId)
  }
})
```

---

### 3. 💬 **SMS УВЕДОМЛЕНИЯ**

**Регистрация на SMS.ru:**
1. Зайдите на https://sms.ru/
2. Зарегистрируйтесь и пополните баланс
3. Получите API_ID в личном кабинете

**Добавьте в .env.local:**
```bash
SMS_RU_API_ID=your_api_id_here
SMS_RU_FROM=Get2B  # Имя отправителя (опционально)
```

**Проверка баланса:**
```bash
curl -X GET "http://localhost:3000/api/sms/balance"
```

**Тестовая отправка:**
```bash
curl -X POST "http://localhost:3000/api/sms/test" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79991234567"}'
```

---

## 🚀 **ИСПОЛЬЗОВАНИЕ**

### **Автоматическая отправка при изменении статуса:**

```typescript
// В вашем коде изменения статуса проекта
await fetch('/api/notifications/project-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-123',
    oldStatus: 'in_progress',
    newStatus: 'waiting_approval',
    projectData: {
      companyName: 'ООО Тестовая компания',
      amount: 50000,
      currency: 'USD'
    },
    recipients: [
      {
        id: 'manager-1',
        name: 'Менеджер',
        role: 'manager',
        phone: '+79991234567',
        preferences: {
          channels: [
            { type: 'telegram', enabled: true },
            { type: 'sms', enabled: true }
          ],
          criticalOnly: false,
          timezone: 'Europe/Moscow'
        }
      }
    ]
  })
})
```

### **Ручная отправка через сервис:**

```typescript
import { NotificationService } from '@/lib/notifications/NotificationService'

const notificationService = NotificationService.getInstance()

const results = await notificationService.sendProjectStatusNotification(
  projectId,
  oldStatus,
  newStatus,
  projectData,
  recipients
)

console.log('Результаты отправки:', results)
```

---

## 🧪 **ТЕСТИРОВАНИЕ**

### **Страница тестирования:**
Откройте: `http://localhost:3000/dashboard/test-notifications`

**Возможности:**
- ✅ Проверка статуса всех каналов
- ✅ Тестирование разных статусов проекта
- ✅ Настройка получателей
- ✅ Просмотр результатов отправки
- ✅ Статистика доставки

### **API для тестирования:**

**Проверка доступных каналов:**
```bash
curl -X GET "http://localhost:3000/api/notifications/project-status"
```

**Отправка тестового уведомления:**
```bash
curl -X POST "http://localhost:3000/api/notifications/project-status" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-123",
    "oldStatus": "draft",
    "newStatus": "waiting_approval",
    "projectData": {
      "companyName": "Тестовая компания",
      "amount": 1000,
      "currency": "USD"
    }
  }'
```

---

## 📊 **МОНИТОРИНГ И СТАТИСТИКА**

### **Логи уведомлений:**
Все уведомления логируются в консоль с подробной информацией:

```
🔔 API /notifications/project-status вызван
📦 Тело запроса: { projectId: "test-123", ... }
📡 Доступные каналы: ["telegram", "push"]
👥 Получатели уведомлений: 2
✅ Отправлено успешно: 2/2
```

### **API статистики:**
```bash
curl -X GET "http://localhost:3000/api/notifications/project-status?projectId=test-123"
```

**Ответ:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "successful": 8,
    "failed": 2,
    "byChannel": {
      "telegram": 5,
      "push": 2,
      "sms": 1,
      "email": 0
    }
  },
  "availableChannels": ["telegram", "push"]
}
```

---

## ⚠️ **TROUBLESHOOTING**

### **Telegram не работает:**
```bash
# Проверка токена
curl -X GET "https://api.telegram.org/bot<TOKEN>/getMe"

# Проверка webhook
curl -X GET "http://localhost:3000/api/telegram/set-webhook"
```

### **Push уведомления не приходят:**
1. Проверьте VAPID ключи в .env.local
2. Убедитесь что Service Worker зарегистрирован
3. Проверьте разрешения на уведомления в браузере

### **SMS не отправляются:**
```bash
# Проверка API ключа и баланса
curl -X GET "https://sms.ru/my/balance?api_id=<API_ID>&json=1"

# Проверка формата номера
# Правильно: 79991234567
# Неправильно: +7(999)123-45-67
```

### **Общие проблемы:**
- Проверьте все переменные окружения
- Убедитесь что сервисы доступны
- Проверьте логи в консоли разработчика

---

## 🔧 **РАСШИРЕНИЕ СИСТЕМЫ**

### **Добавление нового канала:**

1. **Создайте сервис:**
```typescript
// lib/notifications/EmailService.ts
export class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    // Реализация отправки email
  }
}
```

2. **Интегрируйте в NotificationService:**
```typescript
// lib/notifications/NotificationService.ts
private async sendEmailNotification(
  recipient: NotificationRecipient,
  notification: NotificationPayload
): Promise<NotificationResult> {
  // Реализация отправки email
}
```

3. **Добавьте в каналы:**
```typescript
this.channels.set('email', {
  type: 'email',
  enabled: !!process.env.EMAIL_API_KEY,
  config: { /* конфигурация */ }
})
```

### **Кастомные уведомления:**

```typescript
// Создание специального уведомления
const customNotification: NotificationPayload = {
  id: 'custom-notification',
  type: 'custom_alert',
  priority: 'high',
  title: 'Внимание!',
  message: 'Кастомное сообщение',
  data: { customField: 'value' }
}

await notificationService.sendToChannel('telegram', recipient, customNotification)
```

---

## 📈 **ПРОИЗВОДИТЕЛЬНОСТЬ**

### **Оптимизации:**
- ✅ Параллельная отправка по всем каналам
- ✅ Graceful degradation при недоступности сервисов
- ✅ Retry логика для временных сбоев
- ✅ Кэширование конфигураций

### **Масштабирование:**
- Очереди уведомлений (Redis/Bull)
- Batch отправка для массовых уведомлений
- Rate limiting для предотвращения спама
- Persistent storage для статистики

---

## ✅ **ЧЕКЛИСТ НАСТРОЙКИ**

- [ ] **Telegram Bot настроен** (токен + chat_id)
- [ ] **Push ключи созданы** (VAPID keys)
- [ ] **SMS.ru API получен** (api_id + баланс)
- [ ] **Service Worker зарегистрирован** (public/sw.js)
- [ ] **Тестирование пройдено** (/dashboard/test-notifications)
- [ ] **Переменные окружения проверены**
- [ ] **Логи уведомлений работают**

---

## 🎯 **СЛЕДУЮЩИЕ ШАГИ**

1. **Email интеграция** (SendGrid/Mailgun)
2. **Шаблоны уведомлений** (HTML/Markdown)
3. **Планировщик отправки** (cron jobs)
4. **Dashboard аналитики** (метрики доставки)
5. **A/B тестирование** сообщений

**Система уведомлений готова к продакшену!** 🚀 