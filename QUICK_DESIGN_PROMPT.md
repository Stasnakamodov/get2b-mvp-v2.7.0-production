# 🎨 Улучшить Дизайн UI Компонентов - Краткий Промпт

## Контекст
После FSD рефакторинга создали 10 UI компонентов в `src/shared/ui/`, но они получились слишком простыми и некрасивыми. Нужно сделать их современными и визуально привлекательными.

## Задача
Улучши дизайн компонентов, добавив:
- Современные градиенты
- Плавные тени и transitions
- Красивые hover эффекты
- Анимации
- Правильную типографику

## Компоненты для улучшения
```
src/shared/ui/Button.tsx
src/shared/ui/Input.tsx
src/shared/ui/Card.tsx
src/shared/ui/Badge.tsx
src/shared/ui/Modal.tsx
src/shared/ui/SearchBar.tsx
src/shared/ui/FilterSelect.tsx
src/widgets/catalog-suppliers/ui/SupplierCard.tsx
src/widgets/catalog-suppliers/ui/ProductCard.tsx
```

## Пример улучшения Button
```tsx
// Было:
className="px-4 py-2 bg-blue-500 text-white rounded-lg"

// Должно быть:
className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white
  rounded-xl font-semibold shadow-lg shadow-blue-500/50
  hover:shadow-xl hover:scale-105 transition-all duration-200
  active:scale-95"
```

## Требования
- ✅ Только стили (не менять логику)
- ✅ Tailwind CSS
- ✅ Иконки lucide-react
- ✅ Сохранить функциональность
- ✅ Адаптивный дизайн

## Начни с
1. Читай `src/shared/ui/Button.tsx`
2. Улучши дизайн
3. Покажи до/после
4. Переходи к следующим

**Цель**: Портфолио-качество дизайн! 🚀

---

## Технический стек
- Next.js 15.2.4 + React 18 + TypeScript
- Tailwind CSS + lucide-react
- Dev: `npm run dev` → http://localhost:3000/dashboard/catalog
