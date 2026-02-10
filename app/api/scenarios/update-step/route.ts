import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import type { UpdateScenarioStepRequest } from '@/types/scenario-mode.types'

export async function POST(request: NextRequest) {
  try {
    const body: UpdateScenarioStepRequest = await request.json()
    const {
      scenario_node_id,
      step_number,
      step_config,
      manual_data,
      uploaded_files = [],
      changed_by,
      change_reason,
    } = body

    if (!scenario_node_id || !step_number) {
      return NextResponse.json(
        { success: false, error: 'scenario_node_id и step_number обязательны' },
        { status: 400 }
      )
    }

    if (step_number < 1 || step_number > 7) {
      return NextResponse.json(
        { success: false, error: 'step_number должен быть от 1 до 7' },
        { status: 400 }
      )
    }

    // Upsert дельты шага
    const { data, error } = await supabase
      .from('project_scenario_deltas')
      .upsert(
        {
          scenario_node_id,
          step_number,
          step_config: step_config || null,
          manual_data: manual_data || {},
          uploaded_files: uploaded_files || [],
          changed_by: changed_by || null,
          change_reason: change_reason || null,
        },
        { onConflict: 'scenario_node_id,step_number' }
      )
      .select('id')
      .single()

    if (error) {
      console.error('Ошибка обновления дельты шага:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      delta_id: data.id,
    })
  } catch (err) {
    console.error('Ошибка API update-step:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
