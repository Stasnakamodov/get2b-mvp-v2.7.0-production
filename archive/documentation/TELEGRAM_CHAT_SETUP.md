# 🤖 НАСТРОЙКА TELEGRAM ДЛЯ ЧАТХАБА

## 📋 **ОБЗОР**

В Get2B используются **ДВА РАЗНЫХ TELEGRAM БОТА:**

### **🏗️ ПРОЕКТНЫЙ БОТ (СУЩЕСТВУЮЩИЙ)**
- **Назначение:** Уведомления по этапам проектов
- **Функции:** Одобрение спецификаций, чеков, завершение проектов
- **Переменные:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### **💬 ЧАТ-БОТ (НОВЫЙ)**
- **Назначение:** Уведомления о сообщениях в чатах
- **Функции:** Быстрые ответы, переадресация сообщений
- **Переменные:** `TELEGRAM_CHAT_BOT_TOKEN`, `TELEGRAM_CHAT_BOT_CHAT_ID`

---

## ⚙️ **ВАРИАНТ 1: ОДИН БОТ ДЛЯ ВСЕГО**

**Если хотите использовать существующий бот:**

```bash
# .env.local
TELEGRAM_BOT_TOKEN=your_existing_bot_token
TELEGRAM_CHAT_ID=your_existing_chat_id

# Чат-система будет использовать тот же бот
TELEGRAM_CHAT_BOT_TOKEN=your_existing_bot_token  
TELEGRAM_CHAT_BOT_CHAT_ID=your_existing_chat_id
```

✅ **Плюсы:** Простота, все в одном месте  
❌ **Минусы:** Смешиваются уведомления проектов и чатов

---

## ⚙️ **ВАРИАНТ 2: РАЗНЫЕ БОТЫ (РЕКОМЕНДУЕТСЯ)**

**Создайте отдельный бот для чатов:**

### **Шаг 1: Создание чат-бота**
1. Откройте @BotFather в Telegram
2. Создайте нового бота: `/newbot`
3. Назовите: `Get2B Chat Assistant`
4. Получите токен: `987654321:XYZabcDEFghiJKLmnoPQRstu`

### **Шаг 2: Настройка переменных**
```bash
# .env.local

# ПРОЕКТНЫЙ БОТ (существующий)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890

# ЧАТ-БОТ (новый)
TELEGRAM_CHAT_BOT_TOKEN=987654321:XYZabcDEFghiJKLmnoPQRstu
TELEGRAM_CHAT_BOT_CHAT_ID=-1009876543210
```

✅ **Плюсы:** Четкое разделение, разные настройки  
❌ **Минусы:** Больше настроек

---

## ⚙️ **ВАРИАНТ 3: БЕЗ TELEGRAM ДЛЯ ЧАТОВ**

**Если не хотите настраивать Telegram для чатов:**

```bash
# .env.local

# ПРОЕКТНЫЙ БОТ (работает как раньше)
TELEGRAM_BOT_TOKEN=your_existing_bot_token
TELEGRAM_CHAT_ID=your_existing_chat_id

# ЧАТ-БОТ ОТКЛЮЧЕН
# TELEGRAM_CHAT_BOT_TOKEN=  # не указываем
# TELEGRAM_CHAT_BOT_CHAT_ID=  # не указываем
```

✅ **Плюсы:** Минимум настроек, чат работает  
❌ **Минусы:** Менеджеры не получают уведомления о чат-сообщениях

---

## 🔧 **БЫСТРЫЙ СТАРТ**

### **Для тестирования (без Telegram):**
1. Ничего не настраивайте
2. Чат работает полностью
3. Уведомления просто не отправляются

### **Для продакшена:**
1. Выберите один из вариантов выше
2. Обновите `.env.local`
3. Перезапустите приложение

---

## 🛡️ **ЗАЩИТА ОТ ПУТАНИЦЫ**

В коде добавлены **четкие префиксы:**

```typescript
// ПРОЕКТНЫЕ УВЕДОМЛЕНИЯ
TELEGRAM_BOT_TOKEN         → sendTelegramProjectApproval()
TELEGRAM_CHAT_ID          → sendSupplierReceiptRequest()

// ЧАТ УВЕДОМЛЕНИЯ  
TELEGRAM_CHAT_BOT_TOKEN   → notifyManagersAboutChatMessage()
TELEGRAM_CHAT_BOT_CHAT_ID → handleQuickReply()
```

**Функции НЕ ПЕРЕСЕКАЮТСЯ** - каждая знает свой бот!

---

## 📋 **ПРОВЕРКА РАБОТЫ**

### **Проектный бот:**
```bash
curl "http://localhost:3000/api/telegram/test-bot"
```

### **Чат-бот:**
```bash  
curl -X POST "http://localhost:3000/api/chat/test-notifications"
```

Если боты настроены правильно - получите сообщения в Telegram! 