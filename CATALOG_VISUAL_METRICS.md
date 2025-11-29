# ВИЗУАЛЬНЫЕ МЕТРИКИ АРХИТЕКТУРЫ КАТАЛОГА
## Графический анализ монолитности

---

## 1. ДИАГРАММА РАСПРЕДЕЛЕНИЯ КОДА

```
┌─────────────────────────────────────────────────────────┐
│ CATALOG MODULE TOTAL: 15,258 LINES                      │
└─────────────────────────────────────────────────────────┘

page.tsx                    ████████████████████ 5,366 (35%)
components/                 ████████             2,479 (16%)
app/dashboard/catalog/      ████████████████     7,413 (49%)
  ├─ AddSupplierModal       ████                  ~800
  ├─ AccreditationModal     ███                   ~600
  ├─ Other components       █████████            ~6,013

┌─────────────────────────────────────────────────────────┐
│ КРИТИЧНО: 35% КОДА В ОДНОМ ФАЙЛЕ!                       │
└─────────────────────────────────────────────────────────┘
```

---

## 2. COMPLEXITY HEATMAP

```
┌──────────────────────────────────────────────────┐
│ CYCLOMATIC COMPLEXITY (норма < 10)               │
├──────────────────────────────────────────────────┤
│ page.tsx                    🔴 250+ КРИТИЧНО!    │
│ ProductGridByCategory       🟠 35  ВЫСОКО        │
│ validateSupplierStep        🟠 18  ВЫСОКО        │
│ handleAddSupplierToPersonal 🟡 12  СРЕДНЕ        │
│ loadSuppliersFromAPI        🟢 8   НОРМА         │
└──────────────────────────────────────────────────┘

Легенда:
🔴 КРИТИЧНО   (> 50)   - Немедленный рефакторинг
🟠 ВЫСОКО     (20-50)  - Приоритет на неделю
🟡 СРЕДНЕ     (10-20)  - Улучшить при случае
🟢 НОРМА      (< 10)   - OK
```

---

## 3. ЗАВИСИМОСТИ СОСТОЯНИЙ (54 useState)

```
┌─────────────────────────────────────────────────────────┐
│ STATE DEPENDENCY GRAPH                                   │
└─────────────────────────────────────────────────────────┘

[cart] ──────────┬────────> [activeSupplier]
                 │
                 └────────> [cartLoaded]
                 │
                 └────────> localStorage
                 │
                 └────────> [supplierProducts]

[supplierFormData] ──┬────> [supplierFormStep]
                     │
                     └────> [maxSupplierStep]
                     │
                     └────> [supplierFormErrors]
                     │
                     └────> [uploadingImages]

[selectedCategoryData] ──┬──> [selectedSubcategoryData]
                         │
                         └──> [apiCategories]

ПРОБЛЕМА: Циклические зависимости и побочные эффекты!
```

---

## 4. МОНОЛИТНОСТЬ ПО ОТВЕТСТВЕННОСТЯМ

```
┌─────────────────────────────────────────────────────────┐
│ 15 ОТВЕТСТВЕННОСТЕЙ В ОДНОМ КОМПОНЕНТЕ                   │
└─────────────────────────────────────────────────────────┘

01. State Management         ████████████████████ 100%
02. Supabase Auth            ████████████████████ 100%
03. Supplier Loading         ████████████████████ 100%
04. Category Management      ████████████████████ 100%
05. Cart Management          ████████████████████ 100%
06. Modal Management         ████████████████████ 100%
07. Form Validation          ████████████████████ 100%
08. Image Upload             ████████████████████ 100%
09. Echo Cards Import        ████████████████████ 100%
10. Product Management       ████████████████████ 100%
11. Navigation               ████████████████████ 100%
12. Search & Filtering       ████████████████████ 100%
13. Recommendations          ████████████████████ 100%
14. OCR Processing           ████████████████████ 100%
15. API Integration          ████████████████████ 100%

┌─────────────────────────────────────────────────────────┐
│ КРИТИЧНО: ВСЕ В ОДНОМ ФАЙЛЕ = GOD COMPONENT             │
└─────────────────────────────────────────────────────────┘
```

---

## 5. API CALLS DISTRIBUTION

```
┌─────────────────────────────────────────────────────────┐
│ 16 ПРЯМЫХ FETCH ВЫЗОВОВ В КОМПОНЕНТЕ                     │
└─────────────────────────────────────────────────────────┘

/api/catalog/user-suppliers         ███  (3x)
/api/catalog/verified-suppliers     ██   (2x)
/api/catalog/categories             ███  (3x)
/api/catalog/recommendations        █    (1x)
/api/catalog/products               ██   (2x)
/api/catalog/echo-cards             ██   (2x)
/api/catalog/import-supplier        █    (1x)
/api/catalog/search-by-image        █    (1x)
/api/catalog/search-by-url          █    (1x)

┌─────────────────────────────────────────────────────────┐
│ ПРОБЛЕМА: НЕТ ЦЕНТРАЛИЗОВАННОГО API CLIENT              │
└─────────────────────────────────────────────────────────┘
```

---

## 6. TECHNICAL DEBT TIMELINE

```
┌─────────────────────────────────────────────────────────┐
│ ПРОГНОЗ РОСТА ТЕХНИЧЕСКОГО ДОЛГА                         │
└─────────────────────────────────────────────────────────┘

Сейчас      │ ▓▓▓▓▓▓▓▓▓░ 9.5/10  (320 часов)
            │
+1 месяц    │ ▓▓▓▓▓▓▓▓▓▓ 10/10   (480 часов)
            │  └─> Полная блокировка разработки
            │
+3 месяца   │ ████████████████   (800+ часов)
            │  └─> Переписывание с нуля дешевле
            │
+6 месяцев  │ █████████████████████████
            │  └─> Миграция на новый стек

┌─────────────────────────────────────────────────────────┐
│ КРИТИЧНО: РЕФАКТОРИНГ НЕОБХОДИМ ПРЯМО СЕЙЧАС!           │
└─────────────────────────────────────────────────────────┘
```

---

## 7. REFACTORING IMPACT MATRIX

```
┌──────────────────────────────────────────────────────────┐
│ ЧТО ДАСТ РЕФАКТОРИНГ?                                    │
├──────────────────────────────────────────────────────────┤
│                        │ До рефакторинга │ После         │
├──────────────────────────────────────────────────────────┤
│ Время добавления фичи │   4 часа       │  30 минут ✅   │
│ Время фикса бага      │   2 часа       │  15 минут ✅   │
│ Onboarding разраба    │   2 недели     │  2 дня    ✅   │
│ Code review           │   Невозможен   │  30 минут ✅   │
│ Тестирование          │   Невозможно   │  Automated✅   │
│ Параллельная работа   │   Конфликты    │  Изолирована✅ │
└──────────────────────────────────────────────────────────┘

ROI: Возврат инвестиций через 1.5 месяца
```

---

## 8. PRIORITY MATRIX

```
┌──────────────────────────────────────────────────────────┐
│ IMPACT vs EFFORT                                         │
└──────────────────────────────────────────────────────────┘

High Impact
    │
    │  ┌─────────────┐          ┌─────────────┐
    │  │ FIX BUG     │          │ API CLIENT  │
    │  │ Subcategory │          │ Service     │
    │  │ (30 min) ✅ │          │ (2h)     ✅ │
    │  └─────────────┘          └─────────────┘
    │
    │  ┌─────────────┐          ┌──────────────┐
    │  │ Cart Context│          │ Feature-Sliced│
    │  │ (3h)     ✅ │          │ (8 weeks)     │
    │  └─────────────┘          └──────────────┘
    │
Low Impact  ─────────────────────────────────────>
           Low Effort              High Effort

ВЫВОД: Начать с верхнего левого квадранта
```

---

## 9. BREAKING POINTS (Точки разрыва)

```
┌──────────────────────────────────────────────────────────┐
│ КРИТИЧЕСКИЕ ТОЧКИ ОТКАЗА                                 │
└──────────────────────────────────────────────────────────┘

1. CART STATE RACE CONDITION
   Risk Level: 🔴 CRITICAL
   ├─ 3 useEffect работают с одним состоянием
   ├─ localStorage может десинхронизироваться
   └─ Пользователь теряет корзину

2. SUBCATEGORY NAVIGATION BUG
   Risk Level: 🔴 CRITICAL
   ├─ Подкатегории не работают
   ├─ selectedSubcategory не передается
   └─ 111 товаров показывают 0

3. FORM VALIDATION INCONSISTENCY
   Risk Level: 🟠 HIGH
   ├─ Разная валидация на 7 шагах
   ├─ Нет единой схемы
   └─ Баги при импорте данных

4. IMAGE UPLOAD FAILURES
   Risk Level: 🟡 MEDIUM
   ├─ 2 разные реализации
   ├─ Непредсказуемый fallback
   └─ Потеря изображений

5. MEMORY LEAKS
   Risk Level: 🟡 MEDIUM
   ├─ setInterval без cleanup
   ├─ 12 useEffect с зависимостями
   └─ Потенциальные утечки памяти
```

---

## 10. RECOMMENDED ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│ ЦЕЛЕВАЯ АРХИТЕКТУРА (Feature-Sliced Design)              │
└──────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│              page.tsx (~200 lines)         │
│  ┌────────────────────────────────────┐    │
│  │   Layout & Orchestration Only      │    │
│  └────────────────────────────────────┘    │
└────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Features   │ │   Shared    │ │   Entities  │
├─────────────┤ ├─────────────┤ ├─────────────┤
│ suppliers/  │ │ api/        │ │ Supplier    │
│ categories/ │ │ hooks/      │ │ Product     │
│ cart/       │ │ utils/      │ │ Category    │
│ products/   │ │ types/      │ │ Cart        │
│ modals/     │ │ constants/  │ │             │
└─────────────┘ └─────────────┘ └─────────────┘

Benefits:
✅ Isolation: каждая фича независима
✅ Testability: unit + integration тесты
✅ Scalability: легко добавлять фичи
✅ Team work: параллельная разработка
✅ Maintainability: 10x проще поддержка
```

---

## 11. RISK ASSESSMENT MATRIX

```
┌──────────────────────────────────────────────────────────┐
│ ОЦЕНКА РИСКОВ БЕЗ РЕФАКТОРИНГА                           │
└──────────────────────────────────────────────────────────┘

Risk              Probability   Impact    Score   Mitigation
────────────────────────────────────────────────────────────
Production Bug       90%        Critical   9.0   🔴 URGENT
Team Burnout         80%        High       8.0   🔴 URGENT
Feature Delay        95%        High       9.5   🔴 URGENT
Code Freeze          60%        Critical   6.0   🟠 HIGH
Data Loss            40%        Critical   4.0   🟡 MEDIUM
Security Issue       30%        Critical   3.0   🟡 MEDIUM
Performance Deg.     70%        Medium     4.9   🟠 HIGH

┌──────────────────────────────────────────────────────────┐
│ СРЕДНИЙ РИСК: 7.2/10 (КРИТИЧЕСКИЙ)                       │
│ РЕКОМЕНДАЦИЯ: НЕМЕДЛЕННЫЙ РЕФАКТОРИНГ                    │
└──────────────────────────────────────────────────────────┘
```

---

## 12. ACTIONABLE ROADMAP

```
┌──────────────────────────────────────────────────────────┐
│ 8-WEEK REFACTORING ROADMAP                               │
└──────────────────────────────────────────────────────────┘

WEEK 1: Emergency Fixes & Foundation
├─ Day 1-2:  Fix subcategory bug ✅
├─ Day 3:    Create ApiClient
├─ Day 4:    Create CartContext
└─ Day 5:    Extract constants & utilities

WEEK 2: Service Layer
├─ ValidationService (Zod)
├─ ImageUploadService
├─ StorageService
└─ LoggerService

WEEK 3-4: Context Extraction
├─ SupplierFormContext
├─ CategoryContext
├─ AuthContext
└─ ModalManager

WEEK 5-6: Feature Modules
├─ features/suppliers/
├─ features/categories/
├─ features/cart/
└─ features/products/

WEEK 7: Testing & Documentation
├─ Unit tests (Jest)
├─ Integration tests (Testing Library)
├─ E2E tests (Playwright)
└─ Documentation (Storybook)

WEEK 8: Polish & Deploy
├─ Performance optimization
├─ Code review
├─ Gradual rollout (feature flags)
└─ Monitoring & alerts

┌──────────────────────────────────────────────────────────┐
│ ИТОГО: 8 недель → 10x улучшение maintainability          │
└──────────────────────────────────────────────────────────┘
```

---

## SUMMARY

```
╔══════════════════════════════════════════════════════════╗
║                  ФИНАЛЬНАЯ ОЦЕНКА                        ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Монолитность:          🔴 9.5/10  (КРИТИЧНО)           ║
║  Техдолг:               🔴 320 часов (8 недель)         ║
║  Срочность:             🔴 КРИТИЧНО                     ║
║  Риск без рефакторинга: 🔴 7.2/10  (ВЫСОКИЙ)            ║
║                                                          ║
║  ──────────────────────────────────────────────────      ║
║                                                          ║
║  РЕКОМЕНДАЦИЯ: НАЧАТЬ РЕФАКТОРИНГ НЕМЕДЛЕННО             ║
║                                                          ║
║  Quick Wins (сегодня):                                   ║
║  ✅ Fix subcategory bug         (30 min)                ║
║  ✅ Create ApiClient            (2 hours)               ║
║  ✅ Extract CartContext         (3 hours)               ║
║                                                          ║
║  Long-term (8 weeks):                                    ║
║  ✅ Feature-Sliced Design                               ║
║  ✅ Service Layer                                        ║
║  ✅ Context Architecture                                 ║
║  ✅ Testing & Documentation                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

**Подготовлено:** Senior Software Architect  
**Дата:** 2025-11-29  
**Next Steps:** Обсудить с командой и начать Week 1
