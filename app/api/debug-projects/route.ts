import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const action = searchParams.get('action');

    if (!projectId || !action) {
      return NextResponse.json({ error: 'Missing project_id or action' }, { status: 400 });
    }

    if (action === 'clear_requisites') {
      const requisiteId = searchParams.get('requisite_id');
      
      let deleteQuery = supabase
        .from('project_requisites')
        .delete()
        .eq('project_id', projectId);
      
      // Если указан конкретный ID реквизита, удаляем только его
      if (requisiteId) {
        deleteQuery = deleteQuery.eq('id', requisiteId);
      }
      
      const { data: deletedData, error: deleteError } = await deleteQuery.select('*');

      if (deleteError) {
        return NextResponse.json({ error: 'Delete failed', details: deleteError }, { status: 500 });
      }

      // Сбрасываем статус проекта обратно на step4
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          current_step: 4,
          max_step_reached: 4,
          status: 'in_progress'
        })
        .eq('id', projectId);

      if (updateError) {
        return NextResponse.json({ error: 'Status update failed', details: updateError }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Corrupted requisites cleared successfully',
        deleted_records: deletedData?.length || 0,
        project_reset: 'Status reset to step 4'
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Debug projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Получаем данные проекта и его реквизиты
    const [projectResult, requisitesResult] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single(),
      supabase
        .from('project_requisites')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    ]);

    return NextResponse.json({
      project: projectResult.data,
      project_error: projectResult.error,
      requisites: requisitesResult.data,
      requisites_error: requisitesResult.error
    });
  } catch (error) {
    console.error('Debug projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
