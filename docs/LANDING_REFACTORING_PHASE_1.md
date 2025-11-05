# 🎯 ФАЗА 1: ПОДГОТОВКА К ДЕКОМПОЗИЦИИ LANDING PAGE

## КОНТЕКСТ

Файл `/Users/user/Desktop/godplisgomvp-forvercel/app/page.tsx` является монолитным компонентом на **1363 строки**. Это лендинг страница с интерактивным dashboard preview, туториалами, секциями процесса, преимуществ, FAQ и footer.

Агент `monolith-decomposer` провел анализ и рекомендовал декомпозицию в 8 фаз. Это **ФАЗА 1: Подготовка** (оценка: 2 часа).

---

## ЦЕЛЬ ФАЗЫ 1

Создать полную структуру папок и файлов для будущей декомпозиции, а также подготовить все TypeScript типы. НЕ трогать исходный `app/page.tsx` - он должен продолжать работать.

---

## ЗАДАЧИ

### 1. СОЗДАТЬ СТРУКТУРУ ПАПОК (15 минут)

Создай следующую структуру в проекте:

```
components/
  landing/
    sections/           # Секции лендинга (Hero, Process, Benefits, FAQ, etc.)
    preview/           # Компоненты dashboard preview
    tutorial/          # Tutorial modal компоненты
    cards/             # Переиспользуемые карточки (ProjectCard, StepCard, etc.)
    animations/        # Анимационные обертки (FadeInSection, etc.)
    Header.tsx         # (будет создан позже)
    Footer.tsx         # (будет создан позже)

data/
  landing/
    steps.ts           # 7 шагов процесса
    benefits.ts        # Преимущества Get2B
    faq.ts             # FAQ items
    tutorial.ts        # Tutorial content для модалок
    mockData.ts        # Mock projects и templates

hooks/
  landing/
    useProjects.ts     # Загрузка проектов из Supabase
    useProjectStats.ts # Вычисление статистики проектов
    useTutorial.ts     # Управление tutorial модалками
    useScrollAnimation.ts # Анимации при скролле

lib/
  utils/
    projectHelpers.ts  # Утилиты: toRoman, getCorrectStepForCard, getProjectStatusLabel

constants/
  gradients.ts         # Переиспользуемые градиенты
  animations.ts        # Настройки анимаций (framer-motion variants)

types/
  landing.ts          # TypeScript типы для лендинга
```

**Команды для создания папок:**

```bash
# Создать структуру компонентов
mkdir -p components/landing/sections
mkdir -p components/landing/preview
mkdir -p components/landing/tutorial
mkdir -p components/landing/cards
mkdir -p components/landing/animations

# Создать структуру данных
mkdir -p data/landing

# Создать структуру хуков
mkdir -p hooks/landing

# Создать структуру утилит (если не существует)
mkdir -p lib/utils

# Создать структуру констант
mkdir -p constants

# Создать структуру типов
mkdir -p types
```

---

### 2. СОЗДАТЬ TYPESCRIPT ТИПЫ (30 минут)

Создай файл `/types/landing.ts` со всеми необходимыми типами:

```typescript
import type { LucideIcon } from 'lucide-react'

// ==================== PROJECT TYPES ====================

export interface Project {
  id: string
  name: string
  company_data?: {
    name: string
    legalName?: string
    inn?: string
    kpp?: string
    ogrn?: string
    email?: string
  }
  amount: number
  currency?: string
  created_at: string
  status: string
  current_step: number
  max_step_reached?: number
  receipts?: string
  user_id: string
}

export interface ProjectStep {
  id: number
  title: string
  description: string
  icon: LucideIcon
}

export interface ProjectStatusLabel {
  color: string
  text: string
  Icon: LucideIcon
}

// ==================== PROCESS STEPS ====================

export interface ProcessStep {
  number: string
  title: string
  description: string
  time: string
  icon: LucideIcon
}

// ==================== BENEFITS ====================

export interface Benefit {
  icon: LucideIcon
  title: string
  description: string
}

// ==================== FAQ ====================

export interface FAQItem {
  question: string
  answer: string
}

// ==================== TUTORIAL ====================

export type TutorialType = 'cart' | 'globe' | 'camera' | 'new-project' | 'catalog'

export interface TutorialContent {
  title: string
  description: string
  features: string[]
  icon: LucideIcon
  color: string
}

export interface TutorialState {
  isOpen: boolean
  type: TutorialType | null
}

// ==================== TEMPLATES ====================

export interface Template {
  id: string
  name: string
  description: string
  role: 'client' | 'supplier'
}

// ==================== STATS ====================

export interface ProjectStats {
  activeProjects: number
  pendingProjects: number
  completedProjects: number
  rejectedProjects: number
}

// ==================== HOOK RETURN TYPES ====================

export interface UseProjectsReturn {
  projects: Project[]
  loading: boolean
  error: Error | null
}

export interface UseTutorialReturn {
  isOpen: boolean
  type: TutorialType | null
  openTutorial: (type: TutorialType) => void
  closeTutorial: () => void
}

export interface UseScrollAnimationReturn {
  ref: React.RefObject<HTMLDivElement>
  isInView: boolean
}
```

---

### 3. СОЗДАТЬ КОНСТАНТЫ (30 минут)

#### 3.1. Создай `/constants/gradients.ts`:

```typescript
/**
 * Переиспользуемые градиенты для всего приложения
 */
export const GRADIENTS = {
  // Primary gradients
  primary: "from-blue-500 to-blue-600",
  primaryHover: "from-blue-600 to-blue-700",

  // Hero section
  hero: "from-blue-400 via-purple-400 to-orange-400",
  heroOrbs: {
    top: "bg-blue-500/10",
    bottom: "bg-orange-500/10",
  },

  // Tutorial types
  cart: "from-blue-500 to-blue-600",
  globe: "from-purple-500 to-blue-500",
  globeHover: "from-purple-600 to-blue-600",
  camera: "from-pink-500 to-orange-500",
  catalog: "from-green-500 to-emerald-600",

  // Dashboard
  dashboard: "from-zinc-900/90 to-black/90",

  // Backgrounds
  section: "from-zinc-900 via-zinc-950 to-black",
  card: "from-zinc-900 to-black",
} as const

export type GradientKey = keyof typeof GRADIENTS
```

#### 3.2. Создай `/constants/animations.ts`:

```typescript
import type { Variants } from 'framer-motion'

/**
 * Предустановленные варианты анимаций для framer-motion
 */

export const ANIMATION_DURATION = {
  fast: 0.3,
  normal: 0.5,
  slow: 0.8,
  verySlow: 1,
} as const

export const EASING = {
  smooth: [0.16, 1, 0.3, 1],
  spring: [0.175, 0.885, 0.32, 1.275],
} as const

export const FADE_IN_UP: Variants = {
  initial: {
    opacity: 0,
    y: 30
  },
  animate: {
    opacity: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    y: 30
  },
}

export const FADE_IN: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1
  },
  exit: {
    opacity: 0
  },
}

export const SLIDE_IN_RIGHT: Variants = {
  initial: {
    opacity: 0,
    x: 20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: 20
  },
}

export const SLIDE_IN_LEFT: Variants = {
  initial: {
    opacity: 0,
    x: -20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: -20
  },
}

export const SCALE_IN: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    scale: 1
  },
  exit: {
    opacity: 0,
    scale: 0.95
  },
}

export const STAGGER_CONTAINER: Variants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const STAGGER_ITEM: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.smooth,
    },
  },
}

/**
 * Генератор задержки для анимаций
 */
export function getStaggerDelay(index: number, baseDelay: number = 0.05): number {
  return index * baseDelay
}

/**
 * Генератор transition для анимаций
 */
export function getTransition(duration: number = ANIMATION_DURATION.normal, delay: number = 0) {
  return {
    duration,
    delay,
    ease: EASING.smooth,
  }
}
```

---

### 4. СОЗДАТЬ ЗАГЛУШКИ ДЛЯ ФАЙЛОВ ДАННЫХ (15 минут)

Создай пустые файлы с TODO комментариями для следующих фаз:

#### 4.1. `/data/landing/steps.ts`:

```typescript
import type { ProcessStep } from '@/types/landing'

/**
 * 7 шагов процесса закупки
 * TODO: Заполнить в Фазе 2
 */
export const processSteps: ProcessStep[] = []
```

#### 4.2. `/data/landing/benefits.ts`:

```typescript
import type { Benefit } from '@/types/landing'

/**
 * Преимущества Get2B
 * TODO: Заполнить в Фазе 2
 */
export const benefits: Benefit[] = []
```

#### 4.3. `/data/landing/faq.ts`:

```typescript
import type { FAQItem } from '@/types/landing'

/**
 * Часто задаваемые вопросы
 * TODO: Заполнить в Фазе 2
 */
export const faqItems: FAQItem[] = []
```

#### 4.4. `/data/landing/tutorial.ts`:

```typescript
import type { TutorialContent, TutorialType } from '@/types/landing'

/**
 * Контент для tutorial модалок
 * TODO: Заполнить в Фазе 2
 */
export const tutorialContent: Record<TutorialType, TutorialContent> = {} as Record<TutorialType, TutorialContent>
```

#### 4.5. `/data/landing/mockData.ts`:

```typescript
import type { Project, Template } from '@/types/landing'

/**
 * Mock данные для preview дашборда
 * TODO: Заполнить в Фазе 2
 */
export const mockProjects: Project[] = []

export const mockTemplates: Template[] = []
```

---

### 5. СОЗДАТЬ ЗАГЛУШКИ ДЛЯ УТИЛИТ (15 минут)

#### 5.1. `/lib/utils/projectHelpers.ts`:

```typescript
import type { Project, ProjectStatusLabel } from '@/types/landing'
import { FileText } from 'lucide-react'

/**
 * Конвертирует число в римскую цифру (I-VII)
 * TODO: Реализовать в Фазе 3
 */
export function toRoman(num: number): string {
  // TODO: Реализация
  return String(num)
}

/**
 * Получает корректный шаг для карточки проекта
 * TODO: Реализовать в Фазе 3
 */
export function getCorrectStepForCard(project: Project): number {
  // TODO: Реализация
  return 1
}

/**
 * Получает label статуса проекта с цветом и иконкой
 * TODO: Реализовать в Фазе 3
 */
export function getProjectStatusLabel(
  step: number,
  status: string,
  receipts?: string
): ProjectStatusLabel {
  // TODO: Реализация
  return {
    color: '#6b7280',
    text: 'В работе',
    Icon: FileText,
  }
}
```

---

### 6. СОЗДАТЬ ЗАГЛУШКИ ДЛЯ HOOKS (30 минут)

#### 6.1. `/hooks/landing/useProjects.ts`:

```typescript
import { useState, useEffect } from 'react'
import type { UseProjectsReturn } from '@/types/landing'

/**
 * Хук для загрузки проектов пользователя из Supabase
 * TODO: Реализовать в Фазе 4
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // TODO: Реализовать загрузку из Supabase
    setLoading(false)
  }, [])

  return { projects, loading, error }
}
```

#### 6.2. `/hooks/landing/useProjectStats.ts`:

```typescript
import { useMemo } from 'react'
import type { Project, ProjectStats } from '@/types/landing'

/**
 * Хук для вычисления статистики проектов
 * TODO: Реализовать в Фазе 4
 */
export function useProjectStats(projects: Project[]): ProjectStats {
  const activeProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  const pendingProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  const completedProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  const rejectedProjects = useMemo(() => {
    // TODO: Реализовать подсчет
    return 0
  }, [projects])

  return {
    activeProjects,
    pendingProjects,
    completedProjects,
    rejectedProjects,
  }
}
```

#### 6.3. `/hooks/landing/useTutorial.ts`:

```typescript
import { useState } from 'react'
import type { TutorialType, UseTutorialReturn } from '@/types/landing'

/**
 * Хук для управления tutorial модалками
 * TODO: Реализовать в Фазе 4
 */
export function useTutorial(): UseTutorialReturn {
  const [tutorialState, setTutorialState] = useState<{
    isOpen: boolean
    type: TutorialType | null
  }>({ isOpen: false, type: null })

  const openTutorial = (type: TutorialType) => {
    // TODO: Реализовать
    setTutorialState({ isOpen: true, type })
  }

  const closeTutorial = () => {
    // TODO: Реализовать
    setTutorialState({ isOpen: false, type: null })
  }

  return {
    ...tutorialState,
    openTutorial,
    closeTutorial,
  }
}
```

#### 6.4. `/hooks/landing/useScrollAnimation.ts`:

```typescript
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import type { UseScrollAnimationReturn } from '@/types/landing'

/**
 * Хук для анимаций при скролле
 * TODO: Реализовать в Фазе 4
 */
export function useScrollAnimation(): UseScrollAnimationReturn {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return { ref, isInView }
}
```

---

### 7. СОЗДАТЬ README ДЛЯ СТРУКТУРЫ (10 минут)

Создай `/components/landing/README.md`:

```markdown
# Landing Page Components

Структура компонентов для лендинга Get2B.

## Структура

```
landing/
├── sections/          # Основные секции лендинга
│   ├── HeroSection.tsx
│   ├── ValuePropositionSection.tsx
│   ├── CatalogSection.tsx
│   ├── ProcessStepsSection.tsx
│   ├── BenefitsSection.tsx
│   ├── CRMSupportSection.tsx
│   ├── FAQSection.tsx
│   └── FinalCTASection.tsx
│
├── preview/           # Dashboard preview компоненты
│   ├── DashboardPreview.tsx
│   ├── MockBrowserBar.tsx
│   ├── SearchBar.tsx
│   ├── TemplateGrid.tsx
│   ├── StatsGrid.tsx
│   └── FloatingNotifications.tsx
│
├── tutorial/          # Tutorial модалки
│   └── TutorialModal.tsx
│
├── cards/             # Переиспользуемые карточки
│   ├── ProjectCard.tsx
│   ├── StepCard.tsx
│   ├── BenefitCard.tsx
│   └── FAQItem.tsx
│
├── animations/        # Анимационные обертки
│   └── FadeInSection.tsx
│
├── Header.tsx         # Header лендинга
├── Footer.tsx         # Footer лендинга
└── CTAButtonGroup.tsx # Группа CTA кнопок
```

## Принципы

1. **Single Responsibility** - каждый компонент отвечает за одну вещь
2. **Reusability** - компоненты переиспользуемы
3. **Type Safety** - строгая типизация TypeScript
4. **Performance** - React.memo где необходимо
5. **Accessibility** - semantic HTML и ARIA

## Фазы разработки

- ✅ **Фаза 1**: Подготовка структуры (текущая)
- ⏳ **Фаза 2**: Извлечение данных
- ⏳ **Фаза 3**: Извлечение утилит
- ⏳ **Фаза 4**: Создание hooks
- ⏳ **Фаза 5**: Создание переиспользуемых компонентов
- ⏳ **Фаза 6**: Создание секций
- ⏳ **Фаза 7**: Декомпозиция DashboardPreview
- ⏳ **Фаза 8**: Финальная сборка

## Использование

```tsx
import { HeroSection } from '@/components/landing/sections/HeroSection'

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      {/* ... другие секции */}
    </div>
  )
}
```
```

---

## ПРОВЕРКА РЕЗУЛЬТАТОВ ФАЗЫ 1

После выполнения всех задач проверь:

### ✅ Чеклист:

- [ ] Созданы все папки структуры
- [ ] Создан `/types/landing.ts` со всеми типами
- [ ] Создан `/constants/gradients.ts` с градиентами
- [ ] Создан `/constants/animations.ts` с анимациями
- [ ] Созданы заглушки для файлов данных (5 файлов)
- [ ] Созданы заглушки для утилит (`projectHelpers.ts`)
- [ ] Созданы заглушки для hooks (4 файла)
- [ ] Создан README в `/components/landing/`
- [ ] НЕ трогали исходный `app/page.tsx` - он работает!

### 🧪 Тестирование:

```bash
# 1. Проверка что проект компилируется
npm run build

# 2. Проверка что dev сервер запускается
npm run dev

# 3. Проверка что лендинг работает
# Открой http://localhost:3000 - должно работать как раньше!
```

### 📊 Ожидаемый результат:

- ✅ Создано **20+ новых файлов**
- ✅ Структура папок готова для декомпозиции
- ✅ Все типы определены
- ✅ Константы подготовлены
- ✅ Исходный `app/page.tsx` НЕ изменен
- ✅ Приложение работает как раньше
- ✅ TypeScript компилируется без ошибок

---

## СЛЕДУЮЩИЕ ШАГИ

После успешного завершения Фазы 1:

1. **Закоммить изменения:**
   ```bash
   git add .
   git commit -m "feat: Phase 1 - Prepare landing page refactoring structure

   - Create folder structure for landing components
   - Add TypeScript types (landing.ts)
   - Add constants (gradients, animations)
   - Create stubs for data, utils, hooks
   - Add README documentation

   Phase 1/8 completed ✅"
   ```

2. **Создать документ для Фазы 2:**
   - Извлечение данных из `app/page.tsx` в файлы `/data/landing/`

3. **Сообщить о готовности:**
   - "Фаза 1 завершена! Готов к Фазе 2"

---

## ВАЖНЫЕ ЗАМЕЧАНИЯ

⚠️ **НЕ ДЕЛАТЬ:**
- НЕ изменять `app/page.tsx` в Фазе 1
- НЕ создавать реальные компоненты (только заглушки)
- НЕ реализовывать логику (только TODO комментарии)
- НЕ удалять существующий код

✅ **ДЕЛАТЬ:**
- Создавать структуру папок
- Создавать TypeScript типы
- Создавать константы
- Создавать файлы-заглушки с TODO
- Документировать структуру

---

## ВРЕМЯ ВЫПОЛНЕНИЯ

**Оценка:** 2 часа

- Создание структуры папок: 15 минут
- TypeScript типы: 30 минут
- Константы: 30 минут
- Заглушки данных: 15 минут
- Заглушки утилит: 15 минут
- Заглушки hooks: 30 минут
- README: 10 минут
- Тестирование: 5 минут

---

## ВОПРОСЫ?

Если что-то непонятно:
1. Перечитай секцию с задачей
2. Посмотри примеры кода
3. Проверь чеклист
4. Задай вопрос с контекстом

Удачи! 🚀
