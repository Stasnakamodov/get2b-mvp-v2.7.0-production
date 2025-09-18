// Тест для проверки извлечения банковских данных
const testText = `БАНК
БИК
044525593
Наименование банка
АО "АЛЬФА-БАНК"
ИНН / КПП банка
7728168971 / 770801001
Расчетный счет
40702810802520005607
Корреспондентский счет
30101810200000000593`;

console.log("🔍 Тестируем извлечение банковских данных...");

// Тест 1: Поиск БИК
const bikMatch = testText.match(/БИК[^0-9]*(\d{9})/i);
console.log("Тест 1 - БИК:", bikMatch ? bikMatch[1] : "Не найден");

// Тест 2: Поиск расчетного счета
const accountMatch = testText.match(/Расчетный счет\s*\n\s*(\d{20})/i);
console.log("Тест 2 - Расчетный счет:", accountMatch ? accountMatch[1] : "Не найден");

// Тест 3: Поиск по контексту
const lines = testText.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Поиск БИК
  if (line.includes('БИК')) {
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const bikMatch = nextLine.match(/(\d{9})/);
      if (bikMatch) {
        console.log("Тест 3 - БИК по контексту:", bikMatch[1]);
        break;
      }
    }
  }
  
  // Поиск расчетного счета
  if (line.includes('Расчетный счет')) {
    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const accountMatch = nextLine.match(/(\d{20})/);
      if (accountMatch) {
        console.log("Тест 3 - Расчетный счет по контексту:", accountMatch[1]);
        break;
      }
    }
  }
}

console.log("✅ Тест завершен"); 