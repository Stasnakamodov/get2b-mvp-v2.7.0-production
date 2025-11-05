/**
 * Тестовый скрипт для проверки Claude Web Fetch
 *
 * Тестирует парсинг товаров с разных маркетплейсов:
 * 1. Ozon (сильная защита Cloudflare)
 * 2. Wildberries (сильная защита)
 * 3. Яндекс.Маркет (средняя защита)
 * 4. Простой сайт (без защиты)
 *
 * Запуск: ANTHROPIC_API_KEY=sk-xxx node scripts/test-claude-web-fetch.js
 */

const Anthropic = require('@anthropic-ai/sdk')

// Тестовые URL
const testUrls = [
  {
    name: 'Ozon (защищен Cloudflare)',
    url: 'https://www.ozon.ru/product/smartfon-apple-iphone-15-128-gb-rozovyy-1189416565/',
    expectedBrand: 'Apple',
    difficulty: 'HARD'
  },
  {
    name: 'Wildberries (защищен)',
    url: 'https://www.wildberries.ru/catalog/123456789/detail.aspx',
    expectedBrand: null,
    difficulty: 'HARD'
  },
  {
    name: 'Яндекс.Маркет',
    url: 'https://market.yandex.ru/product--smartfon-apple-iphone-15/123456',
    expectedBrand: 'Apple',
    difficulty: 'MEDIUM'
  },
  {
    name: 'Habr (простой сайт для проверки)',
    url: 'https://habr.com/ru/articles/',
    expectedBrand: null,
    difficulty: 'EASY'
  }
]

async function testClaudeWebFetch() {
  console.log('🧪 ТЕСТ: Claude Web Fetch API\n')

  // Проверяем API ключ
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    console.error('❌ ОШИБКА: ANTHROPIC_API_KEY не найден')
    console.log('\n💡 Как получить API ключ:')
    console.log('1. Зайди на https://console.anthropic.com/')
    console.log('2. Создай аккаунт (есть $5 бесплатных кредитов)')
    console.log('3. Создай API ключ')
    console.log('4. Запусти: ANTHROPIC_API_KEY=sk-xxx node scripts/test-claude-web-fetch.js')
    process.exit(1)
  }

  console.log('✅ API ключ найден:', apiKey.substring(0, 10) + '...\n')

  const client = new Anthropic({ apiKey })

  // Тестируем каждый URL
  for (const test of testUrls) {
    console.log(`\n${'='.repeat(70)}`)
    console.log(`📦 ТЕСТ: ${test.name}`)
    console.log(`🔗 URL: ${test.url}`)
    console.log(`⚡ Сложность: ${test.difficulty}`)
    console.log(`${'='.repeat(70)}\n`)

    try {
      console.log('⏳ Отправляем запрос в Claude...')

      const startTime = Date.now()

      const response = await client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        tools: [{
          type: 'web_fetch_20250910',
          name: 'web_fetch',
          max_uses: 3
        }],
        messages: [{
          role: 'user',
          content: `Проанализируй товар на этой странице: ${test.url}

Извлеки:
- Название товара
- Бренд (если есть)
- Категорию
- Ключевые слова

Верни JSON:
{
  "brand": "бренд или null",
  "category": "категория",
  "keywords": ["слово1", "слово2"],
  "description": "описание"
}

Если страница заблокирована или не загружается - напиши об этом в description.

ОТВЕТ (только JSON):`
        }]
      }, {
        headers: {
          'anthropic-beta': 'web-fetch-2025-09-10'
        }
      })

      const endTime = Date.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)

      console.log(`✅ Ответ получен за ${duration}с\n`)

      // Извлекаем текст из ответа
      const textContent = response.content.find(block => block.type === 'text')

      if (!textContent) {
        console.error('❌ Текстовый контент не найден в ответе')
        continue
      }

      console.log('📄 Ответ Claude:')
      console.log(textContent.text)
      console.log('')

      // Пробуем распарсить JSON
      try {
        let cleanResponse = textContent.text
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()

        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanResponse = jsonMatch[0]
        }

        const parsed = JSON.parse(cleanResponse)

        console.log('✅ РЕЗУЛЬТАТ:')
        console.log('  Бренд:', parsed.brand || 'не определен')
        console.log('  Категория:', parsed.category || 'не определена')
        console.log('  Ключевые слова:', parsed.keywords?.slice(0, 5).join(', ') || 'нет')
        console.log('  Описание:', parsed.description?.substring(0, 100) || 'нет')

        // Проверяем успешность
        const isBlocked = parsed.description?.toLowerCase().includes('заблок') ||
                         parsed.description?.toLowerCase().includes('доступ') ||
                         parsed.description?.toLowerCase().includes('denied') ||
                         parsed.description?.toLowerCase().includes('cloudflare')

        if (isBlocked) {
          console.log('\n⚠️ СТАТУС: ЗАБЛОКИРОВАН (нужен ScraperAPI)')
        } else if (parsed.brand || (parsed.keywords && parsed.keywords.length > 0)) {
          console.log('\n✅ СТАТУС: УСПЕХ (Claude смог распарсить)')
        } else {
          console.log('\n⚠️ СТАТУС: ЧАСТИЧНЫЙ УСПЕХ (мало данных)')
        }

      } catch (parseError) {
        console.error('❌ Ошибка парсинга JSON:', parseError.message)
        console.log('⚠️ СТАТУС: ОШИБКА ФОРМАТА')
      }

      // Показываем использованные токены
      console.log('\n💰 Использовано токенов:')
      console.log('  Input:', response.usage.input_tokens)
      console.log('  Output:', response.usage.output_tokens)

      const inputCost = (response.usage.input_tokens / 1_000_000) * 1 // $1 per 1M tokens
      const outputCost = (response.usage.output_tokens / 1_000_000) * 5 // $5 per 1M tokens
      const totalCost = inputCost + outputCost
      const totalCostRub = totalCost * 90 // Примерный курс

      console.log(`  Стоимость: $${totalCost.toFixed(4)} (~${totalCostRub.toFixed(2)}₽)`)

    } catch (error) {
      console.error('❌ ОШИБКА:', error.message)

      if (error.status === 401) {
        console.log('\n💡 Проблема с аутентификацией. Проверь API ключ.')
      } else if (error.status === 429) {
        console.log('\n💡 Превышен лимит запросов. Подожди немного.')
      } else if (error.message.includes('credit balance')) {
        console.log('\n💡 Недостаточно кредитов на аккаунте.')
        console.log('   Пополни баланс на https://console.anthropic.com/')
      }
    }

    // Пауза между запросами
    if (test !== testUrls[testUrls.length - 1]) {
      console.log('\n⏳ Пауза 3 секунды...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  console.log('\n\n' + '='.repeat(70))
  console.log('🎯 ИТОГИ ТЕСТИРОВАНИЯ')
  console.log('='.repeat(70))
  console.log('\n✅ Работает для:')
  console.log('   - Простых сайтов без защиты (Habr, блоги)')
  console.log('   - Сайтов с базовой защитой')
  console.log('')
  console.log('❌ НЕ работает для:')
  console.log('   - Ozon (Cloudflare + anti-bot)')
  console.log('   - Wildberries (жесткая защита)')
  console.log('   - AliExpress (bot detection)')
  console.log('')
  console.log('💡 РЕКОМЕНДАЦИЯ:')
  console.log('   Для защищенных маркетплейсов нужен ScraperAPI ($49/мес)')
  console.log('   Или пробуем Playwright с Stealth плагином (бесплатно, но менее надежно)')
  console.log('')
}

// Запуск
testClaudeWebFetch()
  .then(() => {
    console.log('✅ Тест завершен\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Фатальная ошибка:', error)
    process.exit(1)
  })
