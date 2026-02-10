import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import type { ScenarioNode, ScenarioDelta, ScenarioTreeNode } from '@/types/scenario-mode.types'
import type { StepNumber } from '@/types/project-constructor.types'

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
    existing.push(d.step_number as StepNumber)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'project_id обязателен' },
        { status: 400 }
      )
    }

    // Загружаем ноды
    const { data: nodes, error: nodesError } = await supabase
      .from('project_scenario_nodes')
      .select('*')
      .eq('project_id', projectId)
      .order('tree_depth', { ascending: true })
      .order('created_at', { ascending: true })

    if (nodesError) {
      return NextResponse.json(
        { success: false, error: nodesError.message },
        { status: 400 }
      )
    }

    if (!nodes || nodes.length === 0) {
      return NextResponse.json({
        success: true,
        tree: [],
        nodes: [],
      })
    }

    // Загружаем все дельты для этих нод
    const nodeIds = nodes.map(n => n.id)
    const { data: deltas, error: deltasError } = await supabase
      .from('project_scenario_deltas')
      .select('*')
      .in('scenario_node_id', nodeIds)

    if (deltasError) {
      return NextResponse.json(
        { success: false, error: deltasError.message },
        { status: 400 }
      )
    }

    // Получаем active_scenario_id из проекта
    const { data: project } = await supabase
      .from('projects')
      .select('active_scenario_id')
      .eq('id', projectId)
      .single()

    const activeScenarioId = project?.active_scenario_id || null

    const tree = buildTree(
      nodes as ScenarioNode[],
      (deltas || []) as ScenarioDelta[],
      activeScenarioId
    )

    return NextResponse.json({
      success: true,
      tree,
      nodes,
    })
  } catch (err) {
    console.error('Ошибка API tree:', err)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
