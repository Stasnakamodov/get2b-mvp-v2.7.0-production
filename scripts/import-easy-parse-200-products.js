#!/usr/bin/env node

/**
 * Импорт 200+ товаров с сайтов без anti-bot защиты
 *
 * Источники:
 * 1. Books to Scrape - специальный сайт для парсинга (1000 книг)
 * 2. FakeStore API - готовый API с электроникой
 * 3. Небольшие магазины без защиты
 */

const fs = require('fs')
const path = require('path')

// Читаем .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      process.env[match[1]] = match[2]
    }
  })
}

// API endpoints
const API_BASE = 'http://localhost:3000'
const PARSE_ENDPOINT = '/api/catalog/products/parse-and-import'

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

// Статистика
let stats = {
  total: 0,
  success: 0,
  failed: 0,
  startTime: Date.now()
}

// ========== ИСТОЧНИК 1: FakeStore API (Электроника) ==========
async function importFromFakeStoreAPI() {
  console.log(`\n${colors.bright}${colors.cyan}📦 ИМПОРТ ИЗ FAKESTORE API${colors.reset}`)
  console.log('─'.repeat(60))

  try {
    // Получаем все товары из категории электроника
    console.log(`${colors.yellow}Загружаю товары электроники...${colors.reset}`)

    const response = await fetch('https://fakestoreapi.com/products/category/electronics')
    const products = await response.json()

    console.log(`${colors.green}✅ Найдено ${products.length} товаров электроники${colors.reset}`)

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      stats.total++

      console.log(`\n[${i + 1}/${products.length}] ${product.title.substring(0, 50)}...`)

      try {
        // Импортируем через наш API (создаем фейковый URL для парсера)
        const importData = {
          url: `https://fakestoreapi.com/products/${product.id}`,
          category: 'ЭЛЕКТРОНИКА',
          // Передаем данные напрямую через specifications
          specifications: {
            source: 'FakeStore API',
            original_data: product
          }
        }

        // Альтернативный вариант - создать товар напрямую в БД
        // Но сначала попробуем через парсер
        const importResponse = await fetch(`${API_BASE}${PARSE_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(importData)
        })

        if (importResponse.ok) {
          stats.success++
          console.log(`${colors.green}✅ Импортирован${colors.reset}`)
        } else {
          stats.failed++
          console.log(`${colors.red}❌ Ошибка импорта${colors.reset}`)
        }
      } catch (error) {
        stats.failed++
        console.log(`${colors.red}❌ ${error.message}${colors.reset}`)
      }

      // Небольшая задержка
      await new Promise(resolve => setTimeout(resolve, 500))
    }

  } catch (error) {
    console.error(`${colors.red}Ошибка загрузки из FakeStore API:${colors.reset}`, error.message)
  }
}

// ========== ИСТОЧНИК 2: Books to Scrape (Книги) ==========
async function importFromBooksToScrape() {
  console.log(`\n${colors.bright}${colors.cyan}📚 ИМПОРТ ИЗ BOOKS TO SCRAPE${colors.reset}`)
  console.log('─'.repeat(60))

  const maxPages = 10 // 10 страниц по 20 книг = 200 книг

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `https://books.toscrape.com/catalogue/page-${page}.html`
    console.log(`\n${colors.yellow}Страница ${page}/${maxPages}: ${pageUrl}${colors.reset}`)

    try {
      // Сначала получаем HTML страницы
      const response = await fetch(pageUrl)
      const html = await response.text()

      // Парсим ссылки на книги (простой regex для демо)
      const bookLinks = html.match(/href="([^"]+)"/g)
        ?.map(href => href.replace('href="', '').replace('"', ''))
        ?.filter(link => link.includes('catalogue/') && link.includes('.html'))
        ?.map(link => `https://books.toscrape.com/catalogue/${link.replace('../', '')}`)
        ?.slice(0, 20) || []

      console.log(`Найдено ${bookLinks.length} книг на странице`)

      // Импортируем каждую книгу
      for (let i = 0; i < Math.min(bookLinks.length, 5); i++) { // Ограничим 5 книг со страницы для теста
        const bookUrl = bookLinks[i]
        stats.total++

        console.log(`[${stats.total}] Импорт: ${bookUrl.substring(30, 70)}...`)

        try {
          const importResponse = await fetch(`${API_BASE}${PARSE_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: bookUrl,
              category: 'КНИГИ'
            })
          })

          if (importResponse.ok) {
            stats.success++
            console.log(`${colors.green}✅ OK${colors.reset}`)
          } else {
            stats.failed++
            const error = await importResponse.json()
            console.log(`${colors.red}❌ ${error.error}${colors.reset}`)
          }
        } catch (error) {
          stats.failed++
          console.log(`${colors.red}❌ ${error.message}${colors.reset}`)
        }

        // Задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

    } catch (error) {
      console.error(`${colors.red}Ошибка парсинга страницы ${page}:${colors.reset}`, error.message)
    }
  }
}

// ========== ИСТОЧНИК 3: Небольшие российские магазины ==========
async function importFromSmallShops() {
  console.log(`\n${colors.bright}${colors.cyan}🛍️ ИМПОРТ ИЗ НЕБОЛЬШИХ МАГАЗИНОВ${colors.reset}`)
  console.log('─'.repeat(60))

  // Список небольших магазинов с простой защитой
  const products = [
    // Региональные магазины электроники
    {
      url: 'https://www.regard.ru/catalog/tovar318970.htm',
      name: 'Видеокарта от Regard',
      category: 'ЭЛЕКТРОНИКА'
    },
    {
      url: 'https://www.citilink.ru/product/videokarta-msi-geforce-rtx-4060-ti-gaming-x-8g-1875347/',
      name: 'Видеокарта от Ситилинк',
      category: 'ЭЛЕКТРОНИКА'
    },
    // Книжные магазины
    {
      url: 'https://www.chitai-gorod.ru/product/garri-potter-i-filosofskiy-kamen-rouling-dzh-k-2866739',
      name: 'Гарри Поттер - Читай-город',
      category: 'КНИГИ'
    },
    {
      url: 'https://www.labirint.ru/books/929386/',
      name: 'Книга с Лабиринта',
      category: 'КНИГИ'
    },
    // Специализированные магазины
    {
      url: 'https://www.pleer.ru/product_637513_Apple_AirPods_Pro_2nd_generation_USB_C.html',
      name: 'AirPods от Плеер.ру',
      category: 'ЭЛЕКТРОНИКА'
    },
    {
      url: 'https://www.holodilnik.ru/small_appliances/coffee_machines/delonghi/ecam220_22_110_sb/',
      name: 'Кофемашина DeLonghi',
      category: 'БЫТОВАЯ ТЕХНИКА'
    }
  ]

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    stats.total++

    console.log(`\n[${i + 1}/${products.length}] ${product.name}`)
    console.log(`URL: ${product.url.substring(0, 60)}...`)

    try {
      const importResponse = await fetch(`${API_BASE}${PARSE_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: product.url,
          category: product.category
        })
      })

      if (importResponse.ok) {
        const data = await importResponse.json()
        stats.success++
        console.log(`${colors.green}✅ Импортирован: ${data.product?.name?.substring(0, 40)}${colors.reset}`)
      } else {
        stats.failed++
        const error = await importResponse.json()
        console.log(`${colors.red}❌ Ошибка: ${error.error}${colors.reset}`)
      }
    } catch (error) {
      stats.failed++
      console.log(`${colors.red}❌ ${error.message}${colors.reset}`)
    }

    // Задержка
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
}

// ========== ГЛАВНАЯ ФУНКЦИЯ ==========
async function main() {
  console.log(`${colors.bright}${colors.magenta}🚀 ИМПОРТ 200+ ТОВАРОВ С ПРОСТЫХ САЙТОВ${colors.reset}`)
  console.log(`${colors.cyan}📅 Дата: ${new Date().toLocaleString('ru-RU')}${colors.reset}`)
  console.log('═'.repeat(60))

  // Проверка сервера
  console.log(`\n${colors.yellow}🔍 Проверка сервера...${colors.reset}`)
  try {
    const response = await fetch(API_BASE)
    if (!response.ok && response.status !== 404) {
      throw new Error(`Сервер недоступен (${response.status})`)
    }
    console.log(`${colors.green}✅ Сервер доступен${colors.reset}`)
  } catch (error) {
    console.log(`${colors.red}❌ Сервер недоступен! Запустите: npm run dev${colors.reset}`)
    process.exit(1)
  }

  // Выбор источников для импорта
  console.log(`\n${colors.bright}ИСТОЧНИКИ ДАННЫХ:${colors.reset}`)
  console.log('1. FakeStore API - товары электроники')
  console.log('2. Books to Scrape - книги (специальный сайт для парсинга)')
  console.log('3. Небольшие российские магазины')

  // Последовательный импорт из всех источников
  await importFromFakeStoreAPI()
  await importFromBooksToScrape()
  await importFromSmallShops()

  // Финальная статистика
  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2)
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${colors.bright}${colors.magenta}📊 ФИНАЛЬНАЯ СТАТИСТИКА${colors.reset}`)
  console.log('═'.repeat(60))
  console.log(`• Всего попыток: ${stats.total}`)
  console.log(`• ${colors.green}Успешно: ${stats.success}${colors.reset}`)
  console.log(`• ${colors.red}Ошибки: ${stats.failed}${colors.reset}`)
  console.log(`• Процент успеха: ${((stats.success / stats.total) * 100).toFixed(1)}%`)
  console.log(`• Время выполнения: ${duration} минут`)
  console.log('═'.repeat(60))

  // Проверка в БД
  if (stats.success > 0) {
    console.log(`\n${colors.green}✅ Импорт завершен!${colors.reset}`)
    console.log(`Проверьте товары в БД:`)
    console.log(`${colors.cyan}SELECT category, COUNT(*) FROM catalog_verified_products GROUP BY category;${colors.reset}`)
  }
}

// Запуск
main().catch(error => {
  console.error(`${colors.red}Критическая ошибка:${colors.reset}`, error)
  process.exit(1)
})