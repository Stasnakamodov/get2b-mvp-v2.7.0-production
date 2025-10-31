/**
 * Прямой тест HTTP запроса к Ozon
 */

async function testFetch() {
  const url = 'https://www.ozon.ru/product/tormoznaya-zhidkost-lukoil-dot-3-1-l-142950385/'

  console.log('🔗 Тестируем прямой HTTP запрос к:', url)

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    })

    console.log('📡 HTTP Status:', response.status)
    console.log('📡 Status Text:', response.statusText)
    console.log('📡 Final URL:', response.url)

    if (!response.ok) {
      console.log('❌ Ошибка HTTP:', response.status)
      return
    }

    const html = await response.text()
    console.log('📄 HTML размер:', html.length, 'байт')
    console.log('📄 Первые 500 символов HTML:\n', html.substring(0, 500))

    // Ищем мета-теги
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
    const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)

    console.log('\n🏷️ Найденные теги:')
    console.log('  <title>:', titleMatch?.[1] || 'не найден')
    console.log('  og:title:', ogTitleMatch?.[1] || 'не найден')
    console.log('  og:description:', ogDescMatch?.[1]?.substring(0, 100) || 'не найдено')

  } catch (error) {
    console.log('❌ Ошибка:', error.message)
    console.log(error)
  }
}

testFetch()
