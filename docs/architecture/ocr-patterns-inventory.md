# 🔍 ИНВЕНТАРЬ OCR ПАТТЕРНОВ - НЕ ПОТЕРЯТЬ ПРИ РЕФАКТОРИНГЕ!

## 🎯 Цель документа
Зафиксировать все рабочие OCR паттерны перед рефакторингом в хук `useOcrUpload`.
**Эти паттерны работают и протестированы на реальных карточках!**

---

## 📋 ПАТТЕРН 1: Анализ карточки компании (Step 1)

### Функция: `analyzeCompanyCard(fileUrl, fileType)`

### API вызов:
```typescript
fetch('/api/document-analysis', {
  method: 'POST',
  body: JSON.stringify({
    fileUrl: fileUrl,
    fileType: fileType,
    documentType: 'company_card' // ⚠️ КРИТИЧНО!
  })
})
```

### Маппинг полей (сохранить как есть!):
```typescript
const companyData = {
  name: extractedData.companyName || extractedData.name || '',
  legalName: extractedData.legalName || extractedData.companyName || '',
  inn: extractedData.inn || '',
  kpp: extractedData.kpp || '',
  ogrn: extractedData.ogrn || '',
  address: extractedData.address || '',
  phone: extractedData.phone || '',
  email: extractedData.email || '',
  website: extractedData.website || '',
  director: extractedData.director || '',
  bankName: extractedData.bankName || '',
  bankAccount: extractedData.bankAccount || '',
  bik: extractedData.bankBik || extractedData.bik || '', // ⚠️ 2 варианта!
  correspondentAccount: extractedData.bankCorrAccount || extractedData.correspondentAccount || '' // ⚠️ 2 варианта!
};
```

### Валидация результата:
```typescript
const hasData = Object.values(companyData).some(value =>
  value && value.toString().trim() !== ''
);
```

### Что происходит после:
- ✅ Закрываем модал только при успешном OCR: `setSelectedSource(null)`
- ✅ Сохраняем отладку: `setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }))`

---

## 📋 ПАТТЕРН 2: Анализ спецификации/инвойса (Step 2)

### Функция: `analyzeSpecification(fileUrl, fileType)`

### API вызов:
```typescript
fetch('/api/document-analysis', {
  method: 'POST',
  body: JSON.stringify({
    fileUrl: fileUrl,
    fileType: fileType,
    documentType: 'invoice' // ⚠️ КРИТИЧНО!
  })
})
```

### 🔥 КЛЮЧЕВОЙ ПАТТЕРН: Очистка названия поставщика
```typescript
let supplierName = extractedData.invoiceInfo?.seller || extractedData.seller || '';

if (supplierName) {
  // Убираем префиксы типа "| Agent: ", "| Buyer:", "Поставщик:", "Продавец:"
  supplierName = supplierName
    .replace(/^\|\s*(Agent|Buyer|Seller|Поставщик|Продавец|Покупатель):\s*/i, '')
    .replace(/^\|\s*/g, '')
    .trim();
}
```

**Почему важно:** OCR часто возвращает мусорные префиксы в названиях!

---

## 📋 ПАТТЕРН 3: Извлечение товаров из инвойса

### Маппинг товаров:
```typescript
const specificationItems = extractedData.items.map((invoiceItem: any) => ({
  name: invoiceItem.name || "Товар из инвойса", // Основное поле
  item_name: invoiceItem.name || "Товар из инвойса", // Дублируем для UI
  item_code: invoiceItem.code || "", // Для UI
  code: invoiceItem.code || "", // Дублируем
  quantity: Number(invoiceItem.quantity) || 1,
  unit: "шт", // Стандартная единица
  price: Number(invoiceItem.price) || 0,
  total: Number(invoiceItem.total) || 0,
  description: invoiceItem.description || ""
}));
```

**Почему дублирование:** UI ожидает и `name`, и `item_name` - это legacy!

### Итоговые данные спецификации:
```typescript
const specificationData = {
  supplier: supplierName,
  items: specificationItems,
  totalAmount: extractedData.invoiceInfo?.totalAmount ||
    extractedData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
  currency: extractedData.invoiceInfo?.currency || extractedData.currency || 'RUB'
};
```

---

## 📋 ПАТТЕРН 4: Извлечение банковских реквизитов из инвойса

### Функция: `extractBankRequisitesFromInvoice(extractedData, analysisText)`

### Структура реквизитов:
```typescript
const requisites = {
  bankName: '',
  accountNumber: '',
  swift: '',
  recipientName: '',
  recipientAddress: '',
  transferCurrency: '',
  hasRequisites: false
};
```

### 🔥 ПАТТЕРН: Очистка recipientName от мусора
```typescript
if (requisites.recipientName) {
  requisites.recipientName = requisites.recipientName
    .replace(/\(账户名称\):\s*/i, '') // Убираем китайский текст
    .replace(/\(Account Name\):\s*/i, '') // Убираем английский текст
    .replace(/^[^a-zA-Z0-9]*/, '') // Убираем символы в начале
    .trim();
}
```

**Почему важно:** OCR часто возвращает китайские/английские подсказки в реквизитах!

---

## 📋 ПАТТЕРН 5: Fallback поиск реквизитов в тексте (если структура не найдена)

### Regex паттерны для номера счета:
```typescript
const accountPatterns = [
  /USD\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
  /EUR\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
  /Account\s*Number\s*:?\s*(\d+)/i,
  /A\/C\s*NO\.?\s*:?\s*(\d+)/i,
  /Номер\s*счета\s*:?\s*(\d+)/i
];

for (const pattern of accountPatterns) {
  const match = analysisText.match(pattern);
  if (match) {
    requisites.accountNumber = match[1];
    break;
  }
}
```

**Зачем:** Если структурированный ответ OCR не содержит данных, ищем в сыром тексте!

---

## 📋 ПАТТЕРН 6: Логика успешного/частичного/неуспешного OCR

### Сценарий 1: Полный успех
```typescript
if (extractedData && extractedData.items && extractedData.items.length > 0) {
  // Сохраняем данные
  setManualData(prev => ({ ...prev, [stepId]: specificationData }));
  // ✅ Закрываем модал
  setSelectedSource(null);
  // Предлагаем автозаполнить реквизиты
  if (bankRequisites.hasRequisites) {
    suggestPaymentMethodAndRequisites(bankRequisites, supplierName);
  }
}
```

### Сценарий 2: Частичный успех (есть поставщик, но нет товаров)
```typescript
else if (extractedData && extractedData.invoiceInfo && supplierName) {
  const specificationData = {
    supplier: supplierName,
    items: [],
    totalAmount: 0,
    currency: extractedData.invoiceInfo?.currency || 'RUB'
  };

  setManualData(prev => ({ ...prev, [stepId]: specificationData }));
  setOcrError(prev => ({
    ...prev,
    [stepId]: 'Найдена информация об инвойсе, но товары не извлечены. Добавьте позиции вручную.'
  }));

  // ✅ ЗАКРЫВАЕМ МОДАЛ ДАЖЕ ПРИ ЧАСТИЧНОМ УСПЕХЕ!
  setSelectedSource(null);

  // Предлагаем реквизиты даже без товаров
  if (bankRequisites.hasRequisites) {
    suggestPaymentMethodAndRequisites(bankRequisites, supplierName);
  }
}
```

### Сценарий 3: Полный провал
```typescript
else {
  console.log("⚠️ Товары не найдены в документе");
  setOcrError(prev => ({
    ...prev,
    [stepId]: 'Не удалось извлечь товары из документа'
  }));
  // ❌ НЕ ЗАКРЫВАЕМ МОДАЛ - пользователь должен увидеть ошибку
}
```

---

## 📋 ПАТТЕРН 7: Состояния OCR (критично для UX!)

### Управление состояниями:
```typescript
// Начало загрузки
setOcrAnalyzing(prev => ({ ...prev, [stepId]: true }));
setOcrError(prev => ({ ...prev, [stepId]: '' }));

// Успех
setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }));
setSelectedSource(null); // Закрываем модал

// Ошибка
setOcrAnalyzing(prev => ({ ...prev, [stepId]: false }));
setOcrError(prev => ({ ...prev, [stepId]: 'Текст ошибки' }));
// НЕ закрываем модал!

// Отладка (всегда сохраняем)
setOcrDebugData(prev => ({ ...prev, [stepId]: extractedData }));
```

---

## 📋 ПАТТЕРН 8: Интеграция с автозаполнением

### После успешного OCR спецификации:
```typescript
// 1. Сохраняем спецификацию
setManualData(prev => ({ ...prev, [2]: specificationData }));

// 2. Предлагаем метод оплаты и реквизиты
if (bankRequisites.hasRequisites) {
  suggestPaymentMethodAndRequisites(bankRequisites, supplierName);
}

// 3. Функция автозаполнения (НЕ ТРОГАТЬ при рефакторинге!)
const suggestPaymentMethodAndRequisites = (bankRequisites, supplierName) => {
  // Эта функция уже существует в монолите
  // Автозаполняет Step 4 (метод оплаты) и Step 5 (реквизиты)
}
```

---

## ⚠️ КРИТИЧНЫЕ ПРАВИЛА ПРИ РЕФАКТОРИНГЕ

### ✅ ЧТО НЕЛЬЗЯ МЕНЯТЬ:

1. **API endpoints и documentType:**
   - `documentType: 'company_card'` для Step 1
   - `documentType: 'invoice'` для Step 2
   - Это контракт с бэкендом!

2. **Маппинг полей:**
   - Дублирование `name` / `item_name` - это нужно для UI
   - Дублирование `code` / `item_code` - это legacy
   - Fallback цепочки `extractedData.bankBik || extractedData.bik`

3. **Regex паттерны очистки:**
   - Очистка supplierName от префиксов
   - Очистка recipientName от китайских символов
   - Fallback regex для реквизитов

4. **Логика закрытия модала:**
   - Закрываем только при успехе или частичном успехе
   - НЕ закрываем при полном провале

5. **Отладочные логи:**
   - Все `console.log` с эмодзи - оставить!
   - `setOcrDebugData` - всегда сохранять

### ✅ ЧТО МОЖНО МЕНЯТЬ:

1. Перенести функции в хук `useOcrUpload`
2. Использовать интегрированный вариант (setManualData напрямую)
3. Добавить TypeScript типы
4. Улучшить обработку ошибок (не ломая существующую логику)

---

## 🧪 ТЕСТ-КЕЙСЫ ДЛЯ ПРОВЕРКИ ПОСЛЕ РЕФАКТОРИНГА

### Step 1 (Карточка компании):
- [ ] Загрузить карточку с полными реквизитами → все поля заполнились
- [ ] Загрузить карточку без банковских данных → компания заполнилась, банк пустой
- [ ] Загрузить нечитаемый документ → показалась ошибка, модал НЕ закрылся

### Step 2 (Спецификация/инвойс):
- [ ] Загрузить инвойс с товарами → спецификация заполнилась
- [ ] Проверить что supplierName очистился от префиксов (`| Agent:` и т.д.)
- [ ] Загрузить инвойс с банковскими реквизитами → Step 4,5 автозаполнились
- [ ] Проверить что recipientName очистился от китайских символов
- [ ] Загрузить инвойс без товаров → частичный успех (supplier есть, items пусто)
- [ ] Загрузить нечитаемый документ → ошибка, модал НЕ закрылся

### Интеграция:
- [ ] После OCR инвойса проверить что `suggestPaymentMethodAndRequisites` вызвалась
- [ ] Проверить что отладочные данные сохраняются в `ocrDebugData`

---

## 📝 ЧЕКЛИСТ ПРИ СОЗДАНИИ `useOcrUpload` ХУКА

- [ ] Скопировать `analyzeCompanyCard` как есть
- [ ] Скопировать `analyzeSpecification` как есть
- [ ] Скопировать `extractBankRequisitesFromInvoice` как есть
- [ ] Скопировать все regex паттерны
- [ ] Скопировать все состояния (uploadedFiles, ocrAnalyzing, ocrError, ocrDebugData)
- [ ] Передать `setManualData` как параметр хука
- [ ] Передать `suggestPaymentMethodAndRequisites` как параметр
- [ ] Сохранить все `console.log` для отладки
- [ ] Протестировать на реальных карточках ПЕРЕД удалением старого кода!

---

## 🎯 ФИНАЛЬНАЯ ПРОВЕРКА

После рефакторинга запусти:
```bash
# 1. Загрузи карточку компании
# 2. Проверь что все поля заполнились
# 3. Загрузи инвойс
# 4. Проверь что товары извлеклись
# 5. Проверь что реквизиты предложились
# 6. Проверь консоль - все логи на месте?
```

Если всё работает → старый код можно удалять! ✅
