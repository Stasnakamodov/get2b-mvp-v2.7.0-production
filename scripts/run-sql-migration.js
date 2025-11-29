#!/usr/bin/env node

/**
 * Execute SQL migration via Supabase REST API
 */

const fs = require('fs')
const path = require('path')

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function executeMigration() {
  console.log('🔧 EXECUTING SQL MIGRATION')
  console.log('='.repeat(70))
  console.log('')

  // Read SQL file
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251127_fix_get_products_by_category_images.sql')

  console.log('📄 Reading:', path.basename(sqlFile))
  const sqlContent = fs.readFileSync(sqlFile, 'utf8')

  // Remove comments and split into statements
  const statements = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log('📝 Found', statements.length, 'SQL statements')
  console.log('')

  // We'll use the createClient to execute SQL via RPC
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Execute the CREATE OR REPLACE FUNCTION statement
  const createFunctionSQL = statements.find(s => s.includes('CREATE OR REPLACE FUNCTION'))

  if (!createFunctionSQL) {
    console.error('❌ Could not find CREATE OR REPLACE FUNCTION statement')
    process.exit(1)
  }

  console.log('⏳ Executing CREATE OR REPLACE FUNCTION...')
  console.log('')

  try {
    // Use Supabase Management API to execute raw SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({
        query: createFunctionSQL + ';'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Failed to execute SQL')
      console.error('Response:', error)
      console.log('')
      console.log('⚠️  Please apply SQL manually in Supabase Dashboard:')
      console.log('👉 https://supabase.com/dashboard/project/ejkhdhexkadecpbjjmsz/sql/new')
      console.log('')
      console.log('SQL to apply:')
      console.log('-'.repeat(70))
      console.log(sqlContent)
      console.log('-'.repeat(70))
      process.exit(1)
    }

    console.log('✅ Function created/updated successfully!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('')
    console.log('⚠️  Please apply SQL manually in Supabase Dashboard:')
    console.log('👉 https://supabase.com/dashboard/project/ejkhdhexkadecpbjjmsz/sql/new')
    console.log('')
    console.log('SQL to apply:')
    console.log('-'.repeat(70))
    console.log(sqlContent)
    console.log('-'.repeat(70))
    process.exit(1)
  }

  // Test the function
  console.log('')
  console.log('🧪 Testing the updated function...')

  const { data, error } = await supabase.rpc('get_products_by_category', {
    category_name: 'ТЕСТОВАЯ',
    user_id_param: null,
    search_query: null,
    limit_param: 1,
    offset_param: 0
  })

  if (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }

  console.log('')
  console.log('✅ Function works!')

  if (Array.isArray(data) && data.length > 0) {
    const product = data[0]
    console.log('')
    console.log('📦 Sample Product:')
    console.log('   Name:', product.product_name)
    console.log('   Has images field:', product.images ? '✅ YES' : '❌ NO')
    console.log('   Image URL:', product.image_url || 'N/A')

    if (product.images) {
      console.log('   Images array:', JSON.stringify(product.images))
    }
  } else {
    console.log('   ⚠️ No products returned (but function works)')
  }

  console.log('')
  console.log('='.repeat(70))
  console.log('✅ MIGRATION COMPLETED!')
  console.log('='.repeat(70))
  console.log('')
}

executeMigration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
