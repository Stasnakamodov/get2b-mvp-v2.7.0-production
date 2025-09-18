# 🔧 ОБНОВЛЕННЫЙ .ENV ФАЙЛ С ЧАТ-БОТОМ

Скопируйте и вставьте в ваш `.env.local` файл:

```bash
# ==========================================
# 🤖 TELEGRAM БОТЫ НАСТРОЙКИ
# ⚠️ КРИТИЧЕСКИ ВАЖНО: ДОЛЖНЫ БЫТЬ ОБА ТОКЕНА! НЕЛЬЗЯ УДАЛЯТЬ!
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
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqqjbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NjA1NjksImV4cCI6MjA0NzIzNjU2OX0.eyJpcCI6IkpXVCJ9"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqjqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdYI6MTczMTY2MDU2OSwuZXhwIjoyMDQ3MjM2NTY5fQ.eyJpc3MiOiJzMyIsImV4cCI6MjA0N3"
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
# 🤖 AI И ЧАТХАБ НАСТРОЙКИ
# ==========================================

# BotHub API для Claude 3.5 Sonnet
BOTHUB_API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVlMmQyYjY3LTY1YTUtNGE1OS1iZjEyLTc4NTA4YWU4NzEwMiIsImlzRGV2ZWxvcGVyIjp0cnVlLCJpYXQiOjE3NTMwMTg5MDcsImV4cCI6MjA2ODU5NDkwN30.vB16n8TZXJDrvSeLndWYXv-8fwVlxXKzrZrdKkj7bZg"

# ==========================================
# 🌐 ДРУГИЕ ПЕРЕМЕННЫЕ
# ==========================================

NODE_ENV=development

# ==========================================
# 📋 СПРАВОЧНАЯ ИНФОРМАЦИЯ
# ==========================================

# 🤖 БОТЫ (ДОЛЖНЫ БЫТЬ ОБА!):
# - TELEGRAM_BOT_TOKEN: проектный бот для апрувов и этапов проектов  
# - TELEGRAM_CHAT_BOT_TOKEN: чат-бот для уведомлений о сообщениях в чатах
# 
# ⚠️ КРИТИЧЕСКИ ВАЖНО: НЕ УДАЛЯЙТЕ НИКАКОЙ ИЗ ТОКЕНОВ!
# Система использует ДВА РАЗНЫХ БОТА для РАЗНЫХ ФУНКЦИЙ!
# 
# 💬 ЧАТХАБ:
# - Автоматическое создание участников через триггеры
# - RLS безопасность включена  
# - AI ответы через BotHub (Claude 3.5 Sonnet)
# - Telegram интеграция для менеджеров через ОБА бота
#
# 🚀 ГОТОВНОСТЬ: База данных готова, API обновлены, нужно протестировать!
```

---

## 🎯 **ИЗМЕНЕНИЯ В ВАШЕМ .ENV:**

### ✅ **ИСПРАВЛЕНО И ДОБАВЛЕНО:**
```bash
# ⚠️ КРИТИЧЕСКИ ВАЖНО: ДОЛЖНЫ БЫТЬ ОБА ТОКЕНА! НЕЛЬЗЯ УДАЛЯТЬ!

# Проектный бот (для апрувов и этапов проектов) - СУЩЕСТВУЮЩИЙ
TELEGRAM_BOT_TOKEN=7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ

# Чат-бот (для уведомлений о сообщениях в чатах) - НОВЫЙ  
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g
```

### 📝 **ПОЯСНЕНИЯ:**
- **TELEGRAM_BOT_TOKEN** - проектный менеджер бот (апрувы, чеки, статусы)
- **TELEGRAM_CHAT_BOT_TOKEN** - чатхаб ассистент бот (уведомления о сообщениях)
- **ОБА ТОКЕНА ОБЯЗАТЕЛЬНЫ** - система использует два разных бота!
- **Стиль оформления** - сохранен ваш любимый формат с разделителями

---

## 🚀 **СЛЕДУЮЩИЕ ШАГИ:**

1. **Скопируйте** ПОЛНЫЙ .env с ОБОИМИ токенами в ваш проект
2. **Убедитесь** что оба токена присутствуют: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_BOT_TOKEN  
3. **Перезапустите** сервер разработки
4. **Протестируйте** ОБА бота через соответствующие API
5. **Готово!** Теперь у вас два специализированных бота работают раздельно

**⚠️ ВАЖНО: Никогда не удаляйте ни один из токенов - система сломается!**

**Красиво оформлено в вашем стиле! 🎨** 