# ПРОМПТ: Деплой + Миграция 004

## Что произошло

Проведён полный аудит совместимости кастомного DB-слоя с бизнес-логикой. Найдено и исправлено 9 багов в двух коммитах:

**Коммит 1** (`3e6fb9e`): `fix: DB layer audit — fix .not() filter, missing tables, broken JOINs, storage ops`
**Коммит 2** (`895cad3`): `fix: Add upsert onConflict support and auto user_id scoping in API proxy`

Код уже закоммичен в main. Осталось:
1. Запушить в GitHub (запустит GH Actions → сборка образа → автодеплой)
2. После деплоя — запустить SQL-миграцию на VPS (создать 4 недостающие таблицы в БД)

---

## Задача 1: Push и деплой

```bash
git push origin main
```

GitHub Actions (`/.github/workflows/deploy.yml`) автоматически:
1. Прогонит lint + type check
2. Соберёт Docker-образ
3. Запушит в `ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production:latest`
4. По SSH зайдёт на VPS `83.220.172.8` и сделает `docker compose up -d`

Дождись пока GH Actions отработает (смотри статус в GitHub).

---

## Задача 2: Миграция SQL на VPS

После успешного деплоя — подключись к серверу и запусти миграцию:

```bash
ssh root@83.220.172.8
```

Затем на сервере:

```bash
docker exec -i get2b-postgres psql -U get2b -d get2b <<'SQL'
-- Migration 004: Add missing requisite tables
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  country text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank text,
  card_number text,
  holder_name text,
  expiry_date text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text,
  address text,
  network text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  role text DEFAULT 'client',
  file_url text NOT NULL,
  file_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_cards_user ON supplier_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user ON crypto_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_project ON project_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invoices_user ON project_invoices(user_id);
SQL
```

Ожидаемый вывод: 4x `CREATE TABLE` + 5x `CREATE INDEX`.

---

## Задача 3: Верификация

После миграции проверь что таблицы появились:

```bash
docker exec -i get2b-postgres psql -U get2b -d get2b -c "\dt bank_accounts; \dt supplier_cards; \dt crypto_wallets; \dt project_invoices;"
```

Проверь что приложение живо:

```bash
curl -sf https://get2b.pro/api/health && echo "OK"
```

---

## Инфраструктура (справка)

| Компонент | Значение |
|-----------|----------|
| VPS | `83.220.172.8`, Ubuntu 24.04, 1 vCPU, 1.8GB RAM |
| Домен | `get2b.pro` |
| SSH | `root@83.220.172.8` (только по ключу) |
| App path на VPS | `/var/www/godplis` |
| Docker контейнеры | `get2b-app` (Next.js) + `get2b-postgres` (PostgreSQL 16) |
| Docker image | `ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production:latest` |
| БД | PostgreSQL 16, user: `get2b`, db: `get2b` |
| Деплой | GitHub Actions → Docker build → SSH pull + `docker compose up -d` |
| SQL миграции | `sql/migrations/` — НЕ автоматические, запускать вручную через `docker exec` |

---

## Что было исправлено (полный список)

1. **`.not()` фильтр не обрабатывался в API proxy** (`app/api/db/query/route.ts`) — добавлен `case 'not'`
2. **`.not("field", "is", null)` генерировал невалидный SQL** (`lib/db/queryBuilder.ts`) — теперь `IS NOT NULL`
3. **JOIN-синтаксис `projects!inner()` молча стрипался** (`Step4PaymentMethodForm.tsx`) — переписан на два отдельных запроса
4. **4 таблицы отсутствовали** (`sql/init.sql` + миграция 004) — `bank_accounts`, `supplier_cards`, `crypto_wallets`, `project_invoices`
5. **`sync_catalog_suppliers` RPC в whitelist но не существует** — убран из whitelist
6. **`storage.list()` и `storage.remove()` — no-op на клиенте** — реализованы через `/api/storage/list` и `/api/storage/remove`
7. **Новые таблицы не в AUTH_REQUIRED_TABLES** — добавлены
8. **Upsert игнорировал `onConflict` параметр** — теперь поддерживает кастомные conflict columns и `ignoreDuplicates`
9. **Нет user_id scoping в API proxy** — добавлен auto-inject `.eq('user_id', userId)` для USER_SCOPED_TABLES (admin/manager bypass)

---

## Если SSH не подключается

Сервер может отклонять SSH из-за fail2ban. Варианты:
1. Подключиться через VNC/Console в панели хостера
2. Подождать 10-30 минут (fail2ban обычно банит временно)
3. Подключиться с другого IP (телефон, VPN)
