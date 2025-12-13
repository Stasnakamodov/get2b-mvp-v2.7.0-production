#!/bin/bash

echo "🔄 Начинаю массовую замену console на logger..."

# Обрабатываем все файлы в API routes (приоритет)
for file in app/api/**/*.ts; do
    if [ -f "$file" ]; then
        # Проверяем наличие console
        if grep -q "console\." "$file"; then
            # Добавляем импорт, если его нет
            if ! grep -q "from.*shared/lib/logger" "$file"; then
                sed -i '' '1a\
import { logger } from "@/src/shared/lib/logger";
' "$file"
            fi
            
            # Заменяем console на logger
            sed -i '' \
                -e 's/console\.log(/logger.info(/g' \
                -e 's/console\.error(/logger.error(/g' \
                -e 's/console\.warn(/logger.warn(/g' \
                -e 's/console\.debug(/logger.debug(/g' \
                -e 's/console\.info(/logger.info(/g' \
                "$file"
            
            echo "✅ Обработан: $file"
        fi
    fi
done

# Обрабатываем файлы в src/entities
for file in src/entities/**/*.ts; do
    if [ -f "$file" ]; then
        if grep -q "console\." "$file"; then
            if ! grep -q "from.*shared/lib/logger" "$file"; then
                sed -i '' '1a\
import { logger } from "@/src/shared/lib/logger";
' "$file"
            fi
            
            sed -i '' \
                -e 's/console\.log(/logger.info(/g' \
                -e 's/console\.error(/logger.error(/g' \
                -e 's/console\.warn(/logger.warn(/g' \
                "$file"
            
            echo "✅ Обработан: $file"
        fi
    fi
done

echo "✨ Готово!"
