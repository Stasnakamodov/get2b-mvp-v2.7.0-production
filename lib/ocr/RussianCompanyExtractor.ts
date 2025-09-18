import { 
  RUSSIAN_COMPANY_PATTERNS, 
  PatternResult, 
  calculateBaseConfidence, 
  calculateContextBonus 
} from './RussianCompanyPatterns';

export interface ExtractedField {
  value: string;
  confidence: number;
  source: 'pattern' | 'context' | 'fallback';
  alternatives?: string[];
}

export interface ExtractedCompanyData {
  companyName?: ExtractedField;
  legalName?: ExtractedField;
  inn?: ExtractedField;
  kpp?: ExtractedField;
  ogrn?: ExtractedField;
  bankName?: ExtractedField;
  bankAccount?: ExtractedField;
  bankBik?: ExtractedField;
  corrAccount?: ExtractedField;
  phone?: ExtractedField;
  email?: ExtractedField;
  address?: ExtractedField;
  director?: ExtractedField;
  overallConfidence: number;
  extractedFields: number;
}

export class RussianCompanyExtractor {
  
  /**
   * Основная функция извлечения данных компании
   */
  extractCompanyData(text: string): ExtractedCompanyData {
    console.log('🔍 [RussianCompanyExtractor] Начинаем извлечение данных компании');
    console.log('📄 [RussianCompanyExtractor] Длина текста:', text.length);
    console.log('📄 [RussianCompanyExtractor] Первые 200 символов:', text.substring(0, 200));

    const results: Partial<ExtractedCompanyData> = {};
    
    // Извлекаем каждое поле
    results.inn = this.extractField(text, 'inn', RUSSIAN_COMPANY_PATTERNS.inn);
    results.kpp = this.extractField(text, 'kpp', RUSSIAN_COMPANY_PATTERNS.kpp);
    results.ogrn = this.extractField(text, 'ogrn', RUSSIAN_COMPANY_PATTERNS.ogrn);
    results.companyName = this.extractField(text, 'companyName', RUSSIAN_COMPANY_PATTERNS.companyName);
    
    // Проверяем, что legalName паттерны существуют
    if (RUSSIAN_COMPANY_PATTERNS.legalName) {
      results.legalName = this.extractField(text, 'legalName', RUSSIAN_COMPANY_PATTERNS.legalName);
    } else {
      console.log('⚠️ [RussianCompanyExtractor] legalName паттерны не найдены!');
    }
    results.bankName = this.extractField(text, 'bankName', RUSSIAN_COMPANY_PATTERNS.bankName);
    results.bankAccount = this.extractField(text, 'bankAccount', RUSSIAN_COMPANY_PATTERNS.bankAccount);
    results.bankBik = this.extractField(text, 'bankBik', RUSSIAN_COMPANY_PATTERNS.bankBik);
    results.corrAccount = this.extractField(text, 'corrAccount', RUSSIAN_COMPANY_PATTERNS.corrAccount);
    results.phone = this.extractField(text, 'phone', RUSSIAN_COMPANY_PATTERNS.phone);
    results.email = this.extractField(text, 'email', RUSSIAN_COMPANY_PATTERNS.email);
    results.address = this.extractField(text, 'address', RUSSIAN_COMPANY_PATTERNS.address);
    results.director = this.extractField(text, 'director', RUSSIAN_COMPANY_PATTERNS.director);

    // Пост-обработка и валидация
    this.postProcessResults(results, text);

    // Рассчитываем общую статистику
    const extractedFields = Object.values(results).filter(field => 
      field && typeof field === 'object' && 'value' in field && field.value
    ).length;

    const confidenceFields = Object.values(results).filter(
      (field): field is ExtractedField => 
        field !== undefined && 
        typeof field === 'object' && 
        'confidence' in field && 
        'value' in field
    );
    
    const totalConfidence = confidenceFields.reduce(
      (sum, field) => sum + field.confidence, 
      0
    );

    const overallConfidence = extractedFields > 0 ? Math.round(totalConfidence / extractedFields) : 0;

    console.log('📊 [RussianCompanyExtractor] Результаты извлечения:');
    console.log(`   - Извлечено полей: ${extractedFields}`);
    console.log(`   - Общая уверенность: ${overallConfidence}%`);

    return {
      ...results,
      extractedFields,
      overallConfidence
    } as ExtractedCompanyData;
  }

  /**
   * Извлекает конкретное поле используя массив паттернов
   */
  private extractField(text: string, fieldType: string, patterns: RegExp[]): ExtractedField | undefined {
    const alternatives: string[] = [];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        let value = this.extractValueFromMatch(match, fieldType);
        
        if (!value) continue;
        
        // Очистка и валидация значения
        value = this.cleanValue(value, fieldType);
        
        if (!this.validateValue(value, fieldType, text)) {
          alternatives.push(value);
          continue;
        }

        // Рассчитываем уверенность
        const baseConfidence = calculateBaseConfidence(i, patterns.length);
        const contextBonus = calculateContextBonus(match, fieldType);
        const confidence = Math.min(baseConfidence + contextBonus, 99);

        console.log(`✅ [${fieldType}] Найдено: "${value}" (confidence: ${confidence}%)`);

        return {
          value,
          confidence,
          source: i < 3 ? 'pattern' : i < 6 ? 'context' : 'fallback',
          alternatives: alternatives.length > 0 ? alternatives : undefined
        };
      }
    }

    if (alternatives.length > 0) {
      console.log(`⚠️ [${fieldType}] Найдены альтернативы, но не прошли валидацию:`, alternatives);
    }

    console.log(`❌ [${fieldType}] Не найдено`);
    return undefined;
  }

  /**
   * Извлекает значение из regex матча
   */
  private extractValueFromMatch(match: RegExpMatchArray, fieldType: string): string {
    // Для большинства паттернов берем первую группу
    if (match[1]) return match[1].trim();
    
    // Для некоторых паттернов может быть вторая или третья группа
    if (fieldType === 'companyName' && match[2]) {
      return (match[1] + ' ' + match[2]).trim();
    }
    
    // Если нет групп, берем весь матч
    return match[0].trim();
  }

  /**
   * Очищает значение от OCR артефактов
   */
  private cleanValue(value: string, fieldType: string): string {
    // Базовая очистка
    let cleaned = value.trim();
    
    // Специфичная очистка для разных типов полей
    switch (fieldType) {
      case 'inn':
      case 'kpp':
      case 'ogrn':
      case 'bankAccount':
      case 'bankBik':
        // Убираем все кроме цифр
        cleaned = cleaned.replace(/[^\d]/g, '');
        break;
        
      case 'companyName':
        // Убираем лишние кавычки и пробелы
        cleaned = cleaned
          .replace(/^["«]+/, '')
          .replace(/["»]+$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        break;
        
      case 'phone':
        // Стандартизируем формат телефона
        // Сначала убираем ненужные символы кроме цифр, +, -, скобок и пробелов
        cleaned = cleaned.replace(/[^\d+\-\(\)\s]/g, '');
        // Затем убираем все кроме цифр и +
        cleaned = cleaned.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('8')) {
          cleaned = '+7' + cleaned.substring(1);
        }
        break;
        
      case 'email':
        // Приводим к нижнему регистру
        cleaned = cleaned.toLowerCase();
        break;
        
      case 'bankBik':
        // Убираем возможную латинскую 'p' вместо русской 'р'
        cleaned = cleaned.replace(/^[pр]/, '');
        break;
    }
    
    return cleaned;
  }

  /**
   * Валидирует извлеченное значение
   */
  private validateValue(value: string, fieldType: string, originalText?: string): boolean {
    if (!value || value.length === 0) return false;
    
    switch (fieldType) {
      case 'inn':
        // Базовая валидация длины
        if (!/^\d{10}$|^\d{12}$/.test(value)) return false;
        
        // 🔥 ЗАЩИТА ОТ ЛОЖНОГО INN ИЗ ОГРН
        if (originalText && this.isInnFromOgrn(value, originalText)) {
          console.log(`❌ [validateValue] Отклонён ложный INN из ОГРН: ${value}`);
          return false;
        }
        
        return true;
        
      case 'kpp':
        return /^\d{9}$/.test(value);
        
      case 'ogrn':
        return /^\d{13}$|^\d{15}$/.test(value);
        
      case 'bankAccount':
        return /^\d{20}$/.test(value);
        
      case 'corrAccount':
        // Корреспондентские счета могут быть 19-20 цифр (разные банки)
        return /^\d{19,20}$/.test(value);
        
      case 'bankBik':
        return /^\d{9}$/.test(value);
        
      case 'companyName':
        // 🔥🔥🔥 КРИТИЧЕСКАЯ ВАЛИДАЦИЯ: Отклоняем заголовки документов
        const documentHeaders = [
          'Карточка предприятия',
          'Карточка учета',
          'Карточка организации', 
          'Основная информация',
          'Реквизиты компании',
          'Сведения о компании',
          'Название проекта',
          'Наименование документа'
        ];
        
        // Более строгая проверка - точное совпадение или содержание
        if (documentHeaders.some(header => 
          value.includes(header) || 
          value.toLowerCase().includes('карточк') ||
          value.toLowerCase().includes('проект') ||
          value.toLowerCase().includes('документ')
        )) {
          console.log(`❌ [validateValue] Отклонён заголовок документа как название: ${value}`);
          return false;
        }
        
        // Дополнительная проверка на описательные фразы
        const descriptivePatterns = [
          /название\s+проекта/i,
          /наименование\s+документа/i,
          /карточка\s+/i,
          /основная\s+информация/i
        ];
        
        if (descriptivePatterns.some(pattern => pattern.test(value))) {
          console.log(`❌ [validateValue] Отклонена описательная фраза как название: ${value}`);
          return false;
        }
        
        return value.length >= 3 && value.length <= 200 && 
               /[а-яёА-ЯЁa-zA-Z]/.test(value);
        
      case 'phone':
        return /^\+?[78]\d{10}$/.test(value.replace(/[^\d+]/g, ''));
        
      case 'email':
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
        
      case 'address':
        // 🔥🔥🔥 КРИТИЧЕСКАЯ ВАЛИДАЦИЯ: Отклоняем описательный текст
        if (value.includes('соответствии') || 
            value.includes('документами') || 
            value.includes('Учредительными') ||
            value.includes('соответствии с Учредительными документами') ||
            value.match(/^\s*\([^)]*\)\s*$/)) {
          console.log(`❌ [validateValue] Отклонён описательный адрес: ${value}`);
          return false;
        }
        
        // Проверяем, что это похоже на реальный адрес (есть цифры или географические маркеры)
        const hasAddressMarkers = /\d{6}|город|г\.|обл\.|область|Российская\s+Федерация|ул\.|улица|пр\.|проспект|д\.|дом/.test(value);
        if (!hasAddressMarkers) {
          console.log(`⚠️ [validateValue] Адрес без географических маркеров: ${value}`);
          return false;
        }
        
        return value.length >= 10 && value.length <= 300;
        
      case 'director':
        return value.length >= 5 && /[А-ЯЁ]/.test(value);
        
      default:
        return value.length > 0;
    }
  }

  /**
   * Пост-обработка результатов
   */
  private postProcessResults(results: Partial<ExtractedCompanyData>, text: string): void {
    // Обработка формата ИНН/КПП
    this.handleInnKppFormat(results, text);
    
    // Очистка названий банков
    this.cleanBankName(results);
    
    // Поиск отсутствующих БИК
    this.findMissingBik(results, text);
    
    // Поиск отсутствующих телефонов
    this.findMissingPhone(results, text);

    // Дополнительная обработка банковских счетов
    this.processBankAccounts(results, text);

    // Если название компании слишком короткое, попробуем найти лучшее
    if (results.companyName && results.companyName.value.length < 10 && results.companyName.confidence < 80) {
      const betterName = this.findBetterCompanyName(text, results.companyName.value);
      if (betterName) {
        console.log('🔄 [postProcess] Заменяем короткое название на лучшее:', betterName);
        results.companyName.value = betterName;
        results.companyName.confidence += 10;
      }
    }

    // Валидация и форматирование телефона
    if (results.phone) {
      const cleanPhone = this.cleanValue(results.phone.value, 'phone');
      if (this.validateValue(cleanPhone, 'phone')) {
        results.phone.value = this.formatPhone(cleanPhone);
      }
    }
  }
  
  /**
   * 🔥 УЛУЧШЕННАЯ обработка формата ИНН/КПП
   */
  private handleInnKppFormat(results: Partial<ExtractedCompanyData>, text: string): void {
    console.log('🔗 [handleInnKppFormat] Ищем формат ИНН/КПП в тексте...');
    
    // Расширенные паттерны для поиска ИНН/КПП - поддержка всех возможных форматов
    const innKppPatterns = [
      // Прямой формат с ключевыми словами
      /ИНН\s*[\/\\]\s*КПП[:\s\n]*(\d{10})\s*[\/\\]\s*(\d{9})/gi,
      /ИНН[:\s]+(\d{10})\s*[\/\\]\s*КПП[:\s]+(\d{9})/gi,
      
      // Просто два числа через слэш
      /(\d{10})\s*[\/\\]\s*(\d{9})/g,
      
      // С переносом строки
      /ИНН\s*[\/\\]\s*КПП\s*\n\s*(\d{10})\s*[\/\\]\s*(\d{9})/gi,
      
      // В скобках или с другими разделителями
      /ИНН[:\s]*(\d{10})[,\s]+КПП[:\s]*(\d{9})/gi,
      
      // Табличный формат
      /\|\s*(\d{10})\s*[\/\\]\s*(\d{9})\s*\|/gi
    ];
    
    let foundInnKpp = false;
    
    for (let i = 0; i < innKppPatterns.length; i++) {
      const pattern = innKppPatterns[i];
      const matches = Array.from(text.matchAll(pattern));
      
      console.log(`🔍 [handleInnKppFormat] Паттерн ${i + 1}: найдено ${matches.length} совпадений`);
      
      for (const match of matches) {
        const innValue = match[1];
        const kppValue = match[2];
        
        console.log(`🔗 [handleInnKppFormat] Найден ИНН/КПП: ${innValue}/${kppValue}`);
        
        // Валидация найденных значений
        if (!/^\d{10}$/.test(innValue) || !/^\d{9}$/.test(kppValue)) {
          console.log(`⚠️ [handleInnKppFormat] Неверный формат, пропускаем: ИНН=${innValue}, КПП=${kppValue}`);
          continue;
        }
        
        // 🔥 ПРИОРИТЕТНАЯ ЗАМЕНА: Если ИНН не найден отдельно или найден с низкой уверенностью
        if (!results.inn || results.inn.confidence < 85) {
          results.inn = {
            value: innValue,
            confidence: 95, // Высокая уверенность для формата ИНН/КПП
            source: 'context'
          };
          console.log('✅ [handleInnKppFormat] Извлечен ИНН из ИНН/КПП формата:', innValue);
        } else {
          console.log(`💡 [handleInnKppFormat] ИНН уже найден с высокой уверенностью (${results.inn.confidence}%), сохраняем: ${results.inn.value}`);
        }
        
        // 🔥 ПРИОРИТЕТНАЯ ЗАМЕНА: Если КПП не найден отдельно или найден неправильно
        if (!results.kpp || results.kpp.confidence < 85 || results.kpp.value !== kppValue) {
          results.kpp = {
            value: kppValue,
            confidence: 95, // Высокая уверенность для формата ИНН/КПП
            source: 'context'
          };
          console.log('✅ [handleInnKppFormat] Извлечен КПП из ИНН/КПП формата:', kppValue);
        } else {
          console.log(`💡 [handleInnKppFormat] КПП уже найден с высокой уверенностью (${results.kpp.confidence}%), но проверяем соответствие`);
          if (results.kpp.value !== kppValue) {
            console.log(`🔄 [handleInnKppFormat] Заменяем КПП ${results.kpp.value} на ${kppValue} из формата ИНН/КПП`);
            results.kpp.value = kppValue;
            results.kpp.confidence = 95;
          }
        }
        
        foundInnKpp = true;
        break; // Берем первое валидное соответствие
      }
      
      if (foundInnKpp) break;
    }
    
    if (foundInnKpp) {
      console.log('✅ [handleInnKppFormat] Успешно обработан формат ИНН/КПП');
    } else {
      console.log('❌ [handleInnKppFormat] Формат ИНН/КПП не найден в тексте');
    }
  }
  
  /**
   * Очистка названий банков
   */
  private cleanBankName(results: Partial<ExtractedCompanyData>): void {
    if (results.bankName) {
      let cleanName = results.bankName.value;
      const originalName = cleanName;
      
      // Убираем лишние слова и переносы строк
      cleanName = cleanName
        .replace(/Наименование\s+банка[\s\n]*/, '')
        .replace(/БИК\s+банка[\s\n]*/, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Убираем предлог "в" в начале
      cleanName = cleanName.replace(/^в\s+/, '');
      
      // Если после очистки остался слишком короткий или неинформативный текст, попробуем найти банк по контексту
      if (cleanName.length < 3 || cleanName === 'АО' || cleanName === 'ПАО' || cleanName === 'банка') {
        console.log('⚠️ [cleanBankName] Слишком короткое название после очистки:', cleanName);
        
        // Попробуем найти банк по БИК или другим признакам
        if (results.bankBik) {
          const bikValue = results.bankBik.value;
          if (bikValue === '044525593') {
            cleanName = 'АЛЬФА-БАНК';
            console.log('🔍 [cleanBankName] Определен банк по БИК 044525593: АЛЬФА-БАНК');
          } else if (bikValue === '044525225') {
            cleanName = 'ПАО Сбербанк';
            console.log('🔍 [cleanBankName] Определен банк по БИК 044525225: ПАО Сбербанк');
          }
        }
        
        // Если всё ещё нет результата, оставляем оригинальный текст
        if (cleanName.length < 3) {
          cleanName = originalName;
          console.log('🔄 [cleanBankName] Возвращаем оригинальное название');
        }
      }
      
      // Стандартизация названий банков 
      if (cleanName.includes('Сбербанк') || cleanName.includes('СБЕРБАНК')) {
        cleanName = 'ПАО Сбербанк';
      } else if (cleanName.includes('«Сбербанк»') || cleanName.includes('"Сбербанк"')) {
        cleanName = 'ПАО Сбербанк';
      } else if (cleanName.includes('АЛЬФА')) {
        cleanName = 'АЛЬФА-БАНК';
      }
      
      if (cleanName !== results.bankName.value) {
        console.log('🧹 [postProcess] Очищено название банка:', results.bankName.value, '->', cleanName);
        results.bankName.value = cleanName;
        results.bankName.confidence = Math.min(results.bankName.confidence + 10, 95);
      }
    }
  }
  
  /**
   * Поиск отсутствующих БИК
   */
  private findMissingBik(results: Partial<ExtractedCompanyData>, text: string): void {
    if (!results.bankBik) {
      // Поиск БИК рядом с известными текстовыми маркерами
      const bikPatterns = [
        /БИК[\s\n]*(\d{9})/gi,
        /Банковский\s+идентификационный\s+код[\s\n]*(\d{9})/gi,
        /(?:в\s+ПАО\s+Сбербанк|\bПАО\s+СБЕРБАНК)[\s\S]{0,100}?(\d{9})/gi,
        /(\d{9})(?=\s|$)/g
      ];
      
      for (const pattern of bikPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          const bikValue = match[1].replace(/[^\d]/g, '');
          if (bikValue.length === 9) {
            results.bankBik = {
              value: bikValue,
              confidence: 80,
              source: 'context'
            };
            console.log('🔍 [postProcess] Найден пропущенный БИК:', bikValue);
            return;
          }
        }
      }
    }
  }
  
  /**
   * Поиск отсутствующих телефонов
   */
  private findMissingPhone(results: Partial<ExtractedCompanyData>, text: string): void {
    if (!results.phone) {
      // Улучшенные паттерны для поиска телефонов
      const phonePatterns = [
        // Полный формат с кодом страны
        /\+7\s*\(\s*(\d{3})\s*\)\s*(\d{3})\s*-?\s*(\d{2})\s*-?\s*(\d{2})/g,
        // Без кода страны
        /(?:^|\s)\(?\s*(\d{3})\s*\)?\s*(\d{3})\s*-?\s*(\d{2})\s*-?\s*(\d{2})(?:\s*\.{3})?/g,
        // Любой формат 11 цифр
        /(?:\+?7|8)([\s\-\(\)]*(\d[\s\-\(\)]*){10})/g,
        // После ключевых слов
        /(?:Телефон|Phone|Tel)[:\s]+([+\d\s\-\(\)]{10,})/gi
      ];
      
      for (const pattern of phonePatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          let phoneValue = match[0];
          
          // Очистка и нормализация
          phoneValue = this.cleanValue(phoneValue, 'phone');
          
          if (this.validateValue(phoneValue, 'phone')) {
            results.phone = {
              value: this.formatPhone(phoneValue),
              confidence: 85,
              source: 'context'
            };
            console.log('🔍 [postProcess] Найден пропущенный телефон:', results.phone.value);
            return;
          }
        }
      }
    }
  }

  /**
   * Пытается найти лучшее название компании
   */
  private findBetterCompanyName(text: string, currentName: string): string | null {
    const lines = text.split('\n');
    
    // Ищем в первых 10 строках
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      
      if (line.length > currentName.length + 5 && 
          line.length < 100 && 
          /^[А-ЯЁ]/.test(line) &&
          !line.includes('ИНН') &&
          !line.includes('КПП') &&
          !line.includes('ОГРН') &&
          !/^\d/.test(line)) {
        return line;
      }
    }
    
    return null;
  }

  /**
   * Форматирует телефон в стандартный вид
   */
  private formatPhone(phone: string): string {
    const digits = phone.replace(/[^\d]/g, '');
    
    if (digits.length === 11 && digits.startsWith('7')) {
      return `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9)}`;
    }
    
    if (digits.length === 11 && digits.startsWith('8')) {
      return `+7 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7, 9)}-${digits.substring(9)}`;
    }
    
    return phone;
  }

  /**
   * Дополнительная обработка банковских счетов
   */
  private processBankAccounts(results: Partial<ExtractedCompanyData>, text: string): void {
    // Если расчетный счет не найден, ищем изолированные 20-значные числа
    if (!results.bankAccount) {
      const accountPatterns = [
        // Изолированные 20-значные числа в банковском контексте
        /(?:^|\n)\s*(\d{20})\s*(?:\n|$)/gm,
        // 20-значные числа рядом с банковскими полями
        /(?:расчетный|расчётный|р\/с)[\s\S]{0,50}?(\d{20})/gi,
        // Любые 20-значные числа, начинающиеся с 40
        /\b(40\d{18})\b/g
      ];
      
      for (const pattern of accountPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          const accountNumber = match[1];
          
          // Проверяем, что это не корреспондентский счет
          if (results.corrAccount && results.corrAccount.value === accountNumber) {
            continue;
          }
          
          // Банковские счета часто начинаются с 40
          if (accountNumber.startsWith('40')) {
            results.bankAccount = {
              value: accountNumber,
              confidence: 75,
              source: 'pattern'
            };
            console.log('🏦 [postProcess] Найден расчетный счет:', accountNumber);
            break;
          }
        }
      }
    }

    // 🔥 НОВОЕ: Если корреспондентский счет не найден, ищем дополнительно
    if (!results.corrAccount) {
      console.log('🔍 [postProcess] Ищем корреспондентский счет дополнительными паттернами...');
      
      const corrAccountPatterns = [
        // Дополнительные паттерны для корреспондентского счета
        /(?:^|\n)\s*(\d{20})\s*(?:\n|$)/gm,
        // Рядом с БИК или банком
        /БИК[\s\S]{0,100}?(\d{20})/gi,
        /банк[\s\S]{0,100}?(\d{20})/gi,
        // Любые 20-значные числа, начинающиеся с 30 (типично для корр. счетов)
        /\b(30\d{18})\b/g,
        // Все 20-значные числа в банковском контексте
        /\b(\d{20})\b/g
      ];
      
      for (const pattern of corrAccountPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
          const corrAccountNumber = match[1];
          
          // Проверяем, что это не расчетный счет
          if (results.bankAccount && results.bankAccount.value === corrAccountNumber) {
            continue;
          }
          
          // Корреспондентские счета часто начинаются с 30
          if (corrAccountNumber.startsWith('30')) {
            results.corrAccount = {
              value: corrAccountNumber,
              confidence: 85,
              source: 'pattern'
            };
            console.log('🏦 [postProcess] Найден корреспондентский счет:', corrAccountNumber);
            break;
          }
          
          // Если не нашли счет начинающийся с 30, но нашли другой 20-значный
          // и это не расчетный счет - возможно это корр. счет
          if (!corrAccountNumber.startsWith('40') && corrAccountNumber !== results.bankAccount?.value) {
            results.corrAccount = {
              value: corrAccountNumber,
              confidence: 70,
              source: 'pattern'
            };
            console.log('🏦 [postProcess] Найден возможный корреспондентский счет:', corrAccountNumber);
            break;
          }
        }
        
        // Если нашли корр. счет, выходим из цикла
        if (results.corrAccount) break;
      }
      
      if (!results.corrAccount) {
        console.log('❌ [postProcess] Корреспондентский счет не найден дополнительными паттернами');
      }
    }
  }

  /**
   * 🔥 УЛУЧШЕННЫЙ МЕТОД: Проверяет, является ли INN ложным извлечением из ОГРН
   */
  private isInnFromOgrn(innCandidate: string, text: string): boolean {
    console.log(`🔍 [isInnFromOgrn] Проверяем ИНН "${innCandidate}" на ложность из ОГРН`);
    
    // 🔥 ПРИОРИТЕТ 1: Сначала проверим, есть ли этот INN в ПРАВИЛЬНОМ контексте
    const innContextPatterns = [
      new RegExp(`ИНН[:\\s]+${innCandidate}(?=\\s|$)`, 'gi'),  // "ИНН: 1234567890" или "ИНН 1234567890"
      new RegExp(`${innCandidate}\\s*[\\/\\\\]\\s*\\d{9}`, 'gi'),  // "1234567890 / 123456789" (ИНН/КПП)
      new RegExp(`${innCandidate}\\s+\\d{9}(?=\\s|$)`, 'gi'),  // "1234567890 123456789" (ИНН пробел КПП)
      new RegExp(`ИНН\\s*[\\/\\\\]\\s*КПП[:\\s]*${innCandidate}\\s*[\\/\\\\]\\s*\\d{9}`, 'gi')  // "ИНН / КПП: 1234567890 / 123456789"
    ];
    
    let foundInCorrectContext = false;
    for (const pattern of innContextPatterns) {
      if (pattern.test(text)) {
        console.log(`✅ [isInnFromOgrn] ИНН "${innCandidate}" найден в ПРАВИЛЬНОМ контексте - НЕ блокируем`);
        foundInCorrectContext = true;
        break;
      }
    }
    
    // Если ИНН найден в правильном контексте, не блокируем его
    if (foundInCorrectContext) {
      return false;
    }
    
    console.log(`⚠️ [isInnFromOgrn] ИНН "${innCandidate}" НЕ найден в правильном контексте, проверяем на ложность из ОГРН...`);
    
    // 🔥 ПРИОРИТЕТ 2: Только если ИНН НЕ найден в правильном контексте, проверяем на ложность из ОГРН
    const ogrnPattern = /\d{13,15}/g;
    const ogrnMatches = Array.from(text.matchAll(ogrnPattern));
    
    for (const match of ogrnMatches) {
      const ogrnNumber = match[0];
      
      // Проверяем, является ли INN подстрокой ОГРН
      if (ogrnNumber.includes(innCandidate)) {
        // Дополнительная проверка: если ОГРН находится рядом со словами "ОГРН" или "от"
        const matchIndex = match.index!;
        const contextBefore = text.substring(Math.max(0, matchIndex - 30), matchIndex);
        const contextAfter = text.substring(matchIndex + ogrnNumber.length, 
                                           Math.min(text.length, matchIndex + ogrnNumber.length + 30));
        
        // Ключевые слова, указывающие на ОГРН
        const ogrnKeywords = /ОГРН|огрн|регистрационный|государственный|основной/i;
        const dateKeywords = /\bот\b|\bг\.?\b|\d{2}\.\d{2}\.\d{4}/i;
        
        if (ogrnKeywords.test(contextBefore) || ogrnKeywords.test(contextAfter) || dateKeywords.test(contextAfter)) {
          console.log(`🔍 [isInnFromOgrn] Найден контекст ОГРН для "${innCandidate}"`);
          console.log(`   ОГРН: ${ogrnNumber}`);
          console.log(`   Контекст до: "${contextBefore}"`);
          console.log(`   Контекст после: "${contextAfter}"`);
          console.log(`   ❌ БЛОКИРУЕМ как ложный INN из ОГРН`);
          return true;
        }
      }
    }
    
    console.log(`✅ [isInnFromOgrn] ИНН "${innCandidate}" не является ложным из ОГРН`);
    return false;
  }
}