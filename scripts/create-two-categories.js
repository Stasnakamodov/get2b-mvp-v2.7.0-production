const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzAzNzE0MiwiZXhwIjoyMDYyNjEzMTQyfQ.MH6oMEsLySC08YsLIjOfeweGtvfGg_vNl-d3sc5L6Lg'
)

// Категории для импорта
const categories = [
  {
    name: 'Автотовары',
    queries: [
      'автомобильные аксессуары', 'автозапчасти', 'коврики автомобильные',
      'держатель телефона авто', 'чехлы на сиденья', 'освежитель воздуха авто',
      'видеорегистратор', 'автомобильное зарядное', 'аптечка автомобильная',
      'компрессор автомобильный', 'щетки стеклоочистителя'
    ]
  },
  {
    name: 'Здоровье и красота',
    queries: [
      'косметика корейская', 'крем для лица', 'сыворотка для кожи',
      'тканевые маски', 'помада', 'тушь для ресниц',
      'шампунь органический', 'массажер для лица', 'витамины',
      'термометр бесконтактный', 'тонометр'
    ]
  }
]

// Генератор товаров
function generateProducts(category, count) {
  const products = []
  const basePrice = category.name === 'Автотовары' ? 500 : 300

  for (let i = 0; i < count; i++) {
    const queryIndex = i % category.queries.length
    const query = category.queries[queryIndex]
    const variant = Math.floor(i / category.queries.length) + 1

    const product = {
      name: query.charAt(0).toUpperCase() + query.slice(1) + ` (вариант ${variant})`,
      description: `Высококачественный товар категории "${category.name}". ${query}. Прямые поставки из Китая. Быстрая доставка.`,
      category: category.name,
      sku: `${category.name.substring(0,3).toUpperCase()}-${Date.now()}-${i}`,
      price: basePrice + Math.floor(Math.random() * 1000),
      currency: 'RUB',
      min_order: '1 шт.',
      in_stock: Math.random() > 0.1,
      specifications: {
        'Производитель': ['Guangzhou Tech', 'Shenzhen Quality', 'Beijing Premium', 'Shanghai Elite'][Math.floor(Math.random() * 4)],
        'Гарантия': ['6 месяцев', '1 год', '2 года'][Math.floor(Math.random() * 3)],
        'Материал': category.name === 'Автотовары' ? 'Пластик/Металл' : 'Натуральные компоненты',
        'Вес': `${Math.floor(Math.random() * 500) + 100}г`
      },
      images: [
        `https://via.placeholder.com/400x400.png?text=${encodeURIComponent(query)}`
      ],
      supplier_id: null, // Установим после создания поставщика
      is_active: true,
      is_featured: Math.random() > 0.8
    }

    products.push(product)
  }

  return products
}

async function importCategories() {
  console.log('🚀 Создание двух новых категорий по 88 товаров\n')

  for (const category of categories) {
    console.log(`\n📦 Категория: ${category.name}`)
    console.log('─'.repeat(50))

    // 1. Создаем/находим поставщика
    let { data: supplier, error: supplierError } = await supabase
      .from('catalog_verified_suppliers')
      .select('id, name')
      .eq('name', `Поставщик ${category.name}`)
      .single()

    if (supplierError || !supplier) {
      const { data: newSupplier, error: createError } = await supabase
        .from('catalog_verified_suppliers')
        .insert([{
          name: `Поставщик ${category.name}`,
          company_name: `${category.name} Trading Co.`,
          category: category.name,
          country: 'Китай',
          city: category.name === 'Автотовары' ? 'Гуанчжоу' : 'Шанхай',
          description: `Профессиональный поставщик товаров категории ${category.name}`,
          is_active: true,
          is_verified: true,
          moderation_status: 'approved',
          contact_email: `${category.name.toLowerCase()}@supplier.cn`,
          min_order: 'От 1 шт.',
          response_time: '1-2 дня',
          public_rating: 4.5 + Math.random() * 0.5
        }])
        .select()
        .single()

      if (createError) {
        console.error(`❌ Ошибка создания поставщика: ${createError.message}`)
        continue
      }
      supplier = newSupplier
    }

    console.log(`✅ Поставщик: ${supplier.name}`)

    // 2. Генерируем товары
    const products = generateProducts(category, 88)
    products.forEach(p => p.supplier_id = supplier.id)

    console.log(`📋 Генерация ${products.length} товаров...`)

    // 3. Импортируем порциями по 20
    const batchSize = 20
    let imported = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)

      const { data, error } = await supabase
        .from('catalog_verified_products')
        .insert(batch)
        .select('id, name')

      if (error) {
        console.error(`❌ Ошибка вставки: ${error.message}`)
        continue
      }

      imported += data.length
      console.log(`  ✓ Добавлено ${imported}/${products.length} товаров`)
    }

    console.log(`\n✅ Импортировано: ${imported} товаров в категорию "${category.name}"`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 Импорт завершен!')
  console.log('='.repeat(50))
  console.log('\n💡 Проверьте каталог: /dashboard/catalog')
}

importCategories()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Ошибка:', err)
    process.exit(1)
  })
