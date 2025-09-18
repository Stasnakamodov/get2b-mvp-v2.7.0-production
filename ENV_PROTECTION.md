# 🛡️ ЗАЩИТА ENV ФАЙЛОВ ОТ ГЛУПЫХ МУВОВ

## ❌ ЗАПРЕЩЕННЫЕ ДЕЙСТВИЯ С .env.local

### 🚨 НИКОГДА НЕ ДЕЛАЙТЕ:
1. **НЕ УДАЛЯЙТЕ** переменные `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_BOT_TOKEN`
2. **НЕ КОММИТЬТЕ** .env.local в git
3. **НЕ МЕНЯЙТЕ** токены без крайней необходимости
4. **НЕ ДЕЛИТЕСЬ** токенами публично

### ✅ КРИТИЧЕСКИ ВАЖНЫЕ ТОКЕНЫ:
```bash
# ПРОЕКТНЫЙ БОТ - для апрувов, чеков, статусов
TELEGRAM_BOT_TOKEN=7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ

# ЧАТ БОТ - для уведомлений о сообщениях в чатах
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g
```

### 🔒 БЛОКИРОВКА ОТ ИЗМЕНЕНИЙ:
```bash
# Делаем .env.local read-only для защиты
chmod 444 .env.local

# Если нужно изменить - сначала разблокируем:
chmod 644 .env.local
# ОСТОРОЖНО РЕДАКТИРУЕМ
# Снова блокируем:
chmod 444 .env.local
```

### 🆘 ЕСЛИ СЛУЧАЙНО УДАЛИЛИ:
```bash
# Восстановление файла:
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://gqknwczkqxzvhezpkctu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxa253Y3prcXh6dmhlenBrY3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NDI0OTMsImV4cCI6MjA0NjAxODQ5M30.cFQ6Gm_PsAFxwO5lnNjFzuA-fmXxGHKKcB4q6D8K1k4
TELEGRAM_BOT_TOKEN=7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ
TELEGRAM_CHAT_ID=-1002460569569
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g
TELEGRAM_CHAT_BOT_CHAT_ID=-1002460569569
CURRENCY_API_KEY=38f6b1c1-e4a3-4e1b-9a2f-8c5d7f9e2a1b
EOF

# Перезапуск сервера:
pkill -f "next dev" && npm run dev
```

### 📋 ЧЕКЛИСТ ПОСЛЕ ИЗМЕНЕНИЯ .env:
- [ ] Оба токена присутствуют
- [ ] Файл защищен (chmod 444)
- [ ] Сервер перезапущен
- [ ] Telegram уведомления работают

## 🔄 ПОСЛЕДОВАТЕЛЬНОСТЬ БЕЗОПАСНОГО ИЗМЕНЕНИЯ:

1. **Остановить сервер**: `pkill -f "next dev"`
2. **Разблокировать**: `chmod 644 .env.local`
3. **ОСТОРОЖНО редактировать**
4. **Заблокировать**: `chmod 444 .env.local`
5. **Перезапустить**: `npm run dev`
6. **Протестировать**: отправить сообщение в чат 