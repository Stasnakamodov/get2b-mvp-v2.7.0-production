// Тест для проверки поиска названия компании
const testText = `КАРТОЧКА
ПРЕДПРИЯТИЯ
ООО "АЙ ТИ ГРУП"
ОРГАНИЗАЦИЯ
Полное наименование организации
ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "АЙ ТИ ГРУП"
Сокращенное наименование организации
ООО "АЙ ТИ ГРУП"`;

console.log("🔍 Тестируем поиск названия компании...");

// Тест 1: Поиск в кавычках
const quoteMatch = testText.match(/(ООО|ОАО|ЗАО|ИП)\s*["«]([^»"]+)["»]/i);
console.log("Тест 1 - Поиск в кавычках:", quoteMatch ? `${quoteMatch[1]} "${quoteMatch[2]}"` : "Не найдено");

// Тест 2: Поиск по паттерну
const patternMatch = testText.match(/\b(ООО|ОАО|ЗАО|ИП)\s*["«]?([^»"\n\r0-9]{3,100})["»]?/i);
console.log("Тест 2 - Поиск по паттерну:", patternMatch ? `${patternMatch[1]} ${patternMatch[2]}` : "Не найдено");

// Тест 3: Поиск строк с кавычками
const lines = testText.split('\n');
for (const line of lines) {
  const trimmedLine = line.trim();
  if (trimmedLine.includes('"') && 
      (trimmedLine.includes('ООО') || trimmedLine.includes('ОАО') || trimmedLine.includes('ЗАО') || trimmedLine.includes('ИП'))) {
    
    const match = trimmedLine.match(/(ООО|ОАО|ЗАО|ИП)\s*["«]([^»"]+)["»]/i);
    if (match) {
      console.log("Тест 3 - Найдено в строке:", `${match[1]} "${match[2]}"`);
      break;
    }
  }
}

console.log("✅ Тест завершен"); 