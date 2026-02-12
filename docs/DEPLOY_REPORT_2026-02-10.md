# DEPLOY REPORT - 10 февраля 2026

## Сервер
- **IP:** 45.150.8.168
- **OS:** Ubuntu 24.04.3 LTS
- **CPU:** AMD EPYC 9654 (2 vCPU)
- **RAM:** 3.7 GB
- **Disk:** 59 GB (использовано ~2 GB)
- **Домен:** get-2-b.ru / www.get-2-b.ru

---

## Что было сделано

### 1. Коммит и push изменений
- **Коммит:** `49419e2` — feat: Add scenario mode, catalog perf fix, landing image optimization
- **24 файла** закоммичены:
  - Сценарный режим (API routes, UI компоненты, хук, типы)
  - Лимит 50 по умолчанию в `app/api/catalog/products/route.ts`
  - Замена `next/Image` на `img` в CatalogSection и MarketplacesSection
  - Feature flags, Telegram notification service
  - Deploy script, testing docs, catalog check scripts

### 2. Настройка сервера с нуля
Сервер был абсолютно пустой. Установлено:
- **Node.js** 20.20.0 (через NodeSource)
- **npm** 10.8.2
- **PM2** 6.0.14 (менеджер процессов)
- **Nginx** 1.24.0 (reverse proxy)
- **Certbot** (SSL сертификаты)
- **Git** 2.43.0

### 3. Деплой приложения
1. Склонирован репозиторий в `/var/www/godplis`
2. Создан `.env.local` с production-настройками (NODE_ENV=production)
3. `npm install --legacy-peer-deps` — успешно
4. `npm run build` — успешно
5. PM2 запущен: `pm2 start npm --name "godplis" -- start`

### 4. Nginx конфигурация
- Reverse proxy на `localhost:3000`
- Кеширование статики (`/_next/static/` — 365 дней, `/images/` — 30 дней)
- Proxy cache zone `NEXTJS` (100MB)
- Keepalive connections
- HTTP → HTTPS редирект

### 5. SSL сертификат
- Let's Encrypt через Certbot
- Домены: `get-2-b.ru` + `www.get-2-b.ru`
- Истекает: **2026-05-11**
- Авто-обновление настроено (certbot.timer)

---

## ИНЦИДЕНТ БЕЗОПАСНОСТИ: Криптомайнер

### Обнаружено
Через ~15 минут после настройки сервера обнаружен **криптомайнер**:

| Файл | Описание | CPU |
|------|----------|-----|
| `/7JeXDej` | Майнер XMRig (2.6MB) | 188% |
| `/6FLrTx` | Конфиг майнера (JSON) | - |
| `/H24Mn2tFe` | Дроппер/даунлоадер | 7.5% |
| `/4WBfqFl`, `/fTgBNIqe`, `/Cvs0sA`, `/tmp/lrt` | Вспомогательные файлы | - |

### SSH бэкдор
В `/root/.ssh/authorized_keys` был внедрён чужой SSH ключ:
```
FROM="85.198.118.171,85.198.75.83" ssh-rsa AAAAB3...Nw== supportAccessKey
```
**IP атакующего:** 85.198.118.171, 85.198.75.83

### Вектор атаки
- Сервер имел открытый SSH с root-паролем
- Пароль мог быть подобран brute-force или был скомпрометирован
- Атака произошла автоматически (бот) — типичный паттерн массового сканирования

### Принятые меры защиты
1. **Убиты все процессы малвари** (kill -9)
2. **Удалены все файлы малвари** из `/` и `/tmp`
3. **Удалён SSH бэкдор** из authorized_keys
4. **UFW файрвол включён** — разрешены только порты 22, 80, 443
5. **SSH парольная аутентификация отключена** — только по SSH-ключу
6. **PermitRootLogin** = prohibit-password
7. **Добавлен только ваш SSH ключ** (user@MacBook-Air-user.local)

### Рекомендации
- [ ] Мониторить `pm2 logs godplis` и `htop` на предмет подозрительных процессов
- [ ] Рассмотреть установку fail2ban: `apt install fail2ban`
- [ ] Создать отдельного пользователя (не root) для запуска приложения
- [ ] Периодически проверять `last` и `lastb` для логинов
- [ ] Удалить пароль из `deploy.sh` (строка 38)

---

## Текущее состояние

| Компонент | Статус |
|-----------|--------|
| https://get-2-b.ru | **Работает (HTTP 200)** |
| SSL сертификат | **Активен** (до 2026-05-11) |
| PM2 (godplis) | **Online** |
| Nginx | **Работает** |
| UFW firewall | **Включён** (22, 80, 443) |
| SSH | **Только по ключу** |
| Малварь | **Удалена** |

### Время ответа
- Первый запрос: ~4с (cold start)
- Последующие: ~2.7с
- Причина: Supabase DB в US-East-1, сервер в России (latency ~150-200ms на каждый запрос к БД)

### Как подключиться к серверу
```bash
ssh root@45.150.8.168
```
(Работает только с SSH-ключом вашего MacBook)

### Как задеплоить обновление
```bash
ssh root@45.150.8.168 'cd /var/www/godplis && git pull origin main && npm install --legacy-peer-deps && npm run build && pm2 restart godplis'
```

### Полезные команды на сервере
```bash
pm2 status              # Статус приложения
pm2 logs godplis        # Логи приложения
pm2 monit               # Мониторинг CPU/RAM
htop                    # Системный мониторинг
ufw status              # Статус файрвола
certbot renew --dry-run # Проверить обновление SSL
nginx -t && systemctl reload nginx  # Перезагрузить Nginx
```

---

## На чём остановились / Что ещё нужно сделать

### Выполнено из плана:
- [x] git add && git commit новые изменения (коммит 49419e2)
- [x] Задеплоить на продакшен (сервер настроен с нуля)
- [x] SSL настроен
- [x] Firewall настроен
- [x] Малварь удалена, сервер защищён

### Не выполнено / Требует внимания:
- [ ] **Скорость загрузки ~2.7с** — обусловлена latency до Supabase US-East-1. Решения:
  - Перенести Supabase в регион ближе (EU/Frankfurt)
  - Добавить кеширование на уровне API (Redis)
  - Использовать ISR/SSG для статических страниц
- [ ] **Ошибка `returnNaN is not defined`** в логах — баг в зависимости, нужно расследовать
- [ ] **Проверить каталог на продакшене** — API требует авторизации, проверить через браузер
- [ ] **Установить fail2ban** для защиты от brute-force
- [ ] **Удалить пароль** из deploy.sh (строка 38)
- [ ] **Создать non-root пользователя** для запуска приложения
