#!/usr/bin/env node

/**
 * Применить миграцию для исправления RPC функции get_products_by_category
 * Исправляет конфликт алиасов который вызывает возврат только 1 товара
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Отсутствуют переменные окружения SUPABASE')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function applyMigration() {
  try {
    console.log('📋 Применение миграции для исправления RPC функции...\n')

    // Читаем файл миграции
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251127_fix_rpc_alias_conflict.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Применяем миграцию через выполнение SQL
    console.log('⚙️  Выполнение SQL миграции...')

    // Supabase не поддерживает прямое выполнение DDL через rpc
    // Нужно использовать Supabase CLI или выполнить через psql
    // Для теста покажем как это сделать вручную

    console.log('\n📌 ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ МИГРАЦИИ:\n')
    console.log('1️⃣  Способ 1: Через Supabase Dashboard')
    console.log('   - Откройте https://supabase.com/dashboard/project/ejkhdhexkadecpbjjmsz/sql/new')
    console.log('   - Скопируйте содержимое файла: supabase/migrations/20251127_fix_rpc_alias_conflict.sql')
    console.log('   - Вставьте в SQL Editor и нажмите "Run"\n')

    console.log('2️⃣  Способ 2: Через Supabase CLI')
    console.log('   npx supabase db push\n')

    console.log('3️⃣  Способ 3: Через psql (если установлен)')
    console.log('   psql "$POSTGRES_URL_NON_POOLING" < supabase/migrations/20251127_fix_rpc_alias_conflict.sql\n')

    console.log('📄 Содержимое миграции:')
    console.log('─'.repeat(80))
    console.log(migrationSQL)
    console.log('─'.repeat(80))

    // Проверяем текущее состояние функции
    console.log('\n🔍 Проверка текущего состояния функции...\n')

    const { data: testBefore, error: errorBefore } = await supabase
      .rpc('get_products_by_category', {
        category_name: 'ТЕСТОВАЯ',
        user_id_param: null,
        search_query: null,
        limit_param: 100,
        offset_param: 0
      })

    if (errorBefore) {
      console.error('❌ Ошибка при вызове функции:', errorBefore.message)
    } else {
      const products = Array.isArray(testBefore) ? testBefore :
                      typeof testBefore === 'string' ? JSON.parse(testBefore) : []
      console.log(`📊 Текущее количество товаров в категории ТЕСТОВАЯ: ${products.length}`)
      console.log(`   ${products.length === 1 ? '❌ ПРОБЛЕМА ПОДТВЕРЖДЕНА' : '✅ Проблема исправлена'}`)
    }

    console.log('\n💡 После применения миграции запустите этот скрипт снова для проверки')

  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    process.exit(1)
  }
}

applyMigration()
