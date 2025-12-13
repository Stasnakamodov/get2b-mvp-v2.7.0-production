const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

async function fixAll() {
  console.log('Исправление цен: юани → рубли (×13)')
  let totalFixed = 0

  while(true) {
    const { data, error } = await supabase
      .from('catalog_verified_products')
      .select('id, price')
      .lt('price', 500)
      .limit(500)

    if (error) {
      console.log('Ошибка:', error.message)
      break
    }

    if (!data || data.length === 0) {
      console.log('Готово! Всего исправлено:', totalFixed)
      break
    }

    console.log('Обновляю партию:', data.length)

    for (const p of data) {
      const newPrice = Math.round(p.price * 13 * 100) / 100
      await supabase
        .from('catalog_verified_products')
        .update({ price: newPrice })
        .eq('id', p.id)
    }

    totalFixed += data.length
  }
}

fixAll()
