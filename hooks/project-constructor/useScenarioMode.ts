'use client'

import { useState, useCallback } from 'react'
import type {
  ScenarioModeState,
  ScenarioTreeNode,
  ScenarioNode,
  ScenarioDelta,
  ResolvedScenario,
  CreateScenarioBranchRequest,
  CreatorRole,
} from '@/types/scenario-mode.types'
import type { StepNumber, StepConfig, ManualData, PartialStepConfigs } from '@/types/project-constructor.types'

const initialState: ScenarioModeState = {
  enabled: false,
  activeScenarioId: null,
  treeData: [],
  selectedNode: null,
  highlightedSteps: {},
  sidePanelOpen: false,
  loading: false,
  error: null,
}

/**
 * Строит иерархическое дерево из плоского списка нод
 */
function buildTree(
  nodes: ScenarioNode[],
  deltas: ScenarioDelta[],
  activeScenarioId: string | null
): ScenarioTreeNode[] {
  const deltasByNode = new Map<string, StepNumber[]>()
  for (const d of deltas) {
    const existing = deltasByNode.get(d.scenario_node_id) || []
    existing.push(d.step_number)
    deltasByNode.set(d.scenario_node_id, existing)
  }

  const nodeMap = new Map<string, ScenarioTreeNode>()
  for (const n of nodes) {
    nodeMap.set(n.id, {
      id: n.id,
      name: n.name,
      description: n.description,
      status: n.status,
      creator_role: n.creator_role,
      branched_at_step: n.branched_at_step,
      tree_depth: n.tree_depth,
      children: [],
      changedSteps: deltasByNode.get(n.id) || [],
      isActive: n.id === activeScenarioId,
      isFrozen: n.status === 'frozen',
      isSelected: n.status === 'selected',
      created_at: n.created_at,
      created_by: n.created_by,
    })
  }

  const roots: ScenarioTreeNode[] = []
  for (const n of nodes) {
    const treeNode = nodeMap.get(n.id)!
    if (n.parent_node_id && nodeMap.has(n.parent_node_id)) {
      nodeMap.get(n.parent_node_id)!.children.push(treeNode)
    } else {
      roots.push(treeNode)
    }
  }

  return roots
}

export function useScenarioMode(projectId: string | null) {
  const [state, setState] = useState<ScenarioModeState>(initialState)

  const setLoading = (loading: boolean) =>
    setState(prev => ({ ...prev, loading, error: null }))

  const setError = (error: string) =>
    setState(prev => ({ ...prev, error, loading: false }))

  /**
   * Загрузка дерева сценариев из API
   */
  const fetchScenarioTree = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/scenarios/tree?project_id=${projectId}`)
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Ошибка загрузки дерева сценариев')
        return
      }

      setState(prev => ({
        ...prev,
        treeData: data.tree,
        enabled: data.tree.length > 0,
        loading: false,
      }))
    } catch (err) {
      setError('Ошибка сети при загрузке дерева сценариев')
    }
  }, [projectId])

  /**
   * Создание новой ветки сценария
   */
  const createScenarioBranch = useCallback(async (
    parentId: string | null,
    step: StepNumber,
    name: string,
    description?: string,
    creatorRole?: CreatorRole
  ) => {
    if (!projectId) return null

    setLoading(true)
    try {
      const body: CreateScenarioBranchRequest = {
        project_id: projectId,
        parent_node_id: parentId,
        name,
        description,
        creator_role: creatorRole || 'client',
        branched_at_step: step,
      }

      const res = await fetch('/api/scenarios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Ошибка создания ветки')
        return null
      }

      // Обновляем дерево
      await fetchScenarioTree()

      // Устанавливаем новый сценарий как активный
      setState(prev => ({
        ...prev,
        activeScenarioId: data.scenario_id,
        enabled: true,
        loading: false,
      }))

      return data.scenario_id as string
    } catch (err) {
      setError('Ошибка сети при создании ветки')
      return null
    }
  }, [projectId, fetchScenarioTree])

  /**
   * Сохранение дельты шага в текущем сценарии
   */
  const updateScenarioStep = useCallback(async (
    stepNumber: StepNumber,
    stepConfig: StepConfig | null,
    manualData: Record<string, any>,
    changeReason?: string
  ) => {
    if (!state.activeScenarioId) return false

    try {
      const res = await fetch('/api/scenarios/update-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_node_id: state.activeScenarioId,
          step_number: stepNumber,
          step_config: stepConfig,
          manual_data: manualData,
          change_reason: changeReason,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Ошибка обновления шага')
        return false
      }

      // Обновляем highlightedSteps
      setState(prev => ({
        ...prev,
        highlightedSteps: {
          ...prev.highlightedSteps,
          [stepNumber]: 'changed',
        },
      }))

      return true
    } catch {
      setError('Ошибка сети при обновлении шага')
      return false
    }
  }, [state.activeScenarioId])

  /**
   * Выбор сценария + заморозка остальных
   */
  const selectScenario = useCallback(async (scenarioId: string) => {
    if (!projectId) return false

    setLoading(true)
    try {
      const res = await fetch('/api/scenarios/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          scenario_id: scenarioId,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Ошибка выбора сценария')
        return false
      }

      setState(prev => ({
        ...prev,
        activeScenarioId: scenarioId,
        loading: false,
      }))

      await fetchScenarioTree()
      return true
    } catch {
      setError('Ошибка сети при выборе сценария')
      return false
    }
  }, [projectId, fetchScenarioTree])

  /**
   * Получение мерженных данных сценария (resolve)
   */
  const resolveScenario = useCallback(async (
    scenarioId: string
  ): Promise<ResolvedScenario | null> => {
    try {
      const res = await fetch(`/api/scenarios/resolve?scenario_id=${scenarioId}`)
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Ошибка resolve сценария')
        return null
      }

      // Обновляем highlightedSteps на основе resolved данных
      const highlights: Record<number, 'changed' | 'inherited' | 'proposed' | 'frozen'> = {}
      for (const step of data.resolved.steps) {
        if (step.source_node_id === scenarioId) {
          highlights[step.step_number] = 'changed'
        } else {
          highlights[step.step_number] = 'inherited'
        }
      }

      setState(prev => ({
        ...prev,
        highlightedSteps: highlights,
        activeScenarioId: scenarioId,
      }))

      return data.resolved as ResolvedScenario
    } catch {
      setError('Ошибка сети при resolve сценария')
      return null
    }
  }, [])

  /**
   * Удаление сценария
   */
  const deleteScenario = useCallback(async (scenarioId: string) => {
    try {
      const res = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Ошибка удаления сценария')
        return false
      }

      // Если удаляли активный сценарий, сбрасываем
      if (state.activeScenarioId === scenarioId) {
        setState(prev => ({
          ...prev,
          activeScenarioId: null,
          highlightedSteps: {},
        }))
      }

      await fetchScenarioTree()
      return true
    } catch {
      setError('Ошибка сети при удалении сценария')
      return false
    }
  }, [state.activeScenarioId, fetchScenarioTree])

  /**
   * Переключение сценария (активация + resolve)
   */
  const switchScenario = useCallback(async (
    scenarioId: string,
    onResolve: (stepConfigs: PartialStepConfigs, manualData: ManualData) => void
  ) => {
    const resolved = await resolveScenario(scenarioId)
    if (resolved) {
      onResolve(resolved.stepConfigs, resolved.manualData)
    }
  }, [resolveScenario])

  /**
   * Toggle боковой панели
   */
  const toggleSidePanel = useCallback(() => {
    setState(prev => ({ ...prev, sidePanelOpen: !prev.sidePanelOpen }))
  }, [])

  /**
   * Включение/выключение режима сценариев
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, enabled }))
  }, [])

  return {
    ...state,
    fetchScenarioTree,
    createScenarioBranch,
    updateScenarioStep,
    selectScenario,
    resolveScenario,
    deleteScenario,
    switchScenario,
    toggleSidePanel,
    setEnabled,
  }
}
