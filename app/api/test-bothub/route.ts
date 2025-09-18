import { NextRequest, NextResponse } from 'next/server';
import { universalAIService } from '@/lib/services/UniversalAIService';

export async function GET() {
  console.log("🧪 Тестируем Universal AI интеграцию...");

  try {
    // Test all AI providers availability
    const providersStatus = await universalAIService.testAIProviders();
    console.log("🔗 Статус AI провайдеров:", providersStatus);

    // Test invoice processing with the universal service
    const testOcrText = `
ИНВОЙС № INV-2025-001
Дата: 15.01.2025
Продавец: ООО "ТестКомпания"
Покупатель: ООО "Покупатель"

Товары:
1. Тепловая масляная печь с газовой горелкой - 1 шт. по 280000 руб. = 280000 руб.
2. Установка и ввод в эксплуатацию - 1 шт. по 0 руб. = 0 руб.

Итого: 280000 руб.
НДС 20%: 56000 руб.
Всего к оплате: 336000 руб.

Банковские реквизиты:
Банк: Сбербанк России
Расчетный счет: 40702810123456789012
БИК: 044525225
ИНН: 1234567890
    `;

    console.log("🧪 Тестируем обработку инвойса через Universal AI...");
    const result = await universalAIService.processInvoiceWithAI(testOcrText);

    const availableProviders = Object.entries(providersStatus)
      .filter(([, available]) => available)
      .map(([provider]) => provider);

    return NextResponse.json({
      success: true,
      message: "Universal AI тест завершен успешно",
      testResults: {
        availableProviders,
        providersStatus,
        processingResult: result,
        inputLength: testOcrText.length,
        itemsFound: result.items?.length || 0,
        hasInvoiceInfo: !!result.invoiceInfo,
        hasBankInfo: !!result.bankInfo
      },
      configuration: {
        botHubKey: !!process.env.BOTHUB_API_KEY,
        openaiKey: !!process.env.OPENAI_API_KEY,
        anthropicKey: !!process.env.ANTHROPIC_API_KEY
      },
      originalInput: testOcrText.substring(0, 300) + "..."
    });

  } catch (error) {
    console.error("❌ Universal AI тест ошибка:", error);

    return NextResponse.json({
      success: false,
      error: "Universal AI тест неудачен",
      details: error instanceof Error ? error.message : String(error),
      configuration: {
        botHubKey: !!process.env.BOTHUB_API_KEY,
        openaiKey: !!process.env.OPENAI_API_KEY,
        anthropicKey: !!process.env.ANTHROPIC_API_KEY
      }
    });
  }
}