import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

interface Project {
  id: string;
  name: string;
  status: string;
  company_data?: {
    name?: string;
    [key: string]: any;
  };
  created_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID обязателен' },
        { status: 400 }
      );
    }


    // Получаем все завершенные проекты пользователя с полными данными
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        company_data,
        created_at,
        updated_at,
        status,
        amount,
        currency
      `)
      .eq('user_id', user_id)
      .in('status', ['completed', 'receipt_approved', 'in_work', 'waiting_client_confirmation', 'draft', 'waiting_approval'])
      .not('company_data', 'is', null)
      .order('updated_at', { ascending: false });

    if (projectsError) {
      console.error('❌ [ECHO CARDS API] Ошибка загрузки проектов:', projectsError);
      return NextResponse.json(
        { error: 'Ошибка загрузки проектов' },
        { status: 500 }
      );
    }

    // Также проверим все проекты пользователя (без фильтров)
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('id, name, status, company_data, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        echo_cards: [],
        count: 0,
        summary: {
          message: 'У вас пока нет завершенных проектов для создания эхо карточек',
          debug: {
            total_projects: allProjects?.length || 0,
            completed_projects: projects?.length || 0,
            status_breakdown: allProjects?.reduce((acc: Record<string, number>, p: any) => {
              acc[p.status] = (acc[p.status] || 0) + 1;
              return acc;
            }, {})
          }
        }
      });
    }


    // Получаем спецификации товаров для всех найденных проектов
    const projectIds = projects.map(p => p.id);

    const { data: specifications, error: specsError } = await supabase
      .from('project_specifications')
      .select(`
        id,
        project_id,
        item_name,
        item_code,
        quantity,
        unit,
        price,
        total,
        image_url
      `)
      .in('project_id', projectIds)
      .not('item_name', 'is', null);

    if (specsError) {
      console.error('⚠️ [ECHO CARDS API] Ошибка загрузки спецификаций:', specsError);
      // Продолжаем без товаров, не блокируем весь API
    } else {
    }

    // Группируем спецификации по project_id для быстрого доступа
    const specsByProject = new Map();
    if (specifications) {
      specifications.forEach((spec: any) => {
        if (!specsByProject.has(spec.project_id)) {
          specsByProject.set(spec.project_id, []);
        }
        specsByProject.get(spec.project_id).push(spec);
      });
    }

    // Группируем проекты по поставщикам (по названию компании)
    const supplierGroups = new Map();

    projects.forEach(project => {
      const companyData = project.company_data;
      if (!companyData || !companyData.name) return;

      const supplierKey = companyData.name.toLowerCase().trim();
      
      if (!supplierGroups.has(supplierKey)) {
        supplierGroups.set(supplierKey, {
          supplier_info: {
            name: companyData.name,
            company_name: companyData.legalName || companyData.name,
            contact_email: companyData.email || '',
            contact_phone: companyData.phone || '',
            website: companyData.website || '',
            payment_type: 'Банковский перевод',
            description: `Поставщик из ваших проектов`,
            logo_url: `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop&crop=center&auto=format&sig=${supplierKey.length}`,
            city: 'Россия',
            country: 'Россия',
            category: 'Общие поставки'
          },
          projects: [],
          total_spent: 0,
          product_items: []
        });
      }

      const group = supplierGroups.get(supplierKey);
      group.projects.push(project);
      group.total_spent += parseFloat(project.amount || '0');

      // Добавляем товары из спецификаций проекта
      const projectSpecs = specsByProject.get(project.id) || [];
      projectSpecs.forEach((spec: any) => {
        group.product_items.push({
          id: `${project.id}-${spec.id}`,
          item_name: spec.item_name || 'Неизвестный товар',
          item_code: spec.item_code || '',
          quantity: `${spec.quantity || 1} ${spec.unit || 'шт'}`,
          price: `${spec.price || 0}`,
          currency: project.currency || 'RUB',
          total: `${spec.total || (spec.price * spec.quantity) || 0}`,
          image_url: spec.image_url || `https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&h=200&fit=crop&auto=format&sig=${spec.item_name?.length || 1}`,
          category: 'Общее',
          description: `Из проекта: ${project.name}`
        });
      });
    });

    // Преобразуем группы в эхо карточки
    const echoCards = Array.from(supplierGroups.entries()).map(([supplierKey, group], index) => {
      const successfulProjects = group.projects.length;
      const totalProjects = group.projects.length;
      const lastProject = group.projects[0]; // Первый = последний по времени из-за сортировки

      return {
        id: `echo-${index + 1}`,
        supplier_info: {
          ...group.supplier_info,
          category: group.product_items.length > 0 ? 
            group.product_items[0].category || 'Общие поставки' : 
            'Общие поставки'
        },
        products: group.product_items.slice(0, 10), // Ограничиваем до 10 товаров
        statistics: {
          total_projects: totalProjects,
          successful_projects: successfulProjects,
          success_rate: Math.round((successfulProjects / totalProjects) * 100),
          total_spent: Math.round(group.total_spent),
          last_project_date: lastProject.updated_at || lastProject.created_at,
          products_count: group.product_items.length
        },
        project_info: {
          title: lastProject.name || 'Проект без названия',
          date: lastProject.updated_at || lastProject.created_at,
          status: 'completed'
        }
      };
    });


    return NextResponse.json({
      success: true,
      echo_cards: echoCards,
      count: echoCards.length,
      summary: {
        message: `Найдено ${echoCards.length} поставщиков из ваших ${projects.length} завершенных проектов`,
        total_projects: projects.length,
        total_suppliers: echoCards.length,
        total_spent: echoCards.reduce((sum, card) => sum + card.statistics.total_spent, 0)
      }
    });

  } catch (error) {
    console.error('❌ [ECHO CARDS API] Ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
