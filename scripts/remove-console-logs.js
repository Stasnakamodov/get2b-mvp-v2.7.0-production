#!/usr/bin/env node

/**
 * Script to remove console.log statements from production code
 * Keeps logger.info, logger.debug, etc. for proper logging
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to search for files
const patterns = [
  'src/**/*.{tsx,ts,jsx,js}',
  'app/**/*.{tsx,ts,jsx,js}',
  'components/**/*.{tsx,ts,jsx,js}'
];

// Files to exclude
const excludePatterns = [
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/logger.ts',
  '**/logger.js'
];

let totalRemoved = 0;

function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Pattern to match console.log, console.debug, console.warn, console.error
  // But not logger.debug, logger.info, etc.
  const consolePattern = /^\s*console\.(log|debug|info|warn|error)\([^)]*\);?\s*$/gm;
  const multilineConsolePattern = /^\s*console\.(log|debug|info|warn|error)\([^)]*\n([^)]*\n)*[^)]*\);?\s*$/gm;

  // Remove single-line console statements
  content = content.replace(consolePattern, '');

  // Remove multi-line console statements
  content = content.replace(multilineConsolePattern, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    const removedCount = (originalContent.match(consolePattern) || []).length +
                        (originalContent.match(multilineConsolePattern) || []).length;
    console.log(`✅ Cleaned ${filePath}: removed ${removedCount} console statements`);
    totalRemoved += removedCount;
    return true;
  }

  return false;
}

console.log('🧹 Starting console.log cleanup...\n');

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: excludePatterns });

  files.forEach(file => {
    const fullPath = path.resolve(file);
    removeConsoleLogs(fullPath);
  });
});

console.log(`\n✨ Cleanup complete! Removed ${totalRemoved} console statements.`);