import { type NextRequest, NextResponse } from "next/server";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";
import { RussianCompanyExtractor } from "@/lib/ocr/RussianCompanyExtractor";

export async function POST(request: NextRequest) {
  try {
    console.log("📄 API /document-analysis вызван");

    const body = await request.json();
    const { fileUrl, fileType, documentType } = body;

    if (!fileUrl || !fileType) {
      return NextResponse.json(
        { error: "fileUrl и fileType обязательны" },
        { status: 400 }
      );
    }

    console.log("🔍 Анализируем документ:", {
      fileUrl: fileUrl.substring(0, 100) + "...",
      fileType,
      documentType
    });

    // Получаем сервис Yandex Vision
    const visionService = getYandexVisionService();

    // Извлекаем текст из документа
    const extractedText = await visionService.extractTextFromDocument(fileUrl, fileType);

    console.log("✅ Текст извлечен:", extractedText.substring(0, 500) + "...");
    console.log("📄 Длина извлеченного текста:", extractedText.length);

    // Проверяем, что текст был извлечен
    if (!extractedText || extractedText.trim().length === 0) {
      console.log("⚠️ Текст не был извлечен из документа");
      return NextResponse.json({
        success: false,
        error: "Не удалось извлечь текст из документа",
        suggestions: {
          message: "Попробуйте загрузить документ в другом формате (JPG, PNG, DOCX) или убедитесь, что документ содержит читаемый текст",
          supportedFormats: ["JPG", "PNG", "PDF", "DOCX", "XLSX"]
        }
      });
    }

    // В зависимости от типа документа, формируем результат
    let result = {
      success: true,
      extractedText,
      documentType,
      suggestions: {}
    };

    // Если это карточка компании, пытаемся извлечь структурированные данные
    if (documentType === 'company_card') {
      console.log("🔍 Парсим данные компании с улучшенным экстрактором...");
      console.log("📄 Тип документа:", documentType);
      console.log("📄 Длина текста:", extractedText.length);
      
      const extractor = new RussianCompanyExtractor();
      const extractedData = extractor.extractCompanyData(extractedText);
      
      // Преобразуем в старый формат для совместимости
      result.suggestions = convertToLegacyFormat(extractedData);
      console.log("📊 Результат парсинга:", result.suggestions);
      console.log("📈 Общая уверенность:", extractedData.overallConfidence + "%");
      console.log("📋 Извлечено полей:", extractedData.extractedFields);
    }
    // Если это инвойс, пытаемся извлечь позиции
    else if (documentType === 'invoice') {
      console.log("🔍 Парсим данные инвойса...");
      result.suggestions = await extractInvoiceData(extractedText);
      console.log("📊 Результат парсинга:", result.suggestions);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Ошибка в API document-analysis:", error);
    return NextResponse.json(
      {
        error: "Ошибка анализа документа",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 Преобразует новый формат данных в старый для совместимости с существующим UI
 */
function convertToLegacyFormat(extractedData: any): any {
  const legacy: any = {
    // Добавляем информацию о качестве извлечения
    extractionInfo: {
      overallConfidence: extractedData.overallConfidence,
      extractedFields: extractedData.extractedFields,
      timestamp: new Date().toISOString()
    }
  };

  // Конвертируем каждое поле
  if (extractedData.companyName) {
    legacy.companyName = extractedData.companyName.value;
    legacy.companyNameConfidence = extractedData.companyName.confidence;
  }
  
  if (extractedData.legalName) {
    legacy.legalName = extractedData.legalName.value;
    legacy.legalNameConfidence = extractedData.legalName.confidence;
  }
  
  if (extractedData.inn) {
    legacy.inn = extractedData.inn.value;
    legacy.innConfidence = extractedData.inn.confidence;
  }
  
  if (extractedData.kpp) {
    legacy.kpp = extractedData.kpp.value;
    legacy.kppConfidence = extractedData.kpp.confidence;
  }
  
  if (extractedData.ogrn) {
    legacy.ogrn = extractedData.ogrn.value;
    legacy.ogrnConfidence = extractedData.ogrn.confidence;
  }
  
  if (extractedData.bankName) {
    legacy.bankName = extractedData.bankName.value;
    legacy.bankNameConfidence = extractedData.bankName.confidence;
  }
  
  if (extractedData.bankAccount) {
    legacy.bankAccount = extractedData.bankAccount.value;
    legacy.bankAccountConfidence = extractedData.bankAccount.confidence;
  }
  
  if (extractedData.bankBik) {
    legacy.bankBik = extractedData.bankBik.value;
    legacy.bankBikConfidence = extractedData.bankBik.confidence;
  }
  
  if (extractedData.corrAccount) {
    console.log('✅ [API] Найден corrAccount:', extractedData.corrAccount.value);
    legacy.bankCorrAccount = extractedData.corrAccount.value;
    legacy.bankCorrAccountConfidence = extractedData.corrAccount.confidence;
  } else {
    console.log('❌ [API] corrAccount не найден в extractedData');
    console.log('🔍 [API] Доступные поля:', Object.keys(extractedData));
  }
  
  if (extractedData.phone) {
    legacy.phone = extractedData.phone.value;
    legacy.phoneConfidence = extractedData.phone.confidence;
  }
  
  if (extractedData.email) {
    legacy.email = extractedData.email.value;
    legacy.emailConfidence = extractedData.email.confidence;
  }
  
  if (extractedData.address) {
    legacy.address = extractedData.address.value;
    legacy.addressConfidence = extractedData.address.confidence;
  }
  
  if (extractedData.director) {
    legacy.director = extractedData.director.value;
    legacy.directorConfidence = extractedData.director.confidence;
  }

  return legacy;
}

/**
 * 🗂️ УСТАРЕВШАЯ ФУНКЦИЯ - Извлекает данные компании из текста (заменена на RussianCompanyExtractor)
 * Оставлена для референса и аварийного отката
 */
function extractCompanyDataLegacy(text: string) {
  const suggestions: any = {};
  
  console.log("🔍 Анализируем текст для извлечения данных компании...");
  console.log("📄 Длина текста:", text.length);
  console.log("📄 Первые 500 символов текста:", text.substring(0, 500));
  console.log("📄 Строки текста (первые 10):", text.split('\n').slice(0, 10));
  console.log("📄 Все строки текста:", text.split('\n'));

  // 🔥 УЛУЧШЕННЫЙ ПОИСК ИНН
  const innPatterns = [
    // Основные паттерны
    /\bИНН[:\s]*(\d{10}|\d{12})\b/i,
    /\bИНН[:\s]*(\d{3}-\d{3}-\d{3}-\d{3})\b/i,
    /\b(\d{10}|\d{12})\s*\(ИНН\)/i,
    
    // Паттерны ИНН/КПП
    /\bИНН\/КПП[:\s]*(\d{10})\/(\d{9})\b/i,
    /\b(\d{10})\/(\d{9})\s*\(ИНН\/КПП\)/i,
    /\bИНН\/КПП\s*\n\s*(\d{10})\/(\d{9})\b/i,
    /ИНН\/КПП\s*\n\s*(\d{10})\/(\d{9})/i,
    
    // Паттерны с OCR ошибками
    /\bИНН\/КПП[:\s]*([0-9\s\-_]{10,})\/([0-9\s\-_]{9,})\b/i,
    /ИНН\/КПП\s*\n\s*([0-9\s\-_]{10,})\/([0-9\s\-_]{9,})/i,
    
    // Дополнительные паттерны для ИНН
    /\bИНН\s*\n\s*(\d{10}|\d{12})\b/i,
    /ИНН\s*\n\s*(\d{10}|\d{12})/i,
    
    // Поиск ИНН в контексте
    /(?<=ИНН\s*[:\n]*)(\d{10}|\d{12})/i,
    
    // Поиск ИНН без префикса (если он единственный в строке)
    /^\s*(\d{10}|\d{12})\s*$/im,
    
    // Поиск ИНН с пробелами (OCR ошибки)
    /\bИНН[:\s]*([0-9\s]{10,12})\b/i,
    /ИНН\s*\n\s*([0-9\s]{10,12})/i,
    
    // Поиск ИНН в начале строки (часто встречается в документах)
    /^(\d{10}|\d{12})\s/i,
    /^(\d{10}|\d{12})$/im,
    
    // Поиск ИНН рядом с КПП (без разделителя)
    /(\d{10})\s+(\d{9})/i,
    
    // 🔥 НОВЫЕ ПАТТЕРНЫ для сложных случаев
    /\bИНН[:\s]*([0-9\s\-_\.]{10,12})\b/i,
    /ИНН[:\s]*([0-9\s\-_\.]{10,12})/i,
    /\b([0-9\s\-_\.]{10,12})\s*\(?ИНН\)?/i,
    
    // Поиск ИНН в табличном формате
    /\|\s*(\d{10}|\d{12})\s*\|/i,
    /\|\s*([0-9\s\-_\.]{10,12})\s*\|/i,
    
    // Поиск ИНН после двоеточия
    /:\s*(\d{10}|\d{12})/i,
    /:\s*([0-9\s\-_\.]{10,12})/i
  ];
  
  for (const pattern of innPatterns) {
    const match = text.match(pattern);
    console.log("🔍 Проверяем паттерн ИНН:", pattern.source);
    if (match) {
      // Очищаем ИНН от возможных OCR ошибок
      let inn = match[1].replace(/[-_\s\.]/g, '');
      inn = inn.replace(/\D/g, '');
      
      // Проверяем, что получилось 10 или 12 цифр
      if ((inn.length === 10 || inn.length === 12) && /^\d+$/.test(inn)) {
        suggestions.inn = inn;
        console.log("✅ ИНН найден:", suggestions.inn);
        
        // Если это формат ИНН/КПП, то извлекаем и КПП
        if (match[2]) {
          let kpp = match[2].replace(/[-_\s\.]/g, '');
          kpp = kpp.replace(/\D/g, '');
          
          // Проверяем, что получилось 9 цифр
          if (kpp.length === 9 && /^\d{9}$/.test(kpp)) {
            suggestions.kpp = kpp;
            console.log("✅ КПП найден из ИНН/КПП:", suggestions.kpp);
          }
        }
        break;
      }
    }
  }
  
  // Дополнительная проверка: если ИНН не найден, но есть строка с двумя числами
  if (!suggestions.inn) {
    console.log("🔍 ИНН не найден стандартными паттернами, ищем по контексту...");
    
    // Ищем строки с двумя числами (ИНН + КПП)
    const lines = text.split('\n');
    for (const line of lines) {
      // Ищем формат "ИНН / КПП" или просто два числа через слеш
      const numbersMatch = line.match(/(\d{10})\s*\/\s*(\d{9})/);
      if (numbersMatch) {
        const potentialInn = numbersMatch[1];
        const potentialKpp = numbersMatch[2];
        
        // Проверяем, что это действительно ИНН и КПП
        if (/^\d{10}$/.test(potentialInn) && /^\d{9}$/.test(potentialKpp)) {
          suggestions.inn = potentialInn;
          suggestions.kpp = potentialKpp;
          console.log("✅ ИНН и КПП найдены по контексту:", suggestions.inn, suggestions.kpp);
          break;
        }
      }
    }
  }
  
  // 🔥 ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: если КПП уже найден, но неправильный
  if (suggestions.kpp && suggestions.kpp === '971711419') {
    console.log("⚠️ КПП неправильный, ищем правильный...");
    
    const lines = text.split('\n');
    for (const line of lines) {
      const numbersMatch = line.match(/(\d{10})\s*\/\s*(\d{9})/);
      if (numbersMatch) {
        const potentialInn = numbersMatch[1];
        const potentialKpp = numbersMatch[2];
        
        if (potentialInn === suggestions.inn && /^\d{9}$/.test(potentialKpp)) {
          suggestions.kpp = potentialKpp;
          console.log("✅ Правильный КПП найден:", suggestions.kpp);
          break;
        }
      }
    }
  }
  
  // 🔥 ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: если КПП все еще неправильный
  if (suggestions.kpp && suggestions.kpp === '971711419') {
    console.log("⚠️ КПП все еще неправильный, ищем по строке ИНН / КПП...");
    
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('ИНН / КПП')) {
        const numbersMatch = line.match(/(\d{10})\s*\/\s*(\d{9})/);
        if (numbersMatch) {
          const potentialInn = numbersMatch[1];
          const potentialKpp = numbersMatch[2];
          
          if (potentialInn === suggestions.inn && /^\d{9}$/.test(potentialKpp)) {
            suggestions.kpp = potentialKpp;
            console.log("✅ Правильный КПП найден по строке ИНН / КПП:", suggestions.kpp);
            break;
          }
        }
      }
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК КПП
  const kppPatterns = [
    /\bКПП[:\s]*(\d{9})\b/i,
    /\bКПП[:\s]*(\d{3}-\d{3}-\d{3})\b/i,
    /\b(\d{9})\s*\(КПП\)/i,
    /\bКПП[:\s]*([0-9\s\-_\.]{9})\b/i,
    /КПП[:\s]*([0-9\s\-_\.]{9})/i,
    /\b([0-9\s\-_\.]{9})\s*\(?КПП\)?/i
  ];
  
  for (const pattern of kppPatterns) {
    const match = text.match(pattern);
    if (match) {
      let kpp = match[1].replace(/[-_\s\.]/g, '');
      kpp = kpp.replace(/\D/g, '');
      
      if (kpp.length === 9 && /^\d{9}$/.test(kpp)) {
        suggestions.kpp = kpp;
        console.log("✅ КПП найден:", suggestions.kpp);
        break;
      }
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК ОГРН
  const ogrnPatterns = [
    /\bОГРН[:\s]*(\d{13}|\d{15})\b/i,
    /\bОГРН[:\s]*(\d{1}-\d{4}-\d{4}-\d{4})\b/i,
    /\b(\d{13}|\d{15})\s*\(ОГРН\)/i,
    /\bОГРН\s*\n\s*(\d{13}|\d{15})\b/i,
    /ОГРН\s*\n\s*(\d{13})/i,
    // Улучшенные паттерны для OCR ошибок
    /\bОГРН[:\s]*([0-9\s\-_]{13,15})\b/i,
    /ОГРН\s*\n\s*([0-9\s\-_]{13,15})/i,
    /\b([0-9\s\-_\.]{13,15})\s*\(?ОГРН\)?/i
  ];
  
  for (const pattern of ogrnPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Очищаем ОГРН от возможных OCR ошибок
      let ogrn = match[1].replace(/[-_\s\.]/g, '');
      ogrn = ogrn.replace(/\D/g, '');
      
      // Проверяем, что получилось 13 или 15 цифр
      if ((ogrn.length === 13 || ogrn.length === 15) && /^\d+$/.test(ogrn)) {
        suggestions.ogrn = ogrn;
        console.log("✅ ОГРН найден:", suggestions.ogrn);
        break;
      }
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК НАЗВАНИЯ КОМПАНИИ
  const companyPatterns = [
    // Основные паттерны для ООО, ОАО, ЗАО, ИП
    /\b(ООО|ОАО|ЗАО|ИП)[\s]*["«]?([^»"\n\r]+)["»]?/i,
    /\b(ООО|ОАО|ЗАО|ИП)[\s]*([^,\n\r]+?)(?=\s*(?:ИНН|КПП|ОГРН|Адрес|Банк|$))/i,
    
    // Паттерны с ключевыми словами
    /\bНазвание[:\s]*([^,\n\r]+)/i,
    /\bКомпания[:\s]*([^,\n\r]+)/i,
    /\bОрганизация[:\s]*([^,\n\r]+)/i,
    /\bПолное наименование[:\s]*\n*([^,\n\r]+)/i,
    /\bСокращенное наименование[:\s]*\n*([^,\n\r]+)/i,
    
    // Паттерны для полных названий
    /\bОбщество\s+с\s+ограниченной\s+ответственностью\s*["«]?([^»"\n\r]+)["»]?/i,
    /\bАкционерное\s+общество\s*["«]?([^»"\n\r]+)["»]?/i,
    /\bЗакрытое\s+акционерное\s+общество\s*["«]?([^»"\n\r]+)["»]?/i,
    
    // Паттерны с переносами строк
    /\bПолное наименование\s*\n\s*([^\n\r]+)/i,
    /\bСокращенное наименование\s*\n\s*([^\n\r]+)/i,
    
    // Поиск по структуре документа (название обычно в начале)
    /^[^ИННКППОГРН]*?(ООО|ОАО|ЗАО|ИП)[\s]*["«]?([^»"\n\r]+)["»]?/im,
    
    // Поиск по контексту (между заголовками)
    /(?<=^|\n)([^ИННКППОГРН\n\r]{5,50})(?=\s*\n\s*(?:ИНН|КПП|ОГРН|Адрес|Банк))/im,
    
    // 🔥 НОВЫЕ ПАТТЕРНЫ для сложных случаев
    /\b(ООО|ОАО|ЗАО|ИП)[\s]*([^0-9\n\r]{3,100})/i,
    /^[^0-9]*?(ООО|ОАО|ЗАО|ИП)[\s]*([^0-9\n\r]{3,100})/im,
    /\b(ООО|ОАО|ЗАО|ИП)[\s]*([^|0-9\n\r]{3,100})/i
  ];
  
  // Поиск полного наименования (юридическое название)
  const legalNamePatterns = [
    /Полное наименование\s*\n\s*([^\n]+)/i,
    /\bОбщество\s+с\s+ограниченной\s+ответственностью\s*["«]?([^»"\n]+)["»]?/i
  ];
  
  // Улучшенная логика поиска названия компании
  let foundCompanyName = false;
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      let companyName = '';
      
      if (match[2]) {
        // Если есть вторая группа (название после ООО/ОАО)
        companyName = match[1] + ' ' + match[2];
      } else if (match[1]) {
        // Если есть только первая группа
        companyName = match[1];
      }
      
      // Очищаем название от лишних символов
      companyName = companyName.trim()
        .replace(/^["«]+/, '')  // Убираем кавычки в начале
        .replace(/["»]+$/, '')  // Убираем кавычки в конце
        .replace(/\s+/g, ' ')   // Убираем лишние пробелы
        .replace(/[^\w\s\-«»]/g, '') // Убираем специальные символы кроме дефиса и кавычек
        .trim();
      
      // Проверяем, что название не слишком короткое и не слишком длинное
      if (companyName.length >= 3 && companyName.length <= 200) {
        suggestions.companyName = companyName;
        console.log("✅ Название компании найдено:", suggestions.companyName);
        foundCompanyName = true;
        break;
      }
    }
  }
  
  // 🔥 АГРЕССИВНЫЙ ПОИСК НАЗВАНИЯ КОМПАНИИ
  if (!foundCompanyName) {
    console.log("🔍 Название компании не найдено стандартными паттернами, ищем агрессивно...");
    
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(lines.length, 15); i++) { // Проверяем первые 15 строк
      const line = lines[i].trim();
      
      // Ищем строки с ООО/ОАО/ЗАО/ИП
      const orgMatch = line.match(/\b(ООО|ОАО|ЗАО|ИП)\s*["«]?([^»"\n\r0-9]{3,100})["»]?/i);
      if (orgMatch && orgMatch[2]) {
        const potentialName = orgMatch[1] + ' ' + orgMatch[2].trim();
        if (potentialName.length >= 5 && potentialName.length <= 200) {
          suggestions.companyName = potentialName;
          console.log("✅ Название компании найдено агрессивным поиском:", suggestions.companyName);
          foundCompanyName = true;
          break;
        }
      }
      
      // Ищем строки, содержащие только буквы и пробелы (возможные названия)
      if (line.length > 5 && 
          line.length < 100 && 
          /^[а-яёa-z\s\-«»]+$/i.test(line) &&
          !line.includes('ИНН') &&
          !line.includes('КПП') &&
          !line.includes('ОГРН') &&
          !line.includes('Адрес') &&
          !line.includes('Банк') &&
          !line.includes('КАРТОЧКА') &&
          !line.includes('ПРЕДПРИЯТИЯ') &&
          !line.includes('ОРГАНИЗАЦИЯ')) {
        
        suggestions.companyName = line.trim();
        console.log("✅ Название компании найдено по буквенному паттерну:", suggestions.companyName);
        foundCompanyName = true;
        break;
      }
    }
  }
  
  // 🔥 ДОПОЛНИТЕЛЬНЫЙ ПОИСК: если название все еще не найдено, ищем в первых строках
  if (!foundCompanyName) {
    console.log("🔍 Название компании все еще не найдено, ищем в первых строках...");
    
    const lines = text.split('\n');
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      
      // Ищем строки, содержащие ООО/ОАО/ЗАО/ИП в любом месте
      if (line.includes('ООО') || line.includes('ОАО') || line.includes('ЗАО') || line.includes('ИП')) {
        // Очищаем строку от лишних символов
        let cleanLine = line.replace(/^[^ООООАОЗАОИП]*/, ''); // Убираем все до ООО/ОАО/ЗАО/ИП
        cleanLine = cleanLine.replace(/[^\w\s\-«»]/g, '').trim(); // Очищаем от спецсимволов
        
        if (cleanLine.length >= 5 && cleanLine.length <= 200) {
          suggestions.companyName = cleanLine;
          console.log("✅ Название компании найдено в первых строках:", suggestions.companyName);
          foundCompanyName = true;
          break;
        }
      }
    }
  }
  
  // 🔥 ПОСЛЕДНЯЯ ПОПЫТКА: ищем строки с кавычками
  if (!foundCompanyName) {
    console.log("🔍 Название компании не найдено, ищем строки с кавычками...");
    
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ищем строки с кавычками, содержащие ООО/ОАО/ЗАО/ИП
      if (trimmedLine.includes('"') && 
          (trimmedLine.includes('ООО') || trimmedLine.includes('ОАО') || trimmedLine.includes('ЗАО') || trimmedLine.includes('ИП'))) {
        
        // Извлекаем текст в кавычках
        const quoteMatch = trimmedLine.match(/(ООО|ОАО|ЗАО|ИП)\s*["«]([^»"]+)["»]/i);
        if (quoteMatch) {
          const companyName = quoteMatch[1] + ' "' + quoteMatch[2] + '"';
          suggestions.companyName = companyName;
          console.log("✅ Название компании найдено в кавычках:", suggestions.companyName);
          foundCompanyName = true;
          break;
        }
      }
    }
  }
  
  // Если все еще не найдено, попробуем более агрессивный поиск
  if (!foundCompanyName) {
    console.log("🔍 Название компании все еще не найдено, пробуем агрессивный поиск...");
    
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ищем любые строки, содержащие буквы и не содержащие только цифры
      if (trimmedLine.length > 3 && 
          trimmedLine.length < 100 && 
          /[а-яёa-z]/i.test(trimmedLine) && 
          !/^\d+$/.test(trimmedLine.replace(/\s/g, '')) &&
          !trimmedLine.includes('ИНН') &&
          !trimmedLine.includes('КПП') &&
          !trimmedLine.includes('ОГРН') &&
          !trimmedLine.includes('Адрес') &&
          !trimmedLine.includes('Банк') &&
          !trimmedLine.includes('БИК') &&
          !trimmedLine.includes('Счет')) {
        
        suggestions.companyName = trimmedLine;
        console.log("✅ Название компании найдено агрессивным поиском:", suggestions.companyName);
        foundCompanyName = true;
        break;
      }
    }
  }
  
  // Проверяем и очищаем неправильно извлеченные данные
  if (suggestions.companyName) {
    // Если название компании содержит только цифры и пробелы, это скорее всего ИНН/КПП
    const onlyNumbers = suggestions.companyName.replace(/\s/g, '').replace(/\D/g, '');
    if (onlyNumbers.length >= 15 && onlyNumbers.length <= 25) {
      console.log("⚠️ Название компании содержит только цифры, вероятно это ИНН/КПП:", suggestions.companyName);
      console.log("🔍 Очищаем название компании и ищем реальное название...");
      
      // Очищаем название компании
      suggestions.companyName = '';
      foundCompanyName = false;
      
      // Ищем реальное название компании в других строках
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Ищем строки с ООО/ОАО/ЗАО/ИП, но не содержащие только цифры
        const orgMatch = trimmedLine.match(/\b(ООО|ОАО|ЗАО|ИП)\s*["«]?([^»"\n\r0-9]+)["»]?/i);
        if (orgMatch && orgMatch[2]) {
          const potentialName = orgMatch[1] + ' ' + orgMatch[2].trim();
          if (potentialName.length >= 5 && potentialName.length <= 200) {
            suggestions.companyName = potentialName;
            console.log("✅ Реальное название компании найдено:", suggestions.companyName);
            foundCompanyName = true;
            break;
          }
        }
      }
    }
  }
  
  // 🔥 ДОПОЛНИТЕЛЬНЫЙ ПОИСК: если название все еще пустое, ищем в кавычках
  if (!suggestions.companyName || suggestions.companyName === '') {
    console.log("🔍 Название компании пустое, ищем в кавычках...");
    
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ищем строки с кавычками, содержащие ООО/ОАО/ЗАО/ИП
      if (trimmedLine.includes('"') && 
          (trimmedLine.includes('ООО') || trimmedLine.includes('ОАО') || trimmedLine.includes('ЗАО') || trimmedLine.includes('ИП'))) {
        
        // Извлекаем текст в кавычках
        const quoteMatch = trimmedLine.match(/(ООО|ОАО|ЗАО|ИП)\s*["«]([^»"]+)["»]/i);
        if (quoteMatch) {
          const companyName = quoteMatch[1] + ' "' + quoteMatch[2] + '"';
          suggestions.companyName = companyName;
          console.log("✅ Название компании найдено в кавычках:", suggestions.companyName);
          foundCompanyName = true;
          break;
        }
      }
    }
  }
  
  // Поиск юридического названия
  for (const pattern of legalNamePatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.legalName = match[1].trim();
      console.log("✅ Юридическое название найдено:", suggestions.legalName);
      break;
    }
  }
  
  // 🔥 ДОПОЛНИТЕЛЬНЫЙ ПОИСК ЮРИДИЧЕСКОГО НАЗВАНИЯ
  if (!suggestions.legalName) {
    console.log("🔍 Юридическое название не найдено стандартными паттернами, ищем дополнительно...");
    
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ищем строки с "Полное наименование организации"
      if (line.includes('Полное наименование организации')) {
        // Берем следующую строку
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.length > 5 && nextLine.length < 200) {
            suggestions.legalName = nextLine;
            console.log("✅ Юридическое название найдено в следующей строке:", suggestions.legalName);
            break;
          }
        }
      }
      
      // Ищем строки с "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ"
      if (line.includes('ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ')) {
        suggestions.legalName = line.trim();
        console.log("✅ Юридическое название найдено по ключевому слову:", suggestions.legalName);
        break;
      }
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК БАНКОВСКИХ РЕКВИЗИТОВ
  const bankPatterns = [
    /\bБанк[:\s]*([^,\n\rБИК]+)/i,
    /\bНазвание банка[:\s]*([^,\n\r]+)/i,
    /\bБанк получателя[:\s]*([^,\n\rБИК]+)/i,
    /\bПолучатель[:\s]*([^,\n\r]+)/i,
    /Банк\s*\n\s*([^\n\r]+)/i,
    /\b([^,\n\r]+)\s*банк/i,
    /\bбанк\s+([^,\n\r]+)/i,
    // Специальный поиск для "Наименование банка"
    /Наименование банка\s*\n\s*([^\n\r]+)/i,
    // Исключаем числовые данные
    /Наименование банка\s*\n\s*([^0-9\n\r\/]+)/i
  ];
  
  for (const pattern of bankPatterns) {
    const match = text.match(pattern);
    if (match) {
      const bankName = match[1].trim();
      
      // Проверяем, что это не "БИК" и не слишком короткое название
      if (bankName && 
          bankName.toLowerCase() !== 'бик' && 
          bankName.length > 2 && 
          bankName.length < 100 &&
          !/^\d+/.test(bankName) && // Исключаем строки, начинающиеся с цифр
          !/^\d+\s*\/\s*\d+/.test(bankName)) { // Исключаем форматы типа "123 / 456"
        suggestions.bankName = bankName;
        console.log("✅ Банк найден:", suggestions.bankName);
        break;
      }
    }
  }
  
  // Если банк не найден, попробуем агрессивный поиск
  if (!suggestions.bankName) {
    console.log("🔍 Банк не найден стандартными паттернами, пробуем агрессивный поиск...");
    
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ищем строки с "Наименование банка"
      if (line.includes('Наименование банка')) {
        // Берем следующую строку
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.length > 3 && 
              nextLine.length < 100 && 
              !/^\d+/.test(nextLine) && // Исключаем строки, начинающиеся с цифр
              !/^\d+\s*\/\s*\d+/.test(nextLine)) { // Исключаем форматы типа "123 / 456"
            suggestions.bankName = nextLine;
            console.log("✅ Банк найден после заголовка:", suggestions.bankName);
            break;
          }
        }
      }
      
      // Ищем строки, содержащие слова "банк", "сбербанк", "втб" и т.д.
      if (line.length > 3 && 
          line.length < 100 && 
          /банк|сбербанк|втб|альфа|тинькофф|райффайзен|открытие/i.test(line) &&
          !line.includes('БИК') &&
          !line.includes('ИНН') &&
          !line.includes('КПП') &&
          !line.includes('ОГРН') &&
          !/^\d+/.test(line)) { // Исключаем строки, начинающиеся с цифр
        
        suggestions.bankName = line;
        console.log("✅ Банк найден агрессивным поиском:", suggestions.bankName);
        break;
      }
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК БАНКОВСКОГО СЧЕТА
  const accountPatterns = [
    /\b(р\/с|счет|расчетный счет)[:\s]*(\d{20})\b/i,
    /\b(\d{20})\s*\(счет\)/i,
    /\bРасчётный счет[:\s]*(\d{20})\b/i,
    /\bРасчётный счет\s*\n\s*(\d{20})\b/i,
    /Расчётный счет\s*\n\s*(\d{20})/i,
    // Улучшенные паттерны для OCR ошибок
    /\bРасчётный счет[:\s]*([0-9\s\-_\.]{20,})\b/i,
    /Расчётный счет\s*\n\s*([0-9\s\-_\.]{20,})/i,
    /\b([0-9\s\-_\.]{20})\s*\(?счет\)?/i
  ];
  
  for (const pattern of accountPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Очищаем счет от возможных OCR ошибок
      let account = match[2] || match[1];
      account = account.replace(/[-_\s\.]/g, '');
      account = account.replace(/\D/g, '');
      
      // Проверяем, что получилось 20 цифр
      if (account.length === 20 && /^\d{20}$/.test(account)) {
        suggestions.bankAccount = account;
        console.log("✅ Банковский счет найден:", suggestions.bankAccount);
        break;
      }
    }
  }
  
  // 🔥 ДОПОЛНИТЕЛЬНЫЙ ПОИСК: если счет не найден, ищем по контексту
  if (!suggestions.bankAccount) {
    console.log("🔍 Расчетный счет не найден стандартными паттернами, ищем по контексту...");
    
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ищем строки с "Расчетный счет"
      if (line.includes('Расчетный счет') || line.includes('Расчётный счет')) {
        // Берем следующую строку
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const accountMatch = nextLine.match(/(\d{20})/);
          if (accountMatch) {
            suggestions.bankAccount = accountMatch[1];
            console.log("✅ Расчетный счет найден по контексту:", suggestions.bankAccount);
            break;
          }
        }
      }
    }
  }

  const corrAccountPatterns = [
    /\b(корр|корреспондентский счет)[:\s]*(\d{20})\b/i,
    /\bКорреспондентский счет[:\s]*(\d{20})\b/i,
    /Корреспондентский счет\s*\n\s*(\d{20})/i,
    // Улучшенные паттерны для OCR ошибок
    /\bКорреспондентский счет[:\s]*([0-9\s\-_]{20,})\b/i,
    /Корреспондентский счет\s*\n\s*([0-9\s\-_]{20,})/i
  ];
  
  for (const pattern of corrAccountPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Очищаем счет от возможных OCR ошибок
      let corrAccount = match[2] || match[1];
      // Убираем все нецифровые символы
      corrAccount = corrAccount.replace(/\D/g, '');
      
      // Проверяем, что получилось 20 цифр
      if (corrAccount.length === 20 && /^\d{20}$/.test(corrAccount)) {
        suggestions.bankCorrAccount = corrAccount;
        console.log("✅ Корреспондентский счет найден:", suggestions.bankCorrAccount);
        break;
      }
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК БИК
  const bikPatterns = [
    /\bБИК[:\s]*(\d{9})\b/i,
    /\b(\d{9})\s*\(БИК\)/i,
    /\bБИК банка[:\s]*(\d{9})\b/i,
    /БИК банка\s*\n\s*(\d{9})/i,
    // Улучшенные паттерны для OCR ошибок
    /\bБИК[:\s]*([pр]?\d{9})\b/i,
    /\bБИК банка[:\s]*([pр]?\d{9})\b/i,
    /БИК банка\s*\n\s*([pр]?\d{9})/i,
    // Поиск 9-значного числа после "БИК"
    /\bБИК[^0-9]*([pр]?\d{9})\b/i,
    /\b([0-9\s\-_\.]{9})\s*\(?БИК\)?/i
  ];
  
  for (const pattern of bikPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Очищаем БИК от возможных OCR ошибок
      let bik = match[1];
      bik = bik.replace(/^[pр]/, '');
      bik = bik.replace(/[-_\s\.]/g, '');
      bik = bik.replace(/\D/g, '');
      
      // Проверяем, что получилось 9 цифр
      if (bik.length === 9 && /^\d{9}$/.test(bik)) {
        suggestions.bankBik = bik;
        console.log("✅ БИК найден:", suggestions.bankBik);
        break;
      }
    }
  }
  
  // 🔥 ДОПОЛНИТЕЛЬНЫЙ ПОИСК: если БИК не найден, ищем по контексту
  if (!suggestions.bankBik) {
    console.log("🔍 БИК не найден стандартными паттернами, ищем по контексту...");
    
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ищем строки с "БИК"
      if (line.includes('БИК')) {
        // Берем следующую строку
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const bikMatch = nextLine.match(/(\d{9})/);
          if (bikMatch) {
            suggestions.bankBik = bikMatch[1];
            console.log("✅ БИК найден по контексту:", suggestions.bankBik);
            break;
          }
        }
        
        // Или ищем в той же строке после "БИК"
        const bikMatch = line.match(/БИК[^0-9]*(\d{9})/i);
        if (bikMatch) {
          suggestions.bankBik = bikMatch[1];
          console.log("✅ БИК найден в строке:", suggestions.bankBik);
          break;
        }
      }
    }
  }

  // Поиск адреса
  const addressPatterns = [
    /\b(Юридический адрес|Адрес)[:\s]*\n*([^,\n]+)/i,
    /\b(Почтовый адрес)[:\s]*\n*([^,\n]+)/i,
    /Юридический адрес\s*\n\s*([^\n]+)/i,
    /Почтовый адрес\s*\n\s*([^\n]+)/i
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.address = match[2] || match[1];
      console.log("✅ Адрес найден:", suggestions.address);
      break;
    }
  }

  // Поиск телефона
  const phonePatterns = [
    /\b(Телефон|Тел)[:\s]*([+\d\s\-\(\)]+)/i,
    /\b([+7]\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2})/i,
    /Телефон\s*\n\s*([+\d\s\-\(\)]+)/i
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.phone = (match[2] || match[1]).trim();
      console.log("✅ Телефон найден:", suggestions.phone);
      break;
    }
  }

  // Поиск email
  const emailPatterns = [
    /\b(E-mail|Email)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
  ];
  
  for (const pattern of emailPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.email = match[2] || match[1];
      console.log("✅ Email найден:", suggestions.email);
      break;
    }
  }

  // Поиск сайта
  const websitePatterns = [
    /\b(Website|Сайт)[:\s]*([^\s\n]+)/i,
    /\b(https?:\/\/[^\s\n]+)/i
  ];
  
  for (const pattern of websitePatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.website = match[2] || match[1];
      console.log("✅ Сайт найден:", suggestions.website);
      break;
    }
  }

  // Поиск директора
  const directorPatterns = [
    /\b(Директор|Генеральный директор|Руководитель)[:\s]*([^\n\r]+)/i,
    /\b(Иванов|Петров|Сидоров|Козлов|Смирнов|Попов|Соколов|Лебедев|Новиков|Морозов)\s+[А-Я]\.[А-Я]\./i
  ];
  
  for (const pattern of directorPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.director = match[2] || match[1];
      console.log("✅ Директор найден:", suggestions.director);
      break;
    }
  }
  
  // Если директор не найден, попробуем агрессивный поиск
  if (!suggestions.director) {
    console.log("🔍 Директор не найден стандартными паттернами, пробуем агрессивный поиск...");
    
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ищем строки с фамилией и инициалами
      if (trimmedLine.length > 5 && 
          trimmedLine.length < 50 && 
          /[А-Я][а-я]+\s+[А-Я]\.[А-Я]\./.test(trimmedLine) &&
          !trimmedLine.includes('ИНН') &&
          !trimmedLine.includes('КПП') &&
          !trimmedLine.includes('ОГРН') &&
          !trimmedLine.includes('Адрес')) {
        
        suggestions.director = trimmedLine;
        console.log("✅ Директор найден агрессивным поиском:", suggestions.director);
        break;
      }
    }
  }

  console.log("📊 Итоговые извлеченные данные:", suggestions);
  return suggestions;
}

/**
 * Извлекает данные инвойса из текста
 */
async function extractInvoiceData(text: string) {
  const suggestions: any = {
    items: [],
    invoiceInfo: {}
  };

  console.log("🔍 Анализируем текст для извлечения данных инвойса...");
  console.log("📄 Первые 300 символов текста:", text.substring(0, 300));

  // Специальная обработка для XLSX данных (табличные форматы)
  if (text.includes('=== ЛИСТ:')) {
    console.log("📊 Обнаружены данные XLSX, применяем специальную обработку...");
    return extractInvoiceDataFromXlsx(text);
  }

  // 🤖 UNIVERSAL AI: Обработка нетабличных форматов с автоматическим fallback
  if (text.length > 500) {
    console.log("🤖 Используем Universal AI для обработки нетабличного инвойса...");
    try {
      const { universalAIService } = await import('../../../lib/services/UniversalAIService');

      const aiResult = await universalAIService.processInvoiceWithAI(text);

      if (aiResult.items && aiResult.items.length > 0) {
        console.log("✅ Universal AI успешно обработал инвойс!");

        // Конвертируем AI результат в формат suggestions
        const convertedResult = {
          items: aiResult.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            code: item.code || '',
            unit: item.unit || 'шт'
          })),
          invoiceInfo: aiResult.invoiceInfo || {},
          bankInfo: aiResult.bankInfo || {}
        };

        console.log("📊 Universal AI результат:", convertedResult);
        return convertedResult;
      } else {
        console.log("⚠️ Universal AI не нашел товары, переходим к regex парсингу");
      }
    } catch (error) {
      console.log("⚠️ Ошибка Universal AI, используем regex парсинг:", error);
    }
  } else {
    console.log("⚠️ Текст слишком короткий для AI, используем regex парсинг");
  }

  // Поиск номера инвойса
  const invoiceNumberPatterns = [
    /\b(Инвойс|Счет|Invoice|№|Номер)[:\s]*([A-Z0-9\-_\/]+)/i,
    /\b№\s*([A-Z0-9\-_\/]+)/i,
    /\bСчет\s*№\s*([A-Z0-9\-_\/]+)/i,
    /\bInvoice\s*#\s*([A-Z0-9\-_\/]+)/i
  ];

  for (const pattern of invoiceNumberPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.invoiceInfo.number = match[2] || match[1];
      console.log("✅ Номер инвойса найден:", suggestions.invoiceInfo.number);
      break;
    }
  }

  // Поиск даты инвойса
  const datePatterns = [
    /\b(Дата|Date)[:\s]*(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/i,
    /\b(\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4})/i,
    /\b(\d{4}-\d{2}-\d{2})/i
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.invoiceInfo.date = match[2] || match[1];
      console.log("✅ Дата инвойса найдена:", suggestions.invoiceInfo.date);
      break;
    }
  }

  // Поиск общей суммы
  const totalPatterns = [
    /\b(Итого|Всего|Сумма|Total|ИТОГО)[:\s]*(\d+[.,]\d{2})\s*(руб|USD|EUR|₽|$|€)/i,
    /\b(Итого|Всего|Сумма|Total|ИТОГО)[:\s]*(\d+)\s*(руб|USD|EUR|₽|$|€)/i,
    /\b(\d+[.,]\d{2})\s*(руб|USD|EUR|₽|$|€)\s*(Итого|Всего|Сумма|Total|ИТОГО)/i
  ];

  for (const pattern of totalPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.invoiceInfo.totalAmount = match[2];
      suggestions.invoiceInfo.currency = match[3];
      console.log("✅ Общая сумма найдена:", match[2], match[3]);
      break;
    }
  }

  // Поиск НДС
  const vatPatterns = [
    /\b(НДС|VAT)[:\s]*(\d+[.,]\d{2})\s*(руб|USD|EUR|₽|$|€)/i,
    /\b(НДС|VAT)[:\s]*(\d+)\s*(руб|USD|EUR|₽|$|€)/i,
    /\b(НДС|VAT)[:\s]*(\d+[.,]\d{2})%/i
  ];

  for (const pattern of vatPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.invoiceInfo.vat = match[2];
      console.log("✅ НДС найден:", match[2]);
      break;
    }
  }

  // Поиск поставщика (продавца)
  const sellerPatterns = [
    /\b(Поставщик|Продавец|Seller|Provider)[:\s]*\n*([^\n]+)/i,
    /\b(ООО|ИП|ОАО|ЗАО)[\s]*["«]?([^»"\n]+)["»]?\s*(Поставщик|Продавец)/i,
    /Поставщик\s*\n\s*([^\n]+)/i
  ];

  for (const pattern of sellerPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.invoiceInfo.seller = match[2] || match[1];
      console.log("✅ Поставщик найден:", suggestions.invoiceInfo.seller);
      break;
    }
  }

  // Поиск покупателя
  const buyerPatterns = [
    /\b(Покупатель|Buyer|Заказчик|Customer)[:\s]*\n*([^\n]+)/i,
    /\b(ООО|ИП|ОАО|ЗАО)[\s]*["«]?([^»"\n]+)["»]?\s*(Покупатель|Buyer)/i,
    /Покупатель\s*\n\s*([^\n]+)/i
  ];

  for (const pattern of buyerPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.invoiceInfo.buyer = match[2] || match[1];
      console.log("✅ Покупатель найден:", suggestions.invoiceInfo.buyer);
      break;
    }
  }

  // 🔥 НОВОЕ: Извлечение банковских реквизитов
  const bankRequisites = extractBankRequisitesFromInvoice(text);
  if (bankRequisites.hasRequisites) {
    suggestions.bankInfo = bankRequisites;
    console.log("🏦 Банковские реквизиты извлечены:", bankRequisites);
  }

  // Улучшенный поиск позиций товаров
  const lines = text.split('\n');
  let inItemsSection = false;
  let itemCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Определяем начало секции товаров (расширенные паттерны)
    if (line.match(/\b(Товары|Позиции|Items|Наименование|№|№п\/п|Description|Product|Goods|Item)\b/i)) {
      inItemsSection = true;
      continue;
    }

    // Определяем конец секции товаров
    if (inItemsSection && line.match(/\b(Итого|Всего|Сумма|Total|ИТОГО|TOTAL|GRAND TOTAL)\b/i)) {
      inItemsSection = false;
      continue;
    }

    // Если мы в секции товаров или строка содержит числа (возможные товары)
    if ((inItemsSection || line.match(/\d+/)) && line.length > 5) {
      
      // Расширенные паттерны для извлечения позиций товаров
      const itemPatterns = [
        // Паттерн: название | количество | цена | сумма
        /^([^|]+)\s*\|\s*(\d+)\s*\|\s*(\d+[.,]\d{2})\s*\|\s*(\d+[.,]\d{2})/i,
        // Паттерн: название x количество = сумма
        /^([^x]+)\s*x\s*(\d+)\s*=\s*(\d+[.,]\d{2})/i,
        // Паттерн: название (количество шт. по цене)
        /^([^(]+)\s*\((\d+)\s*шт\.?\s*по\s*(\d+[.,]\d{2})\)/i,
        // Паттерн: название - количество шт. - цена руб. - сумма
        /^([^-]+)\s*-\s*(\d+)\s*шт\.?\s*-\s*(\d+[.,]\d{2})\s*руб\.?\s*-\s*(\d+[.,]\d{2})/i,
        // Простой паттерн: название количество цена
        /^([^\d]+)\s+(\d+)\s+(\d+[.,]\d{2})/i,
        // Паттерн для китайских товаров: название количество*цена=сумма
        /^([^*]+)\s*(\d+)\s*\*\s*(\d+[.,]\d{2})\s*=\s*(\d+[.,]\d{2})/i,
        // Паттерн: название Qty: количество Price: цена
        /^([^Q]+)\s*Qty:\s*(\d+)\s*Price:\s*(\d+[.,]\d{2})/i,
        // Паттерн: название @ цена x количество
        /^([^@]+)\s*@\s*(\d+[.,]\d{2})\s*x\s*(\d+)/i,
        // Паттерн для простых товаров с числами
        /^([A-Za-zА-Яа-яЁё\s\-\.]+)\s+(\d+)\s+(\d+[.,]\d{2})/i
      ];

      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        if (match) {
          const item = {
            name: match[1].trim(),
            quantity: parseInt(match[2]),
            price: parseFloat(match[3].replace(',', '.')),
            total: match[4] ? parseFloat(match[4].replace(',', '.')) : parseInt(match[2]) * parseFloat(match[3].replace(',', '.')),
            code: `ITEM-${++itemCount}`
          };

          // Очищаем название от лишних символов (сохраняем китайские символы)
          item.name = item.name.replace(/[^\w\sа-яёА-ЯЁ\-\.\u4e00-\u9fff]/gi, '').trim();
          
          if (item.name.length > 2) {
            suggestions.items.push(item);
            console.log("✅ Позиция найдена:", item);
          }
          break;
        }
      }
    }
  }

  // Если не нашли товары в структурированном виде, ищем по ключевым словам
  if (suggestions.items.length === 0) {
    for (const line of lines) {
      // Ищем строки, содержащие названия товаров (включая китайские)
      const productKeywords = [
        // Русские товары
        'компьютер', 'ноутбук', 'телефон', 'принтер', 'сканер', 'монитор', 'клавиатура', 'мышь',
        'кабель', 'адаптер', 'блок', 'зарядка', 'наушники', 'динамик', 'микрофон', 'веб-камера',
        'флешка', 'диск', 'карта', 'память', 'процессор', 'материнская', 'видеокарта', 'жесткий',
        'товар', 'изделие', 'продукт', 'материал', 'комплект', 'набор', 'устройство', 'аппарат',
        // Английские товары
        'computer', 'laptop', 'phone', 'printer', 'scanner', 'monitor', 'keyboard', 'mouse',
        'cable', 'adapter', 'block', 'charger', 'headphones', 'speaker', 'microphone', 'webcam',
        'flash', 'disk', 'card', 'memory', 'processor', 'motherboard', 'graphics', 'hard',
        'product', 'item', 'goods', 'material', 'kit', 'set', 'device', 'equipment',
        // Китайские товары (общие слова)
        '产品', '商品', '物品', '设备', '机器', '工具', '配件', '零件'
      ];

      const hasProductKeyword = productKeywords.some(keyword => 
        line.toLowerCase().includes(keyword.toLowerCase())
      );

      // Также проверяем наличие китайских символов
      const hasChineseChars = /[\u4e00-\u9fff]/.test(line);

      if (hasProductKeyword || hasChineseChars) {
        
        // Ищем числа в строке
        const numbers = line.match(/\d+[.,]?\d*/g);
        if (numbers && numbers.length >= 2) {
          const item = {
            name: line.replace(/\d+[.,]?\d*/g, '').replace(/[^\w\sа-яёА-ЯЁ\-\.\u4e00-\u9fff]/gi, '').trim(),
            quantity: parseInt(numbers[0]),
            price: parseFloat(numbers[1].replace(',', '.')),
            total: numbers[2] ? parseFloat(numbers[2].replace(',', '.')) : parseInt(numbers[0]) * parseFloat(numbers[1].replace(',', '.')),
            code: `ITEM-${++itemCount}`
          };

          if (item.name.length > 2) {
            suggestions.items.push(item);
            console.log("✅ Товар найден по ключевому слову:", item);
          }
        }
      }
    }
  }

  // 🔥 НОВОЕ: Извлекаем банковские реквизиты
  const extractedBankRequisites = extractBankRequisitesFromInvoice(text);
  if (extractedBankRequisites.hasRequisites) {
    suggestions.bankInfo = extractedBankRequisites;
    console.log("🏦 Банковские реквизиты добавлены:", extractedBankRequisites);
  }

  console.log("📊 Итоговые данные инвойса:", suggestions);
  return suggestions;
}

function extractInvoiceDataFromXlsx(text: string) {
  const suggestions: any = {
    items: [],
    invoiceInfo: {}
  };

  console.log("🔍 Специальная обработка XLSX данных...");

  const lines = text.split('\n');
  let currentSheet = '';
  let inItemsSection = false;
  let itemCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Определяем лист
    if (line.startsWith('=== ЛИСТ:')) {
      currentSheet = line.replace('=== ЛИСТ:', '').replace('===', '').trim();
      console.log("📋 Обрабатываем лист:", currentSheet);
      continue;
    }

    // Поиск номера инвойса
    if (line.includes('INV:') || line.includes('Счет') || line.includes('Invoice')) {
      const invMatch = line.match(/(?:INV:|Счет|Invoice)[:\s]*([A-Z0-9\-_\/]+)/i);
      if (invMatch && !suggestions.invoiceInfo.number) {
        suggestions.invoiceInfo.number = invMatch[1];
        console.log("✅ Номер инвойса найден:", suggestions.invoiceInfo.number);
      }
    }

    // Поиск даты
    if (line.includes('dd') && line.includes('2025')) {
      const dateMatch = line.match(/(\w+\s+\d{1,2}\s+\w+\s+\d{4})/);
      if (dateMatch && !suggestions.invoiceInfo.date) {
        suggestions.invoiceInfo.date = dateMatch[1];
        console.log("✅ Дата инвойса найдена:", suggestions.invoiceInfo.date);
      }
    }

    // Поиск поставщика и покупателя
    if (line.includes('Agent:') && line.includes('LLC')) {
      // Очищаем от лишних символов
      const sellerMatch = line.match(/Agent:\s*(.+?)(?:\s+based on|$)/);
      if (sellerMatch && !suggestions.invoiceInfo.seller) {
        suggestions.invoiceInfo.seller = sellerMatch[1].trim();
        console.log("✅ Поставщик найден:", suggestions.invoiceInfo.seller);
      }
    }
    if (line.includes('Buyer:') && line.includes('LLC')) {
      // Очищаем от лишних символов
      const buyerMatch = line.match(/Buyer:\s*(.+?)(?:\s*$)/);
      if (buyerMatch && !suggestions.invoiceInfo.buyer) {
        suggestions.invoiceInfo.buyer = buyerMatch[1].trim();
        console.log("✅ Покупатель найден:", suggestions.invoiceInfo.buyer);
      }
    }

      // Поиск общей суммы
  if (line.includes('Total') || line.includes('Итого') || line.includes('Total,RMB')) {
    const totalMatch = line.match(/(?:Total|Итого)[:,]?\s*(\d+[.,]?\d*)/i);
    if (totalMatch && !suggestions.invoiceInfo.totalAmount) {
      suggestions.invoiceInfo.totalAmount = totalMatch[1];
      suggestions.invoiceInfo.currency = line.includes('RMB') ? 'RMB' : 'USD';
      console.log("✅ Общая сумма найдена:", totalMatch[1], suggestions.invoiceInfo.currency);
    }
  }
  
  // Поиск общей суммы в рублях
  if (line.includes('Total,RUB')) {
    const totalMatch = line.match(/Total,RUB\s*(\d+[.,]?\d*)/i);
    if (totalMatch && !suggestions.invoiceInfo.totalAmountRUB) {
      suggestions.invoiceInfo.totalAmountRUB = totalMatch[1];
      console.log("✅ Общая сумма в рублях найдена:", totalMatch[1]);
    }
  }

    // Определяем начало секции товаров
    if (line.includes('Product description') || line.includes('ITEM NUMBER') || line.includes('QTY') || line.includes('Price,RMB') || line.includes('ITEM NUMBER |')) {
      inItemsSection = true;
      console.log("📍 Найдена секция товаров");
      continue;
    }

    // Определяем конец секции товаров
    if (inItemsSection && (line.includes('Total:') || line.includes('Deposit(RMB):') || line.includes('Payment terms:'))) {
      inItemsSection = false;
      console.log("📍 Конец секции товаров");
      continue;
    }

    // Извлечение позиций товаров из XLSX (два формата)
    if (inItemsSection && line.includes('|')) {
      console.log("🔍 Обрабатываем строку товара:", line);
      const parts = line.split('|').map(part => part.trim()).filter(part => part.length > 0);
      console.log("📋 Части строки:", parts);
      console.log("🔍 Проверяем условия для входа в форматы:");
      console.log("  - parts.length >= 3:", parts.length >= 3);
      console.log("  - parts.length >= 4:", parts.length >= 4);
      console.log("  - parts.length >= 6:", parts.length >= 6);
      console.log("  - line.match(/^\\d+\\s+\\|/):", line.match(/^\d+\s+\|/));
      
              // ПРИОРИТЕТ 1: Формат 3 - Номер | Код | Название | Количество | Цена | Сумма (6 колонок)
        if (parts.length >= 6 && line.match(/^\d+\s+\|/)) {
          console.log("🔍 Проверяем формат 3 (6+ колонок)...");
          const itemNumber = parts[0];
          const itemCode = parts[1];
          const itemName = parts[2];
          const quantityStr = parts[3];
          const priceStr = parts[4];
          const totalStr = parts[5] || '';

          console.log("🔍 Проверяем условия для товара (формат 3):");
          console.log("  - itemNumber:", itemNumber, "isNaN:", isNaN(parseInt(itemNumber)));
          console.log("  - itemCode:", itemCode, "trimmed length:", itemCode?.trim().length);

          // Проверяем, что это действительно товар (начинается с цифры и код не пустой)
          if (itemNumber && !isNaN(parseInt(itemNumber)) && itemCode && itemCode.trim().length > 0) {
            const quantity = parseInt(quantityStr.replace(/[^\d]/g, ''));
            const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
            const total = totalStr ? parseFloat(totalStr.replace(/[^\d.,]/g, '').replace(',', '.')) : quantity * price;

            console.log("🔍 Числовые значения (формат 3):");
            console.log("  - quantity:", quantity);
            console.log("  - price:", price);
            console.log("  - total:", total);
            console.log("  - itemName length:", itemName?.trim().length);

            if (quantity && price && itemName && itemName.trim().length > 2) {
              const item = {
                name: itemName.trim(),
                quantity: quantity,
                price: price,
                total: total,
                code: itemCode || `ITEM-${++itemCount}`,
                unit: 'шт'
              };
              suggestions.items.push(item);
              console.log("✅ Позиция из XLSX найдена (формат 3):", item);
            } else {
              console.log("❌ Формат 3: Условия не прошли проверку");
            }
          } else {
            console.log("❌ Формат 3: itemNumber или itemCode не прошли проверку");
          }
        }

        // ПРИОРИТЕТ 2: Формат 1 - Product description | Quantity | Price | Total (3-4 колонки)
        else if (parts.length >= 3 && parts.length < 6 && !line.match(/^(Product|ITEM|QTY|Price|Total)/i)) {
          console.log("🔍 Проверяем формат 1 (3-5 колонок)...");
        const itemName = parts[0];
        const quantityStr = parts[1];
        const priceStr = parts[2];
        const totalStr = parts[3] || '';

        // Проверяем, что это действительно товар (не заголовок)
        if (itemName && itemName.length > 5 && !itemName.match(/^(Product|ITEM|QTY|Price|Total)/i)) {
          const quantity = parseInt(quantityStr.replace(/[^\d]/g, ''));
          const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
          const total = totalStr ? parseFloat(totalStr.replace(/[^\d.,]/g, '').replace(',', '.')) : quantity * price;

          if (quantity && price && itemName.length > 5) {
            const item = {
              name: itemName.trim(),
              quantity: quantity,
              price: price,
              total: total,
              code: `ITEM-${++itemCount}`,
              unit: 'шт'
            };

            suggestions.items.push(item);
            console.log("✅ Позиция из XLSX найдена:", item);
          }
        }
      }
      
              // Формат 2: ITEM NUMBER | CODE | NAME | QTY | PRICE | TOTAL
        else if (parts.length >= 4 && line.match(/^\d+\s+\|/)) {
          console.log("🔍 Проверяем формат 2...");
        const itemNumber = parts[0];
        const itemCode = parts[1];
        const itemName = parts[2];
        const quantityStr = parts[3];
        const priceStr = parts[4];
        const totalStr = parts[5] || '';

        // Проверяем, что это действительно товар (начинается с цифры)
        if (itemNumber && !isNaN(parseInt(itemNumber))) {
          const quantity = parseInt(quantityStr.replace(/[^\d]/g, ''));
          const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
          const total = totalStr ? parseFloat(totalStr.replace(/[^\d.,]/g, '').replace(',', '.')) : quantity * price;

          if (quantity && price && itemName && itemName.length > 2) {
            const item = {
              name: itemName.trim(),
              quantity: quantity,
              price: price,
              total: total,
              code: itemCode || `ITEM-${++itemCount}`,
              unit: 'шт'
            };

            suggestions.items.push(item);
            console.log("✅ Позиция из XLSX найдена:", item);
          }
        }
      }
      
    }
  }

  // 🔥 НОВОЕ: Извлекаем банковские реквизиты
  const extractedBankRequisites = extractBankRequisitesFromInvoice(text);
  if (extractedBankRequisites.hasRequisites) {
    suggestions.bankInfo = extractedBankRequisites;
    console.log("🏦 Банковские реквизиты добавлены:", extractedBankRequisites);
  }

  console.log("📊 Итоговые данные XLSX инвойса:", suggestions);
  return suggestions;
}

/**
 * 🔥 НОВАЯ ФУНКЦИЯ: Извлечение банковских реквизитов из инвойса
 */
function extractBankRequisitesFromInvoice(text: string) {
  console.log("🏦 Начинаем извлечение банковских реквизитов из инвойса...");
  console.log("📄 Первые 1000 символов текста для поиска банковских реквизитов:", text.substring(0, 1000));
  
  const requisites = {
    bankName: '',
    accountNumber: '',
    swift: '',
    recipientName: '',
    recipientAddress: '',
    transferCurrency: '',
    hasRequisites: false
  };

  // Поиск номера счета (USD A/C NO., EUR A/C NO., Account Number)
  const accountPatterns = [
    /USD\s*A\/C\s*NO\.?\s*\([^)]*\)\s*:?\s*(\d+)/i,  // USD A/C NO. (美元账户号码): 397475795838
    /EUR\s*A\/C\s*NO\.?\s*\([^)]*\)\s*:?\s*(\d+)/i,  // EUR A/C NO. (欧元账户号码): ...
    /USD\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
    /EUR\s*A\/C\s*NO\.?\s*:?\s*(\d+)/i,
    /Account\s*Number\s*:?\s*(\d+)/i,
    /A\/C\s*NO\.?\s*:?\s*(\d+)/i,
    /Номер\s*счета\s*:?\s*(\d+)/i,
    /A\/C\s*No:\s*([A-Z0-9]+)/i,  // A/C No: NRA356011048100241768
    /Account\s*No:\s*([A-Z0-9]+)/i  // Account No: ...
  ];
  
  for (const pattern of accountPatterns) {
    const match = text.match(pattern);
    if (match) {
      requisites.accountNumber = match[1];
      console.log("✅ Найден номер счета:", requisites.accountNumber);
      break;
    }
  }

  // Поиск SWIFT кода
  const swiftPatterns = [
    /SWIF\s*CODE\s*\(\)\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,  // SWIF CODE(): BKCHCNBJ92B
    /SWIFT\s*CODE\s*\(\)\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,  // SWIFT CODE(): ...
    /SWIFT\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /SWIFT\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /BIC\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i,
    /SWIF\s*CODE\s*:?\s*([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)/i  // Для опечаток
  ];
  
  for (const pattern of swiftPatterns) {
    const match = text.match(pattern);
    if (match) {
      requisites.swift = match[1];
      console.log("✅ Найден SWIFT код:", requisites.swift);
      break;
    }
  }

  // 🔥 НОВОЕ: Поиск названия банка
  const bankNamePatterns = [
    /BANK\s*NAME\s*\(银行名称\)\s*:?\s*([^\n]+)/i,  // BANK NAME (银行名称): BANK OF CHINA
    /BANK\s*NAME\s*:?\s*([^\n]+)/i,
    /BANK\s*OF\s*([^\n]+)/i,
    /([A-Z\s]+BANK[A-Z\s]*)/i,  // Общий паттерн для банков
    /([A-Z\s]+BANK\s+OF\s+[A-Z\s]+)/i,  // BANK OF CHINA, BANK OF AMERICA и т.д.
    /Sellers\s*Bank:\s*([^\n]+)/i,  // Sellers Bank:Industrial Bank Co., Ltd
    /Bank\s*address:\s*([^\n]+)/i  // Bank address: No., 158 Binwang Road
  ];
  
  for (const pattern of bankNamePatterns) {
    const match = text.match(pattern);
    if (match) {
      let bankName = match[1].trim();
      // Очищаем от лишних символов
      bankName = bankName.replace(/^[^a-zA-Z]*/, '').replace(/[^a-zA-Z\s]*$/, '').trim();
      if (bankName.length > 3) {
        requisites.bankName = bankName;
        console.log("✅ Найдено название банка:", requisites.bankName);
        break;
      }
    }
  }

  // Поиск названия получателя (ACCOUNT NAME, BENEFICIARY)
  const recipientPatterns = [
    /ACCOUNT\s*NAME\s*\(账户名称\)\s*:?\s*([^\n]+)/i,  // ACCOUNT NAME (账户名称): ZHEJIANG GAMMA TRADING CO.,LTD
    /ACCOUNT\s*NAME\s*:?\s*([^\n]+)/i,
    /BENEFICIARY\s*NAME\s*:?\s*([^\n]+)/i,
    /Получатель\s*:?\s*([^\n]+)/i
  ];
  
  for (const pattern of recipientPatterns) {
    const match = text.match(pattern);
    if (match) {
      requisites.recipientName = match[1].trim();
      console.log("✅ Найдено название получателя:", requisites.recipientName);
      break;
    }
  }

  // Поиск адреса получателя (с ограничением по длине и фильтрацией товаров)
  const addressPatterns = [
    /BENEFICIARY'?S?\s*ADDRESS\s*\(收款人地址\)\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i,  // Ограничиваем 3 строками
    /BENEFICIARY'?S?\s*ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /ADDRESS\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /Адрес\s*:?\s*([^\n]+(?:\n[^\n]+){0,3})/i
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      let address = match[1].trim();
      
      // 🔥 Очищаем адрес от товарных данных
      address = cleanAddressFromProductData(address);
      
      if (address) {
        requisites.recipientAddress = address;
        console.log("✅ Найден адрес получателя:", requisites.recipientAddress);
        break;
      }
    }
  }

  // Определение валюты из номера счета
  if (text.includes('USD A/C NO.') || text.includes('USD')) {
    requisites.transferCurrency = 'USD';
  } else if (text.includes('EUR A/C NO.') || text.includes('EUR')) {
    requisites.transferCurrency = 'EUR';
  }

  // Проверяем, есть ли хотя бы основные реквизиты
  requisites.hasRequisites = !!(requisites.accountNumber || requisites.swift || requisites.recipientName);
  
  console.log("🏦 Результат извлечения реквизитов:", requisites);
  return requisites;
}

/**
 * 🔥 НОВАЯ ФУНКЦИЯ: Очистка адреса от товарных данных
 */
function cleanAddressFromProductData(address: string): string {
  console.log("🧹 Очищаем адрес от товарных данных:", address);
  
  // Удаляем строки с товарными данными
  const lines = address.split('\n');
  const cleanLines = lines.filter(line => {
    const trimmedLine = line.trim();
    
    // Исключаем строки с товарными данными
    if (trimmedLine.includes('Product description') ||
        trimmedLine.includes('Quantity, psc') ||
        trimmedLine.includes('Price, RMB') ||
        trimmedLine.includes('Total, RMB') ||
        trimmedLine.includes('Carlic crusher') ||
        trimmedLine.includes('stainless steel') ||
        trimmedLine.includes('|') && trimmedLine.includes('RMB') ||
        trimmedLine.match(/^\d+[.,]\d+$/) ||  // Цены
        trimmedLine.match(/^\d+$/) && trimmedLine.length > 8) {  // Длинные номера товаров
      console.log("❌ Удаляем товарную строку:", trimmedLine);
      return false;
    }
    
    return true;
  });
  
  const cleanAddress = cleanLines.join('\n').trim();
  console.log("✅ Очищенный адрес:", cleanAddress);
  
  return cleanAddress;
} 