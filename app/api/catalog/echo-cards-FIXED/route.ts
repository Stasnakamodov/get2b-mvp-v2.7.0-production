import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin'

// 🚀 ИСПРАВЛЕННЫЙ API ДЛЯ ИЗВЛЕЧЕНИЯ ЭХО КАРТОЧЕК С ПРАВИЛЬНЫМ ПРИОРИТЕТОМ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id обязателен' }, { status: 400 })
    }

    console.log('🔍 [ECHO CARDS FIXED] Запуск с правильным приоритетом для user_id:', userId)

    // ========================================
    // 📊 ПРАВИЛЬНЫЙ ПРИОРИТЕТ ИСТОЧНИКОВ ДАННЫХ
    // ========================================

    // 1. ПРИОРИТЕТ 1: Реквизиты поставщиков из project_requisites (Step5)
    console.log('🔍 [P1] Получаем реквизиты поставщиков из project_requisites')
    
    const { data: projectRequisites, error: projectRequisitesError } = await supabase
      .from('project_requisites')
      .select('*')
      .eq('user_id', userId)

    if (projectRequisitesError) {
      console.error('⚠️ Ошибка project_requisites:', projectRequisitesError)
    }

    console.log('📊 Project requisites найдено:', projectRequisites?.length || 0)

    // 2. ПРИОРИТЕТ 2: Шаблоны реквизитов как fallback
    console.log('🔍 [P2] Получаем шаблоны реквизитов как fallback')
    
    const { data: bankTemplates } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)

    console.log('📊 Bank templates найдено:', bankTemplates?.length || 0)

    // 3. Получаем проекты (Step5+)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, company_data, status, amount, currency, payment_method, created_at')
      .eq('user_id', userId)
      .gte('current_step', 5)

    if (projectsError) {
      console.error('❌ Ошибка проектов:', projectsError)
      return NextResponse.json({ error: 'Ошибка получения проектов' }, { status: 500 })
    }

    console.log('📊 Проектов найдено:', projects?.length || 0)

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        echo_cards: [],
        summary: { message: 'Нет проектов, дошедших до Step5' }
      })
    }

    // 4. Получаем товары из спецификаций
    const projectIds = projects.map(p => p.id)
    const { data: specifications } = await supabase
      .from('project_specifications')
      .select('project_id, item_name, quantity, price, total, image_url')
      .in('project_id', projectIds)

    console.log('📊 Товаров найдено:', specifications?.length || 0)

    // ========================================
    // 🔄 СОЗДАЕМ ЭХО КАРТОЧКИ С ПРАВИЛЬНЫМ ПРИОРИТЕТОМ
    // ========================================

    const echoCards: any[] = []
    const supplierStats = new Map()

    projects.forEach((project: any) => {
      console.log(`\\n🔄 Обрабатываем проект: ${project.name}`)

      let supplierInfo: any = {}
      let dataSource = 'none'

      // ПРИОРИТЕТ 1: Ищем в project_requisites для этого проекта
      const projectSpecificReqs = projectRequisites?.filter(r => r.project_id === project.id) || []
      
      if (projectSpecificReqs.length > 0) {
        console.log(`✅ [P1] Найдены реквизиты поставщика в project_requisites`)
        const req = projectSpecificReqs[0]
        const data = req.data || {}
        
        supplierInfo = {
          name: data.recipientName || data.name || project.name || 'Неизвестный поставщик',
          company_name: data.recipientName || data.name || 'Неизвестная компания',
          country: getCountryFromData(data, req.type),
          city: getCityFromData(data),
          contact_person: data.recipientName || data.name,
          payment_methods: formatPaymentData(data, req.type),
          payment_type: req.type
        }
        dataSource = 'project_requisites'
      }
      // ПРИОРИТЕТ 2: Ищем в шаблонах по payment_method
      else if (bankTemplates && bankTemplates.length > 0) {
        console.log(`⚠️ [P2] Используем шаблон банковских реквизитов`)
        const template = bankTemplates[0]
        
        supplierInfo = {
          name: project.name || 'Неизвестный поставщик',
          company_name: template.recipientName || template.name || 'Неизвестная компания',
          country: template.country || '',
          city: template.recipientAddress || '',
          contact_person: template.recipientName,
          payment_methods: { bank: template.details || {} },
          payment_type: 'bank'
        }
        dataSource = 'bank_accounts'
      }
      // НЕТ ДАННЫХ - пропускаем
      else {
        console.log(`❌ Пропускаем проект ${project.name} - нет реквизитов`)
        return
      }

      // Товары для проекта
      const projectItems = specifications?.filter(s => s.project_id === project.id) || []
      
      // Группировка по поставщикам
      const supplierKey = `${supplierInfo.name}_${supplierInfo.company_name}`.replace(/\\s+/g, '_').toLowerCase()
      
      if (!supplierStats.has(supplierKey)) {
        supplierStats.set(supplierKey, {
          supplier_info: supplierInfo,
          projects: [],
          total_amount: 0,
          total_projects: 0,
          successful_projects: 0,
          products: new Set(),
          products_detailed: [],
          data_source: dataSource,
          last_project_date: project.created_at
        })
      }

      const stats = supplierStats.get(supplierKey)
      
      // Обновляем на более приоритетные данные
      if (dataSource === 'project_requisites' && stats.data_source !== 'project_requisites') {
        stats.data_source = dataSource
        stats.supplier_info = supplierInfo
      }

      // Добавляем проект
      stats.projects.push({
        id: project.id,
        name: project.name,
        status: project.status,
        amount: project.amount,
        created_at: project.created_at
      })

      // Обновляем статистику
      stats.total_projects += 1
      if (project.status === 'completed') stats.successful_projects += 1
      if (project.amount) stats.total_amount += parseFloat(project.amount)

      // Добавляем товары
      projectItems.forEach((item: any) => {
        if (item.item_name && item.item_name.trim()) {
          stats.products.add(item.item_name.trim())
          
          const existing = stats.products_detailed.find((p: any) => p.name === item.item_name.trim())
          if (!existing) {
            stats.products_detailed.push({
              name: item.item_name.trim(),
              price: item.price || '',
              quantity: item.quantity || 1,
              total: item.total || '',
              image_url: item.image_url || ''
            })
          }
        }
      })
    })

    // ========================================
    // 📋 ФОРМИРУЕМ РЕЗУЛЬТАТ
    // ========================================

    supplierStats.forEach((stats, supplierKey) => {
      const info = stats.supplier_info
      const successRate = stats.total_projects > 0 
        ? Math.round((stats.successful_projects / stats.total_projects) * 100) 
        : 0
      
      echoCards.push({
        supplier_key: supplierKey,
        supplier_info: {
          name: info.name,
          company_name: info.company_name,
          category: 'Электроника',
          country: info.country || '',
          city: info.city || '',
          contact_email: info.contact_email || null,
          contact_phone: info.contact_phone || null,
          contact_person: info.contact_person,
          payment_methods: info.payment_methods,
          payment_type: info.payment_type
        },
        statistics: {
          total_projects: stats.total_projects,
          successful_projects: stats.successful_projects,
          success_rate: successRate,
          total_spent: stats.total_amount,
          products_count: stats.products.size
        },
        products: Array.from(stats.products),
        products_detailed: stats.products_detailed,
        projects: stats.projects,
        extraction_info: {
          data_source: stats.data_source,
          has_payment_details: !!info.payment_methods,
          is_actual_data: stats.data_source === 'project_requisites'
        }
      })
    })

    // Сортируем по приоритету источника
    echoCards.sort((a: any, b: any) => {
      const priorityA = a.extraction_info.data_source === 'project_requisites' ? 1 : 2
      const priorityB = b.extraction_info.data_source === 'project_requisites' ? 1 : 2
      
      if (priorityA !== priorityB) return priorityA - priorityB
      return b.statistics.total_projects - a.statistics.total_projects
    })

    console.log(`🎉 [FIXED] Создано эхо карточек: ${echoCards.length}`)
    echoCards.forEach(card => {
      console.log(`📋 ${card.supplier_info.name} - источник: ${card.extraction_info.data_source}`)
    })

    return NextResponse.json({
      success: true,
      echo_cards: echoCards,
      summary: {
        total_projects: projects.length,
        unique_suppliers: echoCards.length,
        message: `ИСПРАВЛЕНО: Найдено ${echoCards.length} поставщиков из ${projects.length} проектов`,
        data_sources: {
          project_requisites: echoCards.filter(c => c.extraction_info.data_source === 'project_requisites').length,
          templates: echoCards.filter(c => c.extraction_info.data_source !== 'project_requisites').length
        }
      }
    })

  } catch (error) {
    console.error('❌ [FIXED API] Ошибка:', error)
    return NextResponse.json(
      { error: 'Ошибка API', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

// ========================================
// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

function getCountryFromData(data: any, type: string): string {
  if (type === 'bank') {
    if (data.country) return data.country
    if (data.cnapsCode) return 'Китай'
    return ''
  }
  if (type === 'crypto') return 'Глобально'
  return data.country || ''
}

function getCityFromData(data: any): string {
  const address = data.recipientAddress || data.bankAddress || data.address
  if (address && !isTestData(address)) return address
  return ''
}

function formatPaymentData(data: any, type: string): any {
  switch (type) {
    case 'bank':
      return {
        bank: {
          bank_name: data.bankName || '',
          account_number: data.accountNumber || '',
          swift_code: data.swift || '',
          recipient_name: data.recipientName || '',
          bank_address: data.bankAddress || ''
        }
      }
    case 'p2p':
      return {
        card: {
          number: data.card_number || '',
          holder: data.holder_name || ''
        }
      }
    case 'crypto':
      return {
        crypto: {
          address: data.address || '',
          network: data.network || ''
        }
      }
    default:
      return {}
  }
}

function isTestData(value: string): boolean {
  if (!value) return true
  const testPatterns = [
    /^[A-F0-9]{4}-[A-F0-9]{4}$/i,
    /^[0-9]{10,}$/,
    /^test/i,
    /^demo/i
  ]
  return testPatterns.some(pattern => pattern.test(value))
} 