#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для загрузки шаблона ТехноКомплект
 * Использует API /upload-supplier-template
 */

const SUPABASE_URL = "https://ejkhdhexkadecpbjjmsz.supabase.co";
const API_URL = "http://localhost:3002"; // Локальный сервер Next.js (был 3002 в тестах)

const supplierData = {
  supplierId: "655833fa-395e-4785-bd9a-894efef4db24",
  supplierType: "verified",
  templateName: "ТехноКомплект Стандартная Проформа",
  description: "Стандартный шаблон проформы для ТехноКомплект ООО с банковскими реквизитами",
  filePath: "/Users/user/Downloads/Invoice 2869020.xlsx",

  // Правила заполнения основаны на анализе Excel файла из скриншота
  fillingRules: {
    "start_row": 16,        // Начинаем с строки 16 (после заголовков)
    "end_row": 21,          // До строки 21 (5 товаров максимум)
    "max_items": 6,         // Максимум 6 позиций товаров
    "columns": {
      "item_name": "B",     // ITEM NUMBER -> колонка B
      "quantity": "C",      // QTY -> колонка C
      "price": "D",         // Price,RMB -> колонка D
      "total": "E"          // Total,RMB -> колонка E
    },
    "total_row": 22,        // Итоговая сумма после таблицы
    "total_column": "E",    // Колонка E для итогов
    "currency": "RMB",      // Валюта - китайские юани
    "additional_rules": {
      "company_info": {
        "company_name_row": 3,         // Информация о продавце
        "bank_info_rows": [25, 26, 27, 28] // Банковские реквизиты внизу
      },
      "invoice_details": {
        "invoice_number_cell": "F2",   // Номер инвойса справа вверху
        "date_cell": "F1"             // Дата справа вверху
      },
      "totals": {
        "deposit_info_row": 23,        // Информация о депозите
        "currency_note": "RMB только"
      },
      "bank_details": {
        "bank_name": "Industrial Bank Co., Ltd, Hangzhou branch",
        "bank_address": "No., 158 Binwang Road, Yiwu, Zhejiang province, China",
        "swift_code": "FJIBCNBA530",
        "account_number": "NRA356011048100241768"
      }
    }
  }
};

async function uploadTemplate() {
  try {
    console.log("🚀 Начинаем загрузку шаблона ТехноКомплект...");

    // Проверяем существование файла
    if (!fs.existsSync(supplierData.filePath)) {
      console.error("❌ Файл не найден:", supplierData.filePath);
      process.exit(1);
    }

    // Читаем файл
    const fileBuffer = fs.readFileSync(supplierData.filePath);
    const fileName = path.basename(supplierData.filePath);

    console.log("📁 Файл загружен:", fileName, "размер:", fileBuffer.length, "байт");

    // Создаем FormData
    const FormData = require('form-data');
    const formData = new FormData();

    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    formData.append('supplierId', supplierData.supplierId);
    formData.append('supplierType', supplierData.supplierType);
    formData.append('templateName', supplierData.templateName);
    formData.append('description', supplierData.description);
    formData.append('fillingRules', JSON.stringify(supplierData.fillingRules));
    formData.append('isDefault', 'true');

    console.log("📤 Отправляем запрос на", `${API_URL}/api/upload-supplier-template`);

    // Отправляем запрос
    const fetch = require('node-fetch');
    const response = await fetch(`${API_URL}/api/upload-supplier-template`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Шаблон ТехноКомплект успешно загружен!");
      console.log("📋 Детали:", {
        id: result.template.id,
        name: result.template.template_name,
        path: result.template.file_path,
        size: result.template.file_size,
        is_default: result.template.is_default
      });
    } else {
      console.error("❌ Ошибка загрузки:", result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error("❌ Ошибка:", error.message);
    process.exit(1);
  }
}

// Альтернативный вариант: прямая вставка в БД через SQL
async function insertDirectlyToDatabase() {
  console.log("🔄 Альтернативный способ: прямая вставка в БД");

  const sqlQuery = `
-- Загрузка шаблона ТехноКомплект
INSERT INTO supplier_proforma_templates (
  supplier_id,
  supplier_type,
  template_name,
  description,
  file_path,
  filling_rules,
  is_default,
  is_active
) VALUES (
  '655833fa-395e-4785-bd9a-894efef4db24',
  'verified',
  'ТехноКомплект Стандартная Проформа',
  'Стандартный шаблон проформы для ТехноКомплект ООО',
  'templates/655833fa-395e-4785-bd9a-894efef4db24/tehnokomplekt-template.xlsx',
  '${JSON.stringify(supplierData.fillingRules)}'::jsonb,
  true,
  true
);`;

  console.log("📋 SQL для вставки:");
  console.log(sqlQuery);
}

// Запуск
const command = process.argv[2];

if (command === 'sql') {
  insertDirectlyToDatabase();
} else {
  uploadTemplate();
}