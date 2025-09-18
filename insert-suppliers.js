const { createClient } = require('@supabase/supabase-js');

// Используем анонимный ключ как в основном приложении
const supabase = createClient(
  'https://ejkhdhexkadecpbjjmsz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqa2hkaGV4a2FkZWNwYmpqbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzcxNDIsImV4cCI6MjA2MjYxMzE0Mn0.DHcfdHrQmPiG4AkwDaCa9AXYB7zQPJlK7VuXt-g1uUU'
);

const suppliers = [
  {
    name: 'ТехноКомплект',
    company_name: 'ТехноКомплект ООО',
    category: 'Электроника',
    country: 'Россия',
    city: 'Москва',
    description: 'Поставщик профессиональной электроники, компьютерной техники и промышленных решений. Работаем с ведущими мировыми брендами.',
    logo_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=200&fit=crop&crop=center',
    contact_email: 'info@tehnokomplekt.ru',
    contact_phone: '+7 (495) 234-56-78',
    website: 'https://tehnokomplekt.ru',
    contact_person: 'Александр Волков',
    min_order: '₽75,000',
    response_time: '4 часа',
    employees: 45,
    established: 2015,
    certifications: '["ISO 9001:2015", "CE", "RoHS"]',
    specialties: '["Серверное оборудование", "Сетевые решения", "Системы видеонаблюдения", "Промышленные компьютеры"]',
    payment_methods: '["Банковский перевод", "Аккредитив", "Факторинг"]',
    public_rating: 4.8,
    reviews_count: 127,
    projects_count: 189,
    is_featured: true,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'АвтоПрофи',
    company_name: 'АвтоПрофи Трейд ООО',
    category: 'Автотовары',
    country: 'Россия',
    city: 'Нижний Новгород',
    description: 'Специализируемся на поставках автозапчастей, расходных материалов и аксессуаров для легковых и грузовых автомобилей.',
    logo_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=200&fit=crop&crop=center',
    contact_email: 'sales@avtoprofi.ru',
    contact_phone: '+7 (831) 456-78-90',
    website: 'https://avtoprofi.ru',
    contact_person: 'Дмитрий Петров',
    min_order: '₽30,000',
    response_time: '8 часов',
    employees: 23,
    established: 2018,
    certifications: '["ISO/TS 16949", "ГОСТ Р ISO 9001"]',
    specialties: '["Запчасти для иномарок", "Расходные материалы", "Тюнинг и аксессуары", "Автохимия"]',
    payment_methods: '["Наличный расчет", "Банковский перевод", "Отсрочка платежа"]',
    public_rating: 4.6,
    reviews_count: 93,
    projects_count: 156,
    is_featured: false,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'СтройМастер',
    company_name: 'СтройМастер Групп ООО',
    category: 'Строительство',
    country: 'Россия',
    city: 'Екатеринбург',
    description: 'Оптовые поставки строительных и отделочных материалов. Собственные склады и логистическая сеть по Уралу.',
    logo_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop&crop=center',
    contact_email: 'order@stroymaster.ru',
    contact_phone: '+7 (343) 567-89-01',
    website: 'https://stroymaster.ru',
    contact_person: 'Сергей Кузнецов',
    min_order: '₽150,000',
    response_time: '12 часов',
    employees: 67,
    established: 2012,
    certifications: '["ГОСТ", "СТО НОСТРОЙ", "Экологические сертификаты"]',
    specialties: '["Кирпич и блоки", "Сухие смеси", "Металлопрокат", "Кровельные материалы", "Утеплители"]',
    payment_methods: '["Банковский перевод", "Документарный аккредитив", "Векселя"]',
    public_rating: 4.7,
    reviews_count: 78,
    projects_count: 134,
    is_featured: true,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'МедТехСервис',
    company_name: 'МедТехСервис ООО',
    category: 'Здоровье и медицина',
    country: 'Россия',
    city: 'Санкт-Петербург',
    description: 'Поставки медицинского и лабораторного оборудования для клиник, больниц и диагностических центров.',
    logo_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop&crop=center',
    contact_email: 'med@medtechservice.ru',
    contact_phone: '+7 (812) 678-90-12',
    website: 'https://medtechservice.ru',
    contact_person: 'Елена Соколова',
    min_order: '₽200,000',
    response_time: '6 часов',
    employees: 34,
    established: 2016,
    certifications: '["Регистрационное удостоверение Росздравнадзора", "ISO 13485", "ГОСТ Р ИСО 9001"]',
    specialties: '["Диагностическое оборудование", "Лабораторные анализаторы", "Хирургические инструменты", "Расходные материалы"]',
    payment_methods: '["Банковский перевод", "Лизинг", "Рассрочка"]',
    public_rating: 4.9,
    reviews_count: 156,
    projects_count: 89,
    is_featured: true,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'ГастроПлюс',
    company_name: 'ГастроПлюс Дистрибуция ООО',
    category: 'Продукты питания',
    country: 'Россия',
    city: 'Краснодар',
    description: 'Дистрибуция продуктов питания и товаров для ресторанного бизнеса. Работаем с федеральными сетями и HoReCa.',
    logo_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop&crop=center',
    contact_email: 'info@gastroplus.ru',
    contact_phone: '+7 (861) 789-01-23',
    website: 'https://gastroplus.ru',
    contact_person: 'Анна Михайлова',
    min_order: '₽80,000',
    response_time: '24 часа',
    employees: 56,
    established: 2019,
    certifications: '["HACCP", "Халяль", "Кошерные продукты", "Органик"]',
    specialties: '["Мясо и птица", "Морепродукты", "Молочные продукты", "Замороженные продукты", "Оборудование HoReCa"]',
    payment_methods: '["Банковский перевод", "Наличный расчет", "Отсрочка до 30 дней"]',
    public_rating: 4.5,
    reviews_count: 201,
    projects_count: 267,
    is_featured: false,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  },
  {
    name: 'ПромТехРесурс',
    company_name: 'ПромТехРесурс ООО',
    category: 'Промышленность',
    country: 'Россия',
    city: 'Челябинск',
    description: 'Поставки промышленного оборудования, станков и инструмента для машиностроительных предприятий.',
    logo_url: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=200&h=200&fit=crop&crop=center',
    contact_email: 'prom@promtechresurs.ru',
    contact_phone: '+7 (351) 890-12-34',
    website: 'https://promtechresurs.ru',
    contact_person: 'Игорь Смирнов',
    min_order: '₽500,000',
    response_time: '2 дня',
    employees: 29,
    established: 2014,
    certifications: '["ISO 9001", "ТР ТС 010", "Промышленная безопасность"]',
    specialties: '["Металлообрабатывающие станки", "Подъемное оборудование", "Компрессорные установки", "Измерительные приборы"]',
    payment_methods: '["Банковский перевод", "Аккредитив", "Лизинг"]',
    public_rating: 4.4,
    reviews_count: 67,
    projects_count: 98,
    is_featured: false,
    is_active: true,
    is_verified: true,
    moderation_status: 'approved'
  }
];

async function insertSuppliers() {
  try {
    console.log('🚀 Начинаем вставку поставщиков...');
    
    // Сначала удаляем старых поставщиков
    console.log('🧹 Удаляем старых поставщиков...');
    const { error: deleteError } = await supabase
      .from('catalog_verified_suppliers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Удаляем всех
    
    if (deleteError) {
      console.log('⚠️ Предупреждение при удалении:', deleteError.message);
    } else {
      console.log('✅ Старые поставщики удалены');
    }
    
    // Вставляем новых поставщиков
    console.log(`📝 Вставляем ${suppliers.length} новых поставщиков...`);
    
    const { data, error } = await supabase
      .from('catalog_verified_suppliers')
      .insert(suppliers)
      .select();
    
    if (error) {
      console.error('❌ Ошибка вставки:', error);
      return;
    }
    
    console.log('✅ Поставщики успешно созданы!');
    console.log(`📊 Создано поставщиков: ${data?.length || 0}`);
    
    // Показываем созданных поставщиков
    data?.forEach(supplier => {
      console.log(`- ${supplier.name} (${supplier.category}) - ${supplier.city}`);
    });
    
    console.log('\n🎉 Задача завершена успешно!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

insertSuppliers();