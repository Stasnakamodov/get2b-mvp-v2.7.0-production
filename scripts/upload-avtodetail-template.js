#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для загрузки шаблона АвтоДеталь Центр
 * Использует API /upload-supplier-template
 */

const SUPABASE_URL = "https://ejkhdhexkadecpbjjmsz.supabase.co";
const API_URL = "http://localhost:3000"; // Локальный сервер Next.js

const supplierData = {
  supplierId: "beea9ac5-1955-4dea-99d9-712385c838e9",
  supplierType: "verified",
  templateName: "АвтоДеталь Центр Стандартная Проформа",
  description: "Стандартный шаблон проформы для АвтоДеталь Центр с банковскими реквизитами",
  filePath: "/Users/user/Downloads/inv 1 701 540-1.xlsx",

  // Правила заполнения основаны на анализе Excel файла
  fillingRules: {
    "start_row": 14,
    "end_row": 25,
    "max_items": 12,
    "columns": {
      "item_name": "B",      // Product description -> колонка B
      "quantity": "C",       // Quantity, psc -> колонка C
      "price": "D",          // Price,RMB -> колонка D
      "total": "E"           // Total,RMB -> колонка E
    },
    "total_row": 26,
    "total_column": "E",
    "currency": "RMB",
    "additional_rules": {
      "company_info": {
        "company_name_row": 3,
        "bank_info_rows": [5, 6, 7, 8, 9, 10]
      },
      "payment_terms": {
        "terms_row": 27,
        "delivery_terms_row": 28
      },
      "rub_total_row": 27,
      "rub_total_column": "E",
      "exchange_rate": 11.8
    }
  }
};

async function uploadTemplate() {
  try {
    console.log("🚀 Начинаем загрузку шаблона АвтоДеталь Центр...");

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
      console.log("✅ Шаблон успешно загружен!");
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
-- Загрузка шаблона АвтоДеталь Центр
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
  'beea9ac5-1955-4dea-99d9-712385c838e9',
  'verified',
  'АвтоДеталь Центр Стандартная Проформа',
  'Стандартный шаблон проформы для АвтоДеталь Центр',
  'templates/beea9ac5-1955-4dea-99d9-712385c838e9/avtodetail-center-template.xlsx',
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