# Ежедневный деплой GET2B (шпаргалка)

Для **обычных изменений кода**. Для полного редеплоя с нуля (новая ОС, новый сервер) — `DEPLOY_FULL_VPS.md`.

## Текущая схема

CI `.github/workflows/deploy.yml` собирает Docker-образ в GHCR, но шаг SSH-деплоя сломан с 2026-04-11 (secret `SSH_PRIVATE_KEY` не обновили после переустановки ОС). Поэтому деплой **двухфазный**:

1. **GitHub** собирает образ автоматически на push в `main` — проверь что `Build & Push Docker Image` зелёный.
2. **Ты вручную** через SSH пуллишь образ на VPS и перезапускаешь контейнер.

Lint/Tests в CI красные по pre-existing причинам — это **не блокирует** build-and-push (jobs независимы).

---

## Команды

### 1. Проверить что build-and-push прошёл

```bash
gh run list --branch main --limit 1
gh run view <RUN_ID> | grep "Build & Push"
```

Ждём `✓ Build & Push Docker Image`. Обычно 2–3 минуты после push.

### 2. Задеплоить (один SSH вызов)

```bash
ssh root@83.220.172.8 'set -e
cd /var/www/godplis
git pull origin main
docker compose pull web
docker compose up -d
for i in $(seq 1 12); do
  if curl -fsS http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "healthy after ${i}x5s"
    curl -s http://localhost:3000/api/health; echo
    break
  fi
  [ $i -eq 12 ] && { echo "HEALTH FAILED"; docker compose logs web --tail=40; exit 1; }
  sleep 5
done
docker compose ps
docker compose logs web --tail=20'
```

Ожидаемый результат: `{"status":"healthy",...}` и контейнер `get2b-app` в статусе `Up ... (healthy)`.

### 3. Smoke-тест через публичный домен

```bash
curl -sk https://get2b.pro/api/health
curl -sk -X POST https://get2b.pro/api/document-analysis \
  -H "Content-Type: application/json" -d '{}' -w "\nHTTP %{http_code}\n"
```

Второй должен вернуть `HTTP 400 {"error":"fileUrl и fileType обязательны"}` — это подтверждает что новый роут загружен.

---

## Откат

Если что-то отвалилось:

```bash
# Посмотреть предыдущие SHA
ssh root@83.220.172.8 "docker images ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production --format '{{.Tag}} {{.CreatedAt}}' | head -5"

# Откатиться на конкретный SHA
ssh root@83.220.172.8 "cd /var/www/godplis && \
  docker tag ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production:<PREVIOUS_SHA> ghcr.io/stasnakamodov/get2b-mvp-v2.7.0-production:latest && \
  docker compose up -d"
```

`git revert` + push + повторный деплой тоже работает, но медленнее.

---

## Правила

- **SSH один раз, без ретраев** (fail2ban). Если первая попытка упала — СТОП, не долби.
- **`docker compose down -v` запрещён** — убьёт PostgreSQL volume.
- **Миграции SQL** применяются отдельно (`docker exec -i get2b-postgres psql -U get2b -d get2b < sql/migrations/NNN.sql`). Деплой их не запускает.
- **Telegram webhook'и** автоматически переустанавливаются при старте `get2b-app` (видно в логах: `✅ [Webhook] Manager bot: ...`).
- **`.env` на сервере** не трогаем — он прописан один раз и живёт своей жизнью. Исключение: добавление новых переменных (например, `CRON_SECRET` — см. «Каталог объявлений» ниже).

## Каталог объявлений — миграция 014 + cron

Новая фича `/dashboard/listings` требует **однократной** настройки перед первым деплоем:

### 1. Применить миграции ДО redeploy контейнера

```bash
# Миграция 013 (создание таблицы listings) — если ещё не применена
scp sql/migrations/013_create_listings.sql root@83.220.172.8:/tmp/013.sql
ssh root@83.220.172.8 'docker exec -i get2b-postgres psql -U get2b -d get2b < /tmp/013.sql && rm /tmp/013.sql'

# Миграция 014 (UNIQUE на chat_rooms для дедупа + CHECK constraints)
scp sql/migrations/014_listings_catalog_hardening.sql root@83.220.172.8:/tmp/014.sql
ssh root@83.220.172.8 'docker exec -i get2b-postgres psql -U get2b -d get2b < /tmp/014.sql && rm /tmp/014.sql'

# Проверка
ssh root@83.220.172.8 "docker exec get2b-postgres psql -U get2b -d get2b -c \"\\d+ chat_rooms\" | grep chk"
```

### 2. Сгенерировать `CRON_SECRET` и добавить в `.env` на VPS

```bash
SECRET=$(openssl rand -hex 32)
ssh root@83.220.172.8 "grep -q '^CRON_SECRET=' /var/www/godplis/.env || echo 'CRON_SECRET=$SECRET' >> /var/www/godplis/.env"
# Перечитать env в контейнере (docker compose up -d обновит из env_file)
ssh root@83.220.172.8 'cd /var/www/godplis && docker compose up -d'
```

### 3. Установить systemd timer для автоматического expire

```bash
scp docs/ops/get2b-expire-listings.service docs/ops/get2b-expire-listings.timer root@83.220.172.8:/etc/systemd/system/
ssh root@83.220.172.8 'systemctl daemon-reload && systemctl enable --now get2b-expire-listings.timer'
# Проверка
ssh root@83.220.172.8 'systemctl list-timers get2b-expire-listings.timer --no-pager'
# Ручной запуск (для smoke-теста)
ssh root@83.220.172.8 'systemctl start get2b-expire-listings.service && sleep 2 && journalctl -u get2b-expire-listings.service -n 10 --no-pager'
```

Ожидаемый вывод в логах: `{"success":true,"updated":N,"ids":[...]}`.

### 4. Smoke-тест endpoint'а

```bash
# Без auth — 401
curl -sk -X POST https://get2b.pro/api/cron/expire-listings -w "\nHTTP %{http_code}\n"
# С верным секретом (локально на VPS) — 200
ssh root@83.220.172.8 'source /var/www/godplis/.env && curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire-listings'
```

## Когда нужен полный редеплой

- Переустановка ОС на VPS
- Смена хостера
- Потеря SSH-ключа и отсутствие доступа по паролю

→ `docs/DEPLOY_FULL_VPS.md`, шаги 1–17.

## Починка CI deploy (one-time)

Чтобы восстановить автоматический SSH-деплой в `.github/workflows/deploy.yml`:

1. Сгенерить новую пару ключей: `ssh-keygen -t ed25519 -f ~/.ssh/get2b_deploy -C deploy@get2b`
2. Добавить pubkey на VPS: `ssh root@83.220.172.8 "echo '<PUBKEY>' >> ~/.ssh/authorized_keys"`
3. Обновить GitHub secrets:
   - `SSH_PRIVATE_KEY` — содержимое `~/.ssh/get2b_deploy`
   - `SERVER_HOST` — `83.220.172.8`
   - `SERVER_USER` — `root`
4. Re-run последнего workflow через `gh run rerun <RUN_ID>` — Deploy to Production должен стать зелёным.
