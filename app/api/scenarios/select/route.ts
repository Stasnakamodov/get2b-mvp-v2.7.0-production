import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import type { SelectScenarioRequest } from '@/types/scenario-mode.types'

export async function POST(request: NextRequest) {
  try {
    const body: SelectScenarioRequest = await request.json()
    const { project_id, scenario_id } = body

    if (!project_id || !scenario_id) {
      return NextResponse.json(
        { success: false, error: 'project_id и scenario_id обязательны' },
        { status: 400 }
      )
    }

    // Вызов SQL-функции freeze_other_scenarios
    const { error } = await supabase.rpc('freeze_other_scenarios', {
      p_project_id: project_id,
      p_selected_node_id: scenario_id,
    })

    if (error) {
      console.error('Ошибка выбора сценария:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Обновляем active_scenario_id в проекте
    await supabase
      .from('projects')
      .update({ active_scenario_id: scenario_id })
      .eq('id', project_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Ошибка API select:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
