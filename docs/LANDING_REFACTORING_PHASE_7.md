# 🎯 ФАЗА 7: HERO СЕКЦИЯ И DASHBOARD PREVIEW

## КОНТЕКСТ

Файл `/Users/user/Desktop/godplisgomvp-forvercel/app/page.tsx` является монолитным компонентом на **1363 строки**.

**Выполнено:**
- ✅ Фаза 1: Структура папок + типы (530+ строк)
- ✅ Фаза 2: Данные (294 строки)
- ✅ Фаза 3: Утилиты (65 строк)
- ✅ Фаза 4: Хуки (120 строк)
- ✅ Фаза 5: Компоненты (299 строк)
- ✅ Фаза 6: Секции (321 строка)

**Всего извлечено**: ~1629 строк организованного кода

Это **ФАЗА 7: Hero секция + Dashboard Preview** - самая сложная часть декомпозиции.

---

## ЦЕЛЬ ФАЗЫ 7

Создать Hero секцию с интерактивным Dashboard Preview, который содержит:
- Поиск по каталогу с кнопками tutorial
- Карточки проектов (используя ProjectCard из Phase 5)
- Шаблоны проектов
- Статистику проектов
- Tutorial модальные окна

НЕ трогать исходный `app/page.tsx` - он должен продолжать работать.

---

## ЗАДАЧИ

### 1. СОЗДАТЬ HERO СЕКЦИЮ (30 минут)

**Файл**: `components/landing/sections/HeroSection.tsx`

Hero секция находится в `app/page.tsx` строки **471-916** и включает:

**Структура:**
```tsx
<section className="relative min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden z-10">
  {/* Grid pattern background */}
  {/* Gradient orbs */}

  <div className="relative max-w-[1400px] mx-auto px-8 md:px-16 pt-32 pb-24">
    {/* Hero Title + Description + CTA buttons */}
    <motion.div>
      <h1>Закупки из Китая под ключ</h1>
      <p>Каталог 10,000+ товаров · Легальные переводы · Документы для таможни · CRM система</p>
      <Button>Открыть каталог</Button>
      <Button>Создать закупку</Button>
    </motion.div>

    {/* Dashboard Preview - САМАЯ СЛОЖНАЯ ЧАСТЬ */}
    <DashboardPreview />
  </div>
</section>
```

**Важно:**
- Градиентный фон с orbs
- Grid pattern overlay
- Framer Motion анимации
- Компонент должен принимать `tutorialModal` state и функции

---

### 2. СОЗДАТЬ DASHBOARD PREVIEW КОМПОНЕНТ (90 минут)

**Файл**: `components/landing/preview/DashboardPreview.tsx`

Это самая сложная часть - интерактивный dashboard preview из строк **518-916** в `app/page.tsx`.

**Структура Dashboard Preview:**

```tsx
<motion.div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
  {/* Search Bar with Tutorial Buttons */}
  <CatalogSearchBar onTutorialOpen={openTutorial} />

  {/* Project Cards - показываем до 2 проектов */}
  <div className="space-y-3 mb-4">
    {displayProjects.slice(0, 2).map((proj) => (
      <ProjectCard key={proj.id} project={proj} />
    ))}
  </div>

  {/* Project Templates */}
  <ProjectTemplates />

  {/* Project Statistics */}
  <ProjectStatistics stats={projectStats} />
</motion.div>
```

**Подкомпоненты для создания:**

#### 2.1 CatalogSearchBar (строки 625-663)
**Файл**: `components/landing/preview/CatalogSearchBar.tsx`

```tsx
interface CatalogSearchBarProps {
  onTutorialOpen: (type: TutorialType) => void
}
```

Содержит:
- Input поле поиска
- Кнопка "Создать новый проект" (opens tutorial)
- Кнопка Globe (поиск по URL)
- Кнопка Camera (поиск по фото)
- Кнопка Cart с badge "3"

#### 2.2 ProjectTemplates (строки 738-774)
**Файл**: `components/landing/preview/ProjectTemplates.tsx`

Отображает 2 template карточки с кнопкой "Использовать".

#### 2.3 ProjectStatistics (строки 777-827)
**Файл**: `components/landing/preview/ProjectStatistics.tsx`

```tsx
interface ProjectStatisticsProps {
  stats: ProjectStats
}
```

4 статистики: Активные, Ожидают, Завершены, Отклонены.

---

### 3. СОЗДАТЬ TUTORIAL МОДАЛЬНЫЕ ОКНА (45 минут)

**Файл**: `components/landing/tutorial/TutorialModal.tsx`

Tutorial модалки находятся в строках **519-598** в `app/page.tsx`.

**Структура:**
```tsx
interface TutorialModalProps {
  isOpen: boolean
  type: TutorialType | null
  onClose: () => void
}
```

Модалка показывает контент из `data/landing/tutorial.ts` на основе `type`:
- cart: Корзина для закупок
- globe: Поиск по URL
- camera: Поиск по фото
- new-project: Создать проект
- catalog: Каталог

**Компоненты:**
- Overlay (затемнение фона)
- Modal с gradient border
- Close button
- Icon + Title + Description + Features list
- CTA button "Попробовать"

---

### 4. СОЗДАТЬ ДОПОЛНИТЕЛЬНЫЕ СЕКЦИИ (30 минут)

Есть еще несколько секций между Hero и Process:

#### 4.1 IntroSection (строки 868-916)
**Файл**: `components/landing/sections/IntroSection.tsx`

"Get2B — платёжный агент" с 3 карточками участников процесса.

#### 4.2 CatalogSection (строки 920-994)
**Файл**: `components/landing/sections/CatalogSection.tsx`

"10,000+ товаров от проверенных поставщиков" - темная секция с описанием каталога.

#### 4.3 CTASection (строки 1244-1296)
**Файл**: `components/landing/sections/CTASection.tsx`

Финальный CTA "Готовы начать закупки?" с темным градиентным фоном.

#### 4.4 CRMSection (строки 1096-1241)
**Файл**: `components/landing/sections/CRMSection.tsx`

"CRM система + поддержка 24/7" с preview CRM и Telegram поддержкой.

---

## СТРУКТУРА ФАЙЛОВ ДЛЯ СОЗДАНИЯ

```
components/
  landing/
    sections/
      HeroSection.tsx          # Hero с DashboardPreview
      IntroSection.tsx         # Intro с 3 карточками
      CatalogSection.tsx       # Темная секция каталога
      CRMSection.tsx           # CRM + support preview
      CTASection.tsx           # Финальный CTA
    preview/
      DashboardPreview.tsx     # Главный preview компонент
      CatalogSearchBar.tsx     # Поиск + tutorial кнопки
      ProjectTemplates.tsx     # Шаблоны проектов
      ProjectStatistics.tsx    # Статистика 4 блока
    tutorial/
      TutorialModal.tsx        # Modal для tutorials
```

---

## ВАЖНЫЕ ДЕТАЛИ

### Используемые хуки:
```tsx
import { useProjects } from '@/hooks/landing/useProjects'
import { useProjectStats } from '@/hooks/landing/useProjectStats'
import { useTutorial } from '@/hooks/landing/useTutorial'
```

### Используемые компоненты:
```tsx
import { ProjectCard } from '@/components/landing/cards/ProjectCard'
import { FadeInSection } from '@/components/landing/animations/FadeInSection'
```

### Используемые данные:
```tsx
import { mockProjects, mockTemplates } from '@/data/landing/mockData'
import { tutorialContent } from '@/data/landing/tutorial'
```

### projectSteps для timeline:
```tsx
const projectSteps = [
  { id: 1, title: "Данные компании" },
  { id: 2, title: "Спецификация" },
  { id: 3, title: "Оплата" },
  { id: 4, title: "Производство" },
  { id: 5, title: "Доставка" },
  { id: 6, title: "Таможня" },
  { id: 7, title: "Получение" },
]
```

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

### Шаг 1: Создать простые секции (20 мин)
1. IntroSection
2. CatalogSection
3. CTASection
4. CRMSection

### Шаг 2: Создать preview подкомпоненты (40 мин)
1. CatalogSearchBar
2. ProjectTemplates
3. ProjectStatistics

### Шаг 3: Создать DashboardPreview (30 мин)
Собрать все preview компоненты вместе

### Шаг 4: Создать TutorialModal (30 мин)
Modal с overlay и контентом

### Шаг 5: Создать HeroSection (20 мин)
Hero с фоном и DashboardPreview

### Шаг 6: Тестирование (10 мин)
Создать `test-phase-7.tsx` и проверить все компоненты

---

## ПРОВЕРКА

После завершения фазы:

1. ✅ Создано 5 секций (Hero, Intro, Catalog, CRM, CTA)
2. ✅ Создано 4 preview компонента
3. ✅ Создан TutorialModal
4. ✅ Все компоненты используют хуки из Phase 4
5. ✅ Все компоненты используют карточки из Phase 5
6. ✅ Все компоненты используют данные из Phase 2
7. ✅ app/page.tsx НЕ изменен
8. ✅ Создан test-phase-7.tsx
9. ✅ Создан git commit

---

## ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После Фазы 7 будет извлечено ~500-600 строк кода в:
- 5 секций
- 4 preview компонента
- 1 modal компонент

**После этого останется только Фаза 8** - финальная сборка нового `app/page.tsx` из всех созданных компонентов.

---

## НАЧАЛО РАБОТЫ

```bash
# Текущая директория
cd /Users/user/Desktop/godplisgomvp-forvercel

# Проверить состояние
git log --oneline | head -7
# Должно быть 6 phase коммитов

# Начать работу
# Создавай файлы в порядке из "ПОРЯДОК ВЫПОЛНЕНИЯ"
```

**КРИТИЧЕСКИ ВАЖНО**: НЕ ТРОГАТЬ `app/page.tsx` во время работы!

---

## РЕФЕРЕНСЫ ИЗ app/page.tsx

### Hero Title (строки 492-497):
```tsx
<h1 className="text-[64px] md:text-[96px] leading-[0.92] font-light tracking-tight text-white mb-8">
  Закупки из Китая{" "}
  <span className="block mt-2 font-normal bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
    под ключ
  </span>
</h1>
```

### Dashboard Preview outer (строки 518-526):
```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl"
>
```

### Tutorial Button Example (строки 633-639):
```tsx
<button
  onClick={() => setTutorialModal({ isOpen: true, type: 'globe' })}
  className="absolute right-20 top-1/2 -translate-y-1/2 p-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-md hover:from-purple-600 hover:to-blue-600 transition-all cursor-pointer"
  title="Поиск по ссылке из интернета"
>
  <Globe className="w-3 h-3 text-white" />
</button>
```

---

## ФИНАЛЬНАЯ ПРОВЕРКА ПЕРЕД КОММИТОМ

```bash
# Проверить что app/page.tsx не изменен
git status app/page.tsx
# Должно быть: nothing to commit

# Проверить новые файлы
git status --short
# Должно быть ~10 новых файлов

# Посчитать строки
find components/landing/sections components/landing/preview components/landing/tutorial -name "*.tsx" -exec wc -l {} + | tail -1

# Создать коммит
git add components/landing test-phase-7.tsx
git commit -m "feat: Phase 7 - Create Hero section with Dashboard Preview"
```

**Удачи! Это последняя сложная фаза перед финальной сборкой!** 🚀
