const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadProforma(filePath, supplierType, supplierName) {
  try {
    console.log(`📤 Загружаем ${filePath} как ${supplierType} (${supplierName})...`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('supplierType', supplierType);
    formData.append('supplierName', supplierName);

    const response = await fetch('http://localhost:3001/api/upload-supplier-proforma', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Успешно загружено: ${supplierName}`);
      console.log(`   Поставщик ID: ${result.data.supplierId}`);
      console.log(`   Путь в storage: ${result.data.storagePath}\n`);
    } else {
      console.error(`❌ Ошибка загрузки ${filePath}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error(`❌ Ошибка загрузки ${filePath}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Начинаем загрузку проформ...\n');

  const proformas = [
    {
      filePath: '/Users/user/Downloads/инвойсы 2/inv 1 701 540.xlsx',
      supplierType: 'construction',
      supplierName: 'СтройМатериалы-701'
    },
    {
      filePath: '/Users/user/Downloads/инвойсы 2/Invoice 2869020.xlsx',
      supplierType: 'electronics',
      supplierName: 'ЭлектроТехника-2869'
    },
    {
      filePath: '/Users/user/Downloads/инвойсы 2/inv 2 404 730.xlsx',
      supplierType: 'construction',
      supplierName: 'СтройСнаб-404'
    }
  ];

  const results = [];
  for (const proforma of proformas) {
    if (fs.existsSync(proforma.filePath)) {
      const result = await uploadProforma(
        proforma.filePath,
        proforma.supplierType,
        proforma.supplierName
      );
      results.push(result);

      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.error(`❌ Файл не найден: ${proforma.filePath}`);
    }
  }

  console.log('🎯 Загрузка завершена!');
  console.log(`✅ Успешно: ${results.filter(r => r && r.success).length}`);
  console.log(`❌ Ошибок: ${results.filter(r => !r || !r.success).length}`);
}

main().catch(console.error);