#!/bin/bash

# ===========================================
# GET2B Deploy Script
# Server: 45.150.8.168
# ===========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
SERVER="45.150.8.168"
USER="root"
PROJECT_PATH="/var/www/godplis"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🚀 GET2B DEPLOY на ${SERVER}${NC}"
echo -e "${BLUE}================================================${NC}"

# Проверяем есть ли незакоммиченные изменения
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Есть незакоммиченные изменения!${NC}"
    echo -e "${YELLOW}   Сначала закоммить: git add . && git commit -m 'message'${NC}"
    read -p "Продолжить без коммита? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}📡 Шаг 1: Подключение к серверу...${NC}"
echo -e "${YELLOW}Введи пароль: zT3rV2oF3jnP${NC}"

ssh ${USER}@${SERVER} << 'ENDSSH'
    set -e

    echo "📂 Переход в /var/www/godplis..."
    cd /var/www/godplis

    echo "📥 Шаг 2: git pull..."
    git pull origin main

    echo "📦 Шаг 3: Установка зависимостей..."
    npm install --legacy-peer-deps

    echo "🔨 Шаг 4: Сборка проекта..."
    npm run build

    echo "🔄 Шаг 5: Перезапуск PM2..."
    pm2 restart godplis || pm2 start npm --name "godplis" -- start
    pm2 save
    pm2 status

    echo "✅ Деплой завершен!"
ENDSSH

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ ДЕПЛОЙ ЗАВЕРШЕН!${NC}"
echo -e "${GREEN}🌐 Проверь: https://godplis.com${NC}"
echo -e "${GREEN}================================================${NC}"
