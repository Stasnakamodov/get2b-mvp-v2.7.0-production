import { NextRequest, NextResponse } from 'next/server';
import { konturEniService, CompanyCheckRequest } from '@/lib/services/KonturEniService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inn, ogrn, name, address } = body as CompanyCheckRequest;

    // Валидация входных данных
    if (!inn && !ogrn) {
      return NextResponse.json(
        { error: 'Необходимо указать ИНН или ОГРН для проверки компании' },
        { status: 400 }
      );
    }

    // Проверяем конфигурацию
    if (!process.env.KONTUR_ENI_API_KEY || !process.env.KONTUR_ENI_ORG_ID) {
      return NextResponse.json(
        { error: 'Конфигурация Контур.Эни не настроена' },
        { status: 500 }
      );
    }

    console.log('🔍 [Kontur Eni] Начинаем проверку компании:', { inn, ogrn, name });

    // Запускаем проверку компании
    const result = await konturEniService.checkCompany({
      inn,
      ogrn,
      name,
      address,
    });

    console.log('✅ [Kontur Eni] Проверка завершена:', {
      checkId: result.checkId,
      status: result.status,
      totalRisks: result.summary?.totalRisks,
      overallRisk: result.summary?.overallRisk,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ [Kontur Eni] Ошибка проверки компании:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при проверке компании',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkId = searchParams.get('checkId');

    if (!checkId) {
      return NextResponse.json(
        { error: 'Необходимо указать checkId для получения результатов' },
        { status: 400 }
      );
    }

    // Проверяем конфигурацию
    if (!process.env.KONTUR_ENI_API_KEY || !process.env.KONTUR_ENI_ORG_ID) {
      return NextResponse.json(
        { error: 'Конфигурация Контур.Эни не настроена' },
        { status: 500 }
      );
    }

    console.log('🔍 [Kontur Eni] Получаем результаты проверки:', checkId);

    // Получаем результаты проверки
    const result = await konturEniService.getCheckResults(checkId);

    console.log('✅ [Kontur Eni] Результаты получены:', {
      checkId: result.checkId,
      status: result.status,
      totalRisks: result.summary?.totalRisks,
      overallRisk: result.summary?.overallRisk,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('❌ [Kontur Eni] Ошибка получения результатов:', error);
    
    return NextResponse.json(
      { 
        error: 'Ошибка при получении результатов проверки',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
} 