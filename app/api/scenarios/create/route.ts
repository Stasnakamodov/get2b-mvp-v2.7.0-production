import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import type { CreateScenarioBranchRequest } from '@/types/scenario-mode.types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateScenarioBranchRequest = await request.json()
    const {
      project_id,
      parent_node_id,
      name,
      description,
      created_by,
      creator_role = 'client',
      branched_at_step,
    } = body

    if (!project_id || !name) {
      return NextResponse.json(
        { success: false, error: 'project_id и name обязательны' },
        { status: 400 }
      )
    }

    // Вызов SQL-функции create_scenario_branch
    const { data, error } = await supabase.rpc('create_scenario_branch', {
      p_project_id: project_id,
      p_parent_node_id: parent_node_id || null,
      p_name: name,
      p_description: description || null,
      p_created_by: created_by || null,
      p_creator_role: creator_role,
      p_branched_at_step: branched_at_step || null,
    })

    if (error) {
      console.error('Ошибка создания ветки сценария:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Включаем scenario mode для проекта
    await supabase
      .from('projects')
      .update({ scenario_mode_enabled: true, active_scenario_id: data })
      .eq('id', project_id)

    return NextResponse.json({
      success: true,
      scenario_id: data,
    })
  } catch (err) {
    console.error('Ошибка API create scenario:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
