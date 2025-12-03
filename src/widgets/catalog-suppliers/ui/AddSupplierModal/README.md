# AddSupplierModal - Модальное окно добавления поставщика

## Описание

7-шаговая форма для создания и редактирования поставщиков с валидацией Zod, построенная по принципам FSD архитектуры.

## Структура файлов

```
AddSupplierModal/
├── index.tsx                    # 184 строки - Главный компонент
├── useSupplierForm.ts           # 256 строк - Хук управления состоянием
├── validation.ts                # 210 строк - Zod схемы валидации
├── SupplierFormSteps.tsx        # 63 строки - Timeline компонент
├── steps/
│   ├── index.ts                 # Экспорт всех шагов
│   ├── Step1BasicInfo.tsx       # 127 строк - Основная информация
│   ├── Step2Contacts.tsx        # 73 строки - Контакты
│   ├── Step3BusinessProfile.tsx # 83 строки - Бизнес-профиль
│   ├── Step4Certifications.tsx  # 73 строки - Сертификации
│   ├── Step5Products.tsx        # 83 строки - Товары
│   ├── Step6PaymentDetails.tsx  # 110 строк - Платежные реквизиты
│   └── Step7Preview.tsx         # 100 строк - Превью данных
└── README.md                    # Документация
```

**Итого:** 1,362 строки кода (было 853 строки в монолитном файле)

## Преимущества декомпозиции

### До рефакторинга
- 1 файл, 853 строки
- Монолитный компонент
- Смешанная логика валидации
- Сложная поддержка

### После рефакторинга
- 12 файлов, модульная структура
- Разделение ответственности
- Zod валидация (type-safe)
- Переиспользуемые компоненты
- Легкая поддержка и расширение

## Использование

```tsx
import { AddSupplierModal } from '@/src/widgets/catalog-suppliers'

function CatalogPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const handleSuccess = (supplier: Supplier) => {
    console.log('Поставщик сохранен:', supplier)
    // Обновить список поставщиков
  }

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Добавить поставщика
      </button>

      <AddSupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        editingSupplier={editingSupplier}
      />
    </>
  )
}
```

## API компонента

### Props

```typescript
interface AddSupplierModalProps {
  isOpen: boolean                    // Видимость модального окна
  onClose: () => void                // Обработчик закрытия
  onSuccess?: (supplier: Supplier) => void  // Успешное сохранение
  editingSupplier?: Supplier | null  // Поставщик для редактирования
}
```

## Шаги формы

### Шаг 1: Основная информация
- Название поставщика *
- Название компании *
- Категория (select) *
- Страна (select) *
- Город *
- Описание (textarea) *
- Загрузка логотипа

### Шаг 2: Контактная информация
- Email * (с валидацией)
- Телефон *
- Контактное лицо *
- Веб-сайт (optional, с валидацией URL)

### Шаг 3: Бизнес-профиль
- Минимальный заказ * (select)
- Время ответа * (select)
- Количество сотрудников * (select)
- Год основания *

### Шаг 4: Сертификации
- Множественный выбор сертификаций (checkbox grid)
- Динамический список на основе категории

### Шаг 5: Товары
- Список товаров с возможностью добавления/удаления
- Для каждого товара: название, цена

### Шаг 6: Платежные реквизиты
- Банковский перевод (название банка, счет, SWIFT)
- P2P оплата картой (банк, номер, владелец)
- Криптовалюта (сеть, адрес)

### Шаг 7: Превью
- Сводка всех данных (readonly)
- Финальная проверка перед сохранением

## Валидация

Используется библиотека Zod для type-safe валидации:

```typescript
import { validateStep } from './validation'

// Валидация конкретного шага
const result = validateStep(1, formData)
if (!result.success) {
  console.error('Ошибки валидации:', result.errors)
}
```

## Хук useSupplierForm

Централизованное управление состоянием формы:

```typescript
const form = useSupplierForm({
  editingSupplier,
  onSuccess,
  onClose,
  isOpen
})

// Доступные методы:
form.handleNext()           // Переход на следующий шаг
form.handleBack()           // Возврат на предыдущий шаг
form.handleStepClick(3)     // Переход на конкретный шаг
form.updateField('name', value)  // Обновление поля
form.handleLogoUpload(file)      // Загрузка логотипа
form.handleAddProduct()          // Добавление товара
form.handleSave()                // Сохранение поставщика
```

## Зависимости

- React 18+
- TypeScript 5+
- Zod 3+ (валидация)
- lucide-react (иконки)
- Tailwind CSS (стили)
- Supabase (backend)

## FSD архитектура

Компонент следует принципам Feature-Sliced Design:

- **Widget**: `src/widgets/catalog-suppliers/ui/AddSupplierModal/`
- **Entity**: Использует типы из `@/src/entities/supplier`
- **Features**: Использует хуки из `@/src/features/supplier-management`
- **Shared**: Использует конфиги и утилиты из `@/src/shared`

## Миграция со старого кода

Старый файл сохранен как `AddSupplierModal.old.tsx` для справки.

Все импорты автоматически обновлены благодаря централизованному экспорту в `src/widgets/catalog-suppliers/index.ts`.

## Тестирование

```bash
# Проверка TypeScript
npx tsc --noEmit

# Проверка сборки
npm run build
```

## Roadmap

- [ ] Unit тесты для валидации
- [ ] Integration тесты для хука
- [ ] E2E тесты для полного флоу
- [ ] Поддержка drag-and-drop для изображений
- [ ] Прогресс-бар загрузки
- [ ] Автосохранение в localStorage
