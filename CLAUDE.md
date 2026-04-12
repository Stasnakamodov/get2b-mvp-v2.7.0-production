# GET2B — Guide for Claude Code

Next.js 15 платформа для международных закупок. Монолит. Клиент создаёт проекты (компания → спецификация → оплата → чеки), менеджер ведёт flow через Telegram-бот.

## Production

- **Домен:** `get2b.pro`
- **VPS:** `83.220.172.8`, Ubuntu 24.04, 1 vCPU / 1.8GB RAM
- **Контейнеры:** `get2b-app` (Next.js) + `get2b-postgres` (PostgreSQL 16 Alpine)
- **Путь на VPS:** `/var/www/godplis`
- **Образ:** `ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production:latest`
- **Полный редеплой VPS:** 2026-04-11 (переустановка ОС с нуля)

## Деплой

**CI в `.github/workflows/deploy.yml` сломан** с момента переустановки ОС 2026-04-11. Build & Push Docker Image работает (образ попадает в GHCR), но шаг `Deploy to Production` падает с `ssh: handshake failed` — GitHub secret `SSH_PRIVATE_KEY` не обновили под новый хост. Lint и Unit Tests в CI тоже красные (см. ниже), но `build-and-push` не зависит от них.

**Как правильно деплоить сейчас:** `git push origin main` → дождаться build-and-push зелёного в GHCR → ручной SSH на VPS по шагу 11 из `docs/DEPLOY_FULL_VPS.md`:

```bash
ssh root@83.220.172.8 'cd /var/www/godplis && \
  git pull origin main && \
  docker compose pull web && \
  docker compose up -d && \
  sleep 10 && curl -s http://localhost:3000/api/health'
```

См. также: `docs/DEPLOY_QUICK.md` — шпаргалка для ежедневного деплоя; `docs/DEPLOY_FULL_VPS.md` — полный редеплой с нуля (шаги 1–17).

## Правила работы с инфраструктурой

- **SSH к VPS: одна попытка, без ретраев.** fail2ban банит после нескольких неудачных auth — каждый ретрай ухудшает ситуацию. Если не достучался — СТОП, проверь ключи, не долби повторно.
- **Каждую SSH команду отдельным вызовом,** не держать persistent-сессии.
- **Не использовать `mcp__supabase__*` тулы.** В проекте НЕТ Supabase. Схему искать в `sql/init.sql`, миграции в `sql/migrations/`.
- **Не `docker compose down -v`** — убьёт PostgreSQL volume.
- **Не трогать `.env` на сервере** если он уже есть.

## Архитектура данных

- **БД:** PostgreSQL 16, кастомный db wrapper поверх `pg.Pool` (`lib/db/client.ts`), имитирует Supabase-подобный API. **Это НЕ Supabase SDK** — не импортируй `@supabase/*`.
- **Схема:** `sql/init.sql` (tables, functions, triggers). Миграции в `sql/migrations/` нумеруются `001`, `002`, …, всегда идемпотентные (`IF NOT EXISTS`). Запуск: `docker exec -i get2b-postgres psql -U get2b -d get2b < sql/migrations/NNN.sql`.
- **Каталог:** API читает из `catalog_verified_products` / `catalog_verified_suppliers`, а sync-скрипт заливает в `catalog_products` / `catalog_suppliers` → надо вручную копировать в verified таблицы (см. шаг 10 `DEPLOY_FULL_VPS.md`).

## Два конструктора проектов

1. **Классический** (`app/dashboard/create-project/`) — 7 шагов, `Step1..Step7` компоненты, `useProjectSupabase` hook, состояние в `CreateProjectContext`. Подробности: `docs/PROJECT_CONSTRUCTOR_7STEPS.md`.
2. **Атомарный** (`app/dashboard/project-constructor/`) — 3 этапа (Stage 1-2-3), `useOcrUpload`, `useManagerPolling`, `useReceiptPolling`, `UploadOCRMode`. Компактнее, заточен под быстрое создание проекта.

Оба используют один API `POST /api/document-analysis` для OCR (Yandex Vision + YandexGPT).

## OCR (обновлено 2026-04-12)

- **Провайдер:** Yandex Vision (OCR, TEXT_DETECTION, PDF) + YandexGPT (парсинг инвойсов в структурированный JSON).
- **Env:** `YANDEX_VISION_API_KEY`, `YANDEX_FOLDER_ID`. `YANDEX_GPT_API_KEY` опционально, по умолчанию используется `YANDEX_VISION_API_KEY`.
- **Endpoint:** `POST /api/document-analysis` с `{ fileUrl, fileType, documentType: 'company_card' | 'invoice' }`.
- **Ответ для `invoice`:** `{ success, extractedText, suggestions: { items, invoiceInfo, bankInfo }, llmUnavailable?, llmError? }`. `llmUnavailable: true` означает YandexGPT упал — фронт должен показать честную ошибку, а не «товары не найдены».
- **XLSX-путь** (`text.includes('=== ЛИСТ:')`) обходит LLM и использует табличный regex-парсер (`extractInvoiceDataFromXlsx`) — его не трогать, работает.
- **Удалено 2026-04-12:** `lib/services/UniversalAIService.ts`, `lib/services/BotHubAIService.ts` (regex-fallback костыль), `extractCompanyDataLegacy` в route.ts (770 строк мёртвого кода).

## Telegram

- **API Telegram заблокирован на уровне хостера.** Все вызовы `api.telegram.org` должны идти **из контейнера** — в `docker-compose.yml` прописан `extra_hosts` для обхода блокировки по hostname.
- Установка webhook'ов: только изнутри `get2b-app` (см. шаг 15 `DEPLOY_FULL_VPS.md`).
- Два бота: менеджерский (approve/reject через callback'и) и чат-бот (сообщения клиенту).

## Картинки каталога

- **Bind mount:** `./product-images:/app/public/images/products` (не volume — файлы переживают ребилд).
- **Nginx alias:** `/var/www/godplis/product-images/` → `/images/products/` (nginx раздаёт напрямую, в обход Next.js).
- **Права 644 обязательны** — macOS `tar` сохраняет `600` → nginx как `www-data` получит 403.
- Источник: `/Users/user/Downloads/code/public/images/products/` (от А-Спецторг), ~877 файлов.

## Pre-existing test failures (не чинить как side quest)

`npm test` показывает **25 failing / 76 passing** тестов через 5 suite:

- `__tests__/catalog/utils.test.ts` — `getProductImage` возвращает placeholder вместо `null`
- `__tests__/api/kontur-eni.test.ts` — `Request is not defined` (нужен `@jest-environment node`)
- `__tests__/components/KonturEniCheckModal.test.tsx`
- `__tests__/pages/ProfilePage.test.tsx`
- `__tests__/project-constructor-integration.test.tsx` — `No QueryClient set`

Эти 25 падали до меня, не блокируют прод (build-and-push проходит). **Не чини их "по дороге"** — они вне scope обычных задач, могут быть intentional skip или старые артефакты. Чини только если задача явно про них.

TypeScript `tsc --noEmit` тоже выдаёт несколько pre-existing ошибок в тех же файлах. Фильтруй вывод под свои touched файлы: `tsc --noEmit 2>&1 | grep -E "твои-файлы" || echo "clean"`.

## Где что искать

| Что | Путь |
|---|---|
| Полный редеплой с нуля | `docs/DEPLOY_FULL_VPS.md` |
| Ежедневный деплой | `docs/DEPLOY_QUICK.md` |
| 7 шагов классического конструктора | `docs/PROJECT_CONSTRUCTOR_7STEPS.md` |
| Схема БД | `sql/init.sql` |
| Миграции | `sql/migrations/NNN.sql` |
| OCR паттерны и история | `docs/architecture/ocr-patterns-inventory.md`, `lib/ocr/OCR_LIBRARY_DOCUMENTATION.md` |
| DB wrapper | `lib/db/client.ts` |
| Telegram сервисы | `lib/telegram/ManagerBotService.ts`, `lib/telegram/TelegramService.ts` |
| Health check | `app/api/health/route.ts` |
