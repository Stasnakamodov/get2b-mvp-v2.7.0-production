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
      process.env[match[1]] = match[2].replace(/^"|"$/g, '')
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkSupplier() {
  console.log('🔍 ПРОВЕРКА ПОСТАВЩИКА\n')

  // Ищем поставщика "Импортированные товары"
  const response = await fetch(`${SUPABASE_URL}/rest/v1/catalog_verified_suppliers?select=id,name,is_active&name=ilike.*Импортированные*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  })

  const suppliers = await response.json()

  console.log('📊 Найдено поставщиков:', suppliers.length)
  console.log('')

  suppliers.forEach(s => {
    console.log('📦 Поставщик:', s.name)
    console.log('   ID:', s.id)
    console.log('   IS ACTIVE:', s.is_active ? '✅ TRUE' : '❌ FALSE')
    console.log('')
  })

  if (suppliers.length > 0 && !suppliers[0].is_active) {
    console.log('🔴 ПРОБЛЕМА: Поставщик НЕАКТИВЕН!')
    console.log('   Это объясняет почему RPC функция не возвращает товары!')
    console.log('')
    console.log('✅ РЕШЕНИЕ: Активировать поставщика')
  }
}

checkSupplier().catch(console.error)
