# 🚀 GET2B MVP v2.7.0 - DEPLOYMENT GUIDE

## Production Ready Build

Этот репозиторий содержит готовую к продакшену версию GET2B MVP v2.7.0 с коммита `0889303ae2d9f43f6f9abf4b4c591aae2174f22c`.

### ✨ Что включено:

- **173 страницы** полностью протестированы
- **140+ API endpoints** готовы к работе
- **Система безопасности** с rate limiting и CORS
- **Health monitoring** на `/api/health`
- **Telegram bot интеграция** (готов к работе)
- **Middleware** для безопасности и производительности
- **SSR-оптимизированные** компоненты dashboard

### 🔐 Безопасность:

- Rate limiting: 100 запросов/минуту
- Security headers (X-Frame-Options, CSP, XSS Protection)
- CORS только для разрешенных доменов
- Условное логирование для production

### 📊 Готов к тестированию:

- TypeScript: 0 ошибок компиляции
- ESLint: все проверки пройдены
- Build: успешно собирается
- Сервер: стабильно работает на production

## Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env.local
# Отредактируйте .env.local с вашими данными
```

### 3. Сборка проекта
```bash
npm run build
```

### 4. Запуск в продакшене
```bash
npm start
```

## Развертывание на Vercel

### 1. Подключение к Vercel
```bash
npx vercel
```

### 2. Настройка переменных окружения в Vercel Dashboard
- Перейдите в Settings → Environment Variables
- Добавьте все переменные из .env.example

### 3. Деплой
```bash
vercel --prod
```

## Развертывание на других платформах

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2
```bash
npm install -g pm2
npm run build
pm2 start npm --name "get2b-mvp" -- start
```

## API Endpoints

### Health Check
- `GET /api/health` - Проверка состояния приложения

### Основные API
- `GET /api/projects` - Получение проектов
- `POST /api/projects` - Создание проекта
- `GET /api/catalog/suppliers` - Каталог поставщиков
- `POST /api/catalog/suppliers` - Добавление поставщика

### Telegram Integration
- `POST /api/telegram/webhook` - Webhook для Telegram
- `POST /api/telegram/send-message` - Отправка сообщений

## Мониторинг

### Логи
- Production логи: `npm start` → консоль
- Health check: `GET /api/health`

### Метрики
- Время ответа API
- Количество запросов
- Статус базы данных

## Troubleshooting

### Проблемы с базой данных
1. Проверьте переменные Supabase в .env.local
2. Убедитесь что RLS политики настроены
3. Проверьте подключение через `/api/health`

### Проблемы с Telegram
1. Проверьте TELEGRAM_BOT_TOKEN
2. Настройте webhook: `POST /api/telegram/set-webhook`
3. Проверьте логи в консоли

### Проблемы с CORS
1. Обновите allowedOrigins в next.config.js
2. Проверьте headers в middleware.ts
3. Убедитесь что домен добавлен в CORS

## Контакты

Для поддержки и вопросов по развертыванию обращайтесь к команде разработки.

---
**Версия:** 2.7.0  
**Коммит:** 0889303ae2d9f43f6f9abf4b4c591aae2174f22c  
**Дата:** December 2024
