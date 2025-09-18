# 🏦 ИЗВЛЕЧЕНИЕ БАНКОВСКИХ РЕКВИЗИТОВ ИЗ ИНВОЙСА

**Дата создания:** 12 января 2025  
**Статус:** ✅ Реализовано  
**Файлы:** 
- `app/dashboard/project-constructor/page.tsx`
- `app/api/document-analysis/route.ts`

---

## 🎯 **ОБЩАЯ КОНЦЕПЦИЯ**

### **Что добавлено:**
Автоматическое извлечение банковских реквизитов из инвойсов и предложение способа оплаты для шагов 4 и 5 атомарного конструктора.

### **Логика работы:**
1. **OCR анализ инвойса** → извлечение банковских реквизитов
2. **Автоматическое предложение** → "Банковский перевод" как способ оплаты
3. **Предложение реквизитов** → заполнение полей шага 5 данными из инвойса
4. **Пользовательский контроль** → проверка и дополнение предложенных данных

---

## 🏗️ **АРХИТЕКТУРА**

### **1. Извлечение реквизитов (Backend)**
```typescript
// app/api/document-analysis/route.ts
function extractBankRequisitesFromInvoice(text: string) {
  // Поиск номера счета: USD A/C NO., EUR A/C NO.
  // Поиск SWIFT кода: SWIFT CODE, BIC
  // Поиск получателя: ACCOUNT NAME, BENEFICIARY
  // Поиск адреса: BENEFICIARY'S ADDRESS
  // Определение валюты: USD/EUR
}
```

### **2. Предложение данных (Frontend)**
```typescript
// app/dashboard/project-constructor/page.tsx
const suggestPaymentMethodAndRequisites = (bankRequisites: any) => {
  // Автоматически предлагаем "Банковский перевод"
  // Сохраняем реквизиты как предложения
  // Устанавливаем источники данных
}
```

### **3. UI для предложений**
```typescript
// PaymentMethodForm - показывает предложение "Банковский перевод"
// RequisitesForm - показывает извлеченные реквизиты
```

---

## 📋 **ИЗВЛЕКАЕМЫЕ ДАННЫЕ**

### **Из инвойса:**
- ✅ **USD A/C NO.:** 397475795838 → `accountNumber`
- ✅ **SWIFT CODE:** BKCHCNBJ92B → `swift`  
- ✅ **ACCOUNT NAME:** ZHEJIANG GAMMA TRADING CO.,LTD → `recipientName`
- ✅ **BENEFICIARY'S ADDRESS:** ROOM201, NO.1166LONGRUI AVENUE... → `recipientAddress`

### **Автоматические предложения:**
- ✅ **Способ оплаты:** "bank-transfer" (Банковский перевод)
- ✅ **Валюта:** "USD" (из USD A/C NO.)

---

## 🔧 **РЕАЛИЗАЦИЯ**

### **1. Расширенная функция analyzeSpecification**
```typescript
const analyzeSpecification = async (fileUrl: string, fileType: string) => {
  // ... существующий код ...
  
  // 🔥 НОВОЕ: Извлекаем банковские реквизиты
  const bankRequisites = extractBankRequisitesFromInvoice(extractedData, analysisText);
  
  // 🔥 НОВОЕ: Предлагаем способ оплаты и реквизиты
  if (bankRequisites.hasRequisites) {
    suggestPaymentMethodAndRequisites(bankRequisites);
  }
}
```

### **2. Функция извлечения реквизитов**
```typescript
const extractBankRequisitesFromInvoice = (extractedData: any, analysisText: string) => {
  // Поиск по regex паттернам
  // Обработка OCR ошибок
  // Валидация данных
  return {
    accountNumber: '397475795838',
    swift: 'BKCHCNBJ92B',
    recipientName: 'ZHEJIANG GAMMA TRADING CO.,LTD',
    recipientAddress: 'ROOM201, NO.1166LONGRUI AVENUE...',
    transferCurrency: 'USD',
    hasRequisites: true
  };
};
```

### **3. Функция предложения данных**
```typescript
const suggestPaymentMethodAndRequisites = (bankRequisites: any) => {
  // Сохраняем в manualData[4] и manualData[5]
  // Устанавливаем stepConfigs[4] = 'ocr_suggestion'
  // Устанавливаем stepConfigs[5] = 'ocr_suggestion'
};
```

---

## 🎨 **UI КОМПОНЕНТЫ**

### **PaymentMethodForm с предложениями:**
```typescript
{hasSuggestion && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center gap-2 mb-2">
      <Eye className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-800">
        Предложение из инвойса
      </span>
    </div>
    <p className="text-sm text-blue-700 mb-3">
      На основе банковских реквизитов в инвойсе предлагаем:
    </p>
    <div className="bg-white border border-blue-300 rounded p-3">
      <span className="text-sm font-medium">Банковский перевод</span>
    </div>
  </div>
)}
```

### **RequisitesForm с предложениями:**
```typescript
{hasSuggestion && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    {/* Показывает извлеченные реквизиты */}
    {initialData.accountNumber && (
      <div>
        <span className="text-xs text-gray-600">Номер счета:</span>
        <p className="text-sm font-medium">{initialData.accountNumber}</p>
      </div>
    )}
    {/* ... другие поля ... */}
  </div>
)}
```

---

## 🔍 **REGEX ПАТТЕРНЫ**

### **Номер счета:**
```javascript
/USD\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i
/EUR\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i
/Account\s*Number\s*:?\s*(\d+)/i
```

### **SWIFT код:**
```javascript
/SWIFT\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i
/SWIF\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i  // Для опечаток
```

### **Получатель:**
```javascript
/ACCOUNT\s*NAME\s*:?\s*([^\n]+)/i
/ACCOUNT\s*NAME\s*\(账户名称\)\s*:?\s*([^\n]+)/i  // Китайский
```

### **Адрес:**
```javascript
/BENEFICIARY'?S?\s*ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i
/BENEFICIARY'?S?\s*ADDRESS\s*\(收款人地址\)\s*:?\s*([^\n]+(?:\n[^\n]+)*)/i
```

---

## 🧪 **ТЕСТИРОВАНИЕ**

### **Тестовый инвойс:**
```
BENEFICIARY'S INFORMATION (收款人信息)
USD A/C NO. (美元账户号码): 397475795838
SWIF CODE(): BKCHCNBJ92B
ACCOUNT NAME (账户名称): ZHEJIANG GAMMA TRADING CO.,LTD
BENEFICIARY'S ADDRESS (收款人地址): ROOM201, NO.1166LONGRUI AVENUE...
```

### **Ожидаемый результат:**
- ✅ Номер счета: 397475795838
- ✅ SWIFT код: BKCHCNBJ92B
- ✅ Получатель: ZHEJIANG GAMMA TRADING CO.,LTD
- ✅ Адрес: ROOM201, NO.1166LONGRUI AVENUE...
- ✅ Валюта: USD
- ✅ Способ оплаты: Банковский перевод

---

## 🚀 **ПРЕИМУЩЕСТВА**

### **Для пользователя:**
- ✅ **Автоматизация** - не нужно вводить реквизиты с нуля
- ✅ **Контроль** - пользователь проверяет и корректирует
- ✅ **Безопасность** - нет риска ошибок в важных реквизитах
- ✅ **Скорость** - быстрее создание проекта

### **Для системы:**
- ✅ **Интеграция** - работает с существующим OCR
- ✅ **Расширяемость** - легко добавить новые паттерны
- ✅ **Надежность** - валидация извлеченных данных
- ✅ **Логирование** - подробные логи для отладки

---

## 📝 **ПЛАНЫ РАЗВИТИЯ**

### **Краткосрочные:**
- [ ] Добавить поддержку других валют (CNY, RUB)
- [ ] Улучшить паттерны для разных форматов инвойсов
- [ ] Добавить валидацию SWIFT кодов

### **Долгосрочные:**
- [ ] Машинное обучение для улучшения точности
- [ ] Поддержка других типов документов
- [ ] Интеграция с банковскими API для проверки реквизитов 