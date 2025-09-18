# 🤖 ДОКУМЕНТАЦИЯ TELEGRAM БОТОВ GET2B

## ⚠️ **КРИТИЧЕСКИ ВАЖНО:**
В системе Get2B используются **ДВА РАЗНЫХ БОТА** с **ДВУМЯ РАЗНЫМИ ТОКЕНАМИ**. 
**НИКТО НЕ МОЖЕТ УДАЛИТЬ ИЛИ ИЗМЕНИТЬ ЭТУ КОНФИГУРАЦИЮ БЕЗ СОГЛАСОВАНИЯ!**

---

## 🤖 **БОТ #1: ПРОЕКТНЫЙ МЕНЕДЖЕР (существующий)**

### **Назначение:**
- Апрувы и отказы этапов проектов
- Получение и обработка чеков от клиентов  
- Уведомления о смене статусов проектов
- Подтверждения документов и платежей

### **Технические данные:**
```
Название бота: Get2B Project Manager
Username: @your_project_bot (замените на актуальный)
Токен: TELEGRAM_BOT_TOKEN
```

### **Переменная ENV:**
```bash
# ⚠️ НЕЛЬЗЯ УДАЛЯТЬ! Проектный бот для апрувов
TELEGRAM_BOT_TOKEN=7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ
TELEGRAM_CHAT_ID=6725753966
```

### **Используется в файлах:**
- `/app/api/telegram/` - все проектные уведомления
- `/lib/telegram-integration.ts` - апрувы проектов
- Все файлы связанные с 7-шаговым процессом

---

## 🤖 **БОТ #2: ЧАТХАБ АССИСТЕНТ (новый)**

### **Назначение:**
- Уведомления о новых сообщениях в чатах проектов
- Быстрые ответы менеджеров клиентам через Telegram
- Статистика активности чатов
- Управление уведомлениями чат-системы

### **Технические данные:**
```
Название бота: Get2B ChatHub Assistant  
Username: @get2b_chathub_bot
Токен: TELEGRAM_CHAT_BOT_TOKEN
```

### **Переменная ENV:**
```bash
# ⚠️ НЕЛЬЗЯ УДАЛЯТЬ! Чат-бот для уведомлений о сообщениях
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g
```

### **Используется в файлах:**
- `/app/api/telegram-chat-webhook/` - webhook чат-бота
- `/lib/telegram-chat-integration.ts` - уведомления о сообщениях
- `/app/api/chat/messages/` - отправка уведомлений при новых сообщениях

---

## 🔧 **ПОЛНАЯ КОНФИГУРАЦИЯ .ENV**

### **ОБЯЗАТЕЛЬНЫЕ ПЕРЕМЕННЫЕ (НЕЛЬЗЯ УДАЛЯТЬ!):**

```bash
# ==========================================
# 🤖 TELEGRAM БОТЫ НАСТРОЙКИ  
# ⚠️ КРИТИЧЕСКИ ВАЖНО: НЕ УДАЛЯТЬ И НЕ ИЗМЕНЯТЬ БЕЗ СОГЛАСОВАНИЯ!
# ==========================================

# Проектный бот (для апрувов и этапов проектов)
TELEGRAM_BOT_TOKEN=7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ
TELEGRAM_CHAT_ID=6725753966

# Чат-бот (для уведомлений о сообщениях в чатах)  
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g

# ==========================================
# 🗄️ SUPABASE НАСТРОЙКИ
# ==========================================

SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqjbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NjA1NjksImV4cCI6MjA0NzIzNjU2OX0.eyJpcCI6IkpXVCJ9"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqjbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTY2MDU2OSwiZXhwIjoyMDQ3MjM2NTY5fQ.eyJpc3MiOiJzMyIsImV4cCI6MjA0N3"
SUPABASE_JWT_SECRET="m2wj28LnAh2sY/CMXn5kRdPJxsgkWMEUHgzLgIGSRUMBtdbHVQ5Q"

# ==========================================
# 🐘 POSTGRESQL НАСТРОЙКИ
# ==========================================  

POSTGRES_URL="postgres://postgres.ejkhdhexkadecpbjjmsz:B2ryf4eLLIDqghCR@aws-0-eu-central-1.pooler.supabase.com:6432/postgres"
POSTGRES_PRISMA_URL="postgres://postgres.ejkhdhexkadecpbjjmsz:B2ryf4eLLIDqghCR@aws-0-eu-central-1.pooler.supabase.com:6432/postgres?pgbouncer=true&connect_timeout=15"
POSTGRES_URL_NON_POOLING="postgres://postgres.ejkhdhexkadecpbjjmsz:B2ryf4eLLIDqghCR@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
POSTGRES_HOST="db.ejkhdhexkadecpbjjmsz.supabase.co"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="B2ryf4eLLIDqghCR"
POSTGRES_DATABASE="postgres"

# ==========================================
# 🤖 AI И BOTHUB НАСТРОЙКИ
# ==========================================

# BotHub API для Claude 3.5 Sonnet
BOTHUB_API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVlMmQyYjY3LTY1YTUtNGE1OS1iZjEyLTc4NTA4YWU4NzEwMiIsImlzRGV2ZWxvcGVyIjp0cnVlLCJpYXQiOjE3NTMwMTg5MDcsImV4cCI6MjA2ODU5NDkwN30.vB16n8TZXJDrvSeLndWYXv-8fwVlxXKzrZrdKkj7bZg"
BOTHUB_API_URL="https://bothub.chat/api/v2"

# ==========================================
# 🌐 ДРУГИЕ ПЕРЕМЕННЫЕ
# ==========================================

NODE_ENV=development
```

---

## ⚙️ **АРХИТЕКТУРА ВЗАИМОДЕЙСТВИЯ**

### **Поток уведомлений:**

```
📱 КЛИЕНТ пишет сообщение в веб-чат проекта
           ↓
💻 API /chat/messages получает сообщение  
           ↓
🤖 Чат-бот (TELEGRAM_CHAT_BOT_TOKEN) отправляет уведомление менеджерам
           ↓  
👥 МЕНЕДЖЕРЫ получают уведомление в Telegram чат (TELEGRAM_CHAT_ID)
           ↓
📋 При смене статуса проекта - Проектный бот (TELEGRAM_BOT_TOKEN) отправляет апрув
```

### **Разделение ответственности:**

| Функция | Проектный бот | Чат-бот |
|---------|--------------|---------|
| Апрувы проектов | ✅ | ❌ |
| Чеки и платежи | ✅ | ❌ |
| Уведомления о сообщениях | ❌ | ✅ |
| Статистика чатов | ❌ | ✅ |
| Быстрые ответы | ❌ | ✅ |

---

## 🚨 **КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:**

### **🔒 БЕЗОПАСНОСТЬ:**
1. **НИКОГДА НЕ УДАЛЯЙТЕ** переменные `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_BOT_TOKEN`
2. **НИКОГДА НЕ ИЗМЕНЯЙТЕ** токены без согласования с владельцем системы
3. **НИКОГДА НЕ КОММИТЬТЕ** .env файлы в git
4. **ВСЕГДА ИСПОЛЬЗУЙТЕ** .env.local для локальной разработки

### **🔧 РАЗРАБОТКА:**
1. При изменении логики ботов - тестируйте ОБА бота
2. При деплое - проверяйте что оба токена присутствуют
3. При ошибках - проверяйте логи каждого бота отдельно
4. При добавлении новых функций - определите какой бот отвечает

### **📊 МОНИТОРИНГ:**
1. Проектный бот - мониторьте апрувы и платежи
2. Чат-бот - мониторьте уведомления о сообщениях
3. Оба бота должны быть онлайн 24/7
4. При падении одного - второй продолжает работать

---

## 📋 **КОМАНДЫ БОТОВ:**

### **Проектный бот:**
- Кнопки апрувов проектов
- Обработка чеков от клиентов  
- Уведомления о смене статусов

### **Чат-бот:**
- `/start` - приветствие и справка
- `/help` - подробная справка по командам
- `/status` - статистика чатов из БД
- `/projects` - список активных проектных чатов
- `/mute` / `/unmute` - управление уведомлениями

---

## 🎯 **ЗАКЛЮЧЕНИЕ:**

**В системе Get2B используются ДВА СПЕЦИАЛИЗИРОВАННЫХ БОТА:**

1. **Get2B Project Manager** - управление проектами и апрувы
2. **Get2B ChatHub Assistant** - уведомления о чатах и быстрые ответы

**КАЖДЫЙ БОТ ИМЕЕТ СВОЙ УНИКАЛЬНЫЙ ТОКЕН И ФУНКЦИОНАЛЬНОСТЬ!**

**НАРУШЕНИЕ ЭТОЙ АРХИТЕКТУРЫ МОЖЕТ ПРИВЕСТИ К ПОЛОМКЕ ВСЕЙ СИСТЕМЫ УВЕДОМЛЕНИЙ!**

---

*📅 Последнее обновление: $(date)*  
*👤 Ответственный: Команда разработки Get2B*  
*🔒 Статус: КРИТИЧЕСКИ ВАЖНЫЙ ДОКУМЕНТ - НЕ УДАЛЯТЬ!* 