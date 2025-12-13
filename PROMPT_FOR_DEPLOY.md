# ЗАДАЧА: СРОЧНЫЙ ДЕПЛОЙ НА ПРОДАКШЕН

## КОНТЕКСТ
У нас есть готовый код в GitHub репозитории который нужно задеплоить на продакшен сервер.

## ДАННЫЕ ДЛЯ ПОДКЛЮЧЕНИЯ
```
IP: 45.150.8.168
Login: root
Password: Pizda333
```

## ЧТО НУЖНО СДЕЛАТЬ
Выполни SSH подключение и обнови код на сервере:

```bash
sshpass -p 'Pizda333' ssh -o StrictHostKeyChecking=no root@45.150.8.168 '
cd /var/www/godplisgomvp-forvercel &&
git fetch origin &&
git checkout fsd-refactoring-step-by-step &&
git pull origin fsd-refactoring-step-by-step &&
npm install &&
npm run build &&
pm2 restart all
'
```

## РЕПОЗИТОРИЙ
https://github.com/Stasnakamodov/get2b-mvp-v2.7.0-production.git
Ветка: fsd-refactoring-step-by-step

## ЧТО БЫЛО ОБНОВЛЕНО
- Система импорта товаров через OTAPI с умной дедупликацией
- Исправлены все дубликаты в базе данных (1064 уникальных товара)
- Добавлены категории Строительство и Промышленность с подкатегориями
- Оптимизирован импорт с реальными изображениями товаров
- Улучшены UI компоненты каталога

## ВАЖНО
1. Если первый пароль не работает, попробуй: BelayVorona1
2. Проект находится в /var/www/godplisgomvp-forvercel
3. Используется PM2 для управления процессами
4. База данных Supabase уже обновлена

## АЛЬТЕРНАТИВНЫЕ КОМАНДЫ ЕСЛИ ОСНОВНАЯ НЕ РАБОТАЕТ

### Вариант 1 - Прямой деплой:
```bash
ssh root@45.150.8.168
# введи пароль: Pizda333
cd /var/www/godplisgomvp-forvercel
git fetch origin
git checkout fsd-refactoring-step-by-step
git pull origin fsd-refactoring-step-by-step
npm install
npm run build
pm2 restart all
```

### Вариант 2 - Если папки нет:
```bash
ssh root@45.150.8.168
cd /var/www
git clone https://github.com/Stasnakamodov/get2b-mvp-v2.7.0-production.git godplisgomvp-forvercel
cd godplisgomvp-forvercel
git checkout fsd-refactoring-step-by-step
npm install
npm run build
pm2 start npm --name "get2b" -- start
```

### Вариант 3 - Поиск проекта:
```bash
ssh root@45.150.8.168
find /var/www -name "package.json" -type f 2>/dev/null | grep -E "(get2b|godplis|mvp)"
# найди папку с проектом
cd [путь_к_проекту]
git pull origin fsd-refactoring-step-by-step
npm install && npm run build
pm2 restart all
```

## ПРОВЕРКА ПОСЛЕ ДЕПЛОЯ
```bash
pm2 status
curl http://45.150.8.168:3000
```

ПРОСТО СДЕЛАЙ БАШ И ЗАДЕПЛОЙ ЭТО НА СЕРВЕР!