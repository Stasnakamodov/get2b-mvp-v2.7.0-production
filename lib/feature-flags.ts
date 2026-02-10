import { supabase } from './supabaseClient'

/**
 * Feature Flags — управление feature-флагами платформы
 */

export async function isScenarioModeEnabled(projectId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('scenario_mode_enabled')
      .eq('id', projectId)
      .single()

    if (error || !data) return false
    return data.scenario_mode_enabled === true
  } catch {
    return false
  }
}

export async function enableScenarioMode(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ scenario_mode_enabled: true })
      .eq('id', projectId)

    return !error
  } catch {
    return false
  }
}

export async function disableScenarioMode(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects')
      .update({ scenario_mode_enabled: false, active_scenario_id: null })
      .eq('id', projectId)

    return !error
  } catch {
    return false
  }
}
