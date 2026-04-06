# ПРОМПТ: Общий каталог GET2B + А-Спецторг — привод синхронизации

## Контекст: Два проекта — один каталог

Есть два B2B проекта с **одинаковым товарным каталогом**, которые нужно держать в синхронизации:

### Проект 1: GET2B
- **Репо**: `/Users/user/Desktop/godplisgomvp-forvercel/` → `github.com/Stasnakamodov/get2b-mvp-v2.7.0-production`
- **Домен**: `get2b.pro`
- **VPS**: `83.220.172.8`, SSH: `root@83.220.172.8`
- **Стек**: Next.js, TypeScript, **PostgreSQL** (pg.Pool, кастомный QueryBuilder)
- **Каталог хранится**: таблицы `catalog_products`, `catalog_suppliers`, `catalog_categories` в PostgreSQL
- **Docker**: `get2b-app` + `get2b-postgres`, деплой через GitHub Actions
- **Текущее состояние каталога**: 1485 товаров, 14 поставщиков, 41 категория (8 основных + 33 подкатегории)
- **Путь на VPS**: `/var/www/godplis`
- **DB credentials**: user=get2b, db=get2b, пароль в docker-compose

### Проект 2: А-Спецторг
- **Репо**: `/Users/user/Downloads/code/` → `github.com/Master788pro/a-spectorg` (production remote → `Stasnakamodov/technomodern-platform`)
- **Домен**: `а-спецторг.рф` (punycode: `xn----7sbkh9bejel3b.xn--p1ai`)
- **VPS**: отдельный сервер (уточнить IP), SSH deploy через GitHub Actions
- **Стек**: Next.js 16, TypeScript, **JSON-файл** как каталог (НЕ база данных)
- **Каталог хранится**: `/data/realistic-catalog-v2.json` — один JSON файл, загружается в память
- **Docker**: standalone Next.js, деплой через `.github/workflows/deploy-docker.yml`
- **Текущее состояние каталога**: 604 товара, 8 поставщиков, 8 категорий
- **Путь на VPS**: `/var/www/a-spectorg`
- **Чтение**: `lib/catalog.ts` (lazy load + in-memory cache)
- **Запись**: `lib/catalog-write.ts` (пишет в JSON файл + сбрасывает кеш)

---

## Ключевые различия

| | GET2B | А-Спецторг |
|---|---|---|
| **Хранение** | PostgreSQL (таблицы) | JSON-файл на диске |
| **API чтения** | `db.from('catalog_products').select(...)` | `GET /api/catalog/products` (из JSON) |
| **API записи** | SQL INSERT/UPDATE | `catalog-write.ts` → пишет в JSON |
| **Структура товара** | `{id, name, description, category_id (uuid), supplier_id (uuid), price, unit, specifications (jsonb), images (text[]), is_active}` | `{id (prod-XXXX), name, category, subcategory, description, price_1688_cny, price_rub, margin_percent, supplier, moq, in_stock, image_url, specifications}` |
| **Категории** | `catalog_categories` таблица с parent_id, level, key | Плоский массив `{id, name, icon, subcategories[]}` |
| **Поставщики** | `catalog_suppliers` таблица | Вложены в категории JSON |
| **ID формат** | UUID (`9dce15a9-ae2b-...`) | Строковый (`prod-0001`) |
| **Цены** | `price` (число) + `unit` (валюта) | `price_1688_cny` + `price_rub` + `margin_percent` |
| **Деплой** | GitHub Actions → Docker → VPS 83.220.172.8 | GitHub Actions → Docker → VPS (другой IP) |

---

## Что нужно сделать

### Цель
Единый "привод" (sync engine), который позволяет:
1. **Пополнять каталог в одном месте** → автоматически появляется в обоих проектах
2. **Синхронизировать в обе стороны**: GET2B ↔ А-Спецторг
3. **Запускать одной командой** из любого из двух репозиториев

### Уже сделано (в GET2B)
- `data/catalog-seed.json` — выгрузка каталога GET2B в JSON (1485 товаров)
- `scripts/export-catalog.mjs` — экспорт из PostgreSQL в JSON
- `scripts/sync-catalog.mjs` — импорт из JSON в PostgreSQL (upsert, idempotent)
- `scripts/import-dump-to-vps.mjs` — импорт из старого дампа

### Задачи для этого чата

#### 1. Проектирование общего формата каталога
Нужен **единый JSON-формат** (`catalog-seed.json`), который понимают оба проекта. Учти различия:
- ID: UUID vs `prod-XXXX` → нужен маппинг или единый формат
- Цены: одно поле vs CNY/RUB/маржа → нужна нормализация
- Категории: дерево с parent_id vs плоский массив → нужна конверсия
- Поставщики: отдельная таблица vs встроенные в JSON

#### 2. Скрипт двусторонней синхронизации
Один скрипт (или два), который:
```bash
# Из GET2B → А-Спецторг
node scripts/sync-catalog.mjs --from get2b --to spectorg

# Из А-Спецторга → GET2B
node scripts/sync-catalog.mjs --from spectorg --to get2b

# Полная синхронизация (merge)
node scripts/sync-catalog.mjs --merge
```

Для GET2B: пишет через SSH-туннель в PostgreSQL (upsert)
Для А-Спецторга: генерирует JSON-файл → деплоит через SSH/git push

#### 3. Маппинг полей между проектами

```
GET2B catalog_products          ←→  А-Спецторг product
──────────────────────────────────────────────────────
id (uuid)                       ←→  id (prod-XXXX)
name                            ←→  name
description                     ←→  description
category_id (uuid → name)       ←→  category (string)
supplier_id (uuid → name)       ←→  supplier (string)
price                           ←→  price_rub
unit                            ←→  currency (always RUB?)
specifications (jsonb)          ←→  specifications (object)
images (text[])                 ←→  image_url (string, single)
is_active                       ←→  in_stock
created_at                      ←→  created_at
—                               ←→  price_1688_cny (нет в GET2B)
—                               ←→  margin_percent (нет в GET2B)
—                               ←→  moq (нет в GET2B)
—                               ←→  subcategory (в GET2B это parent_id в categories)
```

#### 4. Автоматизация (опционально)
- GitHub Action: при пуше в `data/catalog-seed.json` → автоматический деплой на оба сервера
- Или cron-скрипт на одном из VPS

---

## Файлы для изучения

### GET2B (основной репо)
```
/Users/user/Desktop/godplisgomvp-forvercel/
├── data/catalog-seed.json              # Текущий каталог в JSON (1485 товаров)
├── scripts/export-catalog.mjs          # Экспорт из PostgreSQL → JSON
├── scripts/sync-catalog.mjs            # Импорт из JSON → PostgreSQL
├── scripts/import-dump-to-vps.mjs      # Старый импорт из дампа
├── sql/init.sql                        # Схема БД (таблицы + сиды)
├── lib/db/pool.ts                      # pg.Pool подключение
├── lib/db/queryBuilder.ts              # QueryBuilder (select, insert, upsert)
├── lib/db/index.ts                     # db.from('table')...
└── app/api/catalog/                    # API routes каталога
```

### А-Спецторг
```
/Users/user/Downloads/code/
├── data/realistic-catalog-v2.json      # Текущий каталог (604 товара)
├── data/catalog-clean.json             # Индексированная версия
├── lib/catalog.ts                      # Чтение каталога (lazy load)
├── lib/catalog-write.ts                # Запись в каталог (JSON file)
├── types/catalog.types.ts              # TypeScript типы
├── app/api/catalog/                    # API routes
├── app/admin/                          # Админка (CRUD товаров)
├── supabase/migrations/                # SQL схема (не используется в runtime)
├── Dockerfile                          # Деплой
├── docker-compose.prod.yml             # Продакшен compose
├── nginx/a-spectorg.conf               # Nginx конфиг
└── .github/workflows/deploy-docker.yml # CI/CD
```

### Дамп данных
```
/Users/user/Downloads/code/database-dump/
├── products.json        # 1489 товаров (исходный дамп)
├── real-products.json   # 544 товара (отфильтрованные)
├── suppliers.json       # 14 поставщиков
├── categories.json      # 41 категория
└── user_profiles.json   # Профили пользователей
```

---

## Подключение к серверам

```bash
# GET2B PostgreSQL (через SSH-туннель)
ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8
# Затем: host=localhost port=5433 user=get2b db=get2b

# А-Спецторг VPS
# IP нужно уточнить — проверь в .github/workflows/deploy-docker.yml secrets
# Или: ssh root@<SPECTORG_IP>
```

## Ожидаемый результат

1. **Единый `catalog-seed.json`** в обоих репозиториях (или в одном общем месте)
2. **Скрипт синхронизации** — одна команда заливает каталог на оба сервера
3. **Маппинг полей** — автоматическая конверсия между форматами GET2B и А-Спецторг
4. **Документация** — как добавить товар и синхронизировать
