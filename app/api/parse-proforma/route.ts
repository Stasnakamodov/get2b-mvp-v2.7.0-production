import { NextRequest, NextResponse } from "next/server";
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    console.log("📊 API /parse-proforma вызван");

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: 400 }
      );
    }

    // Читаем файл как ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Берем первый лист
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Конвертируем в JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Анализируем структуру проформы
    const analysis = {
      fileName: file.name,
      sheetName: firstSheetName,
      totalRows: jsonData.length,
      data: jsonData,
      parsed: {
        supplier: '',
        items: [] as any[],
        total: '',
        paymentInfo: [] as string[]
      }
    };

    // Простой парсинг - ищем ключевые поля
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] || '').toLowerCase();

      // Ищем информацию о поставщике
      if (firstCell.includes('supplier') || firstCell.includes('поставщик') || firstCell.includes('company')) {
        analysis.parsed.supplier = row.join(' ').trim();
      }

      // Ищем итоговую сумму
      if (firstCell.includes('total') || firstCell.includes('итого') || firstCell.includes('сумма')) {
        analysis.parsed.total = row.join(' ').trim();
      }

      // Ищем товары (строки с числовыми значениями)
      if (row.some(cell => typeof cell === 'number' && cell > 0)) {
        analysis.parsed.items.push(row);
      }

      // Ищем платежную информацию
      if (firstCell.includes('bank') || firstCell.includes('банк') || firstCell.includes('account') || firstCell.includes('счет') || firstCell.includes('iban') || firstCell.includes('swift')) {
        analysis.parsed.paymentInfo.push(row.join(' ').trim());
      }
    }

    console.log("✅ Файл проанализирован:", {
      name: file.name,
      rows: jsonData.length,
      supplier: analysis.parsed.supplier,
      itemsCount: analysis.parsed.items.length
    });

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ [API] Ошибка парсинга проформы:', error);
    return NextResponse.json(
      {
        error: 'Ошибка парсинга проформы',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}