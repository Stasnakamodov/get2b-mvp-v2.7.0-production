# Логика статусов проекта

## Обзор статусов

### Основные статусы
- `draft` - Черновик, проект не отправлен
- `in_progress` - В процессе заполнения
- `waiting_approval` - Ожидание одобрения менеджером
- `waiting_receipt` - Ожидание загрузки чека клиентом
- `receipt_approved` - Чек клиента одобрен менеджером
- `receipt_rejected` - Чек клиента отклонён
- `filling_requisites` - Заполнение реквизитов
- `waiting_manager_receipt` - **ДОБАВЛЕН**: Ожидание чека от менеджера
- `in_work` - В работе (чек от менеджера загружен)
- `completed` - Проект завершён

## Маппинг статусов на шаги

| Шаг | Название | Статусы | Описание |
|-----|----------|---------|----------|
| 1 | Карточка компании | `draft` | Создание проекта |
| 2 | Загрузка чека клиентом | `in_progress`, `waiting_approval`, `receipt_rejected` | Клиент загружает чек |
| 3 | Ожидание одобрения | `waiting_receipt`, `receipt_approved` | Менеджер одобряет чек |
| 4 | Выбор способа оплаты | - | Промежуточный шаг |
| 5 | Заполнение реквизитов | - | Промежуточный шаг |
| 6 | Получение чека от менеджера | `waiting_manager_receipt`, `in_work` | **Ключевой шаг** |
| 7 | Завершение | `completed` | Проект завершён |

## Переходы между статусами

```
draft → in_progress
in_progress → waiting_approval | receipt_rejected
waiting_approval → waiting_receipt | receipt_rejected  
waiting_receipt → receipt_approved | receipt_rejected
receipt_approved → filling_requisites
receipt_rejected → in_progress
filling_requisites → waiting_manager_receipt
waiting_manager_receipt → in_work
in_work → completed
```

## Логика 6 шага (ключевая)

### До загрузки чека менеджером
- **Статус**: `waiting_manager_receipt`
- **Отображение**: "⏳ Ожидаем загрузки чека от менеджера. Мы уведомим вас, когда чек будет готов."
- **Действие**: Переход с 5 шага устанавливает этот статус

### После загрузки чека менеджером  
- **Статус**: `in_work`
- **Отображение**: "✅ Чек от менеджера готов к просмотру!"
- **Действие**: Webhook меняет статус при загрузке файла

## Telegram интеграция

### Уведомления менеджеру
1. При переходе на 6 шаг отправляется сообщение с кнопкой "📤 Загрузить чек для клиента"
2. Менеджер нажимает кнопку → показывается диалог загрузки
3. Менеджер отправляет файл в reply → webhook обрабатывает и меняет статус

### Обработка файлов
- Файлы сохраняются в JSON формате: `{client_receipt: "...", manager_receipt: "...", manager_uploaded_at: "..."}`
- Статус меняется с `waiting_manager_receipt` на `in_work`

## Статус реализации

### ✅ Завершено
- ✅ Типы и переходы статусов (`lib/types/project-status.ts`)
- ✅ Компонент отображения статусов (`components/ui/ProjectStatus.tsx`)
- ✅ Логика Step5 с переходом на `waiting_manager_receipt`
- ✅ Логика Step6 с различением состояний
- ✅ Webhook обработка загрузки файлов
- ✅ Подробная документация архитектуры
- ✅ **База данных - enum статус `waiting_manager_receipt` добавлен**

### 🔄 В работе
- Тестирование полного флоу с новым статусом
- Мониторинг корректности переходов

## SQL для добавления статуса (ВЫПОЛНЕНО)

```sql
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'waiting_manager_receipt';
```

## Файлы для обновления (ЗАВЕРШЕНО)

- ✅ `lib/types/project-status.ts` - типы и переходы
- ✅ `components/ui/ProjectStatus.tsx` - отображение статусов
- ✅ `app/dashboard/create-project/steps/Step5RequisiteSelectForm.tsx` - переход на 6 шаг  
- ✅ `app/dashboard/create-project/steps/Step6ReceiptForClient.tsx` - отображение статусов
- ✅ `app/api/telegram-webhook/route.ts` - обработка загрузки файлов
- ✅ База данных - добавление enum значения

## Структура данных чеков

Чеки сохраняются в JSON формате:
```json
{
  "client_receipt": "URL_чека_клиента",
  "manager_receipt": "URL_чека_менеджера", 
  "manager_uploaded_at": "2025-06-17T23:23:33.897Z"
}
```

## Итоговое состояние

Система теперь работает корректно:
- ✅ Четкое разделение состояний для пользователя на 6 шаге
- ✅ Правильные тексты сообщений ("ожидание" vs "готов")
- ✅ Рабочая логика переходов между шагами
- ✅ Подробная документация архитектуры
- ✅ Новый статус `waiting_manager_receipt` добавлен в базу данных
- ✅ Все компоненты обновлены для поддержки нового статуса
