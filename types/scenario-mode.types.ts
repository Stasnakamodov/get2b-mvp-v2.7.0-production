import type { StepNumber, StepConfig, ManualData, PartialStepConfigs } from './project-constructor.types'

// ========================================
// БАЗОВЫЕ ТИПЫ СЦЕНАРНОГО РЕЖИМА
// ========================================

export type ScenarioStatus = 'active' | 'frozen' | 'selected' | 'archived'
export type CreatorRole = 'client' | 'manager' | 'supplier'
export type ScenarioNotificationType = 'scenario_created' | 'scenario_selected' | 'scenario_frozen' | 'scenario_updated' | 'scenario_deleted'

// ========================================
// НОДА ДЕРЕВА СЦЕНАРИЕВ
// ========================================

export interface ScenarioNode {
  id: string
  project_id: string
  parent_node_id: string | null
  name: string
  description: string | null
  created_by: string | null
  creator_role: CreatorRole
  branched_at_step: StepNumber | null
  tree_depth: number
  tree_path: string[]
  status: ScenarioStatus
  frozen_at: string | null
  selected_at: string | null
  created_at: string
  updated_at: string
}

// ========================================
// ДЕЛЬТА ШАГА
// ========================================

export interface ScenarioDelta {
  id: string
  scenario_node_id: string
  step_number: StepNumber
  step_config: StepConfig | null
  manual_data: Record<string, any>
  uploaded_files: Array<{ id: string; name: string; url: string; type: string }>
  changed_by: string | null
  change_reason: string | null
  created_at: string
  updated_at: string
}

// ========================================
// РЕЗУЛЬТАТ RESOLVE (мерженные данные)
// ========================================

export interface ResolvedStep {
  step_number: StepNumber
  step_config: StepConfig | null
  manual_data: Record<string, any>
  uploaded_files: Array<{ id: string; name: string; url: string; type: string }>
  source_node_id: string
  source_depth: number
}

export interface ResolvedScenario {
  scenario_id: string
  steps: ResolvedStep[]
  stepConfigs: PartialStepConfigs
  manualData: ManualData
}

// ========================================
// UI-НОДА ДЛЯ РЕНДЕРИНГА ДЕРЕВА
// ========================================

export interface ScenarioTreeNode {
  id: string
  name: string
  description: string | null
  status: ScenarioStatus
  creator_role: CreatorRole
  branched_at_step: StepNumber | null
  tree_depth: number
  children: ScenarioTreeNode[]
  changedSteps: StepNumber[]
  isActive: boolean
  isFrozen: boolean
  isSelected: boolean
  created_at: string
  created_by: string | null
}

// ========================================
// СОСТОЯНИЕ UI СЦЕНАРНОГО РЕЖИМА
// ========================================

export interface ScenarioModeState {
  enabled: boolean
  activeScenarioId: string | null
  treeData: ScenarioTreeNode[]
  selectedNode: ScenarioTreeNode | null
  highlightedSteps: Record<number, 'changed' | 'inherited' | 'proposed' | 'frozen'>
  sidePanelOpen: boolean
  loading: boolean
  error: string | null
}

// ========================================
// REQUEST / RESPONSE ТИПЫ ДЛЯ API
// ========================================

export interface CreateScenarioBranchRequest {
  project_id: string
  parent_node_id: string | null
  name: string
  description?: string
  created_by?: string
  creator_role?: CreatorRole
  branched_at_step?: StepNumber
}

export interface CreateScenarioBranchResponse {
  success: boolean
  scenario_id: string
  error?: string
}

export interface UpdateScenarioStepRequest {
  scenario_node_id: string
  step_number: StepNumber
  step_config: StepConfig | null
  manual_data: Record<string, any>
  uploaded_files?: Array<{ id: string; name: string; url: string; type: string }>
  changed_by?: string
  change_reason?: string
}

export interface UpdateScenarioStepResponse {
  success: boolean
  delta_id: string
  error?: string
}

export interface GetScenarioTreeRequest {
  project_id: string
}

export interface GetScenarioTreeResponse {
  success: boolean
  tree: ScenarioTreeNode[]
  nodes: ScenarioNode[]
  error?: string
}

export interface ResolveScenarioRequest {
  scenario_id: string
}

export interface ResolveScenarioResponse {
  success: boolean
  resolved: ResolvedScenario
  error?: string
}

export interface SelectScenarioRequest {
  project_id: string
  scenario_id: string
}

export interface SelectScenarioResponse {
  success: boolean
  error?: string
}

// ========================================
// УВЕДОМЛЕНИЯ
// ========================================

export interface ScenarioNotification {
  id: string
  scenario_node_id: string | null
  project_id: string
  notification_type: ScenarioNotificationType
  recipient_user_id: string | null
  recipient_role: CreatorRole | null
  telegram_message_id: string | null
  telegram_sent_at: string | null
  is_read: boolean
  created_at: string
}

// ========================================
// БИЗНЕС-ПЛАН СЦЕНАРИЙ
// ========================================

export interface BusinessPlanScenario {
  id: string
  business_plan_id: string | null
  parent_node_id: string | null
  name: string
  description: string | null
  created_by: string | null
  creator_role: CreatorRole
  tree_depth: number
  tree_path: string[]
  config_data: Record<string, any>
  status: ScenarioStatus
  frozen_at: string | null
  selected_at: string | null
  created_at: string
  updated_at: string
}
