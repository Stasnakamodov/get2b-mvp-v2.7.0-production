#!/usr/bin/env node

/**
 * Apply SQL migration directly to Supabase using raw SQL
 */

const fs = require('fs')
const path = require('path')

// Load environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function applyMigration() {
  console.log('🔧 APPLYING MIGRATION TO SUPABASE')
  console.log('='.repeat(70))
  console.log('')

  // Read SQL file
  const sqlFile = path.join(__dirname, '..', 'supabase', 'migrations', '20251127_fix_get_products_by_category_images.sql')
  const sqlContent = fs.readFileSync(sqlFile, 'utf8')

  console.log('📄 SQL Migration File:', path.basename(sqlFile))
  console.log('📝 Size:', sqlContent.length, 'bytes')
  console.log('')
  console.log('⚠️  MANUAL APPLICATION REQUIRED')
  console.log('')
  console.log('Please apply this SQL in Supabase SQL Editor:')
  console.log('👉 https://supabase.com/dashboard/project/ejkhdhexkadecpbjjmsz/sql/new')
  console.log('')
  console.log('='.repeat(70))
  console.log('')
  console.log(sqlContent)
  console.log('')
  console.log('='.repeat(70))
  console.log('')
  console.log('After applying, run: node scripts/test-migration.js')
  console.log('')
}

applyMigration()
