# ⚡ QUICK START: GET2B PROJECT MANAGEMENT BOT

## 🚀 **1-MINUTE SETUP**

```bash
# 1. Запуск сервера
npm run dev

# 2. Запуск ngrok (новый терминал)
ngrok http 3000

# 3. Автонастройка бота
./scripts/setup-bot.sh
```

## ✅ **ПРОВЕРКА РАБОТЫ**

1. **Проверьте Telegram** - должно прийти сообщение "🤖 GET2B Bot Setup Complete!"
2. **Создайте проект** на http://localhost:3000/dashboard/create-project
3. **Загрузите документы** (инвойс/спецификация)
4. **Проверьте уведомление** в Telegram с кнопками
5. **Нажмите "Одобрить"** - статус проекта должен измениться

## 🤖 **КАК РАБОТАЮТ АПРУВЫ**

| Действие | Что происходит |
|----------|----------------|
| Клиент загружает документы | 📱 Уведомление в Telegram |
| Менеджер нажимает **"Одобрить"** | ✅ Статус → `waiting_receipt` |
| Клиент загружает чек | 💰 Уведомление о чеке |
| Менеджер нажимает **"Одобрить чек"** | ✅ Статус → `receipt_approved` |
| Проект переходит на следующий этап | 🎯 Workflow продолжается |

## 🆘 **ЕСЛИ НЕ РАБОТАЕТ**

### Бот не апрувит сделки?
```bash
# Проверить webhook
curl "https://api.telegram.org/bot7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ/getWebhookInfo"

# Должно быть: .../api/telegram-webhook
# НЕ должно быть: .../api/telegram-manager-webhook
```

### Кнопки не реагируют?
```bash
# Проверить логи
tail -f logs/next.log | grep callback_query

# Тест webhook
curl -X POST "http://localhost:3000/api/telegram-webhook" \
  -d '{"callback_query": {"id": "test", "data": "approve_test-id"}}'
```

### Уведомления не приходят?
```bash
# Проверить переменные
echo $TELEGRAM_BOT_TOKEN
echo $TELEGRAM_CHAT_ID

# Тест отправки
curl -X POST "http://localhost:3000/api/telegram/send-message" \
  -d '{"text": "Test"}'
```

## 📚 **ПОЛНАЯ ДОКУМЕНТАЦИЯ**

- **Подробное руководство:** [`PROJECT_MANAGEMENT_BOT_GUIDE.md`](PROJECT_MANAGEMENT_BOT_GUIDE.md)
- **Примеры API:** [`API_EXAMPLES.md`](API_EXAMPLES.md)
- **Скрипт настройки:** [`scripts/setup-bot.sh`](scripts/setup-bot.sh)

## 🎯 **ОСНОВНЫЕ КОМАНДЫ**

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запустить Next.js сервер |
| `ngrok http 3000` | Туннель для webhook |
| `./scripts/setup-bot.sh` | Автонастройка бота |
| `curl .../getWebhookInfo` | Проверить webhook |
| `psql -c "SELECT..."` | Проверить БД |

---

**🚀 Система готова! Telegram bot `@Get2b_bot` теперь управляет вашими проектами!**