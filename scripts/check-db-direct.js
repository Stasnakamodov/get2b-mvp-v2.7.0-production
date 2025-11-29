#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Читаем .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      // Убираем кавычки если есть
      process.env[match[1]] = match[2].replace(/^"|"$/g, '')
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔧 SUPABASE_URL:', SUPABASE_URL)
console.log('🔧 SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')

async function checkDB() {
  console.log('🔍 ПРЯМАЯ ПРОВЕРКА БАЗЫ ДАННЫХ\n')

  // Прямой запрос к Supabase REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/catalog_verified_products?select=id,name,category,subcategory_id,is_active&category=eq.ТЕСТОВАЯ`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    }
  })

  const countHeader = response.headers.get('content-range')
  const products = await response.json()

  console.log('═'.repeat(80))
  console.log('📊 Response Status:', response.status, response.statusText)
  console.log('📊 Response Type:', typeof products)
  console.log('📊 Is Array:', Array.isArray(products))

  if (products.error || products.message) {
    console.log('❌ API Error:', JSON.stringify(products, null, 2))
  }

  console.log(`📊 Товаров в категории ТЕСТОВАЯ: ${Array.isArray(products) ? products.length : 'ERROR'}`)
  if (countHeader) {
    console.log(`📊 Content-Range: ${countHeader}`)
  }
  console.log('═'.repeat(80))

  if (Array.isArray(products) && products.length > 0) {
    console.log('\n📦 Первые 10 товаров:\n')
    products.slice(0, 10).forEach((p, i) => {
      console.log(`  ${i+1}. ${p.name}`)
      console.log(`     ID: ${p.id}`)
      console.log(`     Category: ${p.category}`)
      console.log(`     Subcategory ID: ${p.subcategory_id || 'null'}`)
      console.log(`     Is Active: ${p.is_active}`)
      console.log('')
    })

    console.log(`\n... и еще ${Math.max(0, products.length - 10)} товаров`)

    // Считаем статистику
    const withSubcategory = products.filter(p => p.subcategory_id).length
    const activeProducts = products.filter(p => p.is_active).length

    console.log('\n📊 СТАТИСТИКА:')
    console.log(`   Всего товаров: ${products.length}`)
    console.log(`   С подкатегорией: ${withSubcategory}`)
    console.log(`   Без подкатегории: ${products.length - withSubcategory}`)
    console.log(`   Активных (is_active=true): ${activeProducts}`)
    console.log(`   Неактивных: ${products.length - activeProducts}`)
  }

  console.log('\n═'.repeat(80))
  console.log('🔴 ПРОБЛЕМА:')
  console.log('═'.repeat(80))
  console.log(`
  • Прямой запрос к БД: ${products.length} товаров
  • RPC функция get_products_by_category: 1 товар
  • Разница: ${products.length - 1} товаров не возвращаются!

  Это может быть проблемой:
  1. RLS (Row Level Security) политики
  2. Ошибка в RPC функции
  3. is_active = FALSE у товаров
  4. supplier.is_active = FALSE
  `)
}

checkDB().catch(console.error)
