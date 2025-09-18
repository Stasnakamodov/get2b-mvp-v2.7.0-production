import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID обязателен' }, { status: 400 });
    }

    // Проверяем все проекты пользователя
    const { data: allProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    // Проверяем завершенные проекты с фильтрами
    const { data: completedProjects } = await supabase
      .from('projects')
      .select('id, project_name, company_data, status, amount, specifications!inner(id, items)')
      .eq('user_id', user_id)
      .in('status', ['completed', 'receipt_approved'])
      .not('company_data', 'is', null);

    return NextResponse.json({
      success: true,
      user_id,
      all_projects_count: allProjects?.length || 0,
      completed_projects_count: completedProjects?.length || 0,
      all_projects: allProjects?.map(p => ({
        id: p.id,
        name: p.project_name,
        status: p.status,
        has_company_data: !!(p.company_data?.name)
      })),
      completed_projects: completedProjects || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 });
  }
}
