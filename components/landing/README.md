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
