#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Директории для обработки
const directories = [
  'app/**/*.{ts,tsx}',
  'src/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
  'utils/**/*.{ts,tsx}',
  'types/**/*.{ts,tsx}'
];

// Файлы для исключения
const excludePatterns = [
  '**/node_modules/**',
  '**/build/**',
  '**/.next/**',
  '**/dist/**',
  '**/src/shared/lib/logger.ts' // Не трогаем сам logger
];

let totalReplaced = 0;
let filesModified = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileReplaced = 0;

  // Паттерны замены
  const replacements = [
    // console.log
    {
      pattern: /console\.log\(/g,
      replacement: 'logger.info(',
      type: 'log'
    },
    // console.error
    {
      pattern: /console\.error\(/g,
      replacement: 'logger.error(',
      type: 'error'
    },
    // console.warn
    {
      pattern: /console\.warn\(/g,
      replacement: 'logger.warn(',
      type: 'warn'
    },
    // console.debug
    {
      pattern: /console\.debug\(/g,
      replacement: 'logger.debug(',
      type: 'debug'
    },
    // console.info
    {
      pattern: /console\.info\(/g,
      replacement: 'logger.info(',
      type: 'info'
    }
  ];

  // Выполняем замены
  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      fileReplaced += matches.length;
      content = content.replace(pattern, replacement);
    }
  });

  if (fileReplaced > 0) {
    // Проверяем, есть ли уже импорт logger
    const hasLoggerImport = content.includes("from '@/src/shared/lib/logger'") ||
                           content.includes('from "@/src/shared/lib/logger"') ||
                           content.includes("from '../shared/lib/logger'") ||
                           content.includes("from '../../shared/lib/logger'");

    if (!hasLoggerImport) {
      // Определяем правильный путь импорта
      let importPath = '@/src/shared/lib/logger';

      // Для файлов в src используем относительный путь
      if (filePath.includes('/src/')) {
        const fileDir = path.dirname(filePath);
        const relativePath = path.relative(fileDir, path.join(process.cwd(), 'src/shared/lib'));
        importPath = relativePath.startsWith('.') ? `${relativePath}/logger` : `./${relativePath}/logger`;
      }

      // Добавляем импорт logger в начало файла
      const importStatement = `import { logger } from '${importPath}';\n`;

      // Находим место для вставки импорта (после других импортов)
      const importRegex = /^(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/m;
      const importMatch = content.match(importRegex);

      if (importMatch) {
        // Вставляем после существующих импортов
        const insertPosition = importMatch.index + importMatch[0].length;
        content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
      } else {
        // Если импортов нет, вставляем в начало файла
        content = importStatement + '\n' + content;
      }
    }

    // Сохраняем изменения
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Обработан файл: ${filePath} (заменено: ${fileReplaced})`);
    totalReplaced += fileReplaced;
    filesModified++;
  }
}

console.log('🔄 Начинаю замену console на logger...\n');

// Находим все файлы для обработки
directories.forEach(pattern => {
  const files = glob.sync(pattern, {
    ignore: excludePatterns,
    nodir: true
  });

  files.forEach(file => {
    try {
      processFile(file);
    } catch (error) {
      console.error(`❌ Ошибка при обработке файла ${file}:`, error.message);
    }
  });
});

console.log('\n📊 Статистика:');
console.log(`Файлов изменено: ${filesModified}`);
console.log(`Всего замен: ${totalReplaced}`);
console.log('\n✨ Готово!');