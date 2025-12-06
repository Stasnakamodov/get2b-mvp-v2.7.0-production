/**
 * Создание подкатегорий для категории "Строительство"
 */

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejkhdhexkadecpbjjmsz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

async function createConstructionSubcategories() {
  console.log('🏗️ Создание подкатегорий для категории "Строительство"\n')
  console.log('=' .repeat(60))

  try {
    // Получаем категорию "Строительство"
    const { data: category, error: categoryError } = await supabase
      .from('catalog_categories')
      .select('id, name')
      .eq('key', 'construction')
      .single()

    if (categoryError || !category) {
      console.error('❌ Категория "Строительство" не найдена')
      return
    }

    console.log(`✅ Найдена категория: ${category.name} (ID: ${category.id})`)

    // Подкатегории для строительства
    const subcategories = [
      {
        name: 'Инструменты',
        key: 'tools',
        description: 'Электроинструмент и ручной инструмент'
      },
      {
        name: 'Стройматериалы',
        key: 'building-materials',
        description: 'Материалы для строительства и ремонта'
      },
      {
        name: 'Сантехника',
        key: 'plumbing',
        description: 'Сантехническое оборудование и комплектующие'
      },
      {
        name: 'Электрика',
        key: 'electrical',
        description: 'Электротовары и освещение'
      },
      {
        name: 'Крепеж и метизы',
        key: 'fasteners',
        description: 'Крепежные изделия и металлические изделия'
      },
      {
        name: 'Краски и лаки',
        key: 'paints',
        description: 'Лакокрасочные материалы'
      },
      {
        name: 'Двери и окна',
        key: 'doors-windows',
        description: 'Дверные и оконные системы'
      },
      {
        name: 'Отделочные материалы',
        key: 'finishing-materials',
        description: 'Материалы для внутренней отделки'
      }
    ]

    console.log(`\n📦 Создание ${subcategories.length} подкатегорий...`)

    for (const subcat of subcategories) {
      // Проверяем существование
      const { data: existing } = await supabase
        .from('catalog_subcategories')
        .select('id')
        .eq('key', subcat.key)
        .eq('category_id', category.id)
        .single()

      if (existing) {
        console.log(`  ⏩ ${subcat.name} - уже существует`)
        continue
      }

      // Создаем новую подкатегорию (без поля description)
      const { data: newSubcat, error: insertError } = await supabase
        .from('catalog_subcategories')
        .insert([{
          name: subcat.name,
          key: subcat.key,
          category_id: category.id
        }])
        .select()
        .single()

      if (insertError) {
        console.error(`  ❌ Ошибка создания ${subcat.name}: ${insertError.message}`)
      } else {
        console.log(`  ✅ ${subcat.name} - создана (ID: ${newSubcat.id})`)
      }
    }

    // Выводим итоговую статистику
    const { data: allSubcats } = await supabase
      .from('catalog_subcategories')
      .select('id, name')
      .eq('category_id', category.id)

    console.log('\n' + '=' .repeat(60))
    console.log(`📊 Итого подкатегорий в "Строительство": ${allSubcats.length}`)
    allSubcats.forEach(sub => {
      console.log(`   - ${sub.name}`)
    })
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message)
  }
}

createConstructionSubcategories()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('💥 Фатальная ошибка:', error)
    process.exit(1)
  })