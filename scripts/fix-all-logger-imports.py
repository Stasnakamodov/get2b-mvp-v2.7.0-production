#!/usr/bin/env python3

import os
import re
from pathlib import Path

def fix_duplicate_logger_imports(file_path):
    """Remove duplicate logger imports and add one at the beginning"""

    with open(file_path, 'r') as f:
        content = f.read()

    # Count logger imports
    logger_import = 'import { logger } from "@/src/shared/lib/logger"'
    logger_import_alt = "import { logger } from '@/src/shared/lib/logger'"

    # Remove all logger imports
    content = re.sub(r'import \{ logger \} from ["\']@/src/shared/lib/logger["\'];?\n?', '', content)

    # Add one logger import at the beginning (after 'use client' if present)
    if '"use client"' in content:
        content = content.replace('"use client"', '"use client"\n\n' + logger_import, 1)
    else:
        content = logger_import + '\n' + content

    with open(file_path, 'w') as f:
        f.write(content)

    return True

def main():
    # Find all TypeScript files
    root_dir = Path('.')
    files_fixed = 0

    for ext in ['*.ts', '*.tsx']:
        for dir_path in ['app', 'src', 'components', 'lib', 'hooks']:
            if os.path.exists(dir_path):
                for file_path in Path(dir_path).rglob(ext):
                    # Skip node_modules and .next
                    if 'node_modules' in str(file_path) or '.next' in str(file_path):
                        continue

                    # Skip logger.ts itself
                    if 'logger.ts' in str(file_path):
                        continue

                    # Check if file contains logger import
                    with open(file_path, 'r') as f:
                        content = f.read()
                        logger_count = content.count('import { logger }')

                        if logger_count > 1:
                            print(f"Fixing: {file_path} ({logger_count} imports)")
                            fix_duplicate_logger_imports(file_path)
                            files_fixed += 1

    print(f"\n✨ Fixed {files_fixed} files with duplicate logger imports")

if __name__ == "__main__":
    main()