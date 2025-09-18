import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

// 🧠 API ДЛЯ ИЗВЛЕЧЕНИЯ "ЭХО КАРТОЧЕК" ПОСТАВЩИКОВ ИЗ ПРОЕКТОВ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id обязателен' },
        { status: 400 }
      )
    }

    // ========================================
    // 📊 ИЗВЛЕКАЕМ ТОЛЬКО АКТУАЛЬНЫЕ ДАННЫЕ
    // ========================================

    // 1. ПРИОРИТЕТ 1: Получаем реквизиты поставщиков из project_requisites
    console.log('🔍 [PRIORITY 1] Получаем реквизиты поставщиков из project_requisites для user_id:', userId)
    
    const { data: projectRequisites, error: projectRequisitesError } = await supabase
      .from('project_requisites')
      .select('*')
      .eq('user_id', userId)

    if (projectRequisitesError) {
      console.error('⚠️ Ошибка получения project_requisites (возможно таблица не существует):', projectRequisitesError)
    }

    console.log('📋 Найдено реквизитов в project_requisites:', projectRequisites?.length || 0)

    // 2. ПРИОРИТЕТ 2: Получаем шаблоны реквизитов пользователя как fallback
    console.log('🔍 [PRIORITY 2] Получаем банковские шаблоны для user_id:', userId)
    
    const { data: bankRequisites, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)

    const { data: cardRequisites, error: cardError } = await supabase
      .from('supplier_cards')
      .select('*')
      .eq('user_id', userId)

    const { data: cryptoRequisites, error: cryptoError } = await supabase
      .from('crypto_wallets')
      .select('*')
      .eq('user_id', userId)

    if (bankError || cardError || cryptoError) {
      console.error('❌ Ошибка получения шаблонов реквизитов:', { bankError, cardError, cryptoError })
      return NextResponse.json(
        { error: 'Ошибка получения реквизитов' },
        { status: 500 }
      )
    }

    // Объединяем шаблоны реквизитов с типами (FALLBACK)
    const allTemplateRequisites = [
      ...(bankRequisites || []).map(r => ({ ...r, type: 'bank', source: 'bank_accounts' })),
      ...(cardRequisites || []).map(r => ({ ...r, type: 'p2p', source: 'supplier_cards' })),
      ...(cryptoRequisites || []).map(r => ({ ...r, type: 'crypto', source: 'crypto_wallets' }))
    ]

    // Объединяем реквизиты проектов с типами (ПРИОРИТЕТ)
    const allProjectRequisites = (projectRequisites || []).map(r => ({ 
      ...r, 
      source: 'project_requisites' 
    }))

    console.log('✅ Найдено реквизитов:', {
      from_projects: allProjectRequisites.length,
      from_templates: allTemplateRequisites.length,
      total: allProjectRequisites.length + allTemplateRequisites.length
    })

    // Если нет вообще никаких реквизитов - проверяем есть ли хотя бы обычные проекты
    const hasAnyRequisites = (allProjectRequisites.length + allTemplateRequisites.length) > 0
    if (!hasAnyRequisites) {
      // Проверяем есть ли вообще проекты у пользователя
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('user_id', userId)
        .limit(1)
      
      // Если нет вообще проектов - показываем пустой результат
      if (!allProjects || allProjects.length === 0) {
        return NextResponse.json({
          success: true,
          echo_cards: [],
          summary: {
            total_projects: 0,
            projects_with_supplier_data: 0,
            unique_suppliers: 0,
            message: 'Нет проектов. Создайте первый проект для появления эхо карточек.',
            filter_applied: 'no_projects'
          }
        })
      }
      
      // Если есть проекты, но нет реквизитов - показываем fallback карточки
      console.log('🔄 Нет реквизитов, но есть проекты - показываем fallback карточки')
    }

    // 2. Получаем ВСЕ проекты пользователя
    let projectsQuery = supabase
      .from('projects')
      .select(`
        id,
        name,
        company_data,
        supplier_data,
        supplier_type,
        status,
        amount,
        currency,
        payment_method,
        created_at
      `)
      .eq('user_id', userId)
      .gte('current_step', 5) // Только проекты дошедшие до Step5

    // Если нет вообще никаких реквизитов - возвращаем пустой результат
    if (!hasAnyRequisites) {
      return NextResponse.json({
        success: true,
        echo_cards: [],
        summary: {
          total_projects: 0,
          projects_with_supplier_data: 0,
          unique_suppliers: 0,
          message: 'Нет реквизитов поставщиков. Создайте новый проект и пройдите Step5 для добавления данных поставщика.',
          filter_applied: 'no_requisites',
          requisites_count: 0
        }
      })
    }

    const { data: projects, error: projectsError } = await projectsQuery

    if (projectsError) {
      console.error('❌ Ошибка получения проектов:', projectsError)
      return NextResponse.json(
        { error: 'Ошибка получения проектов', details: projectsError.message },
        { status: 500 }
      )
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        echo_cards: [],
        summary: {
          total_projects: 0,
          projects_with_supplier_data: 0,
          unique_suppliers: 0,
          message: 'Нет актуальных проектов с реквизитами поставщиков',
          filter_applied: 'no_projects_found'
        }
      })
    }

    // 3. Получаем спецификации (товары) для найденных проектов  
    const projectIds = projects.map(p => p.id)
    console.log('🔍 Загружаем спецификации для проектов:', projectIds)
    
    const { data: specifications, error: specificationsError } = await supabase
      .from('project_specifications')
      .select(`
        project_id,
        item_name,
        quantity,
        price,
        total,
        image_url,
        created_at
      `)
      .in('project_id', projectIds)
    
    console.log('📋 Найдено спецификаций (товаров):', specifications?.length || 0)
    if (specifications && specifications.length > 0) {
      console.log('📦 Примеры товаров:', specifications.slice(0, 3))
    }

    if (specificationsError) {
      console.error('❌ Ошибка получения спецификаций:', specificationsError)
      // Не блокируем выполнение, просто работаем без спецификаций
    }

    // ========================================
    // 🔍 СОЗДАЕМ ТОЛЬКО АКТУАЛЬНЫЕ ЭХО КАРТОЧКИ
    // ========================================

    const echoCards: any[] = []
    const supplierStats = new Map()

    projects.forEach((project: any) => {
      // Ищем реквизиты поставщика для этого проекта по payment_method
      const paymentMethodMap: any = {
        'bank-transfer': 'bank',
        'p2p': 'p2p', 
        'crypto': 'crypto'
      }
      
      const expectedType = paymentMethodMap[project.payment_method] || 'bank'
      const projectRequisites = allProjectRequisites?.filter((r: any) => r.type === expectedType) || []
      
      // Ищем товары для этого проекта
      const projectItems = specifications?.filter(s => s.project_id === project.id) || []
      
      let supplierInfo: any = {}
      
      // ИЗВЛЕКАЕМ ДАННЫЕ ИЗ БАНКОВСКИХ/P2P/КРИПТОРЕКВИЗИТОВ
      if (projectRequisites.length > 0) {
        const mainRequisite = projectRequisites[0] // Берем первый реквизит
        
        supplierInfo = {
          name: project.name || 'Неизвестный поставщик',
          company_name: mainRequisite.data?.recipientName || mainRequisite.data?.holder_name || mainRequisite.data?.name || project.name || 'Неизвестная компания',
          category: 'Электроника', // Дефолтная категория с сертификатами
          country: getCountryFromRequisite(mainRequisite),
          city: getCityFromRequisite(mainRequisite),
          contact_email: null, // В реквизитах обычно нет email
          contact_phone: null, // В реквизитах обычно нет телефона
          website: null,
          contact_person: mainRequisite.data?.recipientName || mainRequisite.data?.holder_name,
          // Банковские данные из реквизитов
          payment_methods: formatPaymentMethods(mainRequisite.data || {}, mainRequisite.type),
          // Дополнительная информация
          payment_type: mainRequisite.type,
          requisite_details: mainRequisite,
          source: 'project_requisites'
        }
      }
      // Приоритет 2: Данные из supplier_data (если есть новые поля)  
      else if (project.supplier_data && Object.keys(project.supplier_data).length > 0) {
        // Явно исключаем description из supplier_data
        const { description, ...cleanSupplierData } = project.supplier_data
        supplierInfo = {
          ...cleanSupplierData,
          source: 'supplier_data'
        }
      }
      // НЕ ПОКАЗЫВАЕМ НЕПРАВИЛЬНЫЕ ДАННЫЕ КЛИЕНТА
      else {
        // Пропускаем проекты без реквизитов поставщика
        console.log(`⚠️ Пропускаем проект ${project.name} - нет реквизитов поставщика`)
        return
      }

      // Создаем ключ поставщика для группировки
      const supplierKey = `${supplierInfo.name}_${supplierInfo.company_name}`.replace(/\s+/g, '_').toLowerCase()
      
      // Обновляем статистику поставщика
      if (!supplierStats.has(supplierKey)) {
        supplierStats.set(supplierKey, {
          supplier_info: supplierInfo,
          projects: [],
          total_amount: 0,
          total_projects: 0,
          successful_projects: 0,
          cancelled_projects: 0,
          active_projects: 0,
          products: new Set(),
          categories: new Set(['Электроника']),
          payment_methods: new Set(),
          last_project_date: project.created_at,
          first_project_date: project.created_at,
          products_detailed: [] // Массив с полной информацией о товарах
        })
      }

      const stats = supplierStats.get(supplierKey)
      stats.projects.push({
        id: project.id,
        name: project.name,
        status: project.status,
        amount: project.amount,
        currency: project.currency,
        payment_method: project.payment_method,
        created_at: project.created_at
      })

      // Обновляем статистику
      stats.total_projects += 1
      if (project.status === 'completed') stats.successful_projects += 1
      if (project.status === 'cancelled') stats.cancelled_projects += 1
      if (project.status === 'active') stats.active_projects += 1
      if (project.amount) stats.total_amount += parseFloat(project.amount)
      
      // Добавляем способ оплаты
      if (project.payment_method) {
        stats.payment_methods.add(project.payment_method)
      }
      
      // Обновляем даты
      if (new Date(project.created_at) > new Date(stats.last_project_date)) {
        stats.last_project_date = project.created_at
      }
      if (new Date(project.created_at) < new Date(stats.first_project_date)) {
        stats.first_project_date = project.created_at
      }

      // Добавляем товары из спецификаций с полной информацией
      console.log(`🛍️ Обрабатываем товары для проекта ${project.name}: найдено ${projectItems.length} товаров`)
      
      projectItems.forEach((item: any) => {
        const productName = item.item_name
        if (productName && productName.trim()) {
          stats.products.add(productName.trim())
          
          // Добавляем товар с полной информацией
          const existingProduct = stats.products_detailed.find((p: any) => p.name === productName.trim())
          if (!existingProduct) {
            const productInfo = {
              name: productName.trim(),
              price: item.price || '',
              quantity: item.quantity || 1,
              total: item.total || '',
              image_url: item.image_url || '', // 🖼️ КАРТИНКА ТОВАРА ИЗ STEP2
              project_id: item.project_id,
              created_at: item.created_at
            }
            
            stats.products_detailed.push(productInfo)
            console.log(`➕ Добавлен товар: ${productName.trim()} (цена: ${item.price || 'без цены'}, картинка: ${item.image_url ? '✅' : '❌'})`)
          } else {
            console.log(`⚠️ Товар уже существует: ${productName.trim()}`)
          }
        }
      })
      
      console.log(`📦 Итого товаров у поставщика ${supplierKey}: ${stats.products_detailed.length}`)
    })

    // ========================================
    // 📋 ФОРМИРУЕМ РЕЗУЛЬТАТ ТОЛЬКО АКТУАЛЬНЫХ
    // ========================================

    supplierStats.forEach((stats, supplierKey) => {
      const supplierInfo = stats.supplier_info
      const successRate = stats.total_projects > 0 
        ? Math.round((stats.successful_projects / stats.total_projects) * 100) 
        : 0
      
      echoCards.push({
        supplier_key: supplierKey,
        supplier_info: {
          name: supplierInfo.name,
          company_name: supplierInfo.company_name,
          category: Array.from(stats.categories)[0] || 'Электроника',
          country: supplierInfo.country || '',
          city: supplierInfo.city || '',
          contact_email: supplierInfo.contact_email,
          contact_phone: supplierInfo.contact_phone,
          website: supplierInfo.website,
          contact_person: supplierInfo.contact_person,
          // НИКОГДА НЕ ПЕРЕДАЕМ DESCRIPTION
          // description: НЕ ВКЛЮЧАЕМ ВООБЩЕ
          // Платежная информация из реквизитов
          payment_methods: supplierInfo.payment_methods,
          payment_type: supplierInfo.payment_type,
          // Дополнительная информация
          requisite_details: supplierInfo.requisite_details,
        },
        statistics: {
          total_projects: stats.total_projects,
          successful_projects: stats.successful_projects,
          cancelled_projects: stats.cancelled_projects,
          active_projects: stats.active_projects,
          success_rate: successRate,
          total_spent: stats.total_amount,
          avg_project_value: stats.total_projects > 0 
            ? Math.round(stats.total_amount / stats.total_projects) 
            : 0,
          products_count: stats.products.size,
          categories_count: stats.categories.size,
          payment_methods_used: Array.from(stats.payment_methods),
          first_project_date: stats.first_project_date,
          last_project_date: stats.last_project_date
        },
        products: Array.from(stats.products), // Все товары (названия)  
        products_detailed: stats.products_detailed, // Полная информация о товарах с ценами
        categories: Array.from(stats.categories),
        projects: stats.projects.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        extraction_info: {
          data_source: supplierInfo.source,
          can_import_to_catalog: true,
          needs_manual_review: supplierInfo.source !== 'project_requisites',
          completeness_score: calculateCompletenessScore(supplierInfo),
          has_payment_details: !!supplierInfo.payment_methods,
          is_actual_data: supplierInfo.source === 'project_requisites' || supplierInfo.source === 'supplier_data'
        }
      })
    })

    // Сортируем по количеству проектов и успешности
    echoCards.sort((a: any, b: any) => {
      if (b.statistics.total_projects !== a.statistics.total_projects) {
        return b.statistics.total_projects - a.statistics.total_projects
      }
      return b.statistics.success_rate - a.statistics.success_rate
    })

    return NextResponse.json({
      success: true,
      echo_cards: echoCards,
      summary: {
        total_projects: projects.length,
        projects_with_supplier_data: allProjectRequisites?.length || 0,
        unique_suppliers: echoCards.length,
        message: echoCards.length > 0 
          ? `Найдено ${echoCards.length} поставщиков с полными реквизитами из ${projects.length} проектов`
          : hasAnyRequisites
            ? 'Есть реквизиты, но не удалось создать эхо карточки'
            : 'Нет проектов с реквизитами поставщиков. Создайте новый проект и пройдите Step5 для добавления данных поставщика.',
        filter_applied: hasAnyRequisites 
          ? 'with_requisites' 
          : 'no_requisites',
        requisites_count: allProjectRequisites?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Ошибка в API эхо карточек:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ========================================
// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

// Определение страны из реквизита
function getCountryFromRequisite(requisite: any): string {
  if (requisite.type === 'bank') {
    // Для банковских реквизитов ищем страну
    if (requisite.country) return requisite.country
    if (requisite.details?.cnapsCode) return 'Китай'
    return '' // Пустое поле для заполнения пользователем
  }
  if (requisite.type === 'crypto') {
    // Для криптореквизитов страны нет
    return 'Глобально'
  }
  if (requisite.type === 'p2p') {
    // Для P2P карт ищем страну
    if (requisite.country) return requisite.country
    return '' // Пустое поле для заполнения пользователем
  }
  return '' // Пустое поле для заполнения пользователем
}

// Определение города из реквизита  
function getCityFromRequisite(requisite: any): string {
  if (requisite.type === 'bank') {
    // Для банковских реквизитов ищем адрес получателя
    const address = requisite.recipientAddress || requisite.details?.recipientAddress
    // Проверяем что это не тестовые данные (содержит цифры/буквы как ID)
    if (address && !isTestData(address)) {
      return address
    }
    return '' // Пустое поле для заполнения пользователем
  }
  if (requisite.type === 'crypto') {
    // Для криптореквизитов города нет
    return 'Виртуально'
  }
  if (requisite.type === 'p2p') {
    // Для P2P карт ищем адрес
    const address = requisite.address
    if (address && !isTestData(address)) {
      return address
    }
    return '' // Пустое поле для заполнения пользователем
  }
  return '' // Пустое поле для заполнения пользователем
}

// Проверка на тестовые/заглушечные данные
function isTestData(value: string): boolean {
  if (!value) return true
  // Шаблоны тестовых данных
  const testPatterns = [
    /^[A-F0-9]{4}-[A-F0-9]{4}$/i,  // "75F5-3DC9"
    /^[0-9]{10,}$/,                 // Длинные числа как "8888888888888"
    /^test/i,                       // Начинается с "test"
    /^demo/i,                       // Начинается с "demo"
    /^temp/i,                       // Начинается с "temp"
    /^placeholder/i,                // "placeholder"
    /^sample/i,                     // "sample"
  ]
  
  return testPatterns.some(pattern => pattern.test(value))
}

// Определение страны по типу реквизита (старая функция)
function getCountryByRequisite(data: any, type: string): string {
  if (type === 'bank' && data.cnapsCode) return 'Китай'
  if (type === 'crypto') return 'Криптовалюта'
  if (data.country) return data.country
  return '' // Пустое поле для заполнения пользователем
}

// Форматирование платежных методов
function formatPaymentMethods(data: any, type: string): any {
  switch (type) {
    case 'bank':
      return {
        bank: {
          bank_name: data.bankName,
          account_number: data.accountNumber,
          swift_code: data.swift,
          iban: data.iban,
          cnaps_code: data.cnapsCode,
          recipient_name: data.recipientName,
          recipient_address: data.recipientAddress,
          bank_address: data.bankAddress,
        }
      }
    case 'p2p':
      return {
        card: {
          number: data.card_number,
          holder: data.holder_name,
          expiry: data.expiry_date,
        }
      }
    case 'crypto':
      return {
        crypto: {
          address: data.address,
          network: data.network,
        }
      }
    default:
      return data
  }
}

// Функция расчета полноты данных поставщика
function calculateCompletenessScore(supplierInfo: any): number {
  const fields = ['name', 'company_name', 'country', 'city', 'contact_person', 'payment_methods']
  const filledFields = fields.filter(field => {
    const value = supplierInfo[field]
    return value && value !== 'Не указано' && value !== null && value !== ''
  })
  return Math.round((filledFields.length / fields.length) * 100)
}

// ========================================
// 📥 POST - ИМПОРТ ЭХО КАРТОЧКИ В КАТАЛОГ  
// ========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, supplier_key, supplier_data, products = [] } = body

    if (!user_id || !supplier_key || !supplier_data) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: user_id, supplier_key, supplier_data' },
        { status: 400 }
      )
    }

    // 1. Создаем поставщика в каталоге пользователя
    const { data: newSupplier, error: supplierError } = await supabase
      .from('catalog_user_suppliers')
      .insert({
        user_id,
        name: supplier_data.name,
        company_name: supplier_data.company_name,
        category: supplier_data.category === 'Не указано' ? 'Электроника' : (supplier_data.category || 'Электроника'),
        country: supplier_data.country || '',
        city: supplier_data.city,
        description: null, // Описание остается пустым при импорте
        contact_email: supplier_data.contact_email,
        contact_phone: supplier_data.contact_phone,
        website: supplier_data.website,
        contact_person: supplier_data.contact_person,
        payment_methods: supplier_data.payment_methods,
        source_type: 'extracted_from_projects',
        is_active: true
      })
      .select()
      .single()

    if (supplierError) {
      console.error('❌ Ошибка создания поставщика:', supplierError)
      return NextResponse.json(
        { error: 'Ошибка создания поставщика', details: supplierError.message },
        { status: 500 }
      )
    }

    // 2. Добавляем товары (если есть)
    if (products.length > 0 && newSupplier) {
      const productsToInsert = products.map((product: any) => ({
        supplier_id: newSupplier.id,
        user_id,
        name: product.name || product,
        description: null, // Описание товара остается пустым при импорте
        category: supplier_data.category === 'Не указано' ? 'Электроника' : (supplier_data.category || 'Электроника'),
        price: null, // Цены из проектов обычно нет
        currency: 'USD',
        min_order: '1 штука',
        in_stock: true
      }))

      const { error: productsError } = await supabase
        .from('catalog_user_products')
        .insert(productsToInsert)

      if (productsError) {
        console.error('⚠️ Ошибка добавления товаров:', productsError)
        // Не возвращаем ошибку, т.к. поставщик уже создан
      }
    }

    return NextResponse.json({
      success: true,
      supplier: newSupplier,
      products_added: products.length,
      message: `Поставщик "${supplier_data.name}" успешно добавлен в каталог`
    })

  } catch (error) {
    console.error('❌ Ошибка импорта эхо карточки:', error)
    return NextResponse.json(
      { error: 'Ошибка импорта поставщика', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 