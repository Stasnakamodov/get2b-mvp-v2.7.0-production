require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createProjectCartsTable() {
  console.log('\n📦 СОЗДАНИЕ ТАБЛИЦЫ project_carts\n');
  console.log('=' .repeat(60));
  
  try {
    // Проверяем, существует ли таблица
    const { data: existingTable, error: checkError } = await supabase
      .from('project_carts')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Таблица project_carts уже существует');
      return;
    }
    
    console.log('📝 Таблица не найдена, создаем...\n');
    
    // SQL команды разбиты на части для выполнения
    const sqlCommands = [
      // 1. Создание таблицы
      `CREATE TABLE project_carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        supplier_id UUID,
        supplier_type TEXT CHECK (supplier_type IN ('verified', 'user')),
        supplier_name TEXT,
        supplier_company_name TEXT,
        supplier_data JSONB,
        cart_items JSONB NOT NULL,
        items_count INTEGER DEFAULT 0,
        total_amount DECIMAL(12, 2),
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'converted', 'expired', 'cancelled')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        converted_to_project_id UUID REFERENCES projects(id),
        converted_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
        source TEXT DEFAULT 'catalog',
        metadata JSONB
      )`,
      
      // 2. Индексы
      `CREATE INDEX idx_project_carts_user_id ON project_carts(user_id)`,
      `CREATE INDEX idx_project_carts_supplier ON project_carts(supplier_id, supplier_type)`,
      `CREATE INDEX idx_project_carts_status ON project_carts(status)`,
      `CREATE INDEX idx_project_carts_created_at ON project_carts(created_at DESC)`,
      
      // 3. RLS
      `ALTER TABLE project_carts ENABLE ROW LEVEL SECURITY`,
      `CREATE POLICY "Users can view own carts" ON project_carts FOR SELECT USING (auth.uid() = user_id)`,
      `CREATE POLICY "Users can create own carts" ON project_carts FOR INSERT WITH CHECK (auth.uid() = user_id)`,
      `CREATE POLICY "Users can update own carts" ON project_carts FOR UPDATE USING (auth.uid() = user_id)`,
      `CREATE POLICY "Users can delete own carts" ON project_carts FOR DELETE USING (auth.uid() = user_id)`
    ];
    
    console.log('⚠️  ВАЖНО: Таблицу нужно создать через Supabase Dashboard\n');
    console.log('📋 ИНСТРУКЦИЯ:');
    console.log('1. Откройте https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
    console.log('2. Скопируйте содержимое файла create-project-carts-table.sql');
    console.log('3. Вставьте в SQL Editor');
    console.log('4. Нажмите "Run"\n');
    
    console.log('Или выполните эту упрощенную версию:\n');
    console.log('-'.repeat(60));
    console.log(sqlCommands[0]);
    console.log('-'.repeat(60));
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

createProjectCartsTable();