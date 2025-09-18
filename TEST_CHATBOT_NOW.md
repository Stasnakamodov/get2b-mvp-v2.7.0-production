# ⚡ БЫСТРЫЙ ТЕСТ ЧАТ-БОТА

## 🎯 **СЕЙЧАС МОЖНО ТЕСТИРОВАТЬ:**

### **1. Добавьте токен в .env:**
```bash
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g
```

### **2. Перезапустите сервер:**
```bash
npm run dev
```

### **3. Настройте webhook локально:**
```bash
# Установите ngrok:
npm install -g ngrok

# В новом терминале:
ngrok http 3000

# Скопируйте URL (например: https://abc123.ngrok.io)
# Вставьте в setup-chat-bot-webhook.js:
```

### **4. Запустите настройку webhook:**
```bash
node setup-chat-bot-webhook.js
```

### **5. Тестируйте команды в Telegram:**
```
/start   - приветствие 
/help    - справка
/status  - статистика БД
/projects - список чатов
```

## 🎉 **РЕЗУЛЬТАТ:**
Бот покажет реальную статистику из вашей базы данных!

**Если что-то не работает - проверьте логи в терминале Next.js** 📋 