#!/bin/bash

# ===========================================
# GET2B Deploy Script (Pull-only)
# Server: 83.220.172.8
# Domain: get2b.pro
# Image built by GitHub Actions, server only pulls
# ===========================================

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
SERVER="83.220.172.8"
USER="root"
PROJECT_PATH="/var/www/godplis"
IMAGE="ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production:latest"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}GET2B DEPLOY (Pull from GHCR) на ${SERVER}${NC}"
echo -e "${BLUE}================================================${NC}"

# Проверяем есть ли незакоммиченные изменения
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Есть незакоммиченные изменения!${NC}"
    echo -e "${YELLOW}   Сначала закоммить и push, чтобы GH Actions собрал образ.${NC}"
    read -p "Продолжить деплой текущего latest образа? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${BLUE}Шаг 1: Подключение к серверу...${NC}"

ssh ${USER}@${SERVER} << ENDSSH
    set -e

    echo "Переход в ${PROJECT_PATH}..."
    cd ${PROJECT_PATH}

    echo "Шаг 2: Обновление конфигов из git..."
    git pull origin main

    echo "Шаг 3: Pull Docker-образа из GHCR..."
    docker compose pull

    echo "Шаг 4: Перезапуск контейнера..."
    docker compose up -d

    echo "Шаг 5: Ожидание health check..."
    for i in \$(seq 1 12); do
        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "Приложение запущено и здорово!"
            break
        fi
        if [ \$i -eq 12 ]; then
            echo "Health check не прошёл за 120 секунд!"
            docker compose logs --tail=50
            exit 1
        fi
        echo "Ожидание... (\$i/12)"
        sleep 10
    done

    echo "Шаг 6: Очистка старых образов..."
    docker image prune -f

    echo ""
    echo "Статус контейнеров:"
    docker compose ps
    echo ""
    echo "Логи (последние 20 строк):"
    docker compose logs --tail=20
ENDSSH

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}ДЕПЛОЙ ЗАВЕРШЕН!${NC}"
echo -e "${GREEN}Проверь: https://get2b.pro${NC}"
echo -e "${GREEN}================================================${NC}"
