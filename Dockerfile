# ===========================================
# GET2B Production Dockerfile
# Multi-stage build: deps → build → runtime
# Includes Chromium for Puppeteer/Playwright
# ===========================================

# ---- Stage 1: Install dependencies ----
FROM node:20-bookworm-slim AS deps

WORKDIR /app

# Копируем только файлы зависимостей для кэширования слоя
COPY package.json package-lock.json ./

# Устанавливаем зависимости (включая native: sharp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && npm ci --legacy-peer-deps \
    && rm -rf /var/lib/apt/lists/*

# ---- Stage 2: Build the application ----
FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production build — output: 'standalone' создаёт .next/standalone
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time env vars
ARG NEXT_PUBLIC_BASE_URL=https://get2b.pro
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
# Server-only placeholders for build (overridden at runtime via .env)
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV JWT_SECRET=placeholder
ENV ANTHROPIC_API_KEY=placeholder
ENV TELEGRAM_BOT_TOKEN=placeholder
ENV TELEGRAM_CHAT_BOT_TOKEN=placeholder
ENV TELEGRAM_CHAT_ID=placeholder
ENV YANDEX_VISION_API_KEY=placeholder
ENV YANDEX_FOLDER_ID=placeholder

RUN npm run build

# ---- Stage 3: Production runtime ----
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Chromium + зависимости для Puppeteer/Playwright + sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    # Sharp dependencies
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer/Playwright: использовать системный Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Создаём непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Копируем standalone билд
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Права на кэш-директорию Next.js и tmp для Puppeteer
RUN mkdir -p .next && chown nextjs:nodejs .next
RUN mkdir -p /tmp/puppeteer && chown nextjs:nodejs /tmp/puppeteer
ENV PUPPETEER_CACHE_DIR=/tmp/puppeteer
RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs

EXPOSE 3000

# standalone server.js заменяет next start
CMD ["node", "server.js"]
