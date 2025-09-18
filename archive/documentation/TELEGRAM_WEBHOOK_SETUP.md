# 🔗 Настройка Telegram Webhook с Ngrok

## 📋 Требования

1. **Ngrok** установлен и настроен
2. **Next.js сервер** запущен на порту 3000
3. **Telegram бот** создан и токен получен

## 🚀 Пошаговая настройка

### 1. Запуск Ngrok

```bash
# Запускаем ngrok для порта 3000
ngrok http 3000
```

### 2. Получение URL ngrok

```bash
# Проверяем активные туннели
curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print('Ngrok URL:', data['tunnels'][0]['public_url'])"
```

### 3. Настройка Telegram Webhook

```bash
# Устанавливаем webhook для основного бота
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL.ngrok-free.app/api/telegram-webhook"}'

# Устанавливаем webhook для чат-бота
curl -X POST "https://api.telegram.org/botYOUR_CHAT_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL.ngrok-free.app/api/telegram-chat-webhook"}'
```

### 4. Проверка webhook

```bash
# Проверяем статус webhook
curl -X GET "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

### 5. Тестирование

```bash
# Тестируем отправку сообщения
curl -X POST "https://YOUR_NGROK_URL.ngrok-free.app/api/test-telegram" \
  -H "Content-Type: application/json" \
  -d '{"message": "Тест webhook"}'
```

## 🔧 Переменные окружения

```bash
# .env.local
TELEGRAM_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g
TELEGRAM_CHAT_BOT_TOKEN=8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g
TELEGRAM_CHAT_ID=6725753966
```

## 🚨 Важные моменты

1. **Ngrok URL меняется** при каждом перезапуске
2. **Webhook нужно обновлять** при смене URL
3. **Сервер должен быть запущен** перед настройкой webhook
4. **Токен должен быть действительным** и принадлежать вашему боту

## 🔍 Диагностика проблем

### Ошибка "Unauthorized"
- Проверьте правильность токена
- Убедитесь, что токен принадлежит вашему боту

### Ошибка "Webhook was set"
- Webhook успешно установлен
- Проверьте URL в getWebhookInfo

### Ngrok "endpoint offline"
- Убедитесь, что сервер запущен на порту 3000
- Проверьте, что ngrok направляет на правильный порт

## 📱 Текущие настройки

- **Ngrok URL**: https://970b25aaaf22.ngrok-free.app
- **Webhook URL**: https://970b25aaaf22.ngrok-free.app/api/telegram-webhook
- **Статус**: ✅ Работает
- **Последнее обновление**: 31.07.2025 17:54 