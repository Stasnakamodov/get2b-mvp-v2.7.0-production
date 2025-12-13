#!/bin/bash

# Clean console.log from production code
echo "Cleaning console.log statements..."

# Files to clean
files=(
  "src/features/cart-management/providers/CartProvider.tsx"
  "components/catalog/ProductGridByCategory.tsx"
  "app/dashboard/catalog/page.tsx"
  "app/dashboard/create-project/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Remove console.log and console.debug lines
    grep -v "console\.\(log\|debug\)" "$file" > "$file.tmp" 2>/dev/null && mv "$file.tmp" "$file"
  fi
done

echo "✨ Cleanup complete!"