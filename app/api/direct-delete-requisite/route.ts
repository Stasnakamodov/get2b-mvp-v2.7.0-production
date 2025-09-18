import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requisiteId = searchParams.get('requisite_id');

    if (!requisiteId) {
      return NextResponse.json({ error: 'Missing requisite_id' }, { status: 400 });
    }

    console.log('🗑️ Удаляем реквизит:', requisiteId);

    // Удаляем запись по ID
    const { data: deletedData, error: deleteError } = await supabase
      .from('project_requisites')
      .delete()
      .eq('id', requisiteId)
      .select('*');

    if (deleteError) {
      console.error('❌ Ошибка удаления:', deleteError);
      return NextResponse.json({ error: 'Delete failed', details: deleteError }, { status: 500 });
    }

    console.log('✅ Удалено записей:', deletedData?.length || 0);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Requisite deleted successfully',
      deleted_records: deletedData?.length || 0,
      deleted_data: deletedData
    });
  } catch (error) {
    console.error('❌ Ошибка API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
