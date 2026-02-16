# GET2B Operations Runbook

## Инфраструктура

| Компонент | Детали |
|-----------|--------|
| **Сервер** | VPS 45.150.8.168, Ubuntu 24.04, 2 vCPU, 3.7 GB RAM |
| **Домен** | get-2-b.ru / www.get-2-b.ru |
| **Runtime** | Node.js 20.x, Next.js 15.2.4 |
| **Process manager** | PM2 (процесс `godplis`) |
| **Reverse proxy** | Nginx → localhost:3000 |
| **SSL** | Let's Encrypt (certbot), истекает 2026-05-11 |
| **Firewall** | UFW — порты 22, 80, 443 |
| **БД** | Supabase (PostgreSQL), регион US-East-1 |
| **Код** | /var/www/godplis на сервере |
| **Репозиторий** | GitHub → main ветка |

---

## Подключение к серверу

```bash
ssh root@45.150.8.168
```

Работает только с SSH-ключом (парольная аутентификация отключена).

**Если SSH не работает:**
1. Проверить что ключ добавлен: `ssh-add -l`
2. Если нет: `ssh-add ~/.ssh/id_rsa`
3. Попробовать с verbose: `ssh -v root@45.150.8.168`
4. Если "Too many authentication failures" — указать ключ явно: `ssh -i ~/.ssh/id_rsa root@45.150.8.168`
5. Если ключ не принимается — нужен доступ через панель хостера (VNC/Console)

---

## Стандартный деплой

```bash
ssh root@45.150.8.168 'cd /var/www/godplis && git pull origin main && npm install --legacy-peer-deps && npm run build && pm2 restart godplis'
```

**Поэтапно (если нужен контроль):**

```bash
ssh root@45.150.8.168

cd /var/www/godplis
git pull origin main
npm install --legacy-peer-deps
npm run build          # <-- Если упал — НЕ рестартовать PM2!
pm2 restart godplis
pm2 logs godplis --lines 20   # Проверить что стартовало без ошибок
```

### Правило: билд перед рестартом

**НИКОГДА** не делайте `pm2 restart` если `npm run build` упал. Это уронит прод. Сначала почините билд локально, запушьте фикс, потом повторите деплой.

---

## Диагностика: Прод не работает

### Чеклист (порядок проверки)

#### 1. Проверить доступность снаружи
```bash
# С локальной машины:
curl -sI https://get-2-b.ru/ | head -5
ping -c 3 45.150.8.168
```

- Если ping не проходит → проблема на уровне хостера/сети
- Если ping OK, но HTTPS timeout → SSH на сервер и проверить дальше

#### 2. SSH на сервер и проверить PM2
```bash
ssh root@45.150.8.168
pm2 status
```

| pm2 status | Проблема | Решение |
|------------|----------|---------|
| `online` | PM2 работает, проблема в Nginx или сети | Проверить п.3 |
| `errored` | Приложение упало | `pm2 logs godplis --lines 50`, затем п.5 |
| `stopped` | Кто-то остановил | `pm2 restart godplis` |
| Нет процесса | PM2 потерял конфиг | `cd /var/www/godplis && pm2 start npm --name "godplis" -- start` |

#### 3. Проверить Nginx
```bash
systemctl status nginx
nginx -t                    # Тест конфигурации
tail -20 /var/log/nginx/error.log
```

- Если nginx не запущен: `systemctl start nginx`
- Если ошибка конфигурации: `nginx -t` покажет что не так

#### 4. Проверить порт 3000
```bash
curl -sI http://localhost:3000/ | head -5
ss -tlnp | grep 3000
```

- Если localhost:3000 отвечает, а снаружи нет → проблема в Nginx
- Если localhost:3000 не отвечает → проблема в PM2/Node

#### 5. Проверить логи приложения
```bash
pm2 logs godplis --lines 100
```

Типичные ошибки:

| Ошибка в логах | Причина | Решение |
|----------------|---------|---------|
| `EADDRINUSE :3000` | Порт занят другим процессом | `pm2 kill && pm2 start npm --name "godplis" -- start` |
| `MODULE_NOT_FOUND` | Зависимости не установлены | `npm install --legacy-peer-deps && npm run build && pm2 restart godplis` |
| `ENOMEM` / `JavaScript heap out of memory` | Не хватает RAM | `NODE_OPTIONS="--max-old-space-size=2048" npm run build` |
| `Cannot find module '.next/...'` | Билд отсутствует/битый | `npm run build && pm2 restart godplis` |
| Supabase timeout / connection refused | БД недоступна | Проверить Supabase dashboard, `.env.local` |

#### 6. Проверить диск и память
```bash
df -h         # Место на диске
free -h       # RAM
htop          # CPU / подозрительные процессы
```

- Если диск заполнен: `rm -rf /var/www/godplis/.next/cache` (безопасно, пересоздастся при билде)
- Если RAM мало: проверить нет ли утечек через `htop`, убить лишние процессы

#### 7. Проверить SSL
```bash
certbot certificates
```

- Если сертификат истёк: `certbot renew && systemctl reload nginx`

---

## Типичные инциденты и решения

### Белый экран / 500 после деплоя

**Причина:** Билд на сервере прошёл с ошибками, или `.env.local` потерялся.

```bash
ssh root@45.150.8.168
cd /var/www/godplis

# Проверить env
cat .env.local | head -5

# Пересобрать
npm run build 2>&1 | tail -20

# Если билд OK:
pm2 restart godplis
pm2 logs godplis --lines 20
```

### Сайт работает, но API возвращает ошибки

```bash
# Проверить .env.local на сервере
cat /var/www/godplis/.env.local

# Должны быть:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### PM2 потребляет 100% CPU

```bash
pm2 restart godplis
# Если повторяется:
pm2 logs godplis --lines 100   # Найти что вызывает loop
```

### После git pull конфликты

```bash
cd /var/www/godplis
git stash                      # Сохранить локальные изменения
git pull origin main
git stash pop                  # Вернуть (если нужно)
npm install --legacy-peer-deps
npm run build
pm2 restart godplis
```

---

## Перед деплоем: обязательный чеклист

- [ ] `npm run build` проходит локально без ошибок
- [ ] Все SQL-миграции применены к Supabase
- [ ] Код запушен в main
- [ ] Нет хардкода localhost/dev URL в коде

```bash
# Быстрая проверка перед деплоем:
npm run build && echo "BUILD OK — можно деплоить"
```

---

## Миграции Supabase

Миграции хранятся в `supabase/migrations/`. Применять через MCP Supabase tools или psql:

```bash
# Через psql (если MCP недоступен):
psql "postgresql://postgres.pjlhxglimoehxkysqwfh:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/FILENAME.sql
```

**Важно:**
- Тестировать миграции на dev-ветке Supabase перед продом
- Все миграции должны быть идемпотентными (`IF NOT EXISTS`, `CREATE OR REPLACE`)
- После миграции проверить RLS: `mcp__supabase__get_advisors(type: "security")`

---

## Мониторинг

### На сервере
```bash
pm2 monit              # Реалтайм CPU/RAM приложения
pm2 logs godplis       # Логи в реальном времени
htop                   # Системные ресурсы
```

### Supabase
- Dashboard: проверить DB health, Edge Function logs
- `mcp__supabase__get_logs(service: "postgres")` — логи БД
- `mcp__supabase__get_advisors(type: "performance")` — рекомендации

---

## Контакты и доступы

| Что | Где |
|-----|-----|
| Хостинг (VPS) | Панель хостера (для VNC/восстановления доступа) |
| Supabase | https://supabase.com/dashboard |
| GitHub | Репозиторий проекта |
| Домен (DNS) | Регистратор домена get-2-b.ru |
