const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

// Добавляем больше поставщиков для работающих категорий
const additionalSuppliers = [
  {
    name: 'ЭлектроСтандарт',
    company_name: 'ЭлектроСтандарт ООО',
    category: 'Электроника',
    country: 'Россия',
    city: 'Санкт-Петербург',
    description: 'Поставки электронных компонентов, микросхем и радиодеталей для производства и ремонта.',
    logo_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop&crop=center',
    contact_email: 'info@electrostandard.ru',
    contact_phone: '+7 (812) 345-67-89',
    website: 'https://electrostandard.ru',
    contact_person: 'Михаил Петров',
    min_order: '₽25,000',
    response_time: '6 часов',
    employees: 18,
    established: 2017,
    public_rating: 4.5,
    reviews_count: 84,
    projects_count: 142,
    is_featured: false,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'АвтоДеталь Центр',
    company_name: 'АвтоДеталь Центр ООО',
    category: 'Автотовары',
    country: 'Россия',
    city: 'Ростов-на-Дону',
    description: 'Широкий ассортимент автозапчастей для российских и импортных автомобилей. Быстрая доставка.',
    logo_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&fit=crop&crop=center',
    contact_email: 'order@avtodetal.ru',
    contact_phone: '+7 (863) 567-89-01',
    website: 'https://avtodetal.ru',
    contact_person: 'Андрей Козлов',
    min_order: '₽15,000',
    response_time: '4 часа',
    employees: 31,
    established: 2019,
    public_rating: 4.3,
    reviews_count: 67,
    projects_count: 98,
    is_featured: false,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'МегаТех Электроника',
    company_name: 'МегаТех Электроника ООО',
    category: 'Электроника',
    country: 'Россия',
    city: 'Новосибирск',
    description: 'Профессиональные решения в области телекоммуникаций и IT-оборудования.',
    logo_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200&h=200&fit=crop&crop=center',
    contact_email: 'sales@megatech.ru',
    contact_phone: '+7 (383) 456-78-90',
    website: 'https://megatech.ru',
    contact_person: 'Ольга Васильева',
    min_order: '₽100,000',
    response_time: '8 часов',
    employees: 52,
    established: 2013,
    public_rating: 4.7,
    reviews_count: 156,
    projects_count: 234,
    is_featured: true,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'АвтоСервис Профи',
    company_name: 'АвтоСервис Профи ООО',
    category: 'Автотовары',
    country: 'Россия',
    city: 'Казань',
    description: 'Комплексные поставки автозапчастей и расходников для автосервисов и дилеров.',
    logo_url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&h=200&fit=crop&crop=center',
    contact_email: 'info@autoservice-profi.ru',
    contact_phone: '+7 (843) 234-56-78',
    website: 'https://autoservice-profi.ru',
    contact_person: 'Рустам Хайруллин',
    min_order: '₽40,000',
    response_time: '12 часов',
    employees: 27,
    established: 2016,
    public_rating: 4.4,
    reviews_count: 91,
    projects_count: 167,
    is_featured: false,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  }
];

async function addMoreSuppliers() {
  try {
    console.log('🚀 Добавляем дополнительных поставщиков...');
    
    // Проверяем сколько уже есть
    const { data: existing, error: countError } = await supabase
      .from('catalog_verified_suppliers')
      .select('name, category')
      .eq('is_active', true);
      
    if (countError) {
      console.error('❌ Ошибка подсчета:', countError);
      return;
    }
    
    console.log(`📊 Текущее количество поставщиков: ${existing?.length || 0}`);
    existing?.forEach(s => console.log(`- ${s.name} (${s.category})`));
    
    // Добавляем новых по одному
    console.log(`\n📝 Добавляем ${additionalSuppliers.length} новых поставщиков...`);
    
    const results = [];
    for (let i = 0; i < additionalSuppliers.length; i++) {
      const supplier = additionalSuppliers[i];
      console.log(`\n${i + 1}/${additionalSuppliers.length}: ${supplier.name}...`);
      
      const { data, error } = await supabase
        .from('catalog_verified_suppliers')
        .insert([supplier])
        .select();
      
      if (error) {
        console.error(`❌ Ошибка для ${supplier.name}:`, error.message);
        continue;
      }
      
      console.log(`✅ ${supplier.name} добавлен`);
      results.push(data[0]);
    }
    
    console.log(`\n🎉 Добавлено новых поставщиков: ${results.length}`);
    
    // Показываем итоговый список
    const { data: final, error: finalError } = await supabase
      .from('catalog_verified_suppliers')
      .select('name, category, city, logo_url')
      .eq('is_active', true)
      .order('name');
      
    if (!finalError) {
      console.log(`\n📋 Итоговый список (${final?.length || 0} поставщиков):`);
      final?.forEach(s => {
        console.log(`- ${s.name} (${s.category}) - ${s.city} ${s.logo_url ? '🖼️' : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

addMoreSuppliers();