#!/bin/bash

echo "🔄 Массовая замена console на logger..."

# Функция для обработки файла
process_file() {
    local file="$1"
    
    # Пропускаем файл logger.ts
    if [[ "$file" == *"logger.ts"* ]]; then
        return
    fi
    
    # Проверяем наличие console
    if grep -q "console\.\(log\|error\|warn\|debug\|info\)(" "$file"; then
        # Проверяем наличие импорта logger
        if ! grep -q "from.*logger" "$file"; then
            # Определяем путь импорта
            local import_path="@/src/shared/lib/logger"
            
            # Добавляем импорт после первой строки или первого импорта
            if grep -q "^import" "$file"; then
                # Находим последний импорт и добавляем после него
                sed -i '' "/^import.*from/a\\
import { logger } from '${import_path}';" "$file"
            else
                # Добавляем в начало файла
                sed -i '' "1i\\
import { logger } from '${import_path}';\\
" "$file"
            fi
        fi
        
        # Заменяем console на logger
        sed -i '' \
            -e 's/console\.log(/logger.info(/g' \
            -e 's/console\.error(/logger.error(/g' \
            -e 's/console\.warn(/logger.warn(/g' \
            -e 's/console\.debug(/logger.debug(/g' \
            -e 's/console\.info(/logger.info(/g' \
            "$file"
        
        echo "✅ $file"
    fi
}

# Обрабатываем все TypeScript файлы
export -f process_file
find app src components lib hooks -name "*.ts" -o -name "*.tsx" | \
    grep -v node_modules | \
    grep -v ".next" | \
    while read file; do
        process_file "$file"
    done

# Подсчет результатов
echo ""
echo "📊 Проверка результатов:"
echo "Осталось console.log: $(find app src components -name "*.ts" -o -name "*.tsx" | xargs grep -h "console\.log(" 2>/dev/null | wc -l)"
echo "Осталось console.error: $(find app src components -name "*.ts" -o -name "*.tsx" | xargs grep -h "console\.error(" 2>/dev/null | wc -l)"
echo ""
echo "✨ Готово!"
