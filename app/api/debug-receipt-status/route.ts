import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')
    
    if (!requestId) {
      return NextResponse.json({ error: 'requestId required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Очищаем requestId как в основном коде
    const cleanRequestId = requestId.replace(/[^a-zA-Z0-9]/g, '')
    
    console.log('🔍 [DEBUG] Ищем проект с requestId:', cleanRequestId)
    
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .ilike('atomic_request_id', `%${cleanRequestId}%`)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Ошибка поиска проектов:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('📊 [DEBUG] Найдено проектов:', projects?.length || 0)
    
    let receipts = []
    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id)
      
      // Проверяем загруженные чеки
      const { data: receiptsData, error: receiptsError } = await supabase
        .from('project_receipts')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })

      if (receiptsError) {
        console.error('❌ Ошибка поиска чеков:', receiptsError)
      } else {
        receipts = receiptsData || []
        console.log('📊 [DEBUG] Найдено чеков:', receipts.length)
      }
    }

    return NextResponse.json({
      cleanRequestId,
      count: projects?.length || 0,
      projects: projects?.map(p => ({
        id: p.id,
        status: p.status,
        atomic_moderation_status: p.atomic_moderation_status,
        atomic_request_id: p.atomic_request_id,
        created_at: p.created_at
      })),
      receipts: receipts.map(r => ({
        id: r.id,
        project_id: r.project_id,
        file_url: r.file_url,
        status: r.status,
        created_at: r.created_at
      }))
    })

  } catch (error) {
    console.error('❌ Ошибка диагностики:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 