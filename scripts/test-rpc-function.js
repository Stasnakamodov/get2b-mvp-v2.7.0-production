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

async function testRPC() {
  console.log('🔍 ТЕСТИРОВАНИЕ RPC ФУНКЦИИ get_products_by_category\n')

  // Вызываем RPC функцию напрямую
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_products_by_category`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      category_name: 'ТЕСТОВАЯ',
      user_id_param: null,
      search_query: null,
      limit_param: 100,
      offset_param: 0
    })
  })

  const data = await response.json()

  console.log('📊 Response Status:', response.status, response.statusText)
  console.log('📊 Response Type:', typeof data)
  console.log('📊 Is Array:', Array.isArray(data))

  if (response.ok && Array.isArray(data)) {
    console.log(`📊 Товаров возвращено: ${data.length}`)
    console.log('')

    if (data.length > 0) {
      console.log('📦 Первые 5 товаров:\n')
      data.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.product_name}`)
        console.log(`     ID: ${p.id}`)
        console.log(`     Supplier: ${p.supplier_name}`)
        console.log(`     Supplier ID: ${p.supplier_id}`)
        console.log('')
      })

      // Группируем по поставщикам
      const supplierMap = new Map()
      data.forEach(p => {
        const count = supplierMap.get(p.supplier_id) || 0
        supplierMap.set(p.supplier_id, count + 1)
      })

      console.log('\n📊 ГРУППИРОВКА ПО ПОСТАВЩИКАМ:')
      supplierMap.forEach((count, supplierId) => {
        const supplier = data.find(p => p.supplier_id === supplierId)
        console.log(`   ${supplier.supplier_name}: ${count} товаров`)
      })
    }
  } else {
    console.log('❌ ERROR:', JSON.stringify(data, null, 2))
  }
}

testRPC().catch(console.error)
