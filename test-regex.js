// Тест регулярного выражения для поиска project ID

const testText = "💬 НОВОЕ СООБЩЕНИЕ В ЧАТЕ\n\n🆔 Проект: b7f63bf3-3cfa-4b2c-8a42-ee7b19c53c2d\n📋 Название: ловыдрадлгфтыуолатфгыя\n🏢 Компания: Игрик Иванов\n👤 От кого: Вы\n\n💬 Сообщение:\n\"xt nfv\"\n\n❗ Ответьте на это сообщение, чтобы отправить ответ клиенту в чат.";

console.log('🧪 Тестируем регекс для поиска project ID...');
console.log('📝 Тестовый текст:');
console.log(testText);
console.log('\n');

// Текущий регекс из кода
const projectMatch = testText.match(/🆔 Проект: ([a-f0-9-]+)/);

console.log('🔍 Результат поиска:');
console.log('Match:', projectMatch);
console.log('Project ID:', projectMatch ? projectMatch[1] : 'НЕ НАЙДЕН');

// Альтернативные варианты
const altRegex1 = testText.match(/Проект: ([a-f0-9\-]{36})/);
const altRegex2 = testText.match(/Проект: ([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);

console.log('\n🔧 Альтернативные регексы:');
console.log('Alt 1:', altRegex1 ? altRegex1[1] : 'НЕ НАЙДЕН');
console.log('Alt 2:', altRegex2 ? altRegex2[1] : 'НЕ НАЙДЕН'); 