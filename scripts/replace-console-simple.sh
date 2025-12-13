#!/bin/bash

echo "🔄 Начинаю замену console на logger..."

# Счетчики
total_replaced=0
files_modified=0

# Функция для обработки файла
process_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    local count=0

    # Подсчитываем количество замен
    count=$(grep -c "console\.\(log\|error\|warn\|debug\|info\)(" "$file" 2>/dev/null || echo 0)

    if [ "$count" -gt 0 ]; then
        # Проверяем, есть ли уже импорт logger
        has_logger=$(grep -c "from.*shared/lib/logger" "$file" 2>/dev/null || echo 0)

        # Делаем замены
        sed -e 's/console\.log(/logger.info(/g' \
            -e 's/console\.error(/logger.error(/g' \
            -e 's/console\.warn(/logger.warn(/g' \
            -e 's/console\.debug(/logger.debug(/g' \
            -e 's/console\.info(/logger.info(/g' \
            "$file" > "$temp_file"

        # Добавляем импорт, если его нет
        if [ "$has_logger" -eq 0 ]; then
            # Определяем правильный путь импорта
            if [[ "$file" == *"/src/"* ]]; then
                # Для файлов в src используем относительные пути
                echo "import { logger } from '@/src/shared/lib/logger';" > "${file}.import"
            else
                echo "import { logger } from '@/src/shared/lib/logger';" > "${file}.import"
            fi

            # Вставляем импорт после существующих импортов
            if grep -q "^import" "$temp_file"; then
                # Находим последний импорт и вставляем после него
                awk '/^import/ {imports=imports $0 "\n"}
                     !/^import/ && !done {print imports; system("cat '"${file}.import"'"); done=1; print $0; next}
                     {print}' "$temp_file" > "${file}.final"
                mv "${file}.final" "$temp_file"
            else
                # Если импортов нет, вставляем в начало
                cat "${file}.import" "$temp_file" > "${file}.final"
                mv "${file}.final" "$temp_file"
            fi
            rm -f "${file}.import"
        fi

        # Заменяем оригинальный файл
        mv "$temp_file" "$file"

        echo "✅ Обработан: $file (заменено: $count)"
        ((total_replaced += count))
        ((files_modified++))
    fi
}

# Находим все TypeScript файлы
find app src components lib hooks utils types -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | \
    grep -v node_modules | \
    grep -v ".next" | \
    grep -v "logger.ts" | \
    while read -r file; do
        process_file "$file"
    done

echo ""
echo "📊 Статистика:"
echo "Файлов изменено: $files_modified"
echo "Всего замен: $total_replaced"
echo ""
echo "✨ Готово!"