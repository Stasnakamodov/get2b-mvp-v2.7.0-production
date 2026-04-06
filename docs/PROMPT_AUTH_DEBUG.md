# ПРОМПТ: Диагностика и починка авторизации GET2B

## Контекст проекта

GET2B — Next.js приложение с **кастомным auth модулем** (не Supabase Auth, не NextAuth).  
Архитектура: JWT (jose, HS256) + bcryptjs + PostgreSQL (pg.Pool напрямую).  
Деплой: Docker на VPS 83.220.172.8, домен get2b.pro.

## Текущая проблема

**Не пускает в приложение.** Продакшен БД чистая (переустановка сервера 2026-04-05), таблица `users` — 0 записей. Нужно:

1. Разобраться почему не работает регистрация/логин
2. Убедиться что auth flow полностью рабочий
3. Создать admin-пользователя

## Архитектура Auth (что уже есть)

### Серверная часть
- `lib/auth/index.ts` (176 строк) — ядро: `signUp()`, `signIn()`, `verifyToken()`, `hashPassword()`, `getUserFromRequest()`
- `lib/auth/checkRole.ts` — ролевая система: admin/manager/user/guest
- API routes:
  - `POST /api/auth/register` → `signUp()` → INSERT в users → JWT
  - `POST /api/auth/login` → `signIn()` → SELECT + bcrypt.compare → JWT  
  - `GET /api/auth/me` → `verifyToken()` → возвращает user из JWT payload
  - `POST /api/auth/logout` → очищает cookie

### Клиентская часть
- `lib/auth/client.ts` — authClient (замена supabase.auth): signInWithPassword, signUp, getUser, getSession, signOut
- `hooks/useAuth.ts` — React hook: {user, loading, signIn, signUp, signOut, isAdmin}
- `components/login-form-simple.tsx` — форма логина (используется на /login)
- `components/login-form.tsx` — форма логина + регистрации (с анимациями)
- Токен хранится в httpOnly cookie `auth-token` + localStorage `auth-token`

### DB слой
- `lib/db/pool.ts` — pg.Pool подключение к PostgreSQL
- Auth работает напрямую с pool (не через QueryBuilder): `pool.query('SELECT ... FROM users WHERE email = $1')`
- `db.auth.getUser(token)` — обёртка над verifyToken(), данные из JWT payload
- `db.auth.getSession()` — ЗАГЛУШКА, всегда возвращает `{ session: null }`

### Таблица users (sql/init.sql)
```sql
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text,
  role text DEFAULT 'user',
  email_confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```
**Seed пользователей НЕТ.** Таблица создаётся пустой.

## Задачи

### 1. Проверь что auth flow работает end-to-end

- Открой https://get2b.pro/login — рендерится ли форма?
- Попробуй зарегистрироваться через UI или curl:
```bash
curl -X POST https://get2b.pro/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@get2b.pro","password":"Admin123!","name":"Admin"}'
```
- Если регистрация работает — попробуй залогиниться
- Проверь что `/api/auth/me` с полученным токеном возвращает user

### 2. Создай admin-пользователя

Если регистрация работает — зарегистрируй admin@get2b.pro, затем повысь роль:
```bash
ssh root@83.220.172.8
docker exec -i get2b-postgres psql -U get2b -d get2b -c "UPDATE users SET role = 'admin' WHERE email = 'admin@get2b.pro';"
```

Если регистрация НЕ работает — создай через SQL напрямую (нужен bcrypt hash пароля).

### 3. Известные проблемы (проверь и почини если мешают)

- **`db.auth.getSession()` — заглушка** (`lib/db/index.ts`, строка 83): всегда возвращает `{ session: null }`. Если клиентский код проверяет session для доступа — это может быть причиной "не пускает".
- **Middleware НЕ проверяет auth** — защита только на уровне отдельных API routes через `getUserFromRequest()`. Если какой-то route забыл добавить проверку — он открыт.
- **"Забыли пароль?"** — заглушка (`href="#"`), не работает.
- **ProfileGuard** (`components/profile-guard.tsx`) — проверяет наличие профиля после логина. Если `user_profiles` пустая — может не пускать дальше. Проверь есть ли таблица `user_profiles` и что guard делает при пустом профиле.

### 4. Проверь клиентский auth flow

- `components/login-form-simple.tsx` — после успешного логина вызывает `db.from('user_profiles').select('*').eq('user_id', userId)`. Если таблица user_profiles пустая или запрос падает — UI может зависать.
- `hooks/useAuth.ts` — при маунте вызывает `/api/auth/me`. Если токена нет → user = null → редирект на /login.
- Проверь куда идёт редирект после логина (router.push куда?).

## Подключение к серверу

```bash
ssh root@83.220.172.8
```
Работает только по SSH-ключу (парольная аутентификация отключена).

## Полезные команды

```bash
# Логи приложения
docker logs get2b-app --tail=50

# Проверка таблиц
docker exec get2b-postgres psql -U get2b -d get2b -c "\dt"

# Проверка users
docker exec get2b-postgres psql -U get2b -d get2b -c "SELECT * FROM users;"

# Проверка user_profiles
docker exec get2b-postgres psql -U get2b -d get2b -c "SELECT * FROM user_profiles;"

# Health check
curl -s https://get2b.pro/api/health | jq .
```

## .env переменные (уже на сервере)

Ключевые для auth:
- `JWT_SECRET` — задан (64 символа)
- `DATABASE_URL` — postgresql://get2b:***@postgres:5432/get2b
- `NODE_ENV` — production

## Ожидаемый результат

1. Регистрация и логин работают через UI
2. Есть admin-пользователь (admin@get2b.pro)
3. После логина — переход в /dashboard без зависаний
4. `/api/auth/me` возвращает user при валидном токене
5. Все заглушки в auth flow либо починены, либо задокументированы
