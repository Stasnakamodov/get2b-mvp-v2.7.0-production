#!/bin/bash

# 🚀 СКРИПТ НАСТРОЙКИ TELEGRAM WEBHOOK'ОВ
# Использование: ./setup-webhook.sh

NGROK_URL="https://21db9d337c55.ngrok-free.app"

echo "🤖 Настраиваем webhook'и для Telegram ботов..."
echo "📡 Ngrok URL: $NGROK_URL"

# Загружаем токены из .env.local
source .env.local

echo ""
echo "🔧 Настраиваем основной бот (@Get2b_bot)..."
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$NGROK_URL/api/telegram-webhook\"}"

echo ""
echo "🔧 Настраиваем чат-бот (@get2b_chathub_bot)..."
curl -X POST "https://api.telegram.org/bot$TELEGRAM_CHAT_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$NGROK_URL/api/telegram-chat-webhook\"}"

echo ""
echo "✅ Webhook'и настроены!"
echo ""
echo "📋 Проверка webhook'ов:"
echo "Основной бот:"
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq '.result.url'
echo ""
echo "Чат-бот:"
curl -s "https://api.telegram.org/bot$TELEGRAM_CHAT_BOT_TOKEN/getWebhookInfo" | jq '.result.url'
echo ""
echo "🎉 Готово! Боты настроены и готовы к работе!"
echo ""
echo "🧪 Тестирование:"
echo "1. Отправьте сообщение в Telegram боту @Get2b_bot"
echo "2. Создайте проектную комнату: http://localhost:3000/dashboard/ai-chat"
echo "3. Отправьте сообщение в проектную комнату"
echo "4. Протестируйте атомарный конструктор: http://localhost:3000/dashboard/project-constructor" 