// Обновляем существующие поля поставщиков
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateExistingFields() {
  console.log('🚀 Обновляем существующие поля поставщиков...\n');

  // ТехноКомплект
  const { error: error1 } = await supabase
    .from('catalog_verified_suppliers')
    .update({
      payment_methods: ['bank-transfer', 'p2p', 'crypto']
    })
    .eq('name', 'ТехноКомплект');

  if (error1) {
    console.log('❌ ТехноКомплект:', error1.message);
  } else {
    console.log('✅ ТехноКомплект: payment_methods обновлены');
  }

  // Поиск Bosch (может быть разные названия)
  const { data: boschSuppliers } = await supabase
    .from('catalog_verified_suppliers')
    .select('id, name')
    .ilike('name', '%Bosch%');

  if (boschSuppliers && boschSuppliers.length > 0) {
    const { error: error2 } = await supabase
      .from('catalog_verified_suppliers')
      .update({
        payment_methods: ['bank-transfer', 'crypto']
      })
      .eq('id', boschSuppliers[0].id);

    if (error2) {
      console.log('❌ Bosch:', error2.message);
    } else {
      console.log('✅ Bosch: payment_methods обновлены');
    }
  }

  // Аналогично для других поставщиков
  const suppliers = [
    { search: '%Siemens%', methods: ['bank-transfer'] },
    { search: '%Huawei%', methods: ['bank-transfer', 'crypto', 'p2p'] },
    { search: '%Samsung%', methods: ['bank-transfer', 'crypto'] },
    { search: '%Shenzhou%', methods: ['bank-transfer', 'p2p', 'crypto'] }
  ];

  for (const supplier of suppliers) {
    const { data: found } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name')
      .ilike('name', supplier.search);

    if (found && found.length > 0) {
      const { error } = await supabase
        .from('catalog_verified_suppliers')
        .update({
          payment_methods: supplier.methods
        })
        .eq('id', found[0].id);

      if (error) {
        console.log(`❌ ${found[0].name}:`, error.message);
      } else {
        console.log(`✅ ${found[0].name}: payment_methods обновлены`);
      }
    }
  }

  // Проверяем результат
  console.log('\n📊 Результат обновления:');
  const { data: results } = await supabase
    .from('catalog_verified_suppliers')
    .select('name, payment_methods');

  results?.forEach(r => {
    console.log(`${r.name}: ${r.payment_methods || 'NULL'}`);
  });
}

updateExistingFields();