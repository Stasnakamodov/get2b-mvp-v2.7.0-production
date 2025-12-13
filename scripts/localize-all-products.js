#!/usr/bin/env node

/**
 * Скрипт массовой локализации названий товаров
 * Использует правила транслитерации и очистки без внешних API
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Словарь переводов английских слов
const translations = {
  // Автотовары
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

  // Электроника
  'keyboard': 'клавиатура', 'mouse': 'мышь', 'gaming': 'игровой', 'game': 'игра',
  'mechanical': 'механическая', 'backlight': 'подсветка', 'rgb': 'RGB',
  'speaker': 'колонка', 'headphone': 'наушники', 'earphone': 'наушники',
  'microphone': 'микрофон', 'webcam': 'веб-камера',
  'controller': 'контроллер', 'gamepad': 'геймпад', 'joystick': 'джойстик',
  'cooler': 'кулер', 'fan': 'вентилятор', 'cooling': 'охлаждение',
  'charger': 'зарядное', 'battery': 'аккумулятор', 'power bank': 'повербанк',

  // Дом и быт
  'home': 'дом', 'house': 'дом', 'kitchen': 'кухня', 'bathroom': 'ванная',
  'bedroom': 'спальня', 'living': 'гостиная', 'room': 'комната',
  'furniture': 'мебель', 'decor': 'декор', 'decoration': 'украшение',
  'organizer': 'органайзер', 'storage': 'хранение', 'box': 'коробка',
  'shelf': 'полка', 'rack': 'стойка', 'hanger': 'вешалка',
  'lamp': 'лампа', 'bulb': 'лампочка', 'strip': 'лента',
  'clock': 'часы', 'watch': 'часы', 'timer': 'таймер',

  // Здоровье
  'health': 'здоровье', 'medical': 'медицинский', 'fitness': 'фитнес',
  'massage': 'массаж', 'massager': 'массажёр', 'therapy': 'терапия',
  'thermometer': 'термометр', 'monitor': 'монитор', 'scale': 'весы',

  // Красота
  'beauty': 'красота', 'skin': 'кожа', 'face': 'лицо', 'body': 'тело',
  'hair': 'волосы', 'nail': 'ногти', 'makeup': 'макияж',
  'cream': 'крем', 'serum': 'сыворотка', 'mask': 'маска',
  'brush': 'кисть', 'mirror': 'зеркало',

  // Размеры и характеристики
  'pcs': 'шт', 'piece': 'шт', 'pieces': 'шт', 'pack': 'уп',
  'inch': 'дюйм', 'cm': 'см', 'mm': 'мм', 'm': 'м',
  'ml': 'мл', 'l': 'л', 'g': 'г', 'kg': 'кг',
  'w': 'Вт', 'v': 'В', 'a': 'А', 'mah': 'мАч',

  // Цвета
  'black': 'чёрный', 'white': 'белый', 'red': 'красный', 'blue': 'синий',
  'green': 'зелёный', 'yellow': 'жёлтый', 'pink': 'розовый', 'purple': 'фиолетовый',
  'orange': 'оранжевый', 'brown': 'коричневый', 'gray': 'серый', 'grey': 'серый',
  'gold': 'золотой', 'silver': 'серебряный',

  // Материалы
  'plastic': 'пластик', 'metal': 'металл', 'aluminum': 'алюминий', 'steel': 'сталь',
  'stainless': 'нержавеющий', 'copper': 'медь', 'brass': 'латунь',
  'wood': 'дерево', 'wooden': 'деревянный', 'bamboo': 'бамбук',
  'cotton': 'хлопок', 'silk': 'шёлк', 'polyester': 'полиэстер', 'nylon': 'нейлон',
  'rubber': 'резина', 'silicone': 'силикон', 'foam': 'пена',
};

// Мусорные слова для удаления
const trashWords = [
  'новый', 'новая', 'новое', 'new', 'hot', 'sale', 'best', 'top',
  'элитный', 'элитная', 'модный', 'модная', 'креативный', 'креативная',
  'творческий', 'творческая', 'популярный', 'популярная',
  'высококачественный', 'высококачественная', 'качественный', 'качественная',
  'оригинальный', 'оригинальная', 'подлинный', 'подлинная',
  'бесплатная доставка', 'free shipping', 'dropshipping',
  'минимальный объем заказа', 'moq', 'minimum order',
  '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025',
  'года', 'год', 'г.', 'year',
];

// Функция локализации названия
function localizeName(name, category) {
  if (!name) return name;

  let result = name;

  // 1. Убираем артикулы в начале (цифры и буквы типа "1019994", "GM200")
  result = result.replace(/^[\d\w]{5,15}\s+/i, '');

  // 2. Убираем мусорные слова
  for (const trash of trashWords) {
    const regex = new RegExp(`\\b${trash}\\b[,\\s]*`, 'gi');
    result = result.replace(regex, '');
  }

  // 3. Переводим английские слова
  const words = result.split(/\s+/);
  const translatedWords = words.map(word => {
    const lowerWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (translations[lowerWord]) {
      // Сохраняем пунктуацию
      const prefix = word.match(/^[^a-zA-Zа-яА-Я]*/)?.[0] || '';
      const suffix = word.match(/[^a-zA-Zа-яА-Я]*$/)?.[0] || '';
      return prefix + translations[lowerWord] + suffix;
    }
    return word;
  });
  result = translatedWords.join(' ');

  // 4. Убираем повторяющиеся слова
  const uniqueWords = [];
  const seen = new Set();
  for (const word of result.split(/\s+/)) {
    const normalizedWord = word.toLowerCase().replace(/[^а-яa-z]/g, '');
    if (normalizedWord.length <= 2 || !seen.has(normalizedWord)) {
      uniqueWords.push(word);
      if (normalizedWord.length > 2) {
        seen.add(normalizedWord);
      }
    }
  }
  result = uniqueWords.join(' ');

  // 5. Убираем лишние пробелы и пунктуацию
  result = result
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/^\s*[,.\-]+\s*/, '')
    .replace(/\s*[,.\-]+\s*$/, '')
    .trim();

  // 6. Первая буква заглавная
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // 7. Ограничиваем длину
  if (result.length > 60) {
    result = result.substring(0, 57) + '...';
  }

  return result;
}

async function main() {
  console.log('🚀 Массовая локализация названий товаров\n');

  // Получаем все товары (с пагинацией для больших объёмов)
  let allProducts = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data: products, error: fetchError } = await supabase
      .from('catalog_verified_products')
      .select('id, name, category')
      .order('category')
      .range(offset, offset + PAGE_SIZE - 1);

    if (fetchError) {
      console.error('Ошибка получения товаров:', fetchError);
      return;
    }

    if (!products || products.length === 0) break;

    allProducts = allProducts.concat(products);
    offset += PAGE_SIZE;

    if (products.length < PAGE_SIZE) break;
  }

  const products = allProducts;
  const error = null;

  if (error) {
    console.error('Ошибка получения товаров:', error);
    return;
  }

  console.log(`📦 Найдено товаров: ${products.length}\n`);

  let updated = 0;
  let skipped = 0;
  const examples = [];

  // Обрабатываем батчами по 100
  const BATCH_SIZE = 100;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const updates = [];

    for (const product of batch) {
      const newName = localizeName(product.name, product.category);

      // Обновляем только если название изменилось
      if (newName !== product.name && newName.length > 3) {
        updates.push({
          id: product.id,
          oldName: product.name,
          newName: newName
        });

        // Собираем примеры
        if (examples.length < 15) {
          examples.push({
            category: product.category,
            before: product.name,
            after: newName
          });
        }
      } else {
        skipped++;
      }
    }

    // Обновляем в базе
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('catalog_verified_products')
        .update({ name: update.newName })
        .eq('id', update.id);

      if (!updateError) {
        updated++;
      }
    }

    process.stdout.write(`\r🔄 Обработано: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length}`);
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ');
  console.log('='.repeat(60));
  console.log(`✅ Обновлено: ${updated}`);
  console.log(`⏭️  Пропущено (без изменений): ${skipped}`);

  if (examples.length > 0) {
    console.log('\n📝 ПРИМЕРЫ ЛОКАЛИЗАЦИИ:');
    console.log('-'.repeat(60));
    for (const ex of examples) {
      console.log(`\n[${ex.category}]`);
      console.log(`  ДО:    ${ex.before}`);
      console.log(`  ПОСЛЕ: ${ex.after}`);
    }
  }
}

main().catch(console.error);
