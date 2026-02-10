import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import type { ResolvedScenario, ResolvedStep } from '@/types/scenario-mode.types'
import type { ManualData, PartialStepConfigs, StepNumber } from '@/types/project-constructor.types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scenarioId = searchParams.get('scenario_id')

    if (!scenarioId) {
      return NextResponse.json(
        { success: false, error: 'scenario_id обязателен' },
        { status: 400 }
      )
    }

    // Вызов SQL-функции get_scenario_resolved_steps
    const { data, error } = await supabase.rpc('get_scenario_resolved_steps', {
      p_scenario_node_id: scenarioId,
    })

    if (error) {
      console.error('Ошибка resolve сценария:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    const steps: ResolvedStep[] = (data || []).map((row: any) => ({
      step_number: row.step_number as StepNumber,
      step_config: row.step_config,
      manual_data: row.manual_data || {},
      uploaded_files: row.uploaded_files || [],
      source_node_id: row.source_node_id,
      source_depth: row.source_depth,
    }))

    // Собираем stepConfigs и manualData из resolved steps
    const stepConfigs: PartialStepConfigs = {}
    const manualData: ManualData = {}

    for (const step of steps) {
      const sn = step.step_number as StepNumber
      if (step.step_config) {
        (stepConfigs as any)[sn] = step.step_config
      }
      if (step.manual_data && Object.keys(step.manual_data).length > 0) {
        (manualData as any)[sn] = step.manual_data
      }
    }

    const resolved: ResolvedScenario = {
      scenario_id: scenarioId,
      steps,
      stepConfigs,
      manualData,
    }

    return NextResponse.json({
      success: true,
      resolved,
    })
  } catch (err) {
    console.error('Ошибка API resolve:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
