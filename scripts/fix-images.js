const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

const healthBeautyImages = {
  'косметика корейская': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
  'крем для лица': 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
  'сыворотка для кожи': 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400',
  'тканевые маски': 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400',
  'помада': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
  'тушь для ресниц': 'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400',
  'шампунь органический': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400',
  'массажер для лица': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400',
  'витамины': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  'термометр бесконтактный': 'https://images.unsplash.com/photo-1584744982493-c4dc1b4e6d9f?w=400',
  'тонометр': 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=400'
}

const autoImages = {
  'автомобильные аксессуары': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400',
  'автозапчасти': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
  'коврики автомобильные': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400',
  'держатель телефона авто': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
  'чехлы на сиденья': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
  'освежитель воздуха авто': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400',
  'видеорегистратор': 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400',
  'автомобильное зарядное': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
  'аптечка автомобильная': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400',
  'компрессор автомобильный': 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=400',
  'щетки стеклоочистителя': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400'
}

async function fixImages() {
  console.log('🖼️  Исправление изображений для товаров\n')

  // Получаем все товары категорий
  const { data: products, error } = await supabase
    .from('catalog_verified_products')
    .select('id, name, category')
    .in('category', ['Здоровье и красота', 'Автотовары'])

  if (error) {
    console.error('❌ Ошибка получения товаров:', error)
    return
  }

  console.log(`📦 Найдено ${products.length} товаров для обновления\n`)

  let updated = 0

  for (const product of products) {
    const imageMap = product.category === 'Здоровье и красота' ? healthBeautyImages : autoImages

    // Находим подходящее изображение по названию
    let imageUrl = null
    for (const [key, url] of Object.entries(imageMap)) {
      if (product.name.toLowerCase().includes(key)) {
        imageUrl = url
        break
      }
    }

    if (imageUrl) {
      const { error: updateError } = await supabase
        .from('catalog_verified_products')
        .update({ images: [imageUrl] })
        .eq('id', product.id)

      if (updateError) {
        console.error(`❌ Ошибка обновления ${product.name}:`, updateError.message)
      } else {
        updated++
        if (updated % 10 === 0) {
          console.log(`  ✓ Обновлено ${updated}/${products.length} товаров`)
        }
      }
    }
  }

  console.log(`\n✅ Обновлено изображений: ${updated}`)
  console.log('🎉 Готово!')
}

fixImages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Ошибка:', err)
    process.exit(1)
  })
