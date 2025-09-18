import { type NextRequest, NextResponse } from "next/server";
import { getYandexVisionService } from "@/lib/services/YandexVisionService";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API /debug-ocr вызван");
    
    const body = await request.json();
    const { fileUrl, fileType } = body;
    
    if (!fileUrl || !fileType) {
      return NextResponse.json(
        { error: "fileUrl и fileType обязательны" },
        { status: 400 }
      );
    }
    
    console.log("📄 Анализируем файл:", {
      fileUrl: fileUrl.substring(0, 100) + "...",
      fileType
    });
    
    const visionService = getYandexVisionService();
    const extractedText = await visionService.extractTextFromDocument(fileUrl, fileType);
    
    console.log("✅ Полный текст извлечен:", extractedText);
    
    // Тестируем парсинг
    const suggestions = extractCompanyData(extractedText);
    
    return NextResponse.json({
      success: true,
      extractedText,
      suggestions,
      textLength: extractedText.length,
      hasData: Object.keys(suggestions).length > 0
    });
  } catch (error) {
    console.error("❌ Ошибка в API debug-ocr:", error);
    return NextResponse.json(
      {
        error: "Ошибка отладки OCR",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Извлекает данные компании из текста
 */
function extractCompanyData(text: string) {
  const suggestions: any = {};
  
  console.log("🔍 Анализируем текст для извлечения данных компании...");

  // Поиск ИНН (10 или 12 цифр) - улучшенные паттерны
  const innPatterns = [
    /\bИНН[:\s]*(\d{10}|\d{12})\b/i,
    /\bИНН[:\s]*(\d{3}-\d{3}-\d{3}-\d{3})\b/i,
    /\b(\d{10}|\d{12})\s*\(ИНН\)/i,
    /\bИНН\/КПП[:\s]*(\d{10})\/(\d{9})\b/i,
    /\b(\d{10})\/(\d{9})\s*\(ИНН\/КПП\)/i
  ];
  
  for (const pattern of innPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.inn = match[1].replace(/-/g, '');
      console.log("✅ ИНН найден:", suggestions.inn);
      
      // Если это формат ИНН/КПП, то извлекаем и КПП
      if (match[2]) {
        suggestions.kpp = match[2].replace(/-/g, '');
        console.log("✅ КПП найден из ИНН/КПП:", suggestions.kpp);
      }
      break;
    }
  }

  // Поиск КПП (9 цифр) - улучшенные паттерны
  const kppPatterns = [
    /\bКПП[:\s]*(\d{9})\b/i,
    /\bКПП[:\s]*(\d{3}-\d{3}-\d{3})\b/i,
    /\b(\d{9})\s*\(КПП\)/i
  ];
  
  for (const pattern of kppPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.kpp = match[1].replace(/-/g, '');
      console.log("✅ КПП найден:", suggestions.kpp);
      break;
    }
  }

  // Поиск ОГРН (13 или 15 цифр) - улучшенные паттерны
  const ogrnPatterns = [
    /\bОГРН[:\s]*(\d{13}|\d{15})\b/i,
    /\bОГРН[:\s]*(\d{1}-\d{4}-\d{4}-\d{4})\b/i,
    /\b(\d{13}|\d{15})\s*\(ОГРН\)/i
  ];
  
  for (const pattern of ogrnPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.ogrn = match[1].replace(/-/g, '');
      console.log("✅ ОГРН найден:", suggestions.ogrn);
      break;
    }
  }

  // Поиск названия компании - улучшенные паттерны
  const companyPatterns = [
    /\b(ООО|ОАО|ЗАО|ИП)[\s]*["«]?([^»"\n]+)["»]?/i,
    /\bНазвание[:\s]*([^,\n]+)/i,
    /\bКомпания[:\s]*([^,\n]+)/i,
    /\bОрганизация[:\s]*([^,\n]+)/i,
    /\bПолное наименование[:\s]*\n*([^,\n]+)/i,
    /\bОбщество\s+с\s+ограниченной\s+ответственностью\s*["«]?([^»"\n]+)["»]?/i
  ];
  
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        suggestions.companyName = match[1] + ' ' + match[2];
      } else {
        suggestions.companyName = match[1];
      }
      console.log("✅ Название компании найдено:", suggestions.companyName);
      break;
    }
  }

  // Поиск банковских реквизитов - улучшенные паттерны
  const bankPatterns = [
    /\bБанк[:\s]*([^,\n]+)/i,
    /\bБанк получателя[:\s]*([^,\n]+)/i,
    /\bПолучатель[:\s]*([^,\n]+)/i,
    /\bв\s+([^,\n]+)\s*$/i
  ];
  
  for (const pattern of bankPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.bankName = match[1].trim();
      console.log("✅ Банк найден:", suggestions.bankName);
      break;
    }
  }

  const accountPatterns = [
    /\b(р\/с|счет|расчетный счет)[:\s]*(\d{20})\b/i,
    /\b(\d{20})\s*\(счет\)/i,
    /\bРасчётный счет[:\s]*(\d{20})\b/i
  ];
  
  for (const pattern of accountPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.bankAccount = match[2] || match[1];
      console.log("✅ Банковский счет найден:", suggestions.bankAccount);
      break;
    }
  }

  const corrAccountPatterns = [
    /\b(корр|корреспондентский счет)[:\s]*(\d{20})\b/i,
    /\bКорреспондентский счет[:\s]*(\d{20})\b/i
  ];
  
  for (const pattern of corrAccountPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.bankCorrAccount = match[2] || match[1];
      console.log("✅ Корреспондентский счет найден:", suggestions.bankCorrAccount);
      break;
    }
  }

  const bikPatterns = [
    /\bБИК[:\s]*(\d{9})\b/i,
    /\b(\d{9})\s*\(БИК\)/i,
    /\bБИК банка[:\s]*(\d{9})\b/i
  ];
  
  for (const pattern of bikPatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.bankBik = match[1];
      console.log("✅ БИК найден:", suggestions.bankBik);
      break;
    }
  }

  // Поиск адреса
  const addressPatterns = [
    /\b(Юридический адрес|Адрес)[:\s]*\n*([^,\n]+)/i,
    /\b(Почтовый адрес)[:\s]*\n*([^,\n]+)/i
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
    /\b([+7]\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2})/i
  ];
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      suggestions.phone = match[2] || match[1];
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
      // Убираем двоеточие если оно попало в результат
      if (suggestions.website && suggestions.website.startsWith(':')) {
        suggestions.website = suggestions.website.substring(1).trim();
      }
      console.log("✅ Сайт найден:", suggestions.website);
      break;
    }
  }

  console.log("📊 Итоговые извлеченные данные:", suggestions);
  return suggestions;
} 