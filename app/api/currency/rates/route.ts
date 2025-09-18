import { NextRequest, NextResponse } from 'next/server';
import CurrencyService from '@/lib/services/CurrencyService';

/**
 * 💱 API ЭНДПОИНТ КУРСОВ ВАЛЮТ GET2B
 * GET /api/currency/rates
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true';
  const currencies = searchParams.get('currencies')?.split(',');

  try {
    console.log(`📡 [Currency API] Запрос курсов${forceRefresh ? ' (принудительное обновление)' : ''}`);
    
    const currencyService = CurrencyService.getInstance();
    const data = await currencyService.getRates(forceRefresh);

    // Фильтруем валюты если указаны
    if (currencies && currencies.length > 0) {
      const filteredRates: Record<string, any> = {};
      currencies.forEach(currency => {
        const code = currency.toUpperCase();
        if (data.rates[code]) {
          filteredRates[code] = data.rates[code];
        }
      });
      data.rates = filteredRates;
    }

    // Добавляем полезную метаинформацию
    const response = {
      ...data,
      meta: {
        cache_duration: '1 hour',
        last_updated: data.updated_at,
        available_currencies: Object.keys(data.rates),
        api_version: '1.0',
        get2b_integration: true
      }
    };

    console.log(`✅ [Currency API] Отправлено курсов: ${Object.keys(data.rates).length}`);
    console.log(`📊 [Currency API] Источник: ${data.source}`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // 1 час кеширования в браузере
        'X-Source': data.source,
        'X-Updated': data.updated_at
      }
    });

  } catch (error: any) {
    console.error('❌ [Currency API] Ошибка:', error);

    return NextResponse.json({
      error: 'Failed to fetch currency rates',
      message: error.message,
      timestamp: new Date().toISOString(),
      success: false
    }, {
      status: 500
    });
  }
}

/**
 * 💰 POST /api/currency/rates - Конвертация валют
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, from, to = 'RUB' } = await request.json();

    if (!amount || !from) {
      return NextResponse.json({
        error: 'Missing required parameters',
        message: 'amount and from currency are required',
        success: false
      }, { status: 400 });
    }

    const currencyService = CurrencyService.getInstance();
    const conversion = await currencyService.convert(Number(amount), from.toUpperCase(), to.toUpperCase());

    console.log(`💱 [Currency API] Конвертация: ${amount} ${from} → ${conversion.amount} ${to}`);

    return NextResponse.json({
      success: true,
      conversion,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Currency API] Ошибка конвертации:', error);
    
    return NextResponse.json({
      error: 'Conversion failed',
      message: error.message,
      success: false
    }, { status: 500 });
  }
} 