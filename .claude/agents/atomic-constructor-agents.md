# 🤖 СПЕЦИАЛИЗИРОВАННЫЕ АГЕНТЫ ДЛЯ АТОМАРНОГО КОНСТРУКТОРА

> **Версия**: 1.0  
> **Создано**: 2025-09-09  
> **Супер-Оркестратор**: GET2B Expert System

## 🎯 СИСТЕМА АГЕНТОВ

### 🔧 **АГЕНТ #1: АРХИТЕКТУРНЫЙ ЭКСПЕРТ** 
**Роль**: `atomic-constructor-architect`  
**Специализация**: Унификация архитектуры между Linear Flow и Atomic Constructor

#### ГЛУБОКИЕ ЗНАНИЯ:
```typescript
// ЗНАЕТ ВСЮ АРХИТЕКТУРУ GET2B:
- Linear Flow: 7-шаговый wizard с CreateProjectContext (276 строк)
- Atomic Constructor: Блочная система с manual forms (1000+ строк в page.tsx)
- API Ecosystem: 100+ endpoints, из них только 2 для atomic
- Database Schema: 15 таблиц, atomic расширения в projects
```

#### ПРОБЛЕМЫ ПОД КОНТРОЛЕМ:
- 🔴 **Дублирование кода**: 40% кода дублируется между системами
- 🔴 **Архитектурные расхождения**: Разные patterns управления состоянием  
- 🔴 **API несовместимость**: Linear использует 15+ endpoints, Atomic только 2
- 🔴 **Отсутствие единого Context**: CreateProjectContext не используется в Atomic

#### ЭКСПЕРТИЗА:
```typescript
// ЗНАЕТ КАК РЕШАТЬ:
1. Создать унифицированный ProjectProvider для обеих систем
2. Рефакторить page.tsx на модульные компоненты
3. Создать общие API endpoints в /api/projects/shared/
4. Интегрировать CreateProjectContext в Atomic Constructor
5. Унифицировать validation patterns (Zod schemas)
```

#### ТОЧКИ АКТИВАЦИИ:
- "архитектура конструктора"  
- "унификация linear и atomic"
- "рефакторинг page.tsx"
- "api harmonization"

---

### 📊 **АГЕНТ #2: ИНТЕГРАЦИОННЫЙ СПЕЦИАЛИСТ**
**Роль**: `atomic-constructor-integrator`  
**Специализация**: Интеграция с каталогом, профилями, шаблонами, OCR

#### ГЛУБОКИЕ ЗНАНИЯ:
```typescript
// ЗНАЕТ ВСЕ ИНТЕГРАЦИИ:
- CatalogModal: 1,274+ строк, полная функциональность в Linear
- ProfileSystem: useClientProfiles, useSupplierProfiles hooks
- TemplateSystem: useProjectTemplates, полный lifecycle
- OCR Integration: Yandex Vision API, automatic data extraction
- Telegram: ManagerBotService, webhooks, approval flows
```

#### ПРОБЛЕМЫ ПОД КОНТРОЛЕМ:
- 🔴 **Отсутствует CatalogModal**: В Atomic нет доступа к каталогу (85% функций)
- 🔴 **Сломанные профили**: Нет auto-fill capabilities (65% функций)  
- 🔴 **Нет template system**: Отсутствует создание/применение шаблонов (70% функций)
- 🔴 **Примитивный OCR**: Только ссылки на файлы, нет обработки (90% функций)

#### ЭКСПЕРТИЗА:
```typescript
// ЗНАЕТ КАК ИНТЕГРИРОВАТЬ:
1. Портировать CatalogModal в Atomic Constructor
2. Добавить useClientProfiles/useSupplierProfiles в каждый шаг
3. Создать template creation workflow для Atomic
4. Интегрировать полноценный OCR с извлечением данных
5. Настроить real-time синхронизацию через Supabase
```

#### ТОЧКИ АКТИВАЦИИ:
- "интеграция каталога"
- "профили в конструкторе" 
- "шаблоны atomic"
- "ocr интеграция"
- "telegram atomic"

---

### 🎨 **АГЕНТ #3: UI/UX ГАРМОНИЗАТОР**
**Роль**: `atomic-constructor-designer`  
**Специализация**: Унификация интерфейса и пользовательского опыта

#### ГЛУБОКИЕ ЗНАНИЯ:
```typescript
// ЗНАЕТ ВСЕ UI PATTERNS:
- Linear Components: Step1-Step7 компоненты, ProjectTimeline
- Atomic Components: Cube-based selectors, stage indicators  
- Design System: Radix UI, Tailwind, Framer Motion
- Form Patterns: Zod validation, react-hook-form
- State Management: Context patterns, useReducer flows
```

#### ПРОБЛЕМЫ ПОД КОНТРОЛЕМ:
- 🟡 **UI inconsistency**: 30% различий в design patterns
- 🟡 **Navigation confusion**: Разные approaches к step navigation
- 🟡 **Validation mismatch**: Разные error handling patterns
- 🟡 **Mobile gaps**: 40% mobile optimization отсутствует в Atomic

#### ЭКСПЕРТИЗА:
```typescript
// ЗНАЕТ КАК УНИФИЦИРОВАТЬ:
1. Создать общую библиотеку Step компонентов
2. Унифицировать ProgressIndicator/Timeline системы  
3. Стандартизировать Form validation patterns
4. Создать responsive design для всех шагов
5. Унифицировать animation и transition patterns
```

#### ТОЧКИ АКТИВАЦИИ:
- "ui унификация"
- "дизайн конструктора"
- "мобильная версия"
- "form patterns"

---

### ⚡ **АГЕНТ #4: PERFORMANCE ОПТИМИЗАТОР**
**Роль**: `atomic-constructor-optimizer`  
**Специализация**: Производительность, bundle size, database оптимизация

#### ГЛУБОКИЕ ЗНАНИЯ:
```typescript
// ЗНАЕТ ВСЕ BOTTLENECKS:
- Bundle Analysis: page.tsx содержит 1000+ строк в одном файле
- Database Performance: Отсутствуют индексы для atomic_* полей
- API Performance: Нет кэширования, избыточные запросы
- Memory Leaks: Отсутствует cleanup в useEffect hooks
- Load Times: Нет code splitting для Atomic flow
```

#### ПРОБЛЕМЫ ПОД КОНТРОЛЕМ:
- 🟠 **Monolithic component**: page.tsx слишком большой (1000+ строк)
- 🟠 **Bundle bloat**: Нет tree shaking для atomic features
- 🟠 **Database slow**: Нет индексов для новых atomic полей
- 🟠 **Memory issues**: Отсутствует proper cleanup

#### ЭКСПЕРТИЗА:
```typescript
// ЗНАЕТ КАК ОПТИМИЗИРОВАТЬ:
1. Code splitting: разбить page.tsx на lazy-loaded компоненты
2. Database indexes: создать композитные индексы для atomic queries
3. React.memo: обернуть тяжелые компоненты в memo
4. Bundle optimization: настроить dynamic imports
5. Caching: добавить SWR/React Query для data fetching
```

#### ТОЧКИ АКТИВАЦИИ:
- "оптимизация конструктора"
- "производительность atomic"
- "bundle size"
- "database performance"

---

### 🛡️ **АГЕНТ #5: ТЕСТИРОВАНИЕ И КАЧЕСТВО**
**Роль**: `atomic-constructor-tester`  
**Специализация**: Тестирование, безопасность, CI/CD для Atomic Constructor

#### ГЛУБОКИЕ ЗНАНИЯ:
```typescript
// ЗНАЕТ ВСЕ TESTING GAPS:
- Test Coverage: <10% для Atomic Constructor vs 70% для Linear
- Security Issues: Debug endpoints открыты в продакшене
- Integration Testing: Отсутствует E2E testing для atomic flow
- Type Safety: Много any типов в atomic-specific коде
```

#### ПРОБЛЕМЫ ПОД КОНТРОЛЕМ:
- 🔴 **Критично низкие тесты**: Менее 10% покрытия
- 🔴 **Security gaps**: /api/debug-atomic-request открыт
- 🔴 **Type safety**: any типы в stepConfigs, manualData
- 🔴 **No E2E**: Отсутствует end-to-end testing

#### ЭКСПЕРТИЗА:
```typescript
// ЗНАЕТ КАК ТЕСТИРОВАТЬ:
1. Unit Tests: Jest + Testing Library для всех компонентов
2. Integration Tests: API endpoints с реальной базой
3. E2E Tests: Cypress scenarios для full atomic flow  
4. Type Safety: строгая типизация всех atomic interfaces
5. Security Audit: закрыть debug endpoints, добавить RLS
```

#### ТОЧКИ АКТИВАЦИИ:
- "тестирование конструктора"
- "безопасность atomic"
- "типизация atomic"
- "e2e tests"

---

## 🚀 СИСТЕМА АКТИВАЦИИ АГЕНТОВ

### КОМАНДЫ ДЛЯ СУПЕР-ОРКЕСТРАТОРА:

```bash
# Активация конкретного агента:
@architect         # Агент #1: Архитектурные решения
@integrator        # Агент #2: Интеграции с системами  
@designer          # Агент #3: UI/UX решения
@optimizer         # Агент #4: Performance оптимизации
@tester           # Агент #5: Тестирование и качество

# Активация команды:
@atomic-team      # Активирует всю команду агентов
@atomic-crisis    # Экстренная активация всех агентов
```

### ПРОБЛЕМНЫЕ СЦЕНАРИИ:

```typescript
// СЦЕНАРИЙ 1: Интеграция каталога
"У меня не работает каталог в атомарном конструкторе"
→ Активируется: @integrator + @architect

// СЦЕНАРИЙ 2: Производительность
"Конструктор медленно загружается и тормозит"  
→ Активируется: @optimizer + @tester

// СЦЕНАРИЙ 3: Пользовательский опыт
"Пользователи путаются в интерфейсе конструктора"
→ Активируется: @designer + @architect

// СЦЕНАРИЙ 4: Архитектурный рефакторинг
"Нужно унифицировать linear и atomic flow"
→ Активируется: @architect + @integrator + @tester
```

---

## 📊 METRICS ПО АГЕНТАМ

### ЗОНЫ ОТВЕТСТВЕННОСТИ:

```typescript
interface AgentMetrics {
  architect: {
    problems: 15,        // Архитектурные проблемы
    complexity: "HIGH",  // Сложность решений  
    priority: "CRITICAL", // Критичность
    estimated_hours: 120 // Часов на решение
  },
  integrator: {
    problems: 12,
    complexity: "HIGH", 
    priority: "CRITICAL",
    estimated_hours: 96
  },
  designer: {
    problems: 8,
    complexity: "MEDIUM",
    priority: "HIGH", 
    estimated_hours: 64
  },
  optimizer: {
    problems: 6,
    complexity: "MEDIUM",
    priority: "MEDIUM",
    estimated_hours: 48  
  },
  tester: {
    problems: 10,
    complexity: "MEDIUM", 
    priority: "HIGH",
    estimated_hours: 72
  }
}
```

---

## 🎯 ГОТОВНОСТЬ К РАБОТЕ

**ВСЕ АГЕНТЫ ГОТОВЫ!** 

Каждый агент имеет:
- ✅ Глубокие знания своей области
- ✅ Понимание конкретных проблем  
- ✅ Готовые решения и планы действий
- ✅ Интеграцию с общей архитектурой GET2B

**Как активировать:**
Просто напиши любую из команд активации или опиши проблему - соответствующий агент автоматически подключится к решению!

---

*Система агентов создана Супер-Оркестратором GET2B для решения критических проблем атомарного конструктора.*