#!/usr/bin/env node

/**
 * Скрипт локализации товаров для целевого проекта
 * Таблица: products, поле: name
 */

const { createClient } = require('@supabase/supabase-js');

// Целевой проект
const SUPABASE_URL = 'https://rbngpxwamfkunktxjtqh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibmdweHdhbWZrdW5rdHhqdHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU5OTk0NywiZXhwIjoyMDY0MTc1OTQ3fQ.UnPSq_-7-PlzoYQFSvVUOwu4U6dirDoFyQQG08P7Jek';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Словарь переводов
const translations = {
  'car': 'авто', 'auto': 'авто', 'vehicle': 'авто', 'automotive': 'автомобильный',
  'vacuum': 'пылесос', 'cleaner': 'очиститель', 'washer': 'мойка', 'wash': 'мойка',
  'polish': 'полироль', 'polisher': 'полировальная машина', 'polishing': 'полировка',
  'wax': 'воск', 'coating': 'покрытие', 'ceramic': 'керамическое', 'nano': 'нано',
  'spray': 'спрей', 'filter': 'фильтр', 'oil': 'масло', 'engine': 'двигатель',
  'tire': 'шина', 'tyre': 'шина', 'wheel': 'колесо', 'brake': 'тормоз',
  'pressure': 'давление', 'sensor': 'датчик', 'pump': 'насос', 'compressor': 'компрессор',
  'wireless': 'беспроводной', 'electric': 'электрический', 'portable': 'портативный',
  'digital': 'цифровой', 'automatic': 'автоматический', 'universal': 'универсальный',
  'high': 'высокий', 'power': 'мощность', 'strong': 'мощный', 'mini': 'мини',
  'set': 'набор', 'kit': 'набор', 'tool': 'инструмент', 'repair': 'ремонт',
  'scratch': 'царапина', 'remove': 'удаление', 'remover': 'удалитель',
  'glass': 'стекло', 'window': 'окно', 'mirror': 'зеркало', 'light': 'свет',
  'headlight': 'фара', 'led': 'светодиодный', 'lamp': 'лампа',
  'cover': 'чехол', 'seat': 'сиденье', 'leather': 'кожаный', 'pu': 'экокожа',
  'microfiber': 'микрофибра', 'towel': 'полотенце', 'cloth': 'ткань',
  'sponge': 'губка', 'pad': 'подушка', 'brush': 'щётка',
  'holder': 'держатель', 'mount': 'крепление', 'stand': 'подставка',
  'phone': 'телефон', 'mobile': 'мобильный', 'smartphone': 'смартфон',
  'charger': 'зарядное', 'cable': 'кабель', 'adapter': 'адаптер',
  'bluetooth': 'Bluetooth', 'wifi': 'WiFi', 'usb': 'USB',
  'camera': 'камера', 'dvr': 'видеорегистратор', 'dash': 'бортовой',
  'recorder': 'регистратор', 'video': 'видео', 'hd': 'HD', 'fhd': 'FHD',
  'keyboard': 'клавиатура', 'mouse': 'мышь', 'gaming': 'игровой', 'game': 'игра',
  'mechanical': 'механическая', 'backlight': 'подсветка', 'rgb': 'RGB',
  'speaker': 'колонка', 'headphone': 'наушники', 'earphone': 'наушники',
  'microphone': 'микрофон', 'webcam': 'веб-камера',
  'controller': 'контроллер', 'gamepad': 'геймпад', 'joystick': 'джойстик',
  'cooler': 'кулер', 'fan': 'вентилятор', 'cooling': 'охлаждение',
  'battery': 'аккумулятор', 'power bank': 'повербанк',
  'home': 'дом', 'house': 'дом', 'kitchen': 'кухня', 'bathroom': 'ванная',
  'trigger': 'триггер', 'fire': 'огонь', 'pubg': 'PUBG',
  'control': 'управление', 'android': 'Android', 'ios': 'iOS',
  'magnetic': 'магнитный', 'rotating': 'вращающийся', 'mountain': '',
  'new': '', 'hot': '', 'sale': '', 'best': '', 'top': '',
  'pcs': 'шт', 'piece': 'шт', 'pieces': 'шт', 'pack': 'уп',
  'black': 'чёрный', 'white': 'белый', 'red': 'красный', 'blue': 'синий',
  'green': 'зелёный', 'yellow': 'жёлтый', 'pink': 'розовый',
  'stylus': 'стилус', 'pen': 'ручка', 'touch': 'сенсорный',
  'alloy': 'сплав', 'aluminum': 'алюминиевый', 'metal': 'металлический',
  'axis': 'осевой', 'stabilizer': 'стабилизатор', 'gimbal': 'стабилизатор',
  'bicycle': 'велосипедный', 'bike': 'велосипед', 'motorcycle': 'мотоцикл',
};

// Мусорные слова
const trashWords = [
  'новый', 'новая', 'новое', 'new', 'hot', 'sale', 'best', 'top',
  'элитный', 'элитная', 'модный', 'модная', 'креативный', 'креативная',
  'горный', 'горная', // мусор из китайского перевода
  '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025',
  'года', 'год', 'г.',
];

function localizeName(name) {
  if (!name) return name;
  let result = name;

  // Убираем артикулы в начале
  result = result.replace(/^[\d\w]{5,15}\s+/i, '');

  // Убираем мусорные слова
  for (const trash of trashWords) {
    const regex = new RegExp(`\\b${trash}\\b[,\\s]*`, 'gi');
    result = result.replace(regex, '');
  }

  // Переводим английские слова
  const words = result.split(/\s+/);
  const translatedWords = words.map(word => {
    const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (translations[lowerWord] !== undefined) {
      const prefix = word.match(/^[^a-zA-Zа-яА-Я]*/)?.[0] || '';
      const suffix = word.match(/[^a-zA-Zа-яА-Я]*$/)?.[0] || '';
      return prefix + translations[lowerWord] + suffix;
    }
    return word;
  });
  result = translatedWords.join(' ');

  // Убираем повторяющиеся слова
  const uniqueWords = [];
  const seen = new Set();
  for (const word of result.split(/\s+/)) {
    const normalizedWord = word.toLowerCase().replace(/[^а-яa-z]/g, '');
    if (normalizedWord.length <= 2 || !seen.has(normalizedWord)) {
      uniqueWords.push(word);
      if (normalizedWord.length > 2) seen.add(normalizedWord);
    }
  }
  result = uniqueWords.join(' ');

  // Очистка
  result = result
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/^\s*[,.\-]+\s*/, '')
    .replace(/\s*[,.\-]+\s*$/, '')
    .trim();

  // Первая буква заглавная
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // Ограничение длины
  if (result.length > 60) {
    result = result.substring(0, 57) + '...';
  }

  return result;
}

async function main() {
  console.log('🚀 Локализация товаров целевого проекта\n');
  console.log('URL:', SUPABASE_URL);
  console.log('Таблица: products\n');

  // Получаем все товары с пагинацией
  let allProducts = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Ошибка:', error);
      return;
    }

    if (!products || products.length === 0) break;
    allProducts = allProducts.concat(products);
    offset += PAGE_SIZE;
    if (products.length < PAGE_SIZE) break;
  }

  console.log(`📦 Найдено товаров: ${allProducts.length}\n`);

  let updated = 0;
  let skipped = 0;
  const examples = [];
  const BATCH_SIZE = 100;

  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = allProducts.slice(i, i + BATCH_SIZE);

    for (const product of batch) {
      const newName = localizeName(product.name);

      if (newName !== product.name && newName.length > 3) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ name: newName })
          .eq('id', product.id);

        if (!updateError) {
          updated++;
          if (examples.length < 10) {
            examples.push({ before: product.name, after: newName });
          }
        }
      } else {
        skipped++;
      }
    }

    process.stdout.write(`\r🔄 Обработано: ${Math.min(i + BATCH_SIZE, allProducts.length)}/${allProducts.length}`);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ');
  console.log('='.repeat(60));
  console.log(`✅ Обновлено: ${updated}`);
  console.log(`⏭️  Пропущено: ${skipped}`);

  if (examples.length > 0) {
    console.log('\n📝 ПРИМЕРЫ:');
    console.log('-'.repeat(60));
    for (const ex of examples) {
      console.log(`\n  ДО:    ${ex.before}`);
      console.log(`  ПОСЛЕ: ${ex.after}`);
    }
  }
}

main().catch(console.error);
