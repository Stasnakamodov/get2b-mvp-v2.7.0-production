#!/usr/bin/env node

/**
 * Скрипт локализации названий товаров в каталоге Get2B
 * Использует Claude API для генерации качественных названий
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

// Конфигурация
const SUPABASE_URL = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic();

const BATCH_SIZE = 50; // Товаров за один запрос к Claude

/**
 * Получить товары по категории
 */
async function getProductsByCategory(category) {
  const { data, error } = await supabase
    .from('catalog_verified_products')
    .select('id, name, description, category')
    .eq('category', category)
    .order('id');

  if (error) throw error;
  return data;
}

/**
 * Локализовать названия через Claude
 */
async function localizeNames(products, category) {
  const productList = products.map((p, i) => `${i + 1}. [${p.id}] ${p.name}`).join('\n');

  const prompt = `Ты — профессиональный копирайтер-маркетолог для российского маркетплейса.

ЗАДАЧА: Улучши названия товаров категории "${category}".

ПРАВИЛА:
1. Убери мусор, повторы слов, бессмысленные фразы
2. Переведи английские слова на русский
3. Сделай название понятным и продающим
4. Максимум 60 символов
5. Сохрани ключевые характеристики товара (размер, цвет, материал если важно)
6. Не добавляй лишних слов, только суть

ПРИМЕРЫ:
- "Сильный магнитный держатель автомобильного телефона Горный вращающийся" → "Магнитный держатель телефона в авто 360°"
- "Швейная нить черная нить швейная нить ручной швейной нити" → "Швейные нитки чёрные, набор"
- "Double Fan Mobile Phone Cooler" → "Кулер для смартфона с двумя вентиляторами"
- "PET+NANO COTPAT MATERAL 4PCS CAR Зеркальный зеркальный ветер CAR" → "Защитная плёнка для зеркал авто, 4 шт"
- "Механическая клавиатура подсветка Gaming Keybord Проводная клавиатура" → "Механическая игровая клавиатура с подсветкой"
- "Если это ковровые ковры ковров Рождество" → "Праздничный новогодний коврик"

ТОВАРЫ ДЛЯ ОБРАБОТКИ:
${productList}

ФОРМАТ ОТВЕТА (строго JSON):
[
  {"id": "uuid-товара", "name": "Новое название"},
  ...
]

Выведи ТОЛЬКО JSON массив, без пояснений.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text.trim();

  // Извлекаем JSON из ответа
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Не удалось извлечь JSON:', text.substring(0, 200));
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('Ошибка парсинга JSON:', e.message);
    return [];
  }
}

/**
 * Обновить названия в базе
 */
async function updateProductNames(updates) {
  let success = 0;
  let failed = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from('catalog_verified_products')
      .update({ name: update.name })
      .eq('id', update.id);

    if (error) {
      console.error(`Ошибка обновления ${update.id}:`, error.message);
      failed++;
    } else {
      success++;
    }
  }

  return { success, failed };
}

/**
 * Обработать категорию
 */
async function processCategory(category) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Категория: ${category}`);
  console.log('='.repeat(60));

  const products = await getProductsByCategory(category);
  console.log(`Найдено товаров: ${products.length}`);

  let totalSuccess = 0;
  let totalFailed = 0;
  const examples = [];

  // Обрабатываем батчами
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(products.length / BATCH_SIZE);

    console.log(`\n🔄 Батч ${batchNum}/${totalBatches} (${batch.length} товаров)...`);

    try {
      const updates = await localizeNames(batch, category);

      if (updates.length > 0) {
        // Сохраняем примеры до/после
        for (const update of updates.slice(0, 3)) {
          const original = batch.find(p => p.id === update.id);
          if (original && examples.length < 10) {
            examples.push({
              category,
              before: original.name,
              after: update.name
            });
          }
        }

        const { success, failed } = await updateProductNames(updates);
        totalSuccess += success;
        totalFailed += failed;
        console.log(`   ✅ Обновлено: ${success}, ❌ Ошибок: ${failed}`);
      } else {
        console.log(`   ⚠️ Нет данных для обновления`);
      }
    } catch (error) {
      console.error(`   ❌ Ошибка батча: ${error.message}`);
    }

    // Пауза между батчами для rate limiting
    if (i + BATCH_SIZE < products.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n📊 Итого по категории: ✅ ${totalSuccess} успешно, ❌ ${totalFailed} ошибок`);

  return { success: totalSuccess, failed: totalFailed, examples };
}

/**
 * Главная функция
 */
async function main() {
  const targetCategory = process.argv[2];

  console.log('🚀 Локализация названий товаров Get2B');
  console.log('=====================================\n');

  let categories;

  if (targetCategory) {
    categories = [targetCategory];
  } else {
    // Получаем все категории
    const { data } = await supabase
      .from('catalog_verified_products')
      .select('category')
      .order('category');

    categories = [...new Set(data.map(p => p.category))];
  }

  console.log(`Категории для обработки: ${categories.join(', ')}`);

  let grandTotalSuccess = 0;
  let grandTotalFailed = 0;
  const allExamples = [];

  for (const category of categories) {
    const result = await processCategory(category);
    grandTotalSuccess += result.success;
    grandTotalFailed += result.failed;
    allExamples.push(...result.examples);
  }

  console.log('\n');
  console.log('='.repeat(60));
  console.log('📊 ИТОГОВЫЙ ОТЧЁТ');
  console.log('='.repeat(60));
  console.log(`✅ Успешно обновлено: ${grandTotalSuccess}`);
  console.log(`❌ Ошибок: ${grandTotalFailed}`);

  if (allExamples.length > 0) {
    console.log('\n📝 Примеры локализации:');
    console.log('-'.repeat(60));
    for (const ex of allExamples.slice(0, 10)) {
      console.log(`[${ex.category}]`);
      console.log(`  До:    ${ex.before}`);
      console.log(`  После: ${ex.after}`);
      console.log();
    }
  }
}

main().catch(console.error);
