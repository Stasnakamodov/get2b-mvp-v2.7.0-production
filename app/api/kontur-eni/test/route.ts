import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Проверяем конфигурацию
    const hasApiKey = !!process.env.KONTUR_ENI_API_KEY;
    const hasOrgId = !!process.env.KONTUR_ENI_ORG_ID;
    const baseUrl = process.env.KONTUR_ENI_BASE_URL || 'https://api.testkontur.ru/realty/assessment/v2.1';

    // Тестовые данные из документации Контур.Эни
    const testCompanies = [
      {
        name: "Тестовая компания без рисков",
        inn: "1234567890",
        ogrn: "1063573215232",
        description: "Компания, у которой все хорошо"
      },
      {
        name: "Компания в процессе банкротства",
        inn: "1234567891",
        ogrn: "3139104482492",
        description: "Юридическое лицо в процессе банкротства"
      },
      {
        name: "Компания в Росфинмониторинге",
        inn: "1234567892",
        ogrn: "1026352854934",
        description: "Юридическое лицо есть в списке Росфинмониторинга"
      },
      {
        name: "Компания с исполнительными производствами",
        inn: "1234567893",
        ogrn: "1074044983374",
        description: "Юридическое лицо с суммой исполнительных производств больше 300 000 рублей"
      },
      {
        name: "Компания с арбитражными делами",
        inn: "1234567894",
        ogrn: "8025868642462",
        description: "Юридическое лицо, у которого есть арбитражные дела на сумму меньше 300 000 рублей"
      }
    ];

    return NextResponse.json({
      success: true,
      config: {
        hasApiKey,
        hasOrgId,
        baseUrl,
        isConfigured: hasApiKey && hasOrgId
      },
      testCompanies,
      instructions: {
        setup: "Для настройки добавьте в .env.local:",
        envVars: [
          "KONTUR_ENI_API_KEY=your_api_key_here",
          "KONTUR_ENI_ORG_ID=your_org_id_here",
          "KONTUR_ENI_BASE_URL=https://api.testkontur.ru/realty/assessment/v2.1"
        ],
        testEndpoint: "POST /api/kontur-eni/check-company",
        testData: {
          inn: "1234567890",
          ogrn: "1063573215232",
          name: "Тестовая компания"
        }
      }
    });

  } catch (error) {
    console.error('❌ [Kontur Eni Test] Ошибка:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при проверке конфигурации',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
} 