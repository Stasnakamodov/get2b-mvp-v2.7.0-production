#!/bin/bash

echo "🔧 Исправление пустых catch блоков..."

# Список файлов с пустыми catch блоками
files=(
  "app/api/document-analysis/route.ts"
  "app/api/chat/messages/route.ts"  
  "app/api/catalog/supplier-autofill/[supplierId]/route.ts"
  "app/api/catalog/search-by-image/route.ts"
  "app/api/analyze-database-structure/route.ts"
  "app/api/fix-old-accreditation/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Добавляем импорт logger если его нет
    if ! grep -q "from.*shared/lib/logger" "$file"; then
      sed -i '' '1a\
import { logger } from "@/src/shared/lib/logger";
' "$file"
    fi
    
    # Заменяем пустые catch блоки на обработку с logger
    perl -i -pe 's/} catch \((\w+)?\) \{\s*\}/} catch ($1) { logger.error("Error in API route", $1 || error) }/g' "$file"
    
    # Альтернативный паттерн для catch без переменной
    perl -i -pe 's/} catch \{\s*\}/} catch (error) { logger.error("Error in API route", error) }/g' "$file"
    
    echo "✅ Исправлен: $file"
  fi
done

echo "✨ Готово!"
