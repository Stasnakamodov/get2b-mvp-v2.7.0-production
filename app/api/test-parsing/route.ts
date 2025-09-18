import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    console.log("🧪 ТЕСТ ПАРСИНГА");
    console.log("📄 Полученный текст:", text);
    console.log("📄 Длина текста:", text.length);
    console.log("📄 Первые 100 символов:", text.substring(0, 100));
    console.log("📄 Содержит 'ИНН/КПП':", text.includes('ИНН/КПП'));
    console.log("📄 Содержит 'ОГРН':", text.includes('ОГРН'));
    console.log("📄 Содержит 'ООО':", text.includes('ООО'));
    
    // Простые тесты для каждого паттерна
    interface TestResults {
      inn?: string;
      kpp?: string;
      ogrn?: string;
      companyName?: string;
      companyType?: string;
      [key: string]: string | undefined;
    }

    const testResults: TestResults = {};
    
    // Тест ИНН/КПП
    const innKppMatch = text.match(/\bИНН\/КПП\s*\n\s*(\d{10})\/(\d{9})\b/i);
    if (innKppMatch) {
      testResults.inn = innKppMatch[1];
      testResults.kpp = innKppMatch[2];
      console.log("✅ ИНН/КПП найден:", innKppMatch[1], "/", innKppMatch[2]);
    } else {
      console.log("❌ ИНН/КПП не найден");
    }
    
    // Тест ОГРН
    const ogrnMatch = text.match(/\bОГРН\s*\n\s*(\d{13})\b/i);
    if (ogrnMatch) {
      testResults.ogrn = ogrnMatch[1];
      console.log("✅ ОГРН найден:", ogrnMatch[1]);
    } else {
      console.log("❌ ОГРН не найден");
    }
    
    // Тест названия компании
    const companyMatch = text.match(/\bСокращенное наименование\s*\n\s*([^\n]+)/i);
    if (companyMatch) {
      testResults.companyName = companyMatch[1].trim();
      console.log("✅ Название компании найдено:", companyMatch[1]);
    } else {
      console.log("❌ Название компании не найдено");
    }
    
    // Тест банка
    const bankMatch = text.match(/\bБанк\s*\n\s*([^\n]+)/i);
    if (bankMatch) {
      testResults.bankName = bankMatch[1].trim();
      console.log("✅ Банк найден:", bankMatch[1]);
    } else {
      console.log("❌ Банк не найден");
    }
    
    // Тест счета
    const accountMatch = text.match(/\bРасчётный счет\s*\n\s*(\d{20})\b/i);
    if (accountMatch) {
      testResults.bankAccount = accountMatch[1];
      console.log("✅ Счет найден:", accountMatch[1]);
    } else {
      console.log("❌ Счет не найден");
    }
    
    // Тест БИК
    const bikMatch = text.match(/\bБИК банка\s*\n\s*(\d{9})\b/i);
    if (bikMatch) {
      testResults.bankBik = bikMatch[1];
      console.log("✅ БИК найден:", bikMatch[1]);
    } else {
      console.log("❌ БИК не найден");
    }
    
    // Тест телефона
    const phoneMatch = text.match(/\bТелефон\s*\n\s*([^\n]+)/i);
    if (phoneMatch) {
      testResults.phone = phoneMatch[1].trim();
      console.log("✅ Телефон найден:", phoneMatch[1]);
    } else {
      console.log("❌ Телефон не найден");
    }
    
    // Тест адреса
    const addressMatch = text.match(/\bЮридический адрес\s*\n\s*([^\n]+)/i);
    if (addressMatch) {
      testResults.address = addressMatch[1].trim();
      console.log("✅ Адрес найден:", addressMatch[1]);
    } else {
      console.log("❌ Адрес не найден");
    }
    
    console.log("📊 Итоговые результаты:", testResults);
    
    return NextResponse.json({
      success: true,
      testResults,
      textLength: text.length,
      foundFields: Object.keys(testResults).length
    });
    
  } catch (error) {
    console.error("❌ Ошибка в тестовом парсинге:", error);
    return NextResponse.json(
      { error: "Ошибка тестирования парсинга" },
      { status: 500 }
    );
  }
} 