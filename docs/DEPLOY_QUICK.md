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
- **`.env` на сервере** не трогаем — он прописан один раз и живёт своей жизнью.

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
