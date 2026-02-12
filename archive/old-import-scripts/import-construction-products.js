#!/usr/bin/env node

/**
 * Импорт товаров в категорию "Строительство" с использованием умного импортера
 */

const { spawn } = require('child_process')

console.log('🏗️ ИМПОРТ ТОВАРОВ В КАТЕГОРИЮ "СТРОИТЕЛЬСТВО"')
console.log('=' .repeat(60))
console.log('Используется улучшенный алгоритм с защитой от дубликатов')
console.log('=' .repeat(60))

// Устанавливаем переменные окружения
const env = {
  ...process.env,
  OTAPI_INSTANCE_KEY: '0e4fb57d-d80e-4274-acc5-f22f354e3577',
  IMPORT_CATEGORY: 'Строительство'
}

// Запускаем умный импортер
const importer = spawn('node', ['scripts/smart-import-otapi.js'], { env })

importer.stdout.on('data', (data) => {
  process.stdout.write(data)
})

importer.stderr.on('data', (data) => {
  process.stderr.write(data)
})

importer.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Импорт завершен успешно!')
  } else {
    console.log(`\n❌ Импорт завершен с ошибкой (код: ${code})`)
  }
  process.exit(code)
})