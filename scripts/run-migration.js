const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Загружаем переменные окружения
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('🔄 Читаем SQL файл миграции...')
    
    const sqlFile = path.join(__dirname, '../sql/create-catalog-category-view.sql')
    const sqlContent = fs.readFileSync(sqlFile, 'utf8')
    
    console.log('📊 Выполняем SQL миграцию для создания catalog views...')
    
    // Разбиваем на отдельные команды (по точке с запятой)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'))
    
    console.log(`📋 Найдено ${sqlCommands.length} SQL команд для выполнения`)
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i]
      if (command.trim()) {
        console.log(`⏳ Выполняем команду ${i + 1}/${sqlCommands.length}...`)
        
        const { data, error } = await supabase.rpc('exec_sql', { sql: command })
        
        if (error) {
          console.error(`❌ Ошибка в команде ${i + 1}:`, error)
          // Продолжаем выполнение остальных команд
        } else {
          console.log(`✅ Команда ${i + 1} выполнена успешно`)
        }
      }
    }
    
    // Проверяем что VIEW создались
    console.log('\n🔍 Проверяем созданные VIEW...')
    
    const { data: viewCheck, error: viewError } = await supabase
      .from('catalog_categories_with_counts')
      .select('category, products_count, suppliers_count')
      .limit(5)
    
    if (viewError) {
      console.error('❌ Ошибка проверки VIEW:', viewError)
    } else {
      console.log('✅ VIEW catalog_categories_with_counts работает!')
      console.log('📊 Найдено категорий:', viewCheck?.length || 0)
      viewCheck?.forEach(cat => {
        console.log(`  - ${cat.category}: ${cat.products_count} товаров, ${cat.suppliers_count} поставщиков`)
      })
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка миграции:', error)
  }
}

runMigration()