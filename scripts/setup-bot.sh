#!/bin/bash

# 🤖 GET2B PROJECT MANAGEMENT BOT SETUP SCRIPT
# Автоматическая настройка Telegram бота для управления проектами

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GET2B PROJECT MANAGEMENT BOT SETUP${NC}"
echo "=================================================="

# Проверка переменных окружения
echo -e "\n${YELLOW}📋 Проверяем переменные окружения...${NC}"

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo -e "${RED}❌ TELEGRAM_BOT_TOKEN не найден в .env${NC}"
    exit 1
fi

if [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo -e "${RED}❌ TELEGRAM_CHAT_ID не найден в .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bot Token: ${TELEGRAM_BOT_TOKEN:0:10}...${NC}"
echo -e "${GREEN}✅ Chat ID: $TELEGRAM_CHAT_ID${NC}"

# Проверка запущен ли Next.js сервер
echo -e "\n${YELLOW}🔍 Проверяем Next.js сервер...${NC}"
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Next.js сервер запущен на порту 3000${NC}"
else
    echo -e "${RED}❌ Next.js сервер не запущен. Запустите: npm run dev${NC}"
    exit 1
fi

# Получение ngrok URL
echo -e "\n${YELLOW}🌐 Получаем ngrok URL...${NC}"
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null || echo "")

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo -e "${RED}❌ Ngrok не запущен. Запустите: ngrok http 3000${NC}"
    echo -e "${YELLOW}💡 В новом терминале выполните: ngrok http 3000${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ngrok URL: $NGROK_URL${NC}"

# Настройка webhook
echo -e "\n${YELLOW}🔧 Настраиваем webhook...${NC}"
WEBHOOK_URL="$NGROK_URL/api/telegram-webhook"

WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}")

if echo "$WEBHOOK_RESPONSE" | jq -e '.ok' > /dev/null; then
    echo -e "${GREEN}✅ Webhook настроен: $WEBHOOK_URL${NC}"
else
    echo -e "${RED}❌ Ошибка настройки webhook:${NC}"
    echo "$WEBHOOK_RESPONSE" | jq '.'
    exit 1
fi

# Проверка webhook
echo -e "\n${YELLOW}📡 Проверяем webhook...${NC}"
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo")

if echo "$WEBHOOK_INFO" | jq -e '.result.url' > /dev/null; then
    CURRENT_WEBHOOK=$(echo "$WEBHOOK_INFO" | jq -r '.result.url')
    PENDING_UPDATES=$(echo "$WEBHOOK_INFO" | jq -r '.result.pending_update_count')

    echo -e "${GREEN}✅ Webhook активен: $CURRENT_WEBHOOK${NC}"
    echo -e "${GREEN}✅ Pending updates: $PENDING_UPDATES${NC}"
else
    echo -e "${RED}❌ Webhook не активен${NC}"
    exit 1
fi

# Тестовое сообщение
echo -e "\n${YELLOW}📤 Отправляем тестовое сообщение...${NC}"
TEST_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/telegram/send-message" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"🤖 GET2B Bot Setup Complete!\\n\\n✅ Webhook: $WEBHOOK_URL\\n🕐 Time: $(date)\\n\\nСистема готова к работе! 🚀\"}")

if echo "$TEST_RESPONSE" | jq -e '.success' > /dev/null 2>/dev/null || [[ "$TEST_RESPONSE" == *"success"* ]]; then
    echo -e "${GREEN}✅ Тестовое сообщение отправлено${NC}"
else
    echo -e "${YELLOW}⚠️ Возможны проблемы с отправкой сообщений${NC}"
    echo "Response: $TEST_RESPONSE"
fi

# Проверка базы данных
echo -e "\n${YELLOW}🗄️ Проверяем подключение к базе данных...${NC}"
if command -v psql > /dev/null; then
    PROJECT_COUNT=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM projects;" 2>/dev/null | xargs || echo "0")
    if [ "$PROJECT_COUNT" -gt "0" ]; then
        echo -e "${GREEN}✅ База данных доступна. Проектов: $PROJECT_COUNT${NC}"
    else
        echo -e "${YELLOW}⚠️ База данных пуста или недоступна${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ psql не установлен, пропускаем проверку БД${NC}"
fi

# Итоговая информация
echo -e "\n${BLUE}=================================================="
echo -e "🎉 SETUP COMPLETED SUCCESSFULLY!"
echo -e "==================================================${NC}"
echo -e "${GREEN}✅ Next.js Server:${NC} http://localhost:3000"
echo -e "${GREEN}✅ Ngrok Tunnel:${NC} $NGROK_URL"
echo -e "${GREEN}✅ Webhook URL:${NC} $WEBHOOK_URL"
echo -e "${GREEN}✅ Bot Username:${NC} @Get2b_bot"
echo -e "${GREEN}✅ Manager Chat:${NC} $TELEGRAM_CHAT_ID"

echo -e "\n${YELLOW}📋 NEXT STEPS:${NC}"
echo "1. Проверьте Telegram чат - должно прийти тестовое сообщение"
echo "2. Создайте проект через веб-интерфейс"
echo "3. Проверьте уведомления в Telegram"
echo "4. Протестируйте кнопки одобрения/отклонения"

echo -e "\n${YELLOW}🔗 USEFUL LINKS:${NC}"
echo "• Web App: http://localhost:3000"
echo "• Ngrok Dashboard: http://localhost:4040"
echo "• Documentation: PROJECT_MANAGEMENT_BOT_GUIDE.md"

echo -e "\n${BLUE}Bot setup completed! 🚀${NC}"