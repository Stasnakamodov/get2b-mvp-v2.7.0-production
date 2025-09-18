require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeSupplierProjectConnection() {
  console.log('\n🔍 АНАЛИЗ СВЯЗИ ПОСТАВЩИКОВ С ПРОЕКТАМИ\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Проверяем структуру таблиц
    console.log('\n📊 СТРУКТУРА ТАБЛИЦ:');
    console.log('-'.repeat(40));
    
    // Проверка catalog_verified_suppliers
    const { data: verifiedSuppliers, error: vsError } = await supabase
      .from('catalog_verified_suppliers')
      .select('*')
      .limit(1);
    
    if (!vsError && verifiedSuppliers?.[0]) {
      console.log('\n✅ catalog_verified_suppliers:');
      console.log('   Ключевые поля:', Object.keys(verifiedSuppliers[0]).slice(0, 5).join(', '));
    }
    
    // Проверка catalog_user_suppliers
    const { data: userSuppliers, error: usError } = await supabase
      .from('catalog_user_suppliers')
      .select('*')
      .limit(1);
    
    if (!usError && userSuppliers?.[0]) {
      console.log('\n✅ catalog_user_suppliers:');
      console.log('   Ключевые поля:', Object.keys(userSuppliers[0]).slice(0, 5).join(', '));
    }
    
    // Проверка projects
    const { data: projects, error: pError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (!pError && projects?.[0]) {
      console.log('\n✅ projects:');
      console.log('   Ключевые поля:', Object.keys(projects[0]).slice(0, 5).join(', '));
      console.log('   payment_method:', projects[0].payment_method || 'НЕТ');
      console.log('   company_data:', projects[0].company_data ? 'ЕСТЬ (JSON)' : 'НЕТ');
    }
    
    // Проверка project_specifications
    const { data: specs, error: sError } = await supabase
      .from('project_specifications')
      .select('*')
      .limit(1);
    
    if (!sError && specs?.[0]) {
      console.log('\n✅ project_specifications:');
      console.log('   Ключевые поля:', Object.keys(specs[0]).slice(0, 5).join(', '));
      console.log('   supplier_name:', specs[0].supplier_name || 'НЕТ/ПУСТО');
    }
    
    // Проверка project_requisites
    const { data: requisites, error: rError } = await supabase
      .from('project_requisites')
      .select('*')
      .limit(1);
    
    if (!rError && requisites?.[0]) {
      console.log('\n✅ project_requisites:');
      console.log('   Ключевые поля:', Object.keys(requisites[0]).slice(0, 5).join(', '));
      console.log('   type:', requisites[0].type || 'НЕТ');
      console.log('   data:', requisites[0].data ? 'ЕСТЬ (JSON)' : 'НЕТ');
    }
    
    // 2. ПРОВЕРКА СВЯЗИ ЧЕРЕЗ supplier_name
    console.log('\n\n🔗 АНАЛИЗ СВЯЗЕЙ:');
    console.log('-'.repeat(40));
    
    // Ищем ТехноКомплект в поставщиках
    const { data: technoSupplier } = await supabase
      .from('catalog_verified_suppliers')
      .select('*')
      .or('name.ilike.%ТехноКомплект%,company_name.ilike.%ТехноКомплект%')
      .single();
    
    if (technoSupplier) {
      console.log('\n✅ Найден поставщик "ТехноКомплект ООО":');
      console.log('   ID:', technoSupplier.id);
      console.log('   name:', technoSupplier.name);
      console.log('   company_name:', technoSupplier.company_name);
    } else {
      console.log('\n❌ Поставщик "ТехноКомплект ООО" НЕ НАЙДЕН');
    }
    
    // Ищем проекты с этим поставщиком
    const { data: projectsWithSupplier } = await supabase
      .from('project_specifications')
      .select('project_id, supplier_name')
      .or('supplier_name.ilike.%ТехноКомплект%,supplier_name.ilike.%ТехноКомплект ООО%')
      .limit(5);
    
    if (projectsWithSupplier?.length > 0) {
      console.log('\n✅ Найдены проекты с поставщиком ТехноКомплект:');
      projectsWithSupplier.forEach(p => {
        console.log(`   - Project ID: ${p.project_id}, Supplier: ${p.supplier_name}`);
      });
    } else {
      console.log('\n❌ НЕ НАЙДЕНО проектов с поставщиком ТехноКомплект');
    }
    
    // 3. ПРОВЕРКА РЕКВИЗИТОВ
    console.log('\n\n💳 ПРОВЕРКА РЕКВИЗИТОВ ПОСТАВЩИКОВ:');
    console.log('-'.repeat(40));
    
    if (projectsWithSupplier?.length > 0) {
      const projectIds = projectsWithSupplier.map(p => p.project_id);
      const { data: projectRequisites } = await supabase
        .from('project_requisites')
        .select('project_id, type, data')
        .in('project_id', projectIds)
        .limit(3);
      
      if (projectRequisites?.length > 0) {
        console.log('\n✅ Найдены реквизиты для проектов:');
        projectRequisites.forEach(r => {
          console.log(`   - Project: ${r.project_id}`);
          console.log(`     Type: ${r.type}`);
          console.log(`     Data keys: ${r.data ? Object.keys(r.data).join(', ') : 'ПУСТО'}`);
        });
      } else {
        console.log('\n❌ НЕ НАЙДЕНО реквизитов для проектов с ТехноКомплект');
      }
    }
    
    // 4. ИТОГОВЫЙ АНАЛИЗ
    console.log('\n\n📝 ИТОГОВЫЙ АНАЛИЗ:');
    console.log('=' .repeat(60));
    
    console.log('\n❗ КЛЮЧЕВЫЕ ПРОБЛЕМЫ:');
    console.log('1. НЕТ прямой связи supplier_id между каталогом и проектами');
    console.log('2. Связь только через текстовое поле supplier_name');
    console.log('3. supplier_name может не совпадать точно (ТехноКомплект vs ТехноКомплект ООО)');
    console.log('4. НЕТ гарантии что реквизиты поставщика сохранены');
    
    console.log('\n⚠️  ТЕКУЩАЯ ЛОГИКА:');
    console.log('1. Товары добавляются в корзину с supplier_name');
    console.log('2. При создании проекта supplier_name попадает в project_specifications');
    console.log('3. Реквизиты (шаги 4-5) заполняются ВРУЧНУЮ пользователем');
    console.log('4. НЕТ автоматического заполнения из истории!');
    
    console.log('\n🚫 ОБЕЩАНИЯ В UI vs РЕАЛЬНОСТЬ:');
    console.log('UI обещает: "Способ оплаты будет предложен автоматически"');
    console.log('Реальность: НЕТ КОДА для этого функционала');
    console.log('');
    console.log('UI обещает: "Реквизиты будут заполнены из истории"');
    console.log('Реальность: НЕТ КОДА для поиска истории реквизитов');
    
    console.log('\n✅ ЧТО НУЖНО СДЕЛАТЬ:');
    console.log('1. Создать функцию поиска реквизитов по supplier_name');
    console.log('2. Добавить API endpoint для получения фантомных данных');
    console.log('3. Интегрировать в create-project для автозаполнения');
    console.log('4. Или убрать обещания из UI');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

analyzeSupplierProjectConnection();