const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Подключение к Supabase  
const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.aJiZwDPyWRmEh7jGJe9QW6pV3k0x9b2f1UmT8_X3WFA'
);

async function runSqlScript() {
  try {
    console.log('🚀 Начинаем выполнение SQL скрипта...');
    
    // Читаем SQL файл
    const sqlContent = fs.readFileSync('./create-natural-suppliers.sql', 'utf8');
    
    // Разбиваем на команды по точке с запятой
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '');
    
    console.log(`📋 Найдено ${commands.length} SQL команд`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`\n⚡ Выполняем команду ${i + 1}/${commands.length}:`);
      console.log(command.substring(0, 100) + '...');
      
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: command + ';'
      });
      
      if (error) {
        console.error(`❌ Ошибка в команде ${i + 1}:`, error);
        continue;
      }
      
      console.log(`✅ Команда ${i + 1} выполнена успешно`);
    }
    
    console.log('\n🎉 SQL скрипт выполнен полностью!');
    
    // Проверяем результат
    const { data: suppliers, error: selectError } = await supabase
      .from('catalog_verified_suppliers')
      .select('name, category, city, logo_url')
      .eq('is_active', true);
      
    if (selectError) {
      console.error('❌ Ошибка проверки:', selectError);
      return;
    }
    
    console.log('\n📊 Создано поставщиков:', suppliers?.length || 0);
    suppliers?.forEach(supplier => {
      console.log(`- ${supplier.name} (${supplier.category}) - ${supplier.city}`);
    });
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
  }
}

runSqlScript();