#!/usr/bin/env node

/**
 * Apply SQL migration to Supabase
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🔧 APPLYING MIGRATION: fix_get_products_by_category_images')
  console.log('='.repeat(70))
  console.log('')

  // Read SQL file
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251127_fix_get_products_by_category_images.sql')

  if (!fs.existsSync(sqlFile)) {
    console.error('❌ SQL file not found:', sqlFile)
    process.exit(1)
  }

  console.log('📄 Reading SQL file:', sqlFile)
  const sqlContent = fs.readFileSync(sqlFile, 'utf8')

  // Split by statement (basic splitting, doesn't handle all edge cases)
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== '')

  console.log('📝 Found', statements.length, 'SQL statements')
  console.log('')

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]

    // Skip comments
    if (stmt.startsWith('--')) continue

    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

    try {
      // Use rpc to execute SQL (if you have a custom RPC function)
      // Otherwise we'll need to use raw SQL query
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: stmt + ';'
      })

      if (error) {
        // Try alternative method - using Supabase REST API directly
        console.log('   ⚠️ RPC exec_sql not available, trying direct execution...')

        // For CREATE OR REPLACE FUNCTION, we need to use SQL Editor or supabase CLI
        // Let's just log the statement and ask user to run it manually
        console.log('')
        console.log('📋 Please run this SQL in Supabase SQL Editor:')
        console.log('-'.repeat(70))
        console.log(stmt + ';')
        console.log('-'.repeat(70))
        console.log('')
        console.log('Or run: npx supabase db execute --file', sqlFile)
        console.log('')
        return
      }

      console.log('   ✅ Success')

    } catch (error) {
      console.error('   ❌ Error:', error.message)
      throw error
    }
  }

  console.log('')
  console.log('='.repeat(70))
  console.log('✅ MIGRATION APPLIED SUCCESSFULLY')
  console.log('='.repeat(70))
}

// Run
applyMigration()
  .then(() => {
    console.log('')
    console.log('🧪 Testing the updated function...')

    // Test the function
    return supabase.rpc('get_products_by_category', {
      category_name: 'ТЕСТОВАЯ',
      user_id_param: null,
      search_query: null,
      limit_param: 1,
      offset_param: 0
    })
  })
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Test failed:', error)
      process.exit(1)
    }

    console.log('')
    console.log('✅ Function works!')
    console.log('📦 Sample product:')

    if (Array.isArray(data) && data.length > 0) {
      const product = data[0]
      console.log('   Name:', product.product_name)
      console.log('   Images:', product.images ? '✅ HAS images field' : '❌ NO images field')
      console.log('   Image URL:', product.image_url)

      if (product.images) {
        console.log('   Images array:', product.images)
      }
    } else {
      console.log('   ⚠️ No products returned')
    }

    console.log('')
    process.exit(0)
  })
  .catch((error) => {
    console.error('')
    console.error('❌ MIGRATION FAILED')
    console.error('Error:', error.message)
    console.error('')
    process.exit(1)
  })
