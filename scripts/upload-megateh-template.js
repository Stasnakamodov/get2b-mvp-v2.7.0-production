#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для загрузки шаблона МегаТех Электроника
 * Использует API /upload-supplier-template
 */

const SUPABASE_URL = "https://ejkhdhexkadecpbjjmsz.supabase.co";
const API_URL = "http://localhost:3002"; // Локальный сервер Next.js

const supplierData = {
  supplierId: "5c92e7ee-eb67-4fca-b07c-396b785d90a5",
  supplierType: "verified",
  templateName: "МегаТех Электроника Стандартная Проформа",
  description: "Стандартный шаблон проформы для МегаТех Электроника ООО с банковскими реквизитами",
  filePath: "/Users/user/Downloads/inv 1 701 540-1.xlsx", // Правильный файл для МегаТех Электроника

  // Правила заполнения как у АвтоДеталь Центр (тот же шаблон inv 1 701 540-1.xlsx)
  fillingRules: {
    "start_row": 14,        // Начинаем с строки 14 (как АвтоДеталь)
    "end_row": 25,          // До строки 25 (12 товаров максимум)
    "max_items": 12,        // Максимум 12 позиций товаров
    "columns": {
      "item_name": "B",     // Product description -> колонка B
      "quantity": "C",      // Quantity, psc -> колонка C
      "price": "D",         // Price,RMB -> колонка D
      "total": "E"          // Total,RMB -> колонка E
    },
    "total_row": 26,        // Итоговая сумма E26
    "total_column": "E",    // Колонка E для итогов
    "currency": "RMB",      // Валюта - китайские юани
    "additional_rules": {
      "company_info": {
        "company_name_row": 3,         // Информация о продавце
        "bank_info_rows": [5, 6, 7, 8, 9, 10] // Банковские реквизиты
      },
      "payment_terms": {
        "terms_row": 27,
        "delivery_terms_row": 28
      },
      "rub_total_row": 27,
      "rub_total_column": "E",
      "exchange_rate": 11.8    // Курс юаня к рублю
    }
  }
};

async function uploadTemplate() {
  try {
    console.log("🚀 Начинаем загрузку шаблона МегаТех Электроника...");

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
      console.log("✅ Шаблон МегаТех Электроника успешно загружен!");
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
-- Загрузка шаблона МегаТех Электроника
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
  '5c92e7ee-eb67-4fca-b07c-396b785d90a5',
  'verified',
  'МегаТех Электроника Стандартная Проформа',
  'Стандартный шаблон проформы для МегаТех Электроника ООО',
  'templates/5c92e7ee-eb67-4fca-b07c-396b785d90a5/megateh-elektronika-template.xlsx',
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