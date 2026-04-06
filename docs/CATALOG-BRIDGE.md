# Catalog Bridge — синхронизация каталога GET2B <-> А-Спецторг

## Кто сделал и зачем

Этот код написал **Claude (AI-ассистент)** по запросу разработчика проекта GET2B (Стас).

**Проблема**: два B2B-проекта (GET2B и А-Спецторг) используют один и тот же товарный каталог, но хранят его по-разному:
- **GET2B** — PostgreSQL (таблицы `catalog_products`, `catalog_categories`, `catalog_suppliers`), 1485 товаров, UUID в качестве ID
- **А-Спецторг** — JSON-файл (`data/realistic-catalog-v2.json`), 604 товара, числовые ID

Ручная синхронизация невозможна — разные форматы, разные ID, разные структуры категорий.

**Решение**: скрипт `catalog-bridge` — движок двусторонней синхронизации. Живёт в обоих репозиториях, запускается из любого из них.

---

## Как запускать

Из корня **любого** из двух репозиториев:

```bash
# Посмотреть разницу (ничего не пишет, безопасно)
node scripts/catalog-bridge/index.mjs --diff

# Залить товары GET2B в Спецторг
node scripts/catalog-bridge/index.mjs --from get2b --to spectorg --dry-run

# Залить товары Спецторга в GET2B
node scripts/catalog-bridge/index.mjs --from spectorg --to get2b --dry-run

# Слить всё в обе стороны
node scripts/catalog-bridge/index.mjs --merge --dry-run

# Убрать --dry-run чтобы реально записать
```

### Флаги

| Флаг | Что делает |
|------|-----------|
| `--diff` | Показать разницу, ничего не писать |
| `--from X --to Y` | Однонаправленный синк (X → Y) |
| `--merge` | Двусторонний: оба получают все товары |
| `--dry-run` | Только показать что будет, без записи |
| `--target prod\|staging\|local` | Какой PostgreSQL (для записи в GET2B) |

---

## Структура

```
scripts/catalog-bridge/
  index.mjs              — точка входа CLI
  config.mjs             — пути, подключения к БД
  sync.mjs               — оркестратор
  readers/get2b.mjs      — catalog-seed.json → unified
  readers/spectorg.mjs   — realistic-catalog-v2.json → unified
  writers/get2b.mjs      — unified → seed.json + PG
  writers/spectorg.mjs   — unified → Spectorg JSON
  mapping/id-map.mjs     — маппинг ID между системами
  mapping/categories.mjs — сопоставление категорий
  mapping/suppliers.mjs  — сопоставление поставщиков
  mapping/products.mjs   — сопоставление товаров
data/
  category-mapping.json  — ручной маппинг категорий
  id-map.json            — авто-маппинг ID (создаётся при синке)
```

---

## Текущее состояние (5 апреля 2026)

```
GET2B:    1485 товаров, 41 категория, 14 поставщиков
Спецторг:  604 товара, 54 категории,  8 поставщиков
Совпадений: 0 (каталоги полностью разные)
После merge: 2089 товаров в обоих
```

---

## Для PG-записи нужен SSH-туннель

```bash
ssh -f -N -L 5433:127.0.0.1:5432 root@83.220.172.8
node scripts/catalog-bridge/index.mjs --from spectorg --to get2b --target prod
```

## Важно

- Код одинаковый в обоих репо, отличается только `config.mjs` (пути зеркальные)
- `--dry-run` безопасен, ничего не пишет
- Перед записью в Spectorg делается бэкап `.backup.json`
- PG-запись через транзакцию с ROLLBACK
- Оба репо должны быть на одной машине
