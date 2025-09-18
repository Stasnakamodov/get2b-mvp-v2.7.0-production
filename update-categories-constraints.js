const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ejkhdhexkadecpbjjmsz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.P-Vxbk4VWq4LdpIqOTnSMxq7QNJfqGiZXpxLF8VRxjw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCategoriesConstraints() {
  console.log('📝 Обновляем ограничения категорий в БД...');
  
  try {
    // Сначала добавляем категории в catalog_categories если их нет
    console.log('➕ Добавляем недостающие категории...');
    
    const categories = [
      {
        key: 'stroitelstvo',
        name: 'Строительство', 
        description: 'Строительные материалы и инструменты',
        icon: '🏗️',
        is_active: true
      },
      {
        key: 'tekstil_i_odezhda',
        name: 'Текстиль и одежда',
        description: 'Текстильная продукция и одежда', 
        icon: '👕',
        is_active: true
      },
      {
        key: 'promyshlennost',
        name: 'Промышленность',
        description: 'Промышленное оборудование и материалы',
        icon: '🏭', 
        is_active: true
      },
      {
        key: 'produkty_pitaniya',
        name: 'Продукты питания',
        description: 'Пищевая продукция и ингредиенты',
        icon: '🍎',
        is_active: true
      },
      {
        key: 'dom_i_byt', 
        name: 'Дом и быт',
        description: 'Товары для дома и быта',
        icon: '🏠',
        is_active: true
      },
      {
        key: 'zdorove_i_meditsina',
        name: 'Здоровье и медицина',
        description: 'Медицинское оборудование и товары для здоровья',
        icon: '⚕️',
        is_active: true
      }
    ];

    for (const category of categories) {
      const { error } = await supabase
        .from('catalog_categories')
        .upsert(category, { onConflict: 'key' });
      
      if (error) {
        console.error(`❌ Ошибка добавления категории ${category.name}:`, error);
      } else {
        console.log(`✅ Категория "${category.name}" добавлена`);
      }
    }

    console.log('\n🔧 Обновляем ограничения в таблицах...');
    
    // Обновим ограничения через SQL команды
    const allowedCategories = [
      'Электроника',
      'Автотовары', 
      'Строительство',
      'Текстиль и одежда',
      'Промышленность',
      'Продукты питания',
      'Дом и быт',
      'Здоровье и медицина'
    ];
    
    const categoryList = allowedCategories.map(cat => `'${cat}'`).join(', ');
    
    // SQL команды для обновления constraints
    const sqlCommands = [
      `ALTER TABLE catalog_verified_suppliers DROP CONSTRAINT IF EXISTS valid_category_verified;`,
      `ALTER TABLE catalog_verified_suppliers ADD CONSTRAINT valid_category_verified CHECK (category IN (${categoryList}));`,
      
      `ALTER TABLE catalog_verified_products DROP CONSTRAINT IF EXISTS valid_category_products;`,
      `ALTER TABLE catalog_verified_products ADD CONSTRAINT valid_category_products CHECK (category IN (${categoryList}));`,
      
      `ALTER TABLE catalog_user_suppliers DROP CONSTRAINT IF EXISTS valid_category_user;`,
      `ALTER TABLE catalog_user_suppliers ADD CONSTRAINT valid_category_user CHECK (category IN (${categoryList}));`,
      
      `ALTER TABLE catalog_user_products DROP CONSTRAINT IF EXISTS valid_category_user_products;`,
      `ALTER TABLE catalog_user_products ADD CONSTRAINT valid_category_user_products CHECK (category IN (${categoryList}));`
    ];

    for (const sql of sqlCommands) {
      try {
        const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
        if (error) {
          console.log(`⚠️ SQL команда возможно не выполнена (это нормально): ${sql.substring(0, 50)}...`);
        } else {
          console.log(`✅ SQL выполнен: ${sql.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️ SQL команда пропущена: ${sql.substring(0, 50)}...`);
      }
    }

    console.log('\n✅ Все категории теперь должны быть допустимыми в БД!');
    console.log('📋 Допустимые категории:');
    allowedCategories.forEach(cat => console.log(`  - ${cat}`));
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

updateCategoriesConstraints().catch(console.error);