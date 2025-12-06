# OTAPI Integration - Интеграция с китайскими маркетплейсами

## Что такое OTAPI?

OTAPI (OpenTrade Commerce API) - это платформа для работы с товарами из китайских маркетплейсов:
- **Taobao** - крупнейший маркетплейс Китая
- **1688** - оптовая торговля B2B
- **AliExpress** - международная розница
- **Alibaba** - международный B2B

## Преимущества OTAPI

✅ **Готовые структурированные данные** - не нужен парсинг HTML
✅ **Автоматический перевод** - товары на русском языке
✅ **Конвертация валют** - цены в рублях
✅ **Легальный доступ** - официальное API без нарушений
✅ **Высокая скорость** - 1-4 секунды на запрос

## Установка и настройка

### 1. Получение ключа OTAPI

1. Зарегистрируйтесь на https://otcommerce.com/
2. Получите тестовый ключ (5 дней бесплатно)
3. Добавьте ключ в `.env.local`:

```env
OTAPI_INSTANCE_KEY=ваш_ключ_здесь
```

### 2. Проверка подключения

Запустите тестовый скрипт:

```bash
node scripts/test-otapi.js
```

Скрипт проверит:
- Подключение к OTAPI
- Поиск товаров на разных маркетплейсах
- Получение категорий

### 3. Импорт товаров

#### Через командную строку:

```bash
# Базовый импорт
node scripts/import-from-otapi.js

# С параметрами
node scripts/import-from-otapi.js --query="iPhone" --provider=Taobao --limit=50

# Примеры для разных категорий
node scripts/import-from-otapi.js --query="одежда женская" --category="Текстиль и одежда"
node scripts/import-from-otapi.js --query="auto parts brake" --category="Автотовары"
node scripts/import-from-otapi.js --query="косметика" --category="Красота и здоровье"
```

#### Через API endpoint:

```javascript
// POST /api/catalog/import-from-otapi
fetch('/api/catalog/import-from-otapi', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'smartphone',      // поисковый запрос
    provider: 'Taobao',      // маркетплейс
    category: 'Электроника', // категория в вашей БД
    limit: 20                // количество товаров
  })
})
```

## Структура проекта

```
lib/services/
└── OtapiService.ts         # Основной сервис для работы с OTAPI

scripts/
├── test-otapi.js           # Тестирование подключения
└── import-from-otapi.js    # Скрипт импорта товаров

app/api/catalog/
└── import-from-otapi/
    └── route.ts            # API endpoint для импорта
```

## Методы OtapiService

```typescript
// Поиск товаров
const products = await otapi.searchProducts({
  query: 'laptop',
  provider: 'Taobao',
  category: 'electronics',
  minPrice: 1000,
  maxPrice: 50000,
  limit: 20
})

// Получение деталей товара
const product = await otapi.getProductDetails(
  'item123456',  // ID товара
  'Taobao'       // маркетплейс
)

// Получение категорий
const categories = await otapi.getCategories('Taobao')

// Проверка статуса
const status = await otapi.checkStatus()
```

## Формат данных товара

```typescript
interface OtapiProduct {
  // Идентификаторы
  id: string                  // ID в OTAPI
  vendorId: string           // ID на маркетплейсе
  vendorName: string         // Название маркетплейса

  // Основная информация
  name: string               // Название товара
  description: string        // Описание
  category: string          // Категория
  brand?: string            // Бренд

  // Цены
  price: number             // Цена в рублях
  originalPrice: number     // Оригинальная цена
  currency: string          // Валюта (RUB)
  minOrderQuantity: number  // Мин. заказ

  // Изображения
  mainImage: string         // Главное фото
  images: string[]          // Все фото

  // Характеристики
  specifications: {}        // Технические характеристики
  attributes: []           // Атрибуты товара

  // Статус
  inStock: boolean         // В наличии
  availableQuantity?: number // Доступное количество

  // Рейтинг
  rating?: number          // Рейтинг (0-5)
  reviewsCount?: number    // Количество отзывов
  soldCount?: number       // Продано штук

  // Поставщик
  seller: {
    id: string
    name: string
    rating?: number
    country: string
    city?: string
  }
}
```

## Тарифные планы OTAPI

| План | Стоимость | Включено | Подходит для |
|------|-----------|----------|--------------|
| **K0 BASIC** | $29/мес | 1000 вызовов | Тестирование |
| **K1 STANDARD** | $99/мес | 10000 вызовов | Небольшой магазин |
| **K2 LIGHT** | По запросам | $0.01/вызов | Переменная нагрузка |
| **K3 ENTERPRISE** | $499/мес | Безлимит | Большие объемы |

**Тестовый период:** 5 дней бесплатно

## Решение проблем

### Ошибка: OTAPI_INSTANCE_KEY не найден
```
Добавьте ключ в .env.local:
OTAPI_INSTANCE_KEY=ваш_ключ
```

### Ошибка: Instance key invalid
```
Проверьте правильность ключа
Убедитесь, что аккаунт активен
```

### Товары не найдены
```
Попробуйте другой поисковый запрос
Используйте английский язык для AliExpress
Используйте китайский для 1688
```

### Ошибка импорта в БД
```
Проверьте подключение к Supabase
Убедитесь, что таблицы созданы
Проверьте права доступа
```

## Автоматизация импорта

Для регулярного обновления каталога можно настроить:

1. **Cron задачи** - запуск скрипта по расписанию
2. **Webhook** - обновление при изменении цен
3. **Admin панель** - ручной запуск через интерфейс

## Полезные ссылки

- [Документация OTAPI](http://docs.otapi.net/ru)
- [Личный кабинет](https://otcommerce.com/dashboard)
- [Тарифы и цены](https://otcommerce.com/pricing)
- [Поддержка](mailto:support@otcommerce.com)

## Контакты поддержки OTAPI

- Email: support@otcommerce.com
- Telegram: @otcommerce_support
- Документация: http://docs.otapi.net/ru

---

*Создано для проекта godplisgomvp-forvercel*