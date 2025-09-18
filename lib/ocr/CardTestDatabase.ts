/**
 * 🗃️ БАЗА ТЕСТОВЫХ КАРТОЧЕК КОМПАНИЙ
 * Содержит эталонные данные для регрессионного тестирования OCR системы
 */

export interface CompanyCardData {
  id: string;
  name: string;
  status: 'success' | 'partial' | 'failed';
  extractedText: string;
  expectedData: ExpectedCompanyData;
  actualResults?: ExtractedCompanyData;
  issues?: string[];
  dateAdded: string;
  lastTested: string;
  version: string;
}

export interface ExpectedCompanyData {
  companyName: string;
  legalName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  address: string;
  bankName: string;
  bankAccount: string;
  corrAccount: string;
  bankBik: string;
  phone?: string;
  email?: string;
  website?: string;
  director?: string;
}

export interface ExtractedCompanyData {
  [key: string]: {
    value: string;
    confidence: number;
    source: 'pattern' | 'postprocess';
  } | undefined;
}

/**
 * 🗃️ ЭТАЛОННАЯ БАЗА КАРТОЧЕК
 */
export const COMPANY_CARD_DATABASE: { [id: string]: CompanyCardData } = {
  
  "card_001_partner": {
    id: "card_001_partner",
    name: "ПАРТНЕР",
    status: "success",
    dateAdded: "2025-09-10",
    lastTested: "2025-09-12",
    version: "2.0.0",
    extractedText: `
КАРТОЧКА ПРЕДПРИЯТИЯ

ООО "ПАРТНЕР"

ИНН / КПП
9716000221 / 971601419

ОГРН
1027716000229

Юридический адрес
115432, г. Москва, проспект Андропова, д.38, корп.3

Наименование банка
АЛЬФА-БАНК

БИК банка
044525593

Расчётный счет
40702810123450101230

Корреспондентский счет
30101810200000000593

Телефон
+7 (495) 123-45-67

E-mail
info@partner.ru
    `,
    expectedData: {
      companyName: "ПАРТНЕР",
      legalName: "ООО \"ПАРТНЕР\"",
      inn: "9716000221",
      kpp: "971601419", 
      ogrn: "1027716000229",
      address: "115432, г. Москва, проспект Андропова, д.38, корп.3",
      bankName: "АЛЬФА-БАНК",
      bankAccount: "40702810123450101230",
      corrAccount: "30101810200000000593",
      bankBik: "044525593",
      phone: "+7 (495) 123-45-67",
      email: "info@partner.ru"
    },
    issues: []
  },

  "card_002_itgroup": {
    id: "card_002_itgroup", 
    name: "АЙ ТИ ГРУП",
    status: "success",
    dateAdded: "2025-09-10",
    lastTested: "2025-09-12", 
    version: "2.0.0",
    extractedText: `
Общество с ограниченной ответственностью "АЙ ТИ ГРУП"
ИНН 7701234567 КПП 770101001
ОГРН 1027701234567

Юридический адрес: 
123456, г. Москва, ул. Тверская, д. 1

Банковские реквизиты:
ПАО СБЕРБАНК
БИК 044525225
Расчетный счет 40702810938000123456
Корреспондентский счет 30101810400000000225

Контакты:
Тел: +7 (495) 987-65-43
Email: contact@itgroup.ru
    `,
    expectedData: {
      companyName: "АЙ ТИ ГРУП",
      legalName: "Общество с ограниченной ответственностью \"АЙ ТИ ГРУП\"",
      inn: "7701234567",
      kpp: "770101001",
      ogrn: "1027701234567", 
      address: "123456, г. Москва, ул. Тверская, д. 1",
      bankName: "ПАО СБЕРБАНК", 
      bankAccount: "40702810938000123456",
      corrAccount: "30101810400000000225",
      bankBik: "044525225",
      phone: "+7 (495) 987-65-43",
      email: "contact@itgroup.ru"
    },
    issues: []
  },

  "card_003_volsevmash": {
    id: "card_003_volsevmash",
    name: "ВОЛСЕВМАШ", 
    status: "success",
    dateAdded: "2025-09-10",
    lastTested: "2025-09-12",
    version: "2.0.0",
    extractedText: `
ООО "ВОЛСЕВМАШ"
8801234567 / 880101001
ОГРН: 1028801234567

Адрес: 400001, г. Волгоград, ул. Мира, 15

Банк: ВТБ (ПАО)  
БИК: 044525187
Расчётный счёт: 40702810200001234567
Корр. счёт: 30101810700000000187

+7 (8442) 12-34-56
    `,
    expectedData: {
      companyName: "ВОЛСЕВМАШ",
      legalName: "ООО \"ВОЛСЕВМАШ\"",
      inn: "8801234567",
      kpp: "880101001",
      ogrn: "1028801234567",
      address: "400001, г. Волгоград, ул. Мира, 15",
      bankName: "ВТБ (ПАО)",
      bankAccount: "40702810200001234567", 
      corrAccount: "30101810700000000187",
      bankBik: "044525187",
      phone: "+7 (8442) 12-34-56"
    },
    issues: ["email", "website"] // Не найдены в карточке
  },

  "card_004_baisyuhan": {
    id: "card_004_baisyuhan",
    name: "БАЙСЮХАН",
    status: "failed",
    dateAdded: "2025-09-12", 
    lastTested: "2025-09-12",
    version: "2.0.0",
    extractedText: `
Покупатель:
ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "БАЙСЮХАН"
ИНН: 9705227092
ОГРН: 1247700449480
Юридический адрес: г Москва, ул Летниковская, д 10 стр 2, кв./оф. ПОМЕЩ. 18/10
Реквизиты в ФИЛИАЛ "САНКТ-ПЕТЕРБУРГСКИЙ" АО "АЛЬФА-БАНК"
БИК: 044030786
К/с: 3010181060000000786 в СЕВЕРО-ЗАПАДНОЕ ГУ БАНКА РОССИИ
Номер счета: 40702810232410015485
    `,
    expectedData: {
      companyName: "БАЙСЮХАН",
      legalName: "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \"БАЙСЮХАН\"",
      inn: "9705227092",
      kpp: "", // Не указан в карточке
      ogrn: "1247700449480",
      address: "г Москва, ул Летниковская, д 10 стр 2, кв./оф. ПОМЕЩ. 18/10",
      bankName: "АЛЬФА-БАНК",
      bankAccount: "40702810232410015485",
      corrAccount: "3010181060000000786", 
      bankBik: "044030786"
    },
    issues: [
      "ИНН не извлекается из формата 'ИНН: 9705227092'",
      "ОГРН не извлекается из формата 'ОГРН: 1247700449480'", 
      "К/с не распознается в формате 'К/с: 3010181060000000786'",
      "БИК не извлекается из формата 'БИК: 044030786'"
    ]
  },

  "card_005_nagovitsin": {
    id: "card_005_nagovitsin",
    name: "НАГОВИЦИН ИП", 
    status: "failed",
    dateAdded: "2025-09-12",
    lastTested: "2025-09-12",
    version: "2.1.2",
    extractedText: `
Карточка предприятия

Полное наименование организации: Индивидуальный предприниматель Наговицин Андрей Алексеевич
Сокращенное наименование организации: ИП Наговицин Андрей Алексеевич
Юридический адрес: 426000, Удмуртская Респ., г Ижевск
Фактический адрес: г Ижевск
Почтовый адрес: 426000, Удмуртская Респ., г Ижевск

ИНН / ОГРНИП: 183271969239 / 325180000053059
ОКПО / ОКАТО / ОКТМО: 2043138162 / 94401365000 / 94701000001

Наименование банка: ООО "ОЗОН Банк"
Корреспондентский счет: 30101810645374525068
БИК: 044525068
Расчетный счет: 40802810100001257933
ИНН / КПП: 970307050 / 770301001

Руководитель: Наговицин Андрей Алексеевич
Электронная почта: andrey.nagovitsin@internet.ru
Телефон: 89524003627
    `,
    expectedData: {
      companyName: "НАГОВИЦИН",
      legalName: "Индивидуальный предприниматель Наговицин Андрей Алексеевич",
      inn: "183271969239", 
      kpp: "770301001",
      ogrn: "325180000053059", // ОГРНИП для ИП
      address: "426000, Удмуртская Респ., г Ижевск",
      bankName: "ОЗОН Банк",
      bankAccount: "40802810100001257933",
      corrAccount: "30101810645374525068",
      bankBik: "044525068", 
      phone: "+7 (952) 400-36-27",
      email: "andrey.nagovitsin@internet.ru",
      director: "Наговицин Андрей Алексеевич"
    },
    issues: [
      "Название банка извлекается неправильно: 'ООО' вместо 'ОЗОН Банк'",
      "Расчетный счет перепутался с корреспондентским",
      "Название компании извлекается как 'Карточка предприятия'",
      "ИП формат не распознается правильно"
    ]
  },

  "card_006_komplektpro": {
    id: "card_006_komplektpro",
    name: "КОМПЛЕКТПРО",
    status: "success",
    dateAdded: "2025-09-12",
    lastTested: "2025-09-12", 
    version: "2.2.1",
    extractedText: `
ИНН 9731074981, КПП 772201001, ОГРН 1217700042340 ОКПО 47068057 ОКТМО - 45388000000

Зарегистрировано в ИФНС России № 22 по г. Москве, 111024, г. Москва, шоссе Энтузиастов, д. 14

ООО "КОМПЛЕКТПРО" в
Публичное акционерное общество «Сбербанк России»
Р/счет – 40702810738000084434
К/счет – 30101810400000000225
БИК – 044525225

Генеральный директор ООО "Комплектпро"
Беляев Сергей Борисович (действует на основании Уставa) +7 950 246-60-05
    `,
    expectedData: {
      companyName: "КОМПЛЕКТПРО",
      legalName: "ООО \"КОМПЛЕКТПРО\"",
      inn: "9731074981",
      kpp: "772201001",
      ogrn: "1217700042340",
      address: "111024, г. Москва, шоссе Энтузиастов, д. 14",
      bankName: "Сбербанк России",
      bankAccount: "40702810738000084434",
      corrAccount: "30101810400000000225",
      bankBik: "044525225",
      director: "Беляев Сергей Борисович"
    },
    issues: []
  },

  "card_007_engelsky_metal": {
    id: "card_007_engelsky_metal",
    name: "ЭНГЕЛЬССКИЙ МЕТАЛЛ",
    status: "success",
    dateAdded: "2025-09-12",
    lastTested: "2025-09-12",
    version: "2.2.2",
    extractedText: `
Карточка предприятия

Наименование предприятия  
ООО "Энгельсский металл"

ИНН/КПП: 6449091357\\6449091001
ОГРН: 1186451018324 от 07.08.2018 г.
Главный бухгалтер: Тюленев Алексей Михайлович

Адрес местонахождения
410000, РОССИЯ, САРАТОВСКАЯ ОБЛ, г Энгельс, ул Химиков, д 2А

ОКПО ОГРН
32359263
1186451018324 от 07.08.2018 г Инспекция Федеральной налоговой службы № 25 по Саратовской области
    `,
    expectedData: {
      companyName: "Энгельсский металл",
      legalName: "ООО \"Энгельсский металл\"",
      inn: "6449091357",
      kpp: "6449091001",
      ogrn: "1186451018324",
      address: "410000, РОССИЯ, САРАТОВСКАЯ ОБЛ, г Энгельс, ул Химиков, д 2А",
      bankName: "", // Банковские данные отсутствуют
      bankAccount: "",
      corrAccount: "",
      bankBik: "",
      director: "Тюленев Алексей Михайлович"
    },
    issues: []
  },

  "card_008_trubniy_potok": {
    id: "card_008_trubniy_potok",
    name: "ТРУБНЫЙ ПОТОК ПЕРЕРАБОТКА",
    status: "success",
    dateAdded: "2025-09-12",
    lastTested: "2025-09-12",
    version: "2.3.2",
    extractedText: `
Общество с ограниченной ответственностью «Трубный Поток Переработка»

ИНН: 2014032944
КПП: 201401001  
ОГРН: 1212000009572

Юридический адрес: 366020, Чеченская Республика, г.о. город Грозный, г. Грозный, р-н Ахматовский, ул. им. У.Д. Димаева, д. 14, этаж 2, пом

Расчетный счет: 40702810400250001112
Корреспондентский счет: 30101810145250000411
БИК: 044525411
Банк: ФИЛИАЛ "ЦЕНТРАЛЬНЫЙ" БАНКА ВТБ (ПАО)
    `,
    expectedData: {
      companyName: "Трубный Поток Переработка",
      legalName: "Общество с ограниченной ответственностью «Трубный Поток Переработка»",
      inn: "2014032944",
      kpp: "201401001",
      ogrn: "1212000009572",
      address: "366020, Чеченская Республика, г.о. город Грозный, г. Грозный, р-н Ахматовский, ул. им. У.Д. Димаева, д. 14, этаж 2, пом",
      bankName: "ФИЛИАЛ \"ЦЕНТРАЛЬНЫЙ\" БАНКА ВТБ (ПАО)",
      bankAccount: "40702810400250001112",
      corrAccount: "30101810145250000411",
      bankBik: "044525411"
    },
    issues: []
  },

  "card_009_favorit": {
    id: "card_009_favorit",
    name: "ООО ФАВОРИТ",
    status: "success",
    dateAdded: "2025-09-12",
    lastTested: "2025-09-12",
    version: "2.3.3",
    extractedText: `
ООО ФАВОРИТ
Адрес 625041, Тюменская область, г.о. город Тюмень, г Тюмень, ул Бакинских
Комиссаров, д. 1, помещ. 6
ИНН 7203563629
КПП 720301001
рсчет 40702810500000011819
Банк АО Банк Русский Стандарт»
кс 30101810845250000151
БИК 044525151
ГЕНЕРАЛЬНЫЙ ДИРЕКТОР Барышева Мария Дмитриевна
    `,
    expectedData: {
      companyName: "ООО ФАВОРИТ",
      legalName: "ООО ФАВОРИТ",
      inn: "7203563629",
      kpp: "720301001",
      ogrn: "", // Отсутствует в карточке
      address: "625041, Тюменская область, г.о. город Тюмень, г Тюмень, ул Бакинских Комиссаров, д. 1, помещ. 6",
      bankName: "АО Банк Русский Стандарт",
      bankAccount: "40702810500000011819",
      corrAccount: "30101810845250000151", 
      bankBik: "044525151",
      director: "Барышева Мария Дмитриевна"
    },
    issues: []
  }
};

/**
 * 🧪 АВТОМАТИЧЕСКОЕ ТЕСТИРОВАНИЕ ВСЕХ КАРТОЧЕК
 */
export async function runRegressionTests(extractorFunction: (text: string) => any): Promise<{
  totalCards: number;
  successfulCards: number;
  failedCards: string[];
  regressions: string[];
  newIssues: string[];
}> {
  const results = {
    totalCards: 0,
    successfulCards: 0, 
    failedCards: [] as string[],
    regressions: [] as string[],
    newIssues: [] as string[]
  };

  for (const [cardId, cardData] of Object.entries(COMPANY_CARD_DATABASE)) {
    results.totalCards++;
    
    try {
      const extractedData = extractorFunction(cardData.extractedText);
      
      // Проверяем обязательные поля
      const requiredFields = ['companyName', 'inn', 'ogrn', 'bankAccount'];
      let fieldsFound = 0;
      
      for (const field of requiredFields) {
        if (extractedData[field] && extractedData[field].value) {
          fieldsFound++;
        }
      }
      
      const successThreshold = requiredFields.length * 0.75; // 75% полей должны быть найдены
      const isSuccess = fieldsFound >= successThreshold;
      
      if (isSuccess) {
        results.successfulCards++;
        
        // Проверяем на регрессии (карточка работала раньше, но сломалась)
        if (cardData.status === 'success') {
          // Сравниваем с ожидаемыми данными
          const missingFields = requiredFields.filter(field => 
            cardData.expectedData[field as keyof ExpectedCompanyData] && 
            (!extractedData[field] || !extractedData[field].value)
          );
          
          if (missingFields.length > 0) {
            results.regressions.push(`${cardData.name}: потеряны поля ${missingFields.join(', ')}`);
          }
        }
      } else {
        results.failedCards.push(cardData.name);
        
        // Проверяем на новые проблемы
        if (cardData.status === 'success') {
          results.regressions.push(`${cardData.name}: карточка перестала работать`);
        }
      }
      
    } catch (error) {
      results.failedCards.push(cardData.name);
      results.newIssues.push(`${cardData.name}: ошибка обработки - ${error}`);
    }
  }
  
  return results;
}

/**
 * 📊 ГЕНЕРАЦИЯ ОТЧЕТА ПО БАЗЕ КАРТОЧЕК
 */
export function generateCardDatabaseReport(): {
  totalCards: number;
  byStatus: { [status: string]: number };
  commonIssues: { [issue: string]: number };
  recommendations: string[];
} {
  const report = {
    totalCards: Object.keys(COMPANY_CARD_DATABASE).length,
    byStatus: {} as { [status: string]: number },
    commonIssues: {} as { [issue: string]: number },
    recommendations: [] as string[]
  };
  
  // Подсчитываем статусы
  Object.values(COMPANY_CARD_DATABASE).forEach(card => {
    report.byStatus[card.status] = (report.byStatus[card.status] || 0) + 1;
    
    // Подсчитываем частые проблемы
    card.issues?.forEach(issue => {
      report.commonIssues[issue] = (report.commonIssues[issue] || 0) + 1;
    });
  });
  
  // Генерируем рекомендации
  const failedCount = report.byStatus.failed || 0;
  if (failedCount > 0) {
    report.recommendations.push(`Исправить ${failedCount} неработающих карточек`);
  }
  
  const mostCommonIssue = Object.entries(report.commonIssues)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (mostCommonIssue) {
    report.recommendations.push(`Приоритет: ${mostCommonIssue[0]} (встречается в ${mostCommonIssue[1]} карточках)`);
  }
  
  return report;
}

/**
 * 🔍 ПОИСК КАРТОЧКИ ПО ПАТТЕРНУ
 */
export function findCardsByPattern(pattern: RegExp): {
  cardName: string;
  matches: RegExpMatchArray[];
}[] {
  const results = [];
  
  for (const [cardId, cardData] of Object.entries(COMPANY_CARD_DATABASE)) {
    const matches = Array.from(cardData.extractedText.matchAll(pattern));
    if (matches.length > 0) {
      results.push({
        cardName: cardData.name,
        matches
      });
    }
  }
  
  return results;
}

/**
 * ✅ ВАЛИДАЦИЯ НОВОГО ПАТТЕРНА
 */
export function validatePatternOnAllCards(fieldName: string, newPattern: RegExp): {
  cardName: string;
  shouldFind: boolean;
  actuallyFound: boolean;
  extractedValue?: string;
}[] {
  const results = [];
  
  for (const [cardId, cardData] of Object.entries(COMPANY_CARD_DATABASE)) {
    const expectedValue = cardData.expectedData[fieldName as keyof ExpectedCompanyData];
    const shouldFind = !!expectedValue;
    
    const matches = Array.from(cardData.extractedText.matchAll(newPattern));
    const actuallyFound = matches.length > 0;
    const extractedValue = matches[0]?.[1];
    
    results.push({
      cardName: cardData.name,
      shouldFind,
      actuallyFound,
      extractedValue
    });
  }
  
  return results;
}

export default {
  COMPANY_CARD_DATABASE,
  runRegressionTests,
  generateCardDatabaseReport,
  findCardsByPattern,
  validatePatternOnAllCards
};