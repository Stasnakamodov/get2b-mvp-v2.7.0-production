# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ ЛОГИНА GET2B

## ❌ **ПРОБЛЕМА:**
При изменении .env сломался логин - показывает "Invalid API key"

## ✅ **ИСПРАВЛЕНИЕ:**

### **1. Проверь ТОЧНО эти ключи Supabase в .env:**

```bash
# ⚠️ КРИТИЧЕСКИ ВАЖНО - ТОЧНЫЕ ЗНАЧЕНИЯ:
SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqyrmXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NjA1NjksImV4cCI6MjA0NzIzNjU2OX0.eyJpcCI6IkpXVCJ9"
```

### **2. Добавь недостающий ключ:**
```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqyrmXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTY2MDU2OSwiZXhwIjoyMDQ3MjM2NTY5fQ.eyJpc3MiOiJzMyIsImV4cCI6MjA0N3"
```

### **3. Перезапусти сервер:**
```bash
# Останови (Ctrl+C) и запусти:
npm run dev
```

### **4. Очисти кеш браузера:**
```bash
# В браузере: Ctrl+Shift+R (жесткое обновление)
```

## 🔧 **ПОЛНЫЙ РАБОЧИЙ .ENV:**

```bash
TELEGRAM_BOT_TOKEN=7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ
TELEGRAM_CHAT_ID=6725753966
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g

SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://ejkhdhexkadecpbjjmsz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqyrmXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NjA1NjksImV4cCI6MjA0NzIzNjU2OX0.eyJpcCI6IkpXVCJ9"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmqyrmXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTY2MDU2OSwiZXhwIjoyMDQ3MjM2NTY5fQ.eyJpc3MiOiJzMyIsImV4cCI6MjA0N3"

BOTHUB_API_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImVlMmQyYjY3LTY1YTUtNGE1OS1iZjEyLTc4NTA4YWU4NzEwMiIsImlzRGV2ZWxvcGVyIjp0cnVlLCJpYXQiOjE3NTMwMTg5MDcsImV4cCI6MjA2ODU5NDkwN30.vB16n8TZXJDrvSeLndWYXv-8fwVlxXKzrZrdKkj7bZg"
BOTHUB_API_URL="https://bothub.chat/api/v2"
```

## 🎯 **ЕСЛИ НЕ ПОМОГАЕТ:**

1. **Удали .env.local полностью**
2. **Создай заново с содержимым выше**  
3. **Перезапусти сервер**
4. **Очисти все кеши браузера**

**ДОЛЖНО ЗАРАБОТАТЬ СРАЗУ!** 🔥 