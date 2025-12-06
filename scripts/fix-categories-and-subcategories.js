const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Подкатегории для "Здоровье и красота"
const healthBeautySubcategories = [
  { name: 'Косметика', key: 'cosmetics' },
  { name: 'Уход за кожей', key: 'skincare' },
  { name: 'Средства гигиены', key: 'hygiene' },
  { name: 'Витамины и БАД', key: 'vitamins' }
]

// Маппинг товаров по ключевым словам на подкатегории
const categoryMapping = {
  'Автозапчасти': ['автозапчасти'],
  'Автохимия': ['автомобильное зарядное', 'освежитель воздуха авто'],
  'Аксессуары': ['держатель телефона авто', 'чехлы на сиденья', 'коврики автомобильные', 'аптечка автомобильная'],
  'Шины и диски': ['щетки стеклоочистителя', 'видеорегистратор', 'компрессор автомобильный'],

  'Косметика': ['косметика корейская', 'помада', 'тушь для ресниц'],
  'Уход за кожей': ['крем для лица', 'сыворотка для кожи', 'тканевые маски', 'массажер для лица'],
  'Средства гигиены': ['шампунь органический'],
  'Витамины и БАД': ['витамины', 'термометр бесконтактный', 'тонометр']
}

async function fixCategoriesAndSubcategories() {
  console.log('🚀 Исправление категорий и подкатегорий\n')

  try {
    // 1. Создаем категорию "Здоровье и красота"
    console.log('📋 Шаг 1: Создание категории "Здоровье и красота"')

    let { data: healthBeautyCategory, error: catError } = await supabase
      .from('catalog_categories')
      .select('id, name')
      .eq('name', 'Здоровье и красота')
      .single()

    if (catError || !healthBeautyCategory) {
      const { data: newCategory, error: createCatError } = await supabase
        .from('catalog_categories')
        .insert([{
          name: 'Здоровье и красота',
          key: 'health-beauty',
          icon: '💄'
        }])
        .select()
        .single()

      if (createCatError) {
        console.error(`❌ Ошибка создания категории: ${createCatError.message}`)
        return
      }
      healthBeautyCategory = newCategory
      console.log(`✅ Категория создана: ${healthBeautyCategory.name} (${healthBeautyCategory.id})`)
    } else {
      console.log(`✅ Категория уже существует: ${healthBeautyCategory.name}`)
    }

    // 2. Создаем подкатегории для "Здоровье и красота"
    console.log('\n📋 Шаг 2: Создание подкатегорий для "Здоровье и красота"')

    const subcategoryIds = {}

    for (const subcat of healthBeautySubcategories) {
      let { data: existing, error: existError } = await supabase
        .from('catalog_subcategories')
        .select('id, name')
        .eq('name', subcat.name)
        .eq('category_id', healthBeautyCategory.id)
        .single()

      if (existError || !existing) {
        const { data: newSubcat, error: createError } = await supabase
          .from('catalog_subcategories')
          .insert([{
            name: subcat.name,
            key: subcat.key,
            category_id: healthBeautyCategory.id
          }])
          .select()
          .single()

        if (createError) {
          console.error(`❌ Ошибка создания подкатегории ${subcat.name}: ${createError.message}`)
          continue
        }
        subcategoryIds[subcat.name] = newSubcat.id
        console.log(`  ✓ Создана подкатегория: ${subcat.name}`)
      } else {
        subcategoryIds[subcat.name] = existing.id
        console.log(`  ✓ Подкатегория существует: ${subcat.name}`)
      }
    }

    // 3. Получаем ID подкатегорий для Автотоваров
    console.log('\n📋 Шаг 3: Получение ID подкатегорий для Автотоваров')

    const { data: autoSubcategories, error: autoSubError } = await supabase
      .from('catalog_subcategories')
      .select('id, name')
      .in('name', ['Автозапчасти', 'Автохимия', 'Аксессуары', 'Шины и диски'])

    if (autoSubError) {
      console.error(`❌ Ошибка получения подкатегорий Автотоваров: ${autoSubError.message}`)
      return
    }

    autoSubcategories.forEach(sub => {
      subcategoryIds[sub.name] = sub.id
      console.log(`  ✓ ${sub.name}: ${sub.id}`)
    })

    // 4. Распределяем товары "Автотовары" по подкатегориям
    console.log('\n📋 Шаг 4: Распределение товаров "Автотовары" по подкатегориям')

    const { data: autoProducts, error: autoError } = await supabase
      .from('catalog_verified_products')
      .select('id, name')
      .eq('category', 'Автотовары')

    if (autoError) {
      console.error(`❌ Ошибка получения товаров Автотоваров: ${autoError.message}`)
    } else {
      let autoUpdated = 0
      for (const product of autoProducts) {
        const productName = product.name.toLowerCase()

        for (const [subcatName, keywords] of Object.entries(categoryMapping)) {
          if (!subcategoryIds[subcatName]) continue

          const matches = keywords.some(keyword => productName.includes(keyword.toLowerCase()))

          if (matches) {
            const { error: updateError } = await supabase
              .from('catalog_verified_products')
              .update({ subcategory_id: subcategoryIds[subcatName] })
              .eq('id', product.id)

            if (updateError) {
              console.error(`  ❌ Ошибка обновления ${product.name}: ${updateError.message}`)
            } else {
              autoUpdated++
            }
            break
          }
        }
      }
      console.log(`✅ Обновлено ${autoUpdated} товаров Автотоваров`)
    }

    // 5. Распределяем товары "Здоровье и красота" по подкатегориям
    console.log('\n📋 Шаг 5: Распределение товаров "Здоровье и красота" по подкатегориям')

    const { data: healthProducts, error: healthError } = await supabase
      .from('catalog_verified_products')
      .select('id, name')
      .eq('category', 'Здоровье и красота')

    if (healthError) {
      console.error(`❌ Ошибка получения товаров Здоровье и красота: ${healthError.message}`)
    } else {
      let healthUpdated = 0
      for (const product of healthProducts) {
        const productName = product.name.toLowerCase()

        for (const [subcatName, keywords] of Object.entries(categoryMapping)) {
          if (!subcategoryIds[subcatName]) continue

          const matches = keywords.some(keyword => productName.includes(keyword.toLowerCase()))

          if (matches) {
            const { error: updateError } = await supabase
              .from('catalog_verified_products')
              .update({ subcategory_id: subcategoryIds[subcatName] })
              .eq('id', product.id)

            if (updateError) {
              console.error(`  ❌ Ошибка обновления ${product.name}: ${updateError.message}`)
            } else {
              healthUpdated++
            }
            break
          }
        }
      }
      console.log(`✅ Обновлено ${healthUpdated} товаров Здоровье и красота`)
    }

    // 6. Проверка результатов
    console.log('\n📊 Проверка результатов:')

    const { data: stats, error: statsError } = await supabase
      .from('catalog_verified_products')
      .select('category, subcategory_id')
      .in('category', ['Автотовары', 'Здоровье и красота'])

    if (!statsError) {
      const withSubcat = stats.filter(p => p.subcategory_id !== null).length
      const withoutSubcat = stats.filter(p => p.subcategory_id === null).length

      console.log(`  ✓ Товаров с подкатегорией: ${withSubcat}`)
      console.log(`  ⚠ Товаров без подкатегории: ${withoutSubcat}`)
    }

    console.log('\n' + '='.repeat(50))
    console.log('🎉 Исправление завершено!')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('💥 Критическая ошибка:', error)
    throw error
  }
}

fixCategoriesAndSubcategories()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Ошибка:', err)
    process.exit(1)
  })
