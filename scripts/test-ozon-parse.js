/**
 * Тестируем парсинг Ozon URL
 */

const ogs = require('open-graph-scraper')

async function testOzonParse() {
  const url = 'https://www.ozon.ru/product/tormoznaya-zhidkost-lukoil-dot-3-1-l-142950385/'

  console.log('🔍 Тестируем парсинг:', url)

  const options = {
    url,
    timeout: 10000,
    fetchOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }
  }

  try {
    const { result, error } = await ogs(options)

    if (error) {
      console.log('❌ Ошибка Open Graph:', error)
      return
    }

    console.log('\n✅ Open Graph данные получены:')
    console.log('Title:', result.ogTitle || 'не найден')
    console.log('Description:', result.ogDescription?.substring(0, 100) || 'не найдено')
    console.log('Image:', result.ogImage?.[0]?.url || 'не найдено')
    console.log('\nВсе данные:', JSON.stringify(result, null, 2))

  } catch (error) {
    console.log('❌ Критическая ошибка:', error.message)
    console.log(error)
  }
}

testOzonParse()
