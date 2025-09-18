import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API /test-ocr-debug вызван");

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text обязателен" },
        { status: 400 }
      );
    }

    console.log("📄 Анализируем текст:", text.substring(0, 500) + "...");
    console.log("📄 Длина текста:", text.length);

    // Тестируем улучшенный алгоритм парсинга
    const result = extractCompanyDataImproved(text);

    return NextResponse.json({
      success: true,
      originalText: text,
      extractedData: result,
      debugInfo: {
        textLength: text.length,
        lines: text.split('\n').length,
        firstLines: text.split('\n').slice(0, 10)
      }
    });
  } catch (error) {
    console.error("❌ Ошибка в API test-ocr-debug:", error);
    return NextResponse.json(
      {
        error: "Ошибка анализа",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Улучшенная функция извлечения данных компании
 */
function extractCompanyDataImproved(text: string) {
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
  
  // 🔥 ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: если ИНН не найден, ищем по контексту
  if (!suggestions.inn) {
    console.log("🔍 ИНН не найден стандартными паттернами, ищем по контексту...");
    
    // Ищем строки с двумя числами (ИНН + КПП)
    const lines = text.split('\n');
    for (const line of lines) {
      const numbersMatch = line.match(/(\d{10})\s+(\d{9})/);
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
    /\bОГРН[:\s]*([0-9\s\-_\.]{13,15})\b/i,
    /ОГРН\s*\n\s*([0-9\s\-_\.]{13,15})/i,
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
      const orgMatch = line.match(/\b(ООО|ОАО|ЗАО|ИП)\s+([^0-9\n\r]{3,100})/i);
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
          !line.includes('Банк')) {
        
        suggestions.companyName = line.trim();
        console.log("✅ Название компании найдено по буквенному паттерну:", suggestions.companyName);
        foundCompanyName = true;
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
    /\bбанк\s+([^,\n\r]+)/i
  ];
  
  for (const pattern of bankPatterns) {
    const match = text.match(pattern);
    if (match) {
      const bankName = match[1].trim();
      
      // Проверяем, что это не "БИК" и не слишком короткое название
      if (bankName && 
          bankName.toLowerCase() !== 'бик' && 
          bankName.length > 2 && 
          bankName.length < 100) {
        suggestions.bankName = bankName;
        console.log("✅ Банк найден:", suggestions.bankName);
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

  // 🔥 УЛУЧШЕННЫЙ ПОИСК БИК
  const bikPatterns = [
    /\bБИК[:\s]*(\d{9})\b/i,
    /\b(\d{9})\s*\(БИК\)/i,
    /\bБИК банка[:\s]*(\d{9})\b/i,
    /БИК банка\s*\n\s*(\d{9})/i,
    /\bБИК[:\s]*([pр]?\d{9})\b/i,
    /\bБИК банка[:\s]*([pр]?\d{9})\b/i,
    /БИК банка\s*\n\s*([pр]?\d{9})/i,
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

  // 🔥 УЛУЧШЕННЫЙ ПОИСК АДРЕСА
  const addressPatterns = [
    /\b(Юридический адрес|Адрес)[:\s]*\n*([^,\n]+)/i,
    /\b(Почтовый адрес)[:\s]*\n*([^,\n]+)/i,
    /Юридический адрес\s*\n\s*([^\n]+)/i,
    /Почтовый адрес\s*\n\s*([^\n]+)/i,
    /\b([^,\n]+)\s*\(?адрес\)?/i
  ];
  
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.address = match[2] || match[1];
      console.log("✅ Адрес найден:", suggestions.address);
      break;
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК ТЕЛЕФОНА
  const phonePatterns = [
    /\b(Телефон|Тел)[:\s]*([+\d\s\-\(\)]+)/i,
    /\b([+7]\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2})/i,
    /Телефон\s*\n\s*([+\d\s\-\(\)]+)/i,
    /\b(\d{1}\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2})/i,
    /\b(\d{1}\s*\d{3}\s*\d{3}\s*\d{2}\s*\d{2})/i
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.phone = (match[2] || match[1]).trim();
      console.log("✅ Телефон найден:", suggestions.phone);
      break;
    }
  }

  // 🔥 УЛУЧШЕННЫЙ ПОИСК EMAIL
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

  console.log("📊 Итоговые извлеченные данные:", suggestions);
  return suggestions;
} 