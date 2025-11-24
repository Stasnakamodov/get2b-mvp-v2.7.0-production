import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// 🎯 API ENDPOINT: Автозаполнение данных поставщика для Steps 2,4,5
// GET /api/catalog/supplier-autofill/{supplierId}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  const startTime = Date.now()
  
  try {
    const resolvedParams = await params
    const supplierId = resolvedParams.supplierId

    // Получаем параметры запроса
    const { searchParams } = new URL(request.url)
    const roomType = searchParams.get('room_type') || 'auto' // 'verified', 'user', 'auto'
    const includePhantomData = searchParams.get('include_phantom') === 'true'

    // Получаем токен авторизации для RLS
    const authHeader = request.headers.get('authorization')
    let currentUserId = null
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        currentUserId = user?.id
      } catch (error) {
      }
    }

    // Определяем тип поставщика и получаем его данные
    let supplierData = null
    let supplierType = roomType

    // 1. Сначала пытаемся найти в аккредитованных поставщиках
    if (roomType === 'auto' || roomType === 'verified') {
      const { data: verifiedSupplier, error: verifiedError } = await supabase
        .from('catalog_verified_suppliers')
        .select(`
          *,
          catalog_verified_products (
            id, name, description, price, currency, min_order, in_stock, images, sku
          )
        `)
        .eq('id', supplierId)
        .eq('is_active', true)
        .single()

      if (!verifiedError && verifiedSupplier) {
        supplierData = verifiedSupplier
        supplierType = 'verified'
      }
    }

    // 2. Если не найден в verified, ищем в пользовательских
    if (!supplierData && (roomType === 'auto' || roomType === 'user')) {
      const { data: userSupplier, error: userError } = await supabase
        .from('catalog_user_suppliers')
        .select(`
          *,
          catalog_user_products (
            id, name, description, price, currency, min_order, in_stock, images, sku
          )
        `)
        .eq('id', supplierId)
        .eq('user_id', currentUserId)
        .eq('is_active', true)
        .single()

      if (!userError && userSupplier) {
        supplierData = userSupplier
        supplierType = 'user'
      }
    }

    if (!supplierData) {
      return NextResponse.json({
        success: false,
        error: 'Поставщик не найден или недоступен',
        supplier_id: supplierId
      }, { status: 404 })
    }

    // 3. Получаем фантомные данные (данные из завершенных проектов)
    let phantomData = null
    if (includePhantomData && currentUserId) {
      phantomData = await getPhantomSupplierData(supplierData.name, currentUserId)
    }

    // 4. Формируем ответ с данными для автозаполнения
    const autofillData = {
      // Данные поставщика (для Step1 если нужно)
      supplier_info: {
        id: supplierData.id,
        name: supplierData.name,
        company_name: supplierData.company_name,
        category: supplierData.category,
        country: supplierData.country,
        city: supplierData.city,
        description: supplierData.description,
        logo_url: supplierData.logo_url,
        contact_email: supplierData.contact_email,
        contact_phone: supplierData.contact_phone,
        website: supplierData.website,
        contact_person: supplierData.contact_person,
        room_type: supplierType,
        room_icon: supplierType === 'verified' ? '🧡' : '🔵'
      },

      // Данные для Step2 (товары поставщика)
      step2_data: {
        products: supplierType === 'verified' 
          ? supplierData.catalog_verified_products || []
          : supplierData.catalog_user_products || [],
        supplier_name: supplierData.name // Для project_specifications.supplier_name
      },

      // Данные для Step4 (способ оплаты)
      step4_data: {
        payment_method: phantomData?.payment_method || getDefaultPaymentMethod(supplierData),
        payment_methods_available: supplierData.payment_methods || ['bank-transfer'],
        has_phantom_data: !!phantomData?.payment_method
      },

      // Данные для Step5 (реквизиты поставщика)
      step5_data: {
        requisites: phantomData?.requisites || getDefaultRequisites(supplierData),
        has_phantom_data: !!phantomData?.requisites,
        phantom_projects_count: phantomData?.projects_used || 0
      },

      // Метаданные
      metadata: {
        supplier_type: supplierType,
        has_products: (supplierType === 'verified' 
          ? supplierData.catalog_verified_products?.length 
          : supplierData.catalog_user_products?.length) > 0,
        has_phantom_data: !!phantomData,
        phantom_data_confidence: phantomData?.confidence_score || 0
      }
    }

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      supplier_id: supplierId,
      autofill_data: autofillData,
      summary: {
        supplier_name: supplierData.name,
        supplier_type: supplierType,
        products_count: autofillData.step2_data.products.length,
        has_phantom_data: autofillData.metadata.has_phantom_data,
        execution_time_ms: executionTime
      }
    })

  } catch (error) {
    console.error('❌ [API] Критическая ошибка получения автозаполнения:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Внутренняя ошибка сервера при получении данных автозаполнения',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка',
      supplier_id: 'unknown'
    }, { status: 500 })
  }
}

// 🔮 Функция получения фантомных данных из завершенных проектов
async function getPhantomSupplierData(supplierName: string, userId: string) {
  try {

    // 1. Ищем проекты с этим поставщиком в спецификациях
    const { data: specifications, error: specsError } = await supabase
      .from('project_specifications')
      .select('project_id, supplier_name')
      .ilike('supplier_name', `%${supplierName}%`)
      .eq('user_id', userId)

    if (specsError || !specifications?.length) {
      return null
    }

    const projectIds = [...new Set(specifications.map(s => s.project_id))]

    // 2. Получаем данные проектов и их реквизиты
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id, name, status, payment_method, amount, currency, created_at,
        project_requisites (*)
      `)
      .in('id', projectIds)
      .eq('user_id', userId)

    if (projectsError || !projects?.length) {
      return null
    }

    // 3. Анализируем данные для автозаполнения
    const completedProjects = projects.filter(p => p.status === 'completed')
    const paymentMethods = projects.map(p => p.payment_method).filter(Boolean)
    const allRequisites = projects.flatMap(p => p.project_requisites || [])

    if (completedProjects.length === 0) {
      return null
    }

    // 4. Определяем наиболее часто используемый способ оплаты
    const paymentMethodCounts = paymentMethods.reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostUsedPaymentMethod = Object.entries(paymentMethodCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0]

    // 5. Берем последние использованные реквизиты для этого способа оплаты
    const relevantRequisites = allRequisites
      .filter(r => r.type === mostUsedPaymentMethod)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    const phantomData = {
      payment_method: mostUsedPaymentMethod,
      requisites: relevantRequisites?.data,
      projects_used: completedProjects.length,
      confidence_score: Math.min(completedProjects.length / 3, 1), // Максимум 1.0 при 3+ проектах
      last_used: completedProjects[0]?.created_at
    }


    return phantomData

  } catch (error) {
    console.error('❌ [PHANTOM] Ошибка получения фантомных данных:', error)
    return null
  }
}

// 📄 Функция получения способа оплаты по умолчанию
function getDefaultPaymentMethod(supplier: any): string {
  // Используем доступные способы оплаты поставщика или банковский перевод по умолчанию
  if (supplier.payment_methods && Array.isArray(supplier.payment_methods)) {
    return supplier.payment_methods[0] || 'bank-transfer'
  }
  return 'bank-transfer'
}

// 💰 Функция получения реквизитов по умолчанию
function getDefaultRequisites(supplier: any) {
  // Формируем базовые реквизиты на основе контактных данных поставщика
  return {
    company_name: supplier.company_name || supplier.name,
    contact_email: supplier.contact_email,
    contact_phone: supplier.contact_phone,
    website: supplier.website,
    contact_person: supplier.contact_person,
    country: supplier.country,
    city: supplier.city,
    // Банковские поля будут заполнены пустыми для ручного ввода
    bank_name: '',
    account_number: '',
    swift: '',
    recipient_name: supplier.company_name || supplier.name
  }
}