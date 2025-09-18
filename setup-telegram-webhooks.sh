#!/bin/bash

# 🚀 СКРИПТ НАСТРОЙКИ TELEGRAM WEBHOOK'ОВ
# Использование: ./setup-telegram-webhooks.sh <ngrok_url>

if [ -z "$1" ]; then
    echo "❌ Ошибка: Укажите ngrok URL"
    echo "Использование: ./setup-telegram-webhooks.sh <ngrok_url>"
    echo "Пример: ./setup-telegram-webhooks.sh https://abc123.ngrok-free.app"
    exit 1
fi

NGROK_URL=$1

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