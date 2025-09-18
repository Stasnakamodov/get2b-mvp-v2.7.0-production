import { NextRequest, NextResponse } from "next/server";
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log("📊 API /generate-supplier-proforma вызван");

    const body = await request.json();
    const { projectId, supplierId, supplierData, specificationItems, templatePath } = body;

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!projectId || !supplierId || !supplierData) {
      return NextResponse.json(
        { error: "projectId, supplierId и supplierData обязательны" },
        { status: 400 }
      );
    }

    console.log("🔍 Генерируем проформу для:", {
      projectId,
      supplierId,
      supplierName: supplierData.name,
      itemsCount: (specificationItems && specificationItems.length) || 0,
      useTemplate: !!templatePath
    });

    let workbook = new ExcelJS.Workbook();

    // Если есть шаблон - загружаем его, иначе создаем новый
    if (templatePath) {
      console.log("📄 Загружаем шаблон через ExcelJS:", templatePath);

      // Загружаем шаблон из Storage
      const { data: templateData, error: templateError } = await supabase.storage
        .from('supplier-proformas')
        .download(templatePath);

      if (templateError) {
        console.error("❌ Ошибка загрузки шаблона:", templateError);
        // Fallback к созданию нового файла
        workbook = new ExcelJS.Workbook();
        workbook.addWorksheet('Проформа');
      } else {
        console.log("✅ Шаблон загружен, читаем через ExcelJS...");
        // Читаем шаблон с сохранением всех стилей и форматирования
        const arrayBuffer = await templateData.arrayBuffer();
        workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        console.log("✅ ExcelJS: Шаблон загружен с сохранением форматирования");
      }
    } else {
      // Создаем новую рабочую книгу Excel
      workbook = new ExcelJS.Workbook();
      workbook.addWorksheet('Проформа');
    }

    // Если используем шаблон, заполняем данными Step2 с правилами
    if (templatePath && workbook.worksheets.length > 0) {
      console.log("🔄 Заполняем шаблон данными из Step2 с правилами (ExcelJS)");

      // Получаем правила заполнения из БД
      const { data: templateRecord, error: templateError } = await supabase
        .from('supplier_proforma_templates')
        .select('id, filling_rules, template_name, usage_count')
        .eq('file_path', templatePath)
        .eq('is_active', true)
        .single();

      if (templateError || !templateRecord) {
        console.error("❌ Не удалось получить правила заполнения для шаблона:", templatePath);
        console.log("🔄 Используем fallback к стандартной логике заполнения");
        // Fallback к старой логике без правил
        const worksheet = workbook.worksheets[0];

        if (specificationItems && specificationItems.length > 0) {
          const maxItems = Math.min(specificationItems.length, 12);
          let totalAmount = 0;

          specificationItems.slice(0, maxItems).forEach((item: any, index: number) => {
            const quantity = Number(item.quantity) || Number(item.proforma_quantity) || 0;
            const price = Number(item.price) || Number(item.proforma_price) || 0;
            const total = quantity * price;
            totalAmount += total;
            const rowIndex = 13 + index; // ExcelJS uses 1-based indexing

            // СОХРАНЯЕМ ВСЕ СТИЛИ! Только меняем значения
            const nameCell = worksheet.getCell(rowIndex, 2); // B column
            const qtyCell = worksheet.getCell(rowIndex, 3);  // C column
            const priceCell = worksheet.getCell(rowIndex, 4); // D column
            const totalCell = worksheet.getCell(rowIndex, 5); // E column

            nameCell.value = item.item_name || 'Товар';
            qtyCell.value = quantity;
            priceCell.value = price;
            totalCell.value = total;

            console.log(`📝 ExcelJS: Строка ${rowIndex} заполнена: ${item.item_name} - ${quantity} × ${price} = ${total}`);
          });

          // Итоговая сумма
          const totalCell = worksheet.getCell(26, 5); // E26
          totalCell.value = totalAmount;

          console.log("✅ ExcelJS Fallback заполнение завершено, стили сохранены!");
        }
      } else {

      const rules = templateRecord.filling_rules;
      console.log("📋 Используем правила заполнения ExcelJS:", rules);

      const worksheet = workbook.worksheets[0];

      // Заполняем шаблон по правилам
      if (specificationItems && specificationItems.length > 0) {
        console.log("🎯 Заполняем шаблон товарами с применением правил");

        const maxItems = Math.min(
          specificationItems.length,
          rules.max_items || (rules.end_row - rules.start_row + 1)
        );
        let totalAmount = 0;

        specificationItems.slice(0, maxItems).forEach((item: any, index: number) => {
          const quantity = Number(item.quantity) || Number(item.proforma_quantity) || 0;
          const price = Number(item.price) || Number(item.proforma_price) || 0;
          const total = quantity * price;
          totalAmount += total;

          // Вычисляем индекс строки: start_row - 1 + index (Excel rows 1-indexed, array 0-indexed)
          const rowIndex = (rules.start_row - 1) + index;

          console.log(`📝 Заполняем строку ${rowIndex + 1} (правило: начало с ${rules.start_row})`);

          // Заполняем колонки согласно правилам (ExcelJS)
          const columns = rules.columns;

          // ExcelJS: Заполнение с сохранением форматирования
          // Конвертируем буквы колонок в числа (A=1, B=2, C=3, D=4, E=5)
          const columnToNumber = (col: string): number => col.charCodeAt(0) - 64;

          if (columns.item_name) {
            const nameCell = worksheet.getCell(rowIndex + 1, columnToNumber(columns.item_name));
            nameCell.value = item.item_name || 'Товар из Step2';
          }

          if (columns.quantity) {
            const qtyCell = worksheet.getCell(rowIndex + 1, columnToNumber(columns.quantity));
            qtyCell.value = quantity;
          }

          if (columns.price) {
            const priceCell = worksheet.getCell(rowIndex + 1, columnToNumber(columns.price));
            priceCell.value = price;
          }

          if (columns.total) {
            const totalCell = worksheet.getCell(rowIndex + 1, columnToNumber(columns.total));
            totalCell.value = total;
          }

          // Дополнительные поля если есть
          if (columns.item_code && item.item_code) {
            const codeCell = worksheet.getCell(rowIndex + 1, columnToNumber(columns.item_code));
            codeCell.value = item.item_code;
          }

          if (columns.unit && item.unit) {
            const unitCell = worksheet.getCell(rowIndex + 1, columnToNumber(columns.unit));
            unitCell.value = item.unit;
          }

          console.log(`📝 Строка ${rowIndex + 1}: ${item.item_name} - ${quantity} × ${price} = ${total}`);
        });

        // Записываем итоговую сумму согласно правилам (ExcelJS)
        if (rules.total_row && rules.total_column) {
          const columnToNumber = (col: string): number => col.charCodeAt(0) - 64;
          const totalCell = worksheet.getCell(rules.total_row, columnToNumber(rules.total_column));
          totalCell.value = totalAmount;

          console.log(`💰 Итоговая сумма записана в ${rules.total_column}${rules.total_row}: ${totalAmount}`);
        }

        // Дополнительные правила заполнения
        if (rules.additional_rules) {
          const additionalRules = rules.additional_rules;

          // Сумма в других валютах (ExcelJS)
          if (additionalRules.rub_total_row && additionalRules.exchange_rate) {
            const columnToNumber = (col: string): number => col.charCodeAt(0) - 64;
            const rubAmount = totalAmount * additionalRules.exchange_rate;
            const rubTotalColumn = additionalRules.rub_total_column || rules.total_column;
            const rubCell = worksheet.getCell(additionalRules.rub_total_row, columnToNumber(rubTotalColumn));
            rubCell.value = rubAmount;

            console.log(`💱 Сумма в рублях: ${rubAmount.toFixed(2)} (курс ${additionalRules.exchange_rate})`);
          }

          // Дата генерации (ExcelJS)
          if (additionalRules.date_cell) {
            const currentDate = new Date().toLocaleDateString('ru-RU');
            const dateCell = worksheet.getCell(additionalRules.date_cell);
            dateCell.value = currentDate;
          }

          // Номер проформы/инвойса (ExcelJS)
          if (additionalRules.invoice_number_cell) {
            const invoiceNumber = `INV-${Date.now()}`;
            const invoiceCell = worksheet.getCell(additionalRules.invoice_number_cell);
            invoiceCell.value = invoiceNumber;
          }
        }

        console.log(`✅ Заполнено товаров: ${maxItems}/${specificationItems.length}`);
        console.log(`💰 Итого: ${totalAmount} ${rules.currency || 'USD'}`);

        if (specificationItems.length > maxItems) {
          console.log(`⚠️ Превышено максимальное количество товаров. Показаны только первые ${maxItems} из ${specificationItems.length}`);
        }

        // Увеличиваем счетчик использования шаблона
        await supabase.rpc('increment_template_usage', { p_template_id: templateRecord.id });
      }
      }

      console.log("✅ Шаблон заполнен данными из Step2");

    } else {
      // Создаем новую проформу с нуля
      console.log("📝 Создаем новую проформу с нуля");

      // Заголовок проформы
      const currentDate = new Date().toLocaleDateString('ru-RU');
      const headerData = [
      ["ПРОФОРМА-ИНВОЙС"],
      [""],
      [`Дата: ${currentDate}`],
      [`Проект: ${projectId}`],
      [""],
      ["ПОСТАВЩИК:"],
      [`Название: ${supplierData.name || 'Не указано'}`],
      [`Компания: ${supplierData.company_name || 'Не указано'}`],
      [`Страна: ${supplierData.country || 'Не указано'}`],
      [`Город: ${supplierData.city || 'Не указано'}`],
      [`Категория: ${supplierData.category || 'Не указано'}`],
      [`Тип: ${supplierData.room_type === 'verified' ? 'Проверенный поставщик' : 'Поставщик пользователь'}`],
      [""],
      ["СПЕЦИФИКАЦИЯ ТОВАРОВ:"],
      [""],
    ];

    // Заголовки таблицы товаров
    const tableHeaders = [
      "№", "Наименование", "Код товара", "Количество", "Ед. изм.", "Цена за ед. ($)", "Сумма ($)"
    ];

    // Данные товаров
    let itemsData: any[][] = [];
    let totalAmount = 0;

    if (specificationItems && specificationItems.length > 0) {
      itemsData = specificationItems.map((item: any, index: number) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const total = quantity * price;
        totalAmount += total;

        return [
          index + 1,
          item.item_name || 'Товар',
          item.item_code || '',
          quantity,
          item.unit || 'шт',
          price.toFixed(2),
          total.toFixed(2)
        ];
      });
    } else {
      // Если товаров нет, добавляем placeholder
      itemsData = [
        [1, "Товары будут добавлены позже", "", 0, "шт", "0.00", "0.00"]
      ];
    }

    // Итоговые данные
    const footerData = [
      [""],
      ["", "", "", "", "", "ИТОГО:", `$${totalAmount.toFixed(2)}`],
      [""],
      ["РЕКВИЗИТЫ ДЛЯ ОПЛАТЫ:"],
      [""]
    ];

    // Добавляем банковские реквизиты если есть
    if (supplierData.bank_accounts && supplierData.bank_accounts.length > 0) {
      footerData.push(["БАНКОВСКИЕ РЕКВИЗИТЫ:"]);
      supplierData.bank_accounts.forEach((account: any, index: number) => {
        footerData.push([`Банковский счет ${index + 1}:`]);
        if (account.account_number) footerData.push([`Номер счета: ${account.account_number}`]);
        if (account.bank_name) footerData.push([`Банк: ${account.bank_name}`]);
        if (account.swift_code) footerData.push([`SWIFT: ${account.swift_code}`]);
        if (account.iban) footerData.push([`IBAN: ${account.iban}`]);
        if (account.routing_number) footerData.push([`Routing: ${account.routing_number}`]);
        footerData.push([""]);
      });
    }

    // Добавляем криптовалютные кошельки если есть
    if (supplierData.crypto_wallets && supplierData.crypto_wallets.length > 0) {
      footerData.push(["КРИПТОВАЛЮТНЫЕ КОШЕЛЬКИ:"]);
      supplierData.crypto_wallets.forEach((wallet: any) => {
        footerData.push([`${wallet.currency || 'Crypto'}: ${wallet.address || ''}`]);
        if (wallet.network) footerData.push([`Сеть: ${wallet.network}`]);
        footerData.push([""]);
      });
    }

    // Добавляем P2P карты если есть
    if (supplierData.p2p_cards && supplierData.p2p_cards.length > 0) {
      footerData.push(["P2P КАРТЫ:"]);
      supplierData.p2p_cards.forEach((card: any) => {
        footerData.push([`${card.platform || 'P2P'}: ${card.card_number || card.phone || ''}`]);
        if (card.card_holder) footerData.push([`Держатель: ${card.card_holder}`]);
        footerData.push([""]);
      });
    }

    // Добавляем контактную информацию
    footerData.push(["ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:"]);
    footerData.push([`ID поставщика: ${supplierId}`]);
    footerData.push([`Создано: ${new Date().toLocaleString('ru-RU')}`]);
    footerData.push([""]);
    footerData.push(["Данная проформа создана автоматически системой Get2B"]);

    // Объединяем все данные
    const allData = [
      ...headerData,
      tableHeaders,
      ...itemsData,
      ...footerData
    ];

    // Создаем рабочий лист (ExcelJS)
    const worksheet = workbook.addWorksheet('Проформа');

    // Добавляем данные в лист
    allData.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const cell = worksheet.getCell(rowIndex + 1, colIndex + 1);
        cell.value = cellValue;
      });
    });

    // Настройка ширины колонок (ExcelJS)
    worksheet.columns = [
      { width: 5 },   // №
      { width: 30 },  // Наименование
      { width: 15 },  // Код товара
      { width: 10 },  // Количество
      { width: 10 },  // Ед. изм.
      { width: 15 },  // Цена за ед.
      { width: 15 }   // Сумма
    ];
    } // Закрытие else блока создания новой проформы

    // Генерируем Excel файл в формате buffer (ExcelJS)
    const excelBuffer = await workbook.xlsx.writeBuffer();

    // Создаем имя файла
    const supplierName = (supplierData.name || 'supplier')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_');
    const fileName = `proforma_${supplierName}_${projectId}_${Date.now()}.xlsx`;

    // Путь в Storage: supplier-proformas/{supplierId}/{projectId}/{fileName}
    const storagePath = `${supplierId}/${projectId}/${fileName}`;

    // Сохраняем в Supabase Storage
    console.log("💾 Сохраняем проформу в Storage:", storagePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('supplier-proformas')
      .upload(storagePath, excelBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true
      });

    if (uploadError) {
      console.error("❌ Ошибка загрузки в Storage:", uploadError);
      // Если загрузка не удалась, все равно возвращаем файл пользователю
    } else {
      console.log("✅ Проформа сохранена в Storage:", uploadData);
    }

    // Возвращаем файл пользователю для скачивания
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache',
        'X-Storage-Path': storagePath, // Передаем путь в заголовке для frontend
      }
    });

  } catch (error) {
    console.error('❌ [API] Ошибка генерации проформы:', error);
    return NextResponse.json(
      {
        error: 'Ошибка генерации проформы',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}