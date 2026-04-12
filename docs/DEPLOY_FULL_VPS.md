# Полный деплой GET2B на VPS (с нуля)

Инструкция для случая полной переустановки ОС или нового сервера.
**Проверено:** 2026-04-11 — полный деплой с нуля, всё поднялось.

## Доступы

- VPS: root@83.220.172.8
- Проект на сервере: /var/www/godplis
- Домен: get2b.pro
- GHCR образ: ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production:latest

## Правила SSH

- Если SSH НЕ подключается — СТОП. НЕ ретраить.
- fail2ban банит после нескольких неудачных попыток — каждый ретрай ухудшает ситуацию.
- Каждую команду выполнять ОТДЕЛЬНЫМ ssh вызовом (не держать сессию).
- После переустановки ОС нужно удалить старый host key: `ssh-keygen -R 83.220.172.8`

---

## Порядок деплоя (строго по шагам)

### Шаг 1: SSH ключ

После переустановки ОС SSH ключ теряется. Нужно добавить заново.

**Если есть пароль root (после свежей установки ОС):**
```bash
# Удалить старый host key (если ОС переустановлена)
ssh-keygen -R 83.220.172.8

# Добавить SSH ключ через пароль
sshpass -p 'ПАРОЛЬ' ssh -o StrictHostKeyChecking=no root@83.220.172.8 \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**Если пароля нет — через VNC-консоль хостера:**
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ПУБЛИЧНЫЙ_КЛЮЧ" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Шаг 2: Проверить доступ

```bash
ssh -o ConnectTimeout=10 root@83.220.172.8 "whoami && uptime"
```

Если не подключается — СТОП, не ретраить.

### Шаг 3: Установить Docker

```bash
ssh root@83.220.172.8 "apt-get update -qq && apt-get install -y -qq ca-certificates curl gnupg git"

ssh root@83.220.172.8 "install -m 0755 -d /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc && chmod a+r /etc/apt/keyrings/docker.asc && echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo \$VERSION_CODENAME) stable\" > /etc/apt/sources.list.d/docker.list && apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin && systemctl start docker && systemctl enable docker && docker --version"
```

### Шаг 4: Клонировать проект

```bash
ssh root@83.220.172.8 "mkdir -p /var/www && git clone https://github.com/Stasnakamodov/get2b-mvp-v2.7.0-production.git /var/www/godplis"
```

**Если папка уже существует** (например, туда уже залиты картинки):
```bash
ssh root@83.220.172.8 "cd /var/www && git clone https://github.com/Stasnakamodov/get2b-mvp-v2.7.0-production.git godplis-tmp && cp -r godplis-tmp/* godplis-tmp/.* godplis/ 2>/dev/null; rm -rf godplis-tmp"
```

### Шаг 5: Создать .env файл

Скопировать `.env.local` из локального проекта, адаптировав для прода:

```bash
# Ключевые отличия от .env.local:
# - DATABASE_URL: postgres (не localhost:5433) — внутри Docker network
# - NODE_ENV: production (не development)
# - Убрать SUPABASE_* переменные (не нужны на проде)
```

Обязательные переменные:
```
DATABASE_URL=postgresql://get2b:ПАРОЛЬ@postgres:5432/get2b
DB_PASSWORD=ПАРОЛЬ
JWT_SECRET=...  (мин. 32 символа, такой же как в .env.local)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
TELEGRAM_CHAT_BOT_TOKEN=...
NEXT_PUBLIC_BASE_URL=https://get2b.pro
NODE_ENV=production
UPLOAD_DIR=/data/uploads
BOTHUB_API_KEY=...
YANDEX_VISION_API_KEY=...
YANDEX_FOLDER_ID=...
SCRAPER_API_KEY=...
OTAPI_INSTANCE_KEY=...
```

**НЕ трогать .env если он уже есть на сервере!**

### Шаг 6: Залить картинки каталога

На VPS нужны ВСЕ картинки: `prod-*.jpg` + `asp-*.jpg` из исходников А-Спецторг.

```bash
# Локально: создать архив
cd /Users/user/Downloads/code/public/images/products/
tar czf /tmp/catalog-images-all.tar.gz prod-*.jpg asp-*.jpg

# Залить на VPS
scp /tmp/catalog-images-all.tar.gz root@83.220.172.8:/tmp/

# Распаковать в bind mount директорию + права
ssh root@83.220.172.8 "mkdir -p /var/www/godplis/product-images && tar xzf /tmp/catalog-images-all.tar.gz -C /var/www/godplis/product-images/ && chmod 644 /var/www/godplis/product-images/*.jpg && chown -R root:root /var/www/godplis/product-images/ && rm /tmp/catalog-images-all.tar.gz && echo 'Images:' && ls /var/www/godplis/product-images/*.jpg | wc -l"
```

**ВАЖНО:** Права 644 обязательны — nginx (www-data) должен читать файлы. macOS tar сохраняет права 600, nginx получит 403.

Bind mount в docker-compose.yml: `./product-images:/app/public/images/products`
Nginx alias: `/var/www/godplis/product-images/`
Картинки переживают ребилд контейнера.

### Шаг 7: Поднять PostgreSQL

```bash
ssh root@83.220.172.8 "cd /var/www/godplis && docker compose up -d postgres"
```

Дождаться готовности (до 30 сек):
```bash
ssh root@83.220.172.8 "sleep 5 && docker compose -f /var/www/godplis/docker-compose.yml exec -T postgres pg_isready -U get2b"
```

### Шаг 8: Применить схему и миграции

```bash
# Сначала init.sql (создаёт таблицы, функции, триггеры)
ssh root@83.220.172.8 "cat /var/www/godplis/sql/init.sql | docker compose -f /var/www/godplis/docker-compose.yml exec -T postgres psql -U get2b -d get2b"

# Потом миграции (идемпотентные)
ssh root@83.220.172.8 "cd /var/www/godplis && for f in sql/migrations/*.sql; do echo \"=== \$f ===\"; cat \"\$f\" | docker compose exec -T postgres psql -U get2b -d get2b 2>&1 | tail -3; done"
```

### Шаг 9: Синхронизировать каталог

Каталог хранится в `data/catalog-seed.json`. Скрипт заливает в catalog_products, но API читает из catalog_verified_products — нужен второй шаг.

```bash
# Локально: SSH-тоннель + sync
ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8

# Очистить таблицы (если init.sql создал пустые записи)
ssh root@83.220.172.8 "docker compose -f /var/www/godplis/docker-compose.yml exec -T postgres psql -U get2b -d get2b -c 'TRUNCATE catalog_categories, catalog_suppliers, catalog_products, catalog_verified_products, catalog_verified_suppliers CASCADE;'"

# Запустить синхронизацию (из локальной папки проекта)
node scripts/sync-catalog.mjs --target prod
```

### Шаг 10: Скопировать каталог в verified таблицы

API читает из `catalog_verified_*`, а sync заливает в `catalog_*`. Нужно скопировать:

```bash
ssh root@83.220.172.8 "docker compose -f /var/www/godplis/docker-compose.yml exec -T postgres psql -U get2b -d get2b << 'SQL'
-- Поставщики
INSERT INTO catalog_verified_suppliers (id, name, company_name, country, contact_person, is_active, created_at, updated_at)
SELECT id, name, name, country, 
  COALESCE(contact_info->>'contact_person', ''),
  is_active, created_at, updated_at
FROM catalog_suppliers
ON CONFLICT (id) DO NOTHING;

-- Товары (text[] images -> jsonb, category_id -> category text)
INSERT INTO catalog_verified_products (id, supplier_id, name, description, category, price, specifications, images, is_active, created_at, updated_at)
SELECT 
  p.id, p.supplier_id, p.name, p.description,
  COALESCE(c.name, 'Без категории'),
  p.price, 
  COALESCE(p.specifications, '{}'::jsonb),
  COALESCE(array_to_json(p.images)::jsonb, '[]'::jsonb),
  p.is_active, p.created_at, p.updated_at
FROM catalog_products p
LEFT JOIN catalog_categories c ON p.category_id = c.id
ON CONFLICT DO NOTHING;

-- Удалить товары с мёртвыми alicdn/otcommerce URL
DELETE FROM catalog_verified_products 
WHERE images::text LIKE '%otcommerce%' OR images::text LIKE '%alicdn%';

-- Удалить товары без картинок
DELETE FROM catalog_verified_products WHERE images = '[]'::jsonb;

-- Проверка
SELECT 
  (SELECT count(*) FROM catalog_verified_suppliers) as suppliers,
  (SELECT count(*) FROM catalog_verified_products) as products;
SQL"
```

Ожидаемый результат: ~38 поставщиков, ~591 товар.

### Шаг 11: Подтянуть Docker образ и поднять web

```bash
ssh root@83.220.172.8 "cd /var/www/godplis && docker compose pull web && docker compose up -d"
```

### Шаг 12: Дождаться health check (до 60 сек)

```bash
ssh root@83.220.172.8 "sleep 15 && curl -s http://localhost:3000/api/health"
```

Ожидаемый ответ: `{"status":"healthy",...}`

### Шаг 13: Nginx + SSL

```bash
# Установить
ssh root@83.220.172.8 "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx"

# Удалить default, получить сертификат
ssh root@83.220.172.8 "rm -f /etc/nginx/sites-enabled/default && systemctl restart nginx && certbot --nginx -d get2b.pro -d www.get2b.pro --non-interactive --agree-tos -m admin@get2b.pro"

# Применить наш конфиг (certbot может не найти server block — это ОК, наш конфиг уже ссылается на сертификаты)
ssh root@83.220.172.8 "cp /var/www/godplis/nginx/get2b.conf /etc/nginx/sites-enabled/get2b && cp /var/www/godplis/nginx/get2b-ratelimit.conf /etc/nginx/conf.d/get2b-ratelimit.conf 2>/dev/null; nginx -t && systemctl restart nginx"
```

### Шаг 14: Fail2ban + UFW

```bash
ssh root@83.220.172.8 "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq fail2ban ufw"

# Fail2ban
ssh root@83.220.172.8 "cp /var/www/godplis/ops/fail2ban/jail.d/* /etc/fail2ban/jail.d/ && cp /var/www/godplis/ops/fail2ban/filter.d/* /etc/fail2ban/filter.d/ && touch /var/log/nginx/bot-attacks.log && systemctl restart fail2ban"

# UFW (опционально)
ssh root@83.220.172.8 "ufw allow 22 && ufw allow 80 && ufw allow 443 && echo 'y' | ufw enable"
```

### Шаг 15: Telegram вебхуки

**ВАЖНО:** Telegram API заблокирован на уровне хостера. Вебхуки ставить ТОЛЬКО из контейнера (там есть extra_hosts для обхода).

```bash
ssh root@83.220.172.8 "docker compose -f /var/www/godplis/docker-compose.yml exec -T web node -e \"
fetch('https://api.telegram.org/bot7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ/setWebhook?url=https://get2b.pro/api/telegram-webhook&allowed_updates=%5B%22message%22%2C%22callback_query%22%5D').then(r=>r.json()).then(d=>console.log('Bot1:', JSON.stringify(d)));
fetch('https://api.telegram.org/bot8195945436:AAGfC8pGuygYhH60BW8MYS-UuPNSpuPw87g/setWebhook?url=https://get2b.pro/api/telegram-chat-webhook&allowed_updates=%5B%22message%22%2C%22callback_query%22%5D').then(r=>r.json()).then(d=>console.log('Bot2:', JSON.stringify(d)));
\""
```

Ожидаемый результат: `{"ok":true,"result":true}`

### Шаг 16: Создать admin пользователя

```bash
# Сгенерировать bcrypt хеш пароля (локально)
node -e "require('bcryptjs').hash('ПАРОЛЬ', 10).then(h => console.log(h))"

# Вставить пользователя (ВАЖНО: экранировать $ в хеше через одинарные кавычки)
ssh root@83.220.172.8 'docker compose -f /var/www/godplis/docker-compose.yml exec -T postgres psql -U get2b -d get2b -c "INSERT INTO users (email, password_hash, name, role, email_confirmed_at) VALUES ('"'"'EMAIL'"'"', '"'"'BCRYPT_HASH'"'"', '"'"'ИМЯ'"'"', '"'"'admin'"'"', now());"'

# Создать профиль и карточку клиента — через UI после логина или SQL
```

### Шаг 17: Финальная проверка

```bash
# Контейнеры
ssh root@83.220.172.8 "docker compose -f /var/www/godplis/docker-compose.yml ps"

# HTTPS
ssh root@83.220.172.8 "curl -sk https://get2b.pro/api/health"

# Картинки (должен быть HTTP 200 image/jpeg)
ssh root@83.220.172.8 "curl -sI https://get2b.pro/images/products/prod-0001.jpg | head -3"

# Telegram (из контейнера)
ssh root@83.220.172.8 "docker compose -f /var/www/godplis/docker-compose.yml exec -T web node -e \"fetch('https://api.telegram.org/bot7674425495:AAGiuSrYNJuJA06a65fXA95Ss0pcXhOE8tQ/getWebhookInfo').then(r=>r.json()).then(d=>console.log(JSON.stringify(d.result.url)))\""
```

Открыть https://get2b.pro → залогиниться → создать проект → проверить Telegram уведомления.

---

## Чего НЕ делать

- НЕ ретраить SSH при ошибке подключения (fail2ban)
- НЕ трогать .env файл если он уже есть
- НЕ пересоздавать volumes PostgreSQL (потеря данных!)
- НЕ использовать `docker compose down -v`
- НЕ ставить Telegram вебхуки с хоста (заблокировано) — только из контейнера
- НЕ забывать chmod 644 на картинках (macOS tar = 600 = nginx 403)

## Важные детали архитектуры

- Docker Compose: postgres (порт 5432 localhost) + web (порт 3000 localhost)
- Nginx: reverse proxy HTTPS → localhost:3000, SSL через Let's Encrypt
- Картинки: bind mount `./product-images` → `/app/public/images/products`, nginx раздаёт через alias
- БД: PostgreSQL 16 Alpine, user=get2b, db=get2b, пароль из .env
- API каталога читает из `catalog_verified_products` (НЕ `catalog_products`)
- Sync script заливает в `catalog_products` → нужно копировать в `catalog_verified_products` (шаг 10)
- Telegram API заблокирован хостером → extra_hosts в docker-compose обходит блокировку

## Источники картинок

```
/Users/user/Downloads/code/public/images/products/
├── prod-*.jpg   (785 файлов, ~212MB) — основные товары
├── asp-*.jpg    (92 файла, ~42MB)    — товары А-Спецторг
└── Итого: ~877 файлов, ~254MB
```

3 файла отсутствуют в исходниках: prod-0588.jpg, prod-0590.jpg, prod-0630.jpg — товары с этими картинками удаляются из каталога.
