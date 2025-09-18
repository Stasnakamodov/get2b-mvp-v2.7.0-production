import { NextRequest, NextResponse } from 'next/server';

// Тестовый DOCX текст из реальных логов
const testDocxText = `Zhuhai East Road International Trade Co.,  Ltd

A7, 4th Floor, No.6 Jingyuan Road, Jida, Zhuhai,519015

+86 13531821997

Buyer :

IT GROUP LLC

129226, Russia Moscow, ext. Rostokino Municipal District, Agricultural Street, 11, building 3, floor/room 1/II, room 1 (PM 115)

registration number 1227700266463

Specification No:

ZER03/31 dd 31/03/2025

Contract No:

AС/03-31/2 dd 31/03/2025

Delivery conditions

CPT Bishkek

ххх

Shipper:

Zhuhai East Road International Trade Co.,  Ltd

A7, 4th Floor, No.6 Jingyuan Road, Jida,  Zhuhai,519015

Consignee (according to the supply contract АС/03-31 dd 31.03.2025

 IP Alkin Anton Aleksandrovichrubley

Russian Federation, Republic of Kalmykia, Ulan Khol

+7 926 0672275

Packing:

Banking information:

Terms of payment:

100%  prepayment

registration number 440400400136632

tax number 91440400MACK5DMT7E

Ping An Bank Zhuhai Branch Sales Department

Branch

Gross weight:

VTB Bank SHANGHAI Branch

Net weight:

code

Product description

Quantity, psc

Price per pcs., RMB

Total

Totalpersсs., ¥

1

Thermal oil heater furnace with gas/diesel burner

1 psc

280 000

280 000

2

Installation, commissioning

1 psc

-

-

Total ¥:

280 000 ,00¥

Total ₽:

2 800 000,00₽`;

export async function GET() {
  console.log("🧪 ТЕСТ: Парсинг DOCX товаров");

  // Тестируем многострочный парсер
  const lines = testDocxText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const foundItems: any[] = [];

  for (let i = 0; i < lines.length - 4; i++) {
    const line1 = lines[i];     // номер
    const line2 = lines[i + 1]; // название
    const line3 = lines[i + 2]; // количество
    const line4 = lines[i + 3]; // цена
    const line5 = lines[i + 4]; // сумма

    console.log(`🔍 Проверяем строки ${i}-${i+4}:`);
    console.log(`  line1 (номер): "${line1}" | тест: /^\\d+$/ = ${/^\d+$/.test(line1)}`);
    console.log(`  line2 (название): "${line2}" | длина: ${line2.length}`);
    console.log(`  line3 (количество): "${line3}" | тест psc: ${/\d+\s*psc/.test(line3)}`);
    console.log(`  line4 (цена): "${line4}" | тест цифры: ${/^\d+[\s,]*\d*$/.test(line4.replace(/\s/g, ''))}`);

    // ПАТТЕРН ДЛЯ МНОГОСТРОЧНЫХ ТАБЛИЦ DOCX
    if (/^\d+$/.test(line1) &&
        line2.length > 10 &&
        /\d+\s*psc/.test(line3) &&
        /^\d+[\s,]*\d*$/.test(line4.replace(/\s/g, ''))) {

      const itemNumber = parseInt(line1);
      const itemName = line2;
      const quantity = parseInt(line3.replace(/[^\d]/g, '')) || 1;
      const price = parseFloat(line4.replace(/\s/g, '').replace(',', '.')) || 0;
      const total = line5 && /^\d+/.test(line5) ? parseFloat(line5.replace(/\s/g, '').replace(',', '.')) : quantity * price;

      const item = {
        name: itemName.trim(),
        quantity: quantity,
        price: price,
        total: total,
        code: `ITEM-${itemNumber}`,
        unit: 'шт'
      };

      if (item.name.length > 5 && item.price > 0) {
        foundItems.push(item);
        console.log(`✅ Многострочная позиция найдена (строки ${i+1}-${i+5}):`, item);
        i += 4;
      }
    }
  }

  return NextResponse.json({
    success: true,
    foundItems,
    totalLines: lines.length,
    testText: testDocxText.substring(0, 300) + "..."
  });
}