const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
);

async function check() {
  // Общий count
  const { count: total } = await supabase.from('catalog_verified_products').select('*', { count: 'exact', head: true });
  console.log('ВСЕГО ТОВАРОВ:', total);

  // По категориям - используем count
  const categories = ['Электроника', 'Дом и быт', 'Строительство', 'Здоровье и красота', 'Автотовары', 'Промышленность', 'Одежда и аксессуары'];

  console.log('\nПо категориям:');
  for (const cat of categories) {
    const { count } = await supabase
      .from('catalog_verified_products')
      .select('*', { count: 'exact', head: true })
      .eq('category', cat);

    const { data: sample } = await supabase
      .from('catalog_verified_products')
      .select('price, images, name, description, currency')
      .eq('category', cat)
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('  ' + cat + ': ' + count + ' товаров');
    if (sample && sample.length > 0) {
      sample.forEach(p => {
        const imgCount = Array.isArray(p.images) ? p.images.length : 0;
        console.log('    -> ' + p.name?.substring(0, 60) + ' | ' + p.price + ' ' + p.currency + ' | ' + imgCount + ' фото');
      });
    }
  }

  // Проверяем качество: описания, цены, картинки
  console.log('\n=== ПРОВЕРКА КАЧЕСТВА ===');

  const { count: withImages } = await supabase
    .from('catalog_verified_products')
    .select('*', { count: 'exact', head: true })
    .not('images', 'is', null);

  const { count: withRub } = await supabase
    .from('catalog_verified_products')
    .select('*', { count: 'exact', head: true })
    .eq('currency', 'RUB');

  const { count: withDesc } = await supabase
    .from('catalog_verified_products')
    .select('*', { count: 'exact', head: true })
    .not('description', 'is', null);

  console.log('  С картинками: ' + withImages + '/' + total);
  console.log('  Цены в RUB: ' + withRub + '/' + total);
  console.log('  С описанием: ' + withDesc + '/' + total);
}

check().catch(e => console.error(e.message));
