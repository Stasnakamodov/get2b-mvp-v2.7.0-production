#!/bin/bash

echo "🔧 Исправление всех дублированных импортов logger..."

# Список проблемных файлов из ошибки сборки
files=(
  "app/dashboard/accredit-supplier/[id]/page.tsx"
  "app/dashboard/active-projects/page.tsx"
  "app/dashboard/ai-chat/page.tsx"
  "app/dashboard/profile/page.tsx"
  "app/dashboard/project-constructor/page.tsx"
  "app/dashboard/project/[id]/page.tsx"
  "app/dashboard/how-to-use/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Обработка: $file"
    # Удаляем ВСЕ импорты logger
    sed -i '' '/import { logger }/d' "$file"
    
    # Добавляем ОДИН импорт после "use client" или в начало
    if grep -q '"use client"' "$file"; then
      # Если есть "use client", добавляем после него
      sed -i '' '/"use client"/a\
\
import { logger } from "@/src/shared/lib/logger"
' "$file"
    else
      # Иначе добавляем в начало
      sed -i '' '1i\
import { logger } from "@/src/shared/lib/logger"\
' "$file"
    fi
  fi
done

echo "✨ Готово!"
